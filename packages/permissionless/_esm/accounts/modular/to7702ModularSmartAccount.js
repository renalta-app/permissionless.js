import { toModularSmartAccount } from "./toModularSmartAccount.js";
export async function to7702ModularSmartAccount(parameters) {
    return toModularSmartAccount({
        ...parameters,
        eip7702: true
    });
}
//# sourceMappingURL=to7702ModularSmartAccount.js.map