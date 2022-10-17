import { Clarinet, Chain, Account } from 'https://deno.land/x/clarinet@v1.0.2/index.ts'
import {
  // Authorization functions
  isController,
  // Verification functions
  mintVerify,
  redeemVerify,
  borrowVerify,
  repayBorrowVerify,
  liquidateBorrowVerify,
  seizeVerify,
  transferVerify,
  // Admin setter functions
  setCloseFactor,
  setCollateralFactor,
  setMaxAssets,
  setLiquidationIncentive,
  // Utility functions
  getExp,
  mulExp,
  mulExp3,
  divExp,
  mulScalarTruncate,
  mulScalarTruncateAddUint,
  truncate,
  // Oracle functions
  getUnderlyingPrice,
  setPriceOracle,
} from './helpers/controller-helper.ts'
import { SCALAR } from './common.ts'

Clarinet.test({
  name: 'Testing authorization functions',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const user1 = accounts.get('wallet_1')
    if (!user1) throw new Error('user1 not found')

    const isControllerResult = await isController(chain, user1.address)
    isControllerResult.expectBool(true)
  },
})

Clarinet.test({
  name: 'Testing verification functions',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')
    if (!deployer) throw new Error('deployer not found')
    const stoken = `${deployer.address}.stoken`
    const user1 = accounts.get('wallet_1')
    const user2 = accounts.get('wallet_2')
    if (!user1 || !user2) throw new Error('user1 or user2 not found')

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

// Admin setter functions
const CLOSE_FACTOR_MIN_MANTISSA = 5n * SCALAR / 100n           // 0.05
const CLOSE_FACTOR_MAX_MANTISSA = 9n * SCALAR / 10n            // 0.9
const LIQUIDATION_INCENTIVE_MIN_MANTISSA = SCALAR              // 1
const LIQUIDATION_INCENTIVE_MAX_MANTISSA = 15n * SCALAR / 10n  // 1.5

Clarinet.test({
  name: 'Testing admin setter functions',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const admin = accounts.get('deployer')
    if (!admin) throw new Error('admin not found')
    const user1 = accounts.get('wallet_1')
    if (!user1) throw new Error('user1 not found')

    /* setCloseFactor */
    const setCloseFactorCheckAdminResult = await setCloseFactor(chain, user1.address, SCALAR)
    setCloseFactorCheckAdminResult.expectErr().expectUint(1n)

    // <= CLOSE_FACTOR_MIN_MANTISSA
    const setCloseFactorFailedResult1 = await setCloseFactor(chain, admin.address, 4n * SCALAR / 100n)
    setCloseFactorFailedResult1.expectErr().expectUint(5n)

    // > CLOSE_FACTOR_MAX_MANTISSA
    const setCloseFactorFailedResult2 = await setCloseFactor(chain, admin.address, 95n * SCALAR / 100n)
    setCloseFactorFailedResult2.expectErr().expectUint(5n)

    const setCloseFactorSuccessResult = await setCloseFactor(chain, admin.address, 8n * SCALAR / 10n)
    setCloseFactorSuccessResult.expectOk().expectUint(0n)

    // FIXME: setCollateralFactor

    /* setMaxAssets */
    const setMaxAssetsCheckAdminResult = await setMaxAssets(chain, user1.address, 10n)
    setMaxAssetsCheckAdminResult.expectErr().expectUint(1n)

    const setMaxAssetsSuccessResult = await setMaxAssets(chain, admin.address, 10n)
    setMaxAssetsSuccessResult.expectOk().expectUint(0n)

    /* setLiquidationIncentive */
    const setLiquidationIncentiveCheckAdminResult = await setLiquidationIncentive(chain, user1.address, SCALAR)
    setLiquidationIncentiveCheckAdminResult.expectErr().expectUint(1n)

    // < LIQUIDATION_INCENTIVE_MIN_MANTISSA
    const setLiquidationIncentiveFailedResult1 = await setLiquidationIncentive(chain, admin.address, SCALAR / 10n)
    setLiquidationIncentiveFailedResult1.expectErr().expectUint(7n)

    // > LIQUIDATION_INCENTIVE_MAX_MANTISSA
    const setLiquidationIncentiveFailedResult2 = await setLiquidationIncentive(chain, admin.address, 151n * SCALAR / 100n)
    setLiquidationIncentiveFailedResult2.expectErr().expectUint(7n)

    const setLiquidationIncentiveSuccessResult = await setLiquidationIncentive(chain, admin.address, 12n * SCALAR / 10n)
    setLiquidationIncentiveSuccessResult.expectOk().expectUint(0n)
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
Clarinet.test({
  name: 'Testing oracle utility functions',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')
    if (!deployer) throw new Error('deployer not found')
    const stoken = `${deployer.address}.stoken`
    const user1 = accounts.get('wallet_1')
    if (!user1) throw new Error('user1 not found')

    // FIXME: Test trait
    const getUnderlyingPriceResult = await getUnderlyingPrice(chain, user1.address)
    getUnderlyingPriceResult.expectUint(3n * SCALAR / 10n)

    const setPriceOracleResult = await setPriceOracle(chain, user1.address, 3n * SCALAR)
    setPriceOracleResult.expectUint(0n)
  },
})
