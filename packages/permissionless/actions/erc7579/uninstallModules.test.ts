import { encodeAbiParameters, encodePacked, isHash, zeroAddress } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getCoreSmartAccounts,
    getLatestEntryPointVersion,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import { erc7579Actions } from "../erc7579"
import { uninstallModules } from "./uninstallModules"

describe.each(getCoreSmartAccounts())("uninstallModules $name", (account) => {
    const { getErc7579SmartAccountClient, name, isEip7702Compliant } = account

    testWithRpc.skipIf(!getErc7579SmartAccountClient)(
        "uninstallModules",
        async ({ rpc }) => {
            if (!getErc7579SmartAccountClient) {
                throw new Error("getErc7579SmartAccountClient not defined")
            }

            const privateKey =
                "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356"
            const privateKeyAccount = privateKeyToAccount(privateKey)

            const publicClient = getPublicClient(rpc.anvilRpc)

            const smartClientWithoutExtend = await getErc7579SmartAccountClient(
                {
                    entryPoint: {
                        version: getLatestEntryPointVersion(account)
                    },
                    privateKey,
                    ...rpc
                }
            )

            const smartClient = smartClientWithoutExtend.extend(
                erc7579Actions()
            )

            const moduleData = encodePacked(
                ["address"],
                [smartClient.account.address]
            )

            const opHash = await smartClient.installModule({
                type: "executor",
                address: "0x4Fd8d57b94966982B62e9588C27B4171B55E8354",
                context: name.startsWith("Kernel 7579")
                    ? encodePacked(
                          ["address", "bytes"],
                          [
                              zeroAddress,
                              encodeAbiParameters(
                                  [{ type: "bytes" }, { type: "bytes" }],
                                  [moduleData, "0x"]
                              )
                          ]
                      )
                    : moduleData,
                authorization: isEip7702Compliant
                    ? await privateKeyAccount.signAuthorization({
                          address: smartClient.account.implementation,
                          chainId: smartClient.chain.id,
                          nonce: await publicClient.getTransactionCount({
                              address: smartClient.account.address
                          })
                      })
                    : undefined
            })

            await smartClient.waitForUserOperationReceipt({
                hash: opHash,
                timeout: 100000
            })

            const uninstallModulesUserOpHash = await uninstallModules(
                smartClient,
                {
                    account: smartClient.account,
                    modules: [
                        {
                            type: "executor",
                            address:
                                "0x4Fd8d57b94966982B62e9588C27B4171B55E8354",
                            context: name.startsWith("Kernel 7579")
                                ? "0x"
                                : encodeAbiParameters(
                                      [
                                          {
                                              name: "prev",
                                              type: "address"
                                          },
                                          {
                                              name: "moduleInitData",
                                              type: "bytes"
                                          }
                                      ],
                                      [
                                          "0x0000000000000000000000000000000000000001",
                                          "0x"
                                      ]
                                  )
                        }
                    ]
                }
            )

            expect(isHash(uninstallModulesUserOpHash)).toBe(true)

            const userOperationReceiptUninstallModules =
                await smartClient.waitForUserOperationReceipt({
                    hash: uninstallModulesUserOpHash,
                    timeout: 100000
                })
            expect(userOperationReceiptUninstallModules).not.toBeNull()
            expect(userOperationReceiptUninstallModules?.userOpHash).toBe(
                uninstallModulesUserOpHash
            )
            expect(
                userOperationReceiptUninstallModules?.receipt.transactionHash
            ).toBeTruthy()

            const receiptUninstallModules =
                await smartClient.getUserOperationReceipt({
                    hash: uninstallModulesUserOpHash
                })

            expect(receiptUninstallModules?.receipt.transactionHash).toBe(
                userOperationReceiptUninstallModules?.receipt.transactionHash
            )
        }
    )
})
