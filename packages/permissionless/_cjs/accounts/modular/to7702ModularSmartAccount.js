"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.to7702ModularSmartAccount = to7702ModularSmartAccount;
const toModularSmartAccount_js_1 = require("./toModularSmartAccount.js");
async function to7702ModularSmartAccount(parameters) {
    return (0, toModularSmartAccount_js_1.toModularSmartAccount)({
        ...parameters,
        eip7702: true
    });
}
//# sourceMappingURL=to7702ModularSmartAccount.js.map