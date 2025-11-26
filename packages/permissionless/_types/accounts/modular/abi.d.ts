export declare const ModularSmartAccountAbi: {
    readonly createAccount: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "address";
            readonly name: "owner";
            readonly type: "address";
        }, {
            readonly internalType: "uint256";
            readonly name: "salt";
            readonly type: "uint256";
        }];
        readonly name: "createAccount";
        readonly outputs: readonly [{
            readonly internalType: "address";
            readonly name: "";
            readonly type: "address";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "function";
    }];
    readonly execute: readonly [{
        readonly type: "function";
        readonly name: "execute";
        readonly inputs: readonly [{
            readonly name: "mode";
            readonly type: "bytes32";
        }, {
            readonly name: "executionCalldata";
            readonly type: "bytes";
        }];
        readonly outputs: readonly [];
        readonly stateMutability: "payable";
    }];
    readonly isModuleInstalled: readonly [{
        readonly type: "function";
        readonly name: "isModuleInstalled";
        readonly inputs: readonly [{
            readonly name: "moduleTypeId";
            readonly type: "uint256";
        }, {
            readonly name: "module";
            readonly type: "address";
        }, {
            readonly name: "additionalContext";
            readonly type: "bytes";
        }];
        readonly outputs: readonly [{
            readonly type: "bool";
        }];
        readonly stateMutability: "view";
    }];
    readonly installModule: readonly [{
        readonly type: "function";
        readonly name: "installModule";
        readonly inputs: readonly [{
            readonly name: "moduleTypeId";
            readonly type: "uint256";
        }, {
            readonly name: "module";
            readonly type: "address";
        }, {
            readonly name: "initData";
            readonly type: "bytes";
        }];
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
    }];
    readonly uninstallModule: readonly [{
        readonly type: "function";
        readonly name: "uninstallModule";
        readonly inputs: readonly [{
            readonly name: "moduleTypeId";
            readonly type: "uint256";
        }, {
            readonly name: "module";
            readonly type: "address";
        }, {
            readonly name: "deInitData";
            readonly type: "bytes";
        }];
        readonly outputs: readonly [];
        readonly stateMutability: "nonpayable";
    }];
};
//# sourceMappingURL=abi.d.ts.map