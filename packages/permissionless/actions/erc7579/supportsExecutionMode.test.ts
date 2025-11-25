import { zeroAddress } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getCoreSmartAccounts,
    getLatestEntryPointVersion,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import { supportsExecutionMode } from "./supportsExecutionMode"

describe.each(getCoreSmartAccounts())(
    "supportsExecutionMode $name",
    (account) => {
        const { getErc7579SmartAccountClient, isEip7702Compliant } = account

        testWithRpc.skipIf(!getErc7579SmartAccountClient)(
            "supportsExecutionMode",
            async ({ rpc }) => {
                if (!getErc7579SmartAccountClient) {
                    throw new Error("getErc7579SmartAccountClient not defined")
                }

                const privateKey =
                    "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356"
                const privateKeyAccount = privateKeyToAccount(privateKey)

                const publicClient = getPublicClient(rpc.anvilRpc)

                const smartClient = await getErc7579SmartAccountClient({
                    entryPoint: {
                        version: getLatestEntryPointVersion(account)
                    },
                    privateKey,
                    ...rpc
                })

                // For EIP-7702 accounts, we can't query before authorization
                const supportsExecutionModeBatchCallBeforeDeploy =
                    isEip7702Compliant
                        ? null
                        : await supportsExecutionMode(smartClient, {
                              account: smartClient.account,
                              type: "batchcall",
                              revertOnError: false,
                              selector: "0x0",
                              context: "0x"
                          })

                if (!isEip7702Compliant) {
                    expect(supportsExecutionModeBatchCallBeforeDeploy).toBe(
                        true
                    )
                }

                // deploy account (or set up 7702 authorization)
                await smartClient.sendTransaction({
                    to: zeroAddress,
                    value: 0n,
                    data: "0x",
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

                const supportsExecutionModeBatchCallBeforeDeployPostDeploy =
                    await supportsExecutionMode(smartClient, {
                        account: smartClient.account,
                        type: "batchcall",
                        revertOnError: false,
                        selector: "0x0",
                        context: "0x"
                    })

                expect(
                    supportsExecutionModeBatchCallBeforeDeployPostDeploy
                ).toBe(true)

                if (!isEip7702Compliant) {
                    expect(supportsExecutionModeBatchCallBeforeDeploy).toBe(
                        supportsExecutionModeBatchCallBeforeDeployPostDeploy
                    )
                }
            }
        )
        testWithRpc.skipIf(!getErc7579SmartAccountClient)(
            "supportsExecutionMode",
            async ({ rpc }) => {
                if (!getErc7579SmartAccountClient) {
                    throw new Error("getErc7579SmartAccountClient not defined")
                }

                const privateKey =
                    "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356"
                const privateKeyAccount = privateKeyToAccount(privateKey)

                const publicClient = getPublicClient(rpc.anvilRpc)

                const smartClient = await getErc7579SmartAccountClient({
                    entryPoint: {
                        version: getLatestEntryPointVersion(account)
                    },
                    privateKey,
                    ...rpc
                })

                // For EIP-7702 accounts, we can't query before authorization
                const supportsExecutionModeDelegatecallBeforeDeploy =
                    isEip7702Compliant
                        ? null
                        : await supportsExecutionMode(smartClient, {
                              account: smartClient.account,
                              type: "delegatecall"
                          })

                if (!isEip7702Compliant) {
                    expect(supportsExecutionModeDelegatecallBeforeDeploy).toBe(
                        true
                    )
                }

                // deploy account (or set up 7702 authorization)
                await smartClient.sendTransaction({
                    to: zeroAddress,
                    value: 0n,
                    data: "0x",
                    authorization: isEip7702Compliant
                        ? await privateKeyAccount.signAuthorization({
                              address: (smartClient.account as any)
                                  .implementation,
                              chainId: smartClient.chain.id,
                              nonce: await publicClient.getTransactionCount({
                                  address: smartClient.account.address
                              })
                          })
                        : undefined
                })

                const supportsExecutionModeBatchCallPostDeploy =
                    await supportsExecutionMode(smartClient, {
                        account: smartClient.account,
                        type: "batchcall",
                        revertOnError: false,
                        selector: "0x0",
                        context: "0x"
                    })

                expect(supportsExecutionModeBatchCallPostDeploy).toBe(true)

                if (!isEip7702Compliant) {
                    expect(supportsExecutionModeDelegatecallBeforeDeploy).toBe(
                        supportsExecutionModeBatchCallPostDeploy
                    )
                }
            }
        )
    }
)
