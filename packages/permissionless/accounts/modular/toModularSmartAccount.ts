import {
    type Account,
    type Address,
    type Assign,
    type Chain,
    type Client,
    type Hex,
    type JsonRpcAccount,
    type LocalAccount,
    type OneOf,
    type PrivateKeyAccount,
    type Transport,
    type WalletClient,
    encodeAbiParameters,
    encodeFunctionData,
    encodePacked,
    parseAbiParameters
} from "viem"
import {
    type SmartAccount,
    type SmartAccountImplementation,
    entryPoint08Abi,
    entryPoint08Address,
    getUserOperationTypedData,
    toSmartAccount
} from "viem/account-abstraction"
import { getChainId } from "viem/actions"
import { getAction } from "viem/utils"
import { getAccountNonce } from "../../actions/public/getAccountNonce.js"
import { getSenderAddress } from "../../actions/public/getSenderAddress.js"
import { decode7579Calls } from "../../utils/decode7579Calls.js"
import { type EthereumProvider, toOwner } from "../../utils/toOwner.js"
import { ModularSmartAccountAbi } from "./abi.js"

/** Default factory address deployment. */
const DEFAULT_FACTORY_ADDRESS = "0x00af0100b5d4dd9bacc054282c103530287e7305"

/**
 * ERC-7579 Call Types
 * @see https://erc7579.com
 */
export const CALLTYPE_SINGLE = "0x00"
export const CALLTYPE_BATCH = "0x01"

/** Stub signature useful for gas estimation. */
const STUB_ECDSA_SIGNATURE =
    "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c"

const getAccountInitCode = async (
    owner: Address,
    index = BigInt(0)
): Promise<Hex> => {
    if (!owner) throw new Error("Owner account not found")

    return encodeFunctionData({
        abi: ModularSmartAccountAbi.createAccount,
        functionName: "createAccount",
        args: [owner, index]
    })
}

export type ToModularSmartAccountParameters<
    owner extends OneOf<
        | EthereumProvider
        | WalletClient<Transport, Chain | undefined, Account>
        | LocalAccount
    >,
    eip7702 extends boolean = false
> = {
    client: Client<
        Transport,
        Chain | undefined,
        JsonRpcAccount | LocalAccount | undefined
    >
    owner: owner
    eip7702?: eip7702
    signatureWrapper?: (signature: Hex) => Hex | Promise<Hex>
    signer?: LocalAccount | PrivateKeyAccount
} & (eip7702 extends true
    ? {
          entryPoint?: {
              address: Address
              version: "0.8"
          }
          factoryAddress?: never
          index?: never
          address?: never
          nonceKey?: never
          accountLogicAddress?: Address
      }
    : {
          entryPoint?: {
              address: Address
              version: "0.8"
          }
          factoryAddress?: Address
          index?: bigint
          address?: Address
          nonceKey?: bigint
          accountLogicAddress?: Address
      })

export type ModularSmartAccountImplementation<eip7702 extends boolean = false> =
    Assign<
        SmartAccountImplementation<
            typeof entryPoint08Abi,
            "0.8",
            eip7702 extends true ? { implementation: Address } : object,
            eip7702
        >,
        { sign: NonNullable<SmartAccountImplementation["sign"]> }
    >

export type ToModularSmartAccountReturnType<eip7702 extends boolean = false> =
    eip7702 extends true
        ? SmartAccount<ModularSmartAccountImplementation<true>>
        : SmartAccount<ModularSmartAccountImplementation<false>>

/**
 * @description Creates a Modular Smart Account
 *
 * @returns A Modular Smart Account instance
 */
export async function toModularSmartAccount<
    owner extends OneOf<
        | EthereumProvider
        | WalletClient<Transport, Chain | undefined, Account>
        | LocalAccount
    >,
    eip7702 extends boolean = false
>(
    parameters: ToModularSmartAccountParameters<owner, eip7702>
): Promise<ToModularSmartAccountReturnType<eip7702>> {
    const {
        client,
        owner,
        factoryAddress: _factoryAddress,
        index = BigInt(0),
        eip7702 = false,
        address = eip7702 ? owner.address : undefined,
        nonceKey,
        accountLogicAddress,
        signatureWrapper,
        signer: customSigner
    } = parameters

    const localOwner = await toOwner({
        owner,
        address
    })

    // Use custom signer if provided (e.g. for session keys), otherwise use owner
    const signer = customSigner || localOwner

    // Modular account only supports EntryPoint 0.8
    // TODO: throw on mismatched entrypoint
    const entryPoint = {
        address: parameters.entryPoint?.address || entryPoint08Address,
        abi: entryPoint08Abi,
        version: "0.8" as const
    }

    // Default factory address (Renalta Modular Smart Account Factory deployment)
    const factoryAddress =
        _factoryAddress ||
        (accountLogicAddress ? undefined : DEFAULT_FACTORY_ADDRESS)

    let chainId: number
    const getMemoizedChainId = async () => {
        if (chainId) return chainId
        chainId = client.chain
            ? client.chain.id
            : await getAction(client, getChainId, "getChainId")({})
        return chainId
    }

    const getFactoryArgsFunc = () => async () => {
        if (!factoryAddress) {
            throw new Error(
                "Factory address is required for non-EIP-7702 accounts"
            )
        }
        return {
            factory: factoryAddress,
            factoryData: await getAccountInitCode(localOwner.address, index)
        }
    }

    const { accountAddress, getFactoryArgs } = await (async () => {
        if (eip7702) {
            return {
                accountAddress: localOwner.address,
                getFactoryArgs: async () => {
                    return {
                        factory: undefined,
                        factoryData: undefined
                    }
                }
            }
        }

        const getFactoryArgs = getFactoryArgsFunc()

        if (address) {
            return { accountAddress: address, getFactoryArgs }
        }

        const { factory, factoryData } = await getFactoryArgs()

        const accountAddress = await getSenderAddress(client, {
            factory,
            factoryData,
            entryPointAddress: entryPoint.address
        })

        return { accountAddress, getFactoryArgs }
    })()

    // Helper to encode ERC-7579 execution data
    const encodeExecution = (
        calls: { to: Address; value: bigint; data: Hex }[]
    ) => {
        if (calls.length === 1) {
            // Single call: abi.encodePacked(address, uint256, bytes)
            const call = calls[0]
            return encodePacked(
                ["address", "uint256", "bytes"],
                [call.to, call.value, call.data]
            )
        }

        // Batch call: abi.encode(Execution[])
        return encodeAbiParameters(
            parseAbiParameters(
                "(address target, uint256 value, bytes callData)[]"
            ),
            [
                calls.map((call) => ({
                    target: call.to,
                    value: call.value,
                    callData: call.data
                }))
            ]
        )
    }

    const account = await toSmartAccount({
        client,
        entryPoint,
        getFactoryArgs,
        extend: eip7702
            ? {
                  implementation: accountLogicAddress
              }
            : undefined,
        // Don't set authorization here - let the caller handle it explicitly
        // authorization property causes issues with viem's isDeployed() caching
        authorization: undefined,
        async getAddress() {
            return accountAddress
        },
        async encodeCalls(calls) {
            // Use ERC-7579 execute function
            const normalizedCalls = calls.map((c) => ({
                to: c.to,
                value: c.value ?? 0n,
                data: c.data ?? "0x"
            }))

            const executionCalldata = encodeExecution(normalizedCalls)

            // Mode: calltype in upper byte, rest zeros
            // CALLTYPE_SINGLE = 0x00, CALLTYPE_BATCH = 0x01
            const callType =
                normalizedCalls.length === 1 ? CALLTYPE_SINGLE : CALLTYPE_BATCH
            const mode =
                `${callType}00000000000000000000000000000000000000000000000000000000000000` as Hex

            return encodeFunctionData({
                abi: ModularSmartAccountAbi.execute,
                functionName: "execute",
                args: [mode, executionCalldata]
            })
        },
        async getNonce(args) {
            return getAccountNonce(client, {
                address: await this.getAddress(),
                entryPointAddress: entryPoint.address,
                key: nonceKey ?? args?.key
            })
        },
        async getStubSignature() {
            return STUB_ECDSA_SIGNATURE
        },
        async sign({ hash }) {
            return this.signMessage({ message: hash })
        },
        signMessage: async ({ message }) => {
            // ERC-1271 signature via signer (or owner if no custom signer)
            return signer.signMessage({ message })
        },
        signTypedData: async (typedData) => {
            return signer.signTypedData(typedData)
        },
        async signUserOperation(parameters) {
            const { chainId = await getMemoizedChainId(), ...userOperation } =
                parameters

            // Standard EIP-712 typed data signature
            const typedData = getUserOperationTypedData({
                chainId,
                entryPointAddress: entryPoint.address,
                userOperation: {
                    ...userOperation,
                    sender: await this.getAddress(),
                    signature: "0x"
                }
            })
            const signature = await signer.signTypedData(typedData)

            // Apply signature wrapper if provided (e.g., for SmartSessions)
            if (signatureWrapper) {
                return await signatureWrapper(signature)
            }

            return signature
        },
        async decodeCalls(callData) {
            return decode7579Calls(callData).callData
        }
    })

    return account as unknown as ToModularSmartAccountReturnType<eip7702>
}
