"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CALLTYPE_BATCH = exports.CALLTYPE_SINGLE = void 0;
exports.toModularSmartAccount = toModularSmartAccount;
const viem_1 = require("viem");
const account_abstraction_1 = require("viem/account-abstraction");
const actions_1 = require("viem/actions");
const utils_1 = require("viem/utils");
const getAccountNonce_js_1 = require("../../actions/public/getAccountNonce.js");
const getSenderAddress_js_1 = require("../../actions/public/getSenderAddress.js");
const decode7579Calls_js_1 = require("../../utils/decode7579Calls.js");
const toOwner_js_1 = require("../../utils/toOwner.js");
const abi_js_1 = require("./abi.js");
const DEFAULT_FACTORY_ADDRESS = "0x00af0100b5d4dd9bacc054282c103530287e7305";
exports.CALLTYPE_SINGLE = "0x00";
exports.CALLTYPE_BATCH = "0x01";
const STUB_ECDSA_SIGNATURE = "0xfffffffffffffffffffffffffffffff0000000000000000000000000000000007aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1c";
const getAccountInitCode = async (owner, index = BigInt(0)) => {
    if (!owner)
        throw new Error("Owner account not found");
    return (0, viem_1.encodeFunctionData)({
        abi: abi_js_1.ModularSmartAccountAbi.createAccount,
        functionName: "createAccount",
        args: [owner, index]
    });
};
async function toModularSmartAccount(parameters) {
    const { client, owner, factoryAddress: _factoryAddress, index = BigInt(0), eip7702 = false, address = eip7702 ? owner.address : undefined, nonceKey, accountLogicAddress, signatureWrapper, signer: customSigner } = parameters;
    const localOwner = await (0, toOwner_js_1.toOwner)({
        owner,
        address
    });
    const signer = customSigner || localOwner;
    const entryPoint = {
        address: parameters.entryPoint?.address || account_abstraction_1.entryPoint08Address,
        abi: account_abstraction_1.entryPoint08Abi,
        version: "0.8"
    };
    const factoryAddress = _factoryAddress ||
        (accountLogicAddress ? undefined : DEFAULT_FACTORY_ADDRESS);
    let chainId;
    const getMemoizedChainId = async () => {
        if (chainId)
            return chainId;
        chainId = client.chain
            ? client.chain.id
            : await (0, utils_1.getAction)(client, actions_1.getChainId, "getChainId")({});
        return chainId;
    };
    const getFactoryArgsFunc = () => async () => {
        if (!factoryAddress) {
            throw new Error("Factory address is required for non-EIP-7702 accounts");
        }
        return {
            factory: factoryAddress,
            factoryData: await getAccountInitCode(localOwner.address, index)
        };
    };
    const { accountAddress, getFactoryArgs } = await (async () => {
        if (eip7702) {
            return {
                accountAddress: localOwner.address,
                getFactoryArgs: async () => {
                    return {
                        factory: undefined,
                        factoryData: undefined
                    };
                }
            };
        }
        const getFactoryArgs = getFactoryArgsFunc();
        if (address) {
            return { accountAddress: address, getFactoryArgs };
        }
        const { factory, factoryData } = await getFactoryArgs();
        const accountAddress = await (0, getSenderAddress_js_1.getSenderAddress)(client, {
            factory,
            factoryData,
            entryPointAddress: entryPoint.address
        });
        return { accountAddress, getFactoryArgs };
    })();
    const encodeExecution = (calls) => {
        if (calls.length === 1) {
            const call = calls[0];
            return (0, viem_1.encodePacked)(["address", "uint256", "bytes"], [call.to, call.value, call.data]);
        }
        return (0, viem_1.encodeAbiParameters)((0, viem_1.parseAbiParameters)("(address target, uint256 value, bytes callData)[]"), [
            calls.map((call) => ({
                target: call.to,
                value: call.value,
                callData: call.data
            }))
        ]);
    };
    const account = await (0, account_abstraction_1.toSmartAccount)({
        client,
        entryPoint,
        getFactoryArgs,
        extend: eip7702
            ? {
                implementation: accountLogicAddress
            }
            : undefined,
        authorization: undefined,
        async getAddress() {
            return accountAddress;
        },
        async encodeCalls(calls) {
            const normalizedCalls = calls.map((c) => ({
                to: c.to,
                value: c.value ?? 0n,
                data: c.data ?? "0x"
            }));
            const executionCalldata = encodeExecution(normalizedCalls);
            const callType = normalizedCalls.length === 1 ? exports.CALLTYPE_SINGLE : exports.CALLTYPE_BATCH;
            const mode = `${callType}00000000000000000000000000000000000000000000000000000000000000`;
            return (0, viem_1.encodeFunctionData)({
                abi: abi_js_1.ModularSmartAccountAbi.execute,
                functionName: "execute",
                args: [mode, executionCalldata]
            });
        },
        async getNonce(args) {
            return (0, getAccountNonce_js_1.getAccountNonce)(client, {
                address: await this.getAddress(),
                entryPointAddress: entryPoint.address,
                key: nonceKey ?? args?.key
            });
        },
        async getStubSignature() {
            return STUB_ECDSA_SIGNATURE;
        },
        async sign({ hash }) {
            return this.signMessage({ message: hash });
        },
        signMessage: async ({ message }) => {
            return signer.signMessage({ message });
        },
        signTypedData: async (typedData) => {
            return signer.signTypedData(typedData);
        },
        async signUserOperation(parameters) {
            const { chainId = await getMemoizedChainId(), ...userOperation } = parameters;
            const typedData = (0, account_abstraction_1.getUserOperationTypedData)({
                chainId,
                entryPointAddress: entryPoint.address,
                userOperation: {
                    ...userOperation,
                    sender: await this.getAddress(),
                    signature: "0x"
                }
            });
            const signature = await signer.signTypedData(typedData);
            if (signatureWrapper) {
                return await signatureWrapper(signature);
            }
            return signature;
        },
        async decodeCalls(callData) {
            return (0, decode7579Calls_js_1.decode7579Calls)(callData).callData;
        }
    });
    return account;
}
//# sourceMappingURL=toModularSmartAccount.js.map