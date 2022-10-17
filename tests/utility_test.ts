import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts'
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts'
import { 
    getExp,
    mulExp,
    mulExp3,
    divExp,
    mulScalarTruncate,
    mulScalarTruncateAddUint,
    truncate,
} from './helpers/controllerUtility-helper.ts'
import { SCALAR } from './common.ts'

Clarinet.test({
    name: 'Testing exponential calculation',
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')
        if (!deployer) throw new Error('deployer not found')
        const user1 = accounts.get('wallet_1')
        if (!user1) throw new Error('user1 not found')

        const getExpResult = await getExp(chain, user1.address, 4n, 2n)
        getExpResult.expectUint(2n * SCALAR)

        const mulExpResult = await mulExp(chain, user1.address, 4n * SCALAR, 2n * SCALAR)
        mulExpResult.expectUint(4n * 2n * SCALAR)

        const mulExp3Result = await mulExp3(chain, user1.address, 4n * SCALAR, 2n * SCALAR, 8n * SCALAR)
        mulExp3Result.expectUint(4n * 2n * 8n * SCALAR)

        const divExpResult1 = await divExp(chain, user1.address, 4n * SCALAR, 2n * SCALAR)
        divExpResult1.expectUint(2n * SCALAR)

        const divExpResult2 = await divExp(chain, user1.address, 4n * SCALAR, 3n * SCALAR)
        divExpResult2.expectUint(4n * SCALAR / 3n)

        const mulScalarTruncateResult = await mulScalarTruncate(chain, user1.address, 4n * SCALAR, 2n * SCALAR)
        mulScalarTruncateResult.expectUint(4n * 2n * SCALAR)

        const mulScalarTruncateAddUintResult = await mulScalarTruncateAddUint(chain, user1.address, 4n * SCALAR, 2n * SCALAR, 12n)
        mulScalarTruncateAddUintResult.expectUint(4n * 2n * SCALAR + 12n)

        const truncateResult1 = await truncate(chain, user1.address, 4n * SCALAR)
        truncateResult1.expectUint(4n)

        const truncateResult2 = await truncate(chain, user1.address, 4n * 100_000n)
        truncateResult2.expectUint(0n)
    },
})
