import { zeroAddress } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getCoreSmartAccounts,
    getLatestEntryPointVersion,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import { supportsModule } from "./supportsModule"

describe.each(getCoreSmartAccounts())("supportsModule $name", (account) => {
    const { getErc7579SmartAccountClient, isEip7702Compliant } = account

    testWithRpc.skipIf(!getErc7579SmartAccountClient)(
        "supportsModule",
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

            // For EIP-7702 accounts, we need to set up authorization first
            if (isEip7702Compliant) {
                await smartClient.sendTransaction({
                    to: zeroAddress,
                    value: 0n,
                    data: "0x",
                    authorization: await privateKeyAccount.signAuthorization({
                        address: (smartClient.account as any).implementation,
                        chainId: smartClient.chain.id,
                        nonce: await publicClient.getTransactionCount({
                            address: smartClient.account.address
                        })
                    })
                })
            }

            const supportsValidationModule = await supportsModule(smartClient, {
                account: smartClient.account,
                type: "validator"
            })

            expect(supportsValidationModule).toBe(true)
        }
    )
})
