import { zeroAddress } from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { describe, expect } from "vitest"
import { testWithRpc } from "../../../permissionless-test/src/testWithRpc"
import {
    getCoreSmartAccounts,
    getLatestEntryPointVersion,
    getPublicClient
} from "../../../permissionless-test/src/utils"
import { accountId } from "./accountId"

describe.each(getCoreSmartAccounts())("accountId $name", (account) => {
    const { getErc7579SmartAccountClient, isEip7702Compliant } = account

    testWithRpc.skipIf(!getErc7579SmartAccountClient)(
        "accountId",
        async ({ rpc }) => {
            if (!getErc7579SmartAccountClient) {
                throw new Error("getErc7579SmartAccountClient not defined")
            }

            const privateKey =
                "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356"
            const privateKeyAccount = privateKeyToAccount(privateKey)

            const smartClient = await getErc7579SmartAccountClient({
                entryPoint: {
                    version: getLatestEntryPointVersion(account)
                },
                privateKey,
                ...rpc
            })

            const publicClient = getPublicClient(rpc.anvilRpc)

            // For EIP-7702 accounts, we can't query accountId before authorization
            // since the EOA has no code until the first tx with authorization is sent
            const accountIdBeforeDeploy = isEip7702Compliant
                ? null
                : await accountId(smartClient)

            // deploy account (or set up 7702 authorization)
            await smartClient.sendTransaction({
                to: zeroAddress,
                value: 0n,
                data: "0x",
                authorization: isEip7702Compliant
                    ? await privateKeyAccount.signAuthorization({
                          address: (smartClient.account as any).implementation,
                          chainId: smartClient.chain.id,
                          nonce: await publicClient.getTransactionCount({
                              address: smartClient.account.address
                          })
                      })
                    : undefined
            })

            const postDeployAccountId = await accountId(smartClient)

            if (!isEip7702Compliant) {
                expect(accountIdBeforeDeploy).toBe(postDeployAccountId)
            }

            expect(postDeployAccountId).toBeTruthy()
        }
    )
})
