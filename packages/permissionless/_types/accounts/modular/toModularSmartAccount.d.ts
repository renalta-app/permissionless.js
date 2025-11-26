import { type Account, type Address, type Assign, type Chain, type Client, type Hex, type JsonRpcAccount, type LocalAccount, type OneOf, type PrivateKeyAccount, type Transport, type WalletClient } from "viem";
import { type SmartAccount, type SmartAccountImplementation, entryPoint08Abi } from "viem/account-abstraction";
import { type EthereumProvider } from "../../utils/toOwner.js";
/**
 * ERC-7579 Call Types
 * @see https://erc7579.com
 */
export declare const CALLTYPE_SINGLE = "0x00";
export declare const CALLTYPE_BATCH = "0x01";
export type ToModularSmartAccountParameters<owner extends OneOf<EthereumProvider | WalletClient<Transport, Chain | undefined, Account> | LocalAccount>, eip7702 extends boolean = false> = {
    client: Client<Transport, Chain | undefined, JsonRpcAccount | LocalAccount | undefined>;
    owner: owner;
    eip7702?: eip7702;
    signatureWrapper?: (signature: Hex) => Hex | Promise<Hex>;
    signer?: LocalAccount | PrivateKeyAccount;
} & (eip7702 extends true ? {
    entryPoint?: {
        address: Address;
        version: "0.8";
    };
    factoryAddress?: never;
    index?: never;
    address?: never;
    nonceKey?: never;
    accountLogicAddress?: Address;
} : {
    entryPoint?: {
        address: Address;
        version: "0.8";
    };
    factoryAddress?: Address;
    index?: bigint;
    address?: Address;
    nonceKey?: bigint;
    accountLogicAddress?: Address;
});
export type ModularSmartAccountImplementation<eip7702 extends boolean = false> = Assign<SmartAccountImplementation<typeof entryPoint08Abi, "0.8", eip7702 extends true ? {
    implementation: Address;
} : object, eip7702>, {
    sign: NonNullable<SmartAccountImplementation["sign"]>;
}>;
export type ToModularSmartAccountReturnType<eip7702 extends boolean = false> = eip7702 extends true ? SmartAccount<ModularSmartAccountImplementation<true>> : SmartAccount<ModularSmartAccountImplementation<false>>;
/**
 * @description Creates a Modular Smart Account
 *
 * @returns A Modular Smart Account instance
 */
export declare function toModularSmartAccount<owner extends OneOf<EthereumProvider | WalletClient<Transport, Chain | undefined, Account> | LocalAccount>, eip7702 extends boolean = false>(parameters: ToModularSmartAccountParameters<owner, eip7702>): Promise<ToModularSmartAccountReturnType<eip7702>>;
//# sourceMappingURL=toModularSmartAccount.d.ts.map