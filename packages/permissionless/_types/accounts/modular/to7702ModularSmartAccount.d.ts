import type { Account, Chain, LocalAccount, OneOf, Transport, WalletClient } from "viem";
import type { SmartAccount } from "viem/account-abstraction";
import type { EthereumProvider } from "../../utils/toOwner.js";
import { type ModularSmartAccountImplementation, type ToModularSmartAccountParameters } from "./toModularSmartAccount.js";
export type To7702ModularSmartAccountParameters<owner extends OneOf<EthereumProvider | WalletClient<Transport, Chain | undefined, Account> | LocalAccount>> = ToModularSmartAccountParameters<owner, true>;
export type To7702ModularSmartAccountImplementation = ModularSmartAccountImplementation<true>;
export type To7702ModularSmartAccountReturnType = SmartAccount<ModularSmartAccountImplementation<true>>;
export declare function to7702ModularSmartAccount<owner extends OneOf<EthereumProvider | WalletClient<Transport, Chain | undefined, Account> | LocalAccount>>(parameters: To7702ModularSmartAccountParameters<owner>): Promise<To7702ModularSmartAccountReturnType>;
//# sourceMappingURL=to7702ModularSmartAccount.d.ts.map