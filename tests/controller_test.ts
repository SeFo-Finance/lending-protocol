import { Clarinet, Chain, Account } from 'https://deno.land/x/clarinet@v1.0.2/index.ts'
import {
  isController,
  mintVerify,
  redeemVerify,
  borrowVerify,
  repayBorrowVerify,
  liquidateBorrowVerify,
  seizeVerify,
  transferVerify,
  // Utility functions
  getExp,
  mulExp,
  mulExp3,
  divExp,
  mulScalarTruncate,
  mulScalarTruncateAddUint,
  truncate,
} from './helpers/controller-helper.ts'
import { SCALAR } from './common.ts'

Clarinet.test({
  name: 'Testing authorization functions',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')
    if (!deployer) throw new Error('deployer not found')
    const stoken = `${deployer.address}.stoken`
    const user1 = accounts.get('wallet_1')
    const user2 = accounts.get('wallet_2')
    if (!user1 || !user2) throw new Error('user1 or user2 not found')

    const isControllerResult = await isController(chain, user1.address)
    isControllerResult.expectBool(true)

    const mintVerifyResult = await mintVerify(chain, user1.address, stoken, stoken, 87n * SCALAR, 10n * SCALAR)
    mintVerifyResult.expectBool(true)

    const redeemVerifyFailedResult = await redeemVerify(chain, user1.address, stoken, user1.address, SCALAR, 0n)
    redeemVerifyFailedResult.expectErr().expectUint(4n)

    const redeemVerifySuccessResult = await redeemVerify(chain, user1.address, stoken, user1.address, 12n * SCALAR, 10n * SCALAR)
    redeemVerifySuccessResult.expectOk().expectBool(true)

    const borrowVerifyResult = await borrowVerify(chain, user1.address, stoken, user1.address, 12n * SCALAR)
    borrowVerifyResult.expectBool(true)

    const repayBorrowVerifyResult = await repayBorrowVerify(
      chain,
      user1.address,
      stoken,
      user1.address,
      user2.address,
      100n * SCALAR,
      0n,
    )
    repayBorrowVerifyResult.expectBool(true)

    const liquidateBorrowVerifyResult = await liquidateBorrowVerify(
      chain,
      user1.address,
      stoken,
      stoken,
      user1.address,
      user2.address,
      50n * SCALAR,
      100n * SCALAR,
    )
    liquidateBorrowVerifyResult.expectBool(true)

    const seizeVerifyResult = await seizeVerify(
      chain,
      user1.address,
      stoken,
      stoken,
      user1.address,
      user2.address,
      100n * SCALAR,
    )
    seizeVerifyResult.expectBool(true)

    const transferVerifyResult = await transferVerify(
      chain,
      user1.address,
      stoken,
      user1.address,
      user2.address,
      100n * SCALAR,
    )
    transferVerifyResult.expectBool(true)
  },
})

// Utility functions
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

// Oracle functions
