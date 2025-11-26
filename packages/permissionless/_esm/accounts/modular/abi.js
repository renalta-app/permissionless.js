export const ModularSmartAccountAbi = {
    createAccount: [
        {
            inputs: [
                {
                    internalType: "address",
                    name: "owner",
                    type: "address"
                },
                {
                    internalType: "uint256",
                    name: "salt",
                    type: "uint256"
                }
            ],
            name: "createAccount",
            outputs: [
                {
                    internalType: "address",
                    name: "",
                    type: "address"
                }
            ],
            stateMutability: "nonpayable",
            type: "function"
        }
    ],
    execute: [
        {
            type: "function",
            name: "execute",
            inputs: [
                { name: "mode", type: "bytes32" },
                { name: "executionCalldata", type: "bytes" }
            ],
            outputs: [],
            stateMutability: "payable"
        }
    ],
    isModuleInstalled: [
        {
            type: "function",
            name: "isModuleInstalled",
            inputs: [
                { name: "moduleTypeId", type: "uint256" },
                { name: "module", type: "address" },
                { name: "additionalContext", type: "bytes" }
            ],
            outputs: [{ type: "bool" }],
            stateMutability: "view"
        }
    ],
    installModule: [
        {
            type: "function",
            name: "installModule",
            inputs: [
                { name: "moduleTypeId", type: "uint256" },
                { name: "module", type: "address" },
                { name: "initData", type: "bytes" }
            ],
            outputs: [],
            stateMutability: "nonpayable"
        }
    ],
    uninstallModule: [
        {
            type: "function",
            name: "uninstallModule",
            inputs: [
                { name: "moduleTypeId", type: "uint256" },
                { name: "module", type: "address" },
                { name: "deInitData", type: "bytes" }
            ],
            outputs: [],
            stateMutability: "nonpayable"
        }
    ]
};
//# sourceMappingURL=abi.js.map