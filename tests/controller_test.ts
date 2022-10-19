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
  // Allowance functions
  mintAllowed,
  redeemAllowed,
  borrowAllowed,
  // Getter functions
  getMarket,
  // Admin setter functions
  setCloseFactor,
  setCollateralFactor,
  setMaxAssets,
  setLiquidationIncentive,
  supportMarket,
  // Utility functions
  enterMarkets,
  // SafeMath functions
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

// Authorization functions
Clarinet.test({
  name: 'Testing authorization functions',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const user1 = accounts.get('wallet_1')
    if (!user1) throw new Error('user1 not found')

    const isControllerResult = await isController(chain, user1.address)
    isControllerResult.expectBool(true)
  },
})

// Verification functions
Clarinet.test({
  name: 'Testing verification functions',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')
    if (!deployer) throw new Error('deployer not found')
    const stoken = `${deployer.address}.stoken`
    const user1 = accounts.get('wallet_1')
    const user2 = accounts.get('wallet_2')
    if (!user1 || !user2) throw new Error('user1 or user2 not found')

    /* mint-verify */
    const mintVerifyResult = await mintVerify(chain, user1.address, stoken, stoken, 87n * SCALAR, 10n * SCALAR)
    mintVerifyResult.expectBool(true)

    /* redeem-verify */
    const redeemVerifyFailedResult = await redeemVerify(chain, user1.address, stoken, user1.address, SCALAR, 0n)
    redeemVerifyFailedResult.expectErr().expectUint(4n)
    const redeemVerifySuccessResult = await redeemVerify(chain, user1.address, stoken, user1.address, 12n * SCALAR, 10n * SCALAR)
    redeemVerifySuccessResult.expectOk().expectBool(true)

    /* borrow-verify */
    const borrowVerifyResult = await borrowVerify(chain, user1.address, stoken, user1.address, 12n * SCALAR)
    borrowVerifyResult.expectBool(true)

    /* repay-borrow-verify */
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

    /* liquidate-borrow-verify */
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

    /* seize-verify */
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

    /* transfer-verify */
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

// Allowance functions
Clarinet.test({
  name: 'Testing allowance functions',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')
    if (!deployer) throw new Error('deployer not found')
    const stoken = `${deployer.address}.stoken`
    const user1 = accounts.get('wallet_1')
    const user2 = accounts.get('wallet_2')
    if (!user1 || !user2) throw new Error('user1 or user2 not found')

    // Initialize market
    await supportMarket(chain, deployer.address, stoken)
    await enterMarkets(chain, user1.address, [stoken])

    /* mint-allowed */
    const mintAllowedResult = await mintAllowed(chain, user1.address, stoken, user1.address, 87n * SCALAR)
    mintAllowedResult.expectOk().expectUint(0n)
    const mintAllowedFailed = await mintAllowed(chain, user1.address, user2.address, user1.address, 87n * SCALAR)
    mintAllowedFailed.expectErr().expectUint(9n)

    /* redeem-allowed */
    const redeemAllowedResult = await redeemAllowed(chain, user1.address, stoken, user1.address, 87n * SCALAR)
    mintAllowedResult.expectOk().expectUint(0n)

    /* borrow-allowed */
    const borrowAllowedResult = await borrowAllowed(chain, user1.address, stoken, user1.address, 87n * SCALAR)
    borrowAllowedResult.expectOk().expectUint(0n)
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
    const stoken = `${admin.address}.stoken`
    const user1 = accounts.get('wallet_1')
    if (!user1) throw new Error('user1 not found')

    /* support-market */
    const supportMarketCheckAdminResult = await supportMarket(chain, user1.address, stoken)
    supportMarketCheckAdminResult.expectErr().expectUint(1n)
    const supportMarketResult1 = await supportMarket(chain, admin.address, stoken)
    supportMarketResult1.expectOk().expectUint(0n)
    const getMarketResult = await getMarket(chain, admin.address, stoken)
    getMarketResult.expectOk().expectTuple()
    const supportMarketResult2 = await supportMarket(chain, admin.address, stoken)
    supportMarketResult2.expectErr().expectUint(10n)

    /* set-close-factor */
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

    /* set-collateral-factor */
    const setCollateralFactorCheckAdminResult = await setCollateralFactor(chain, user1.address, stoken, 8n * SCALAR / 10n)
    setCollateralFactorCheckAdminResult.expectErr().expectUint(1n)
    const setCollateralFactorResult = await setCollateralFactor(chain, admin.address, stoken, 8n * SCALAR / 10n)
    setCollateralFactorResult.expectOk().expectUint(0n)
    // > 0.9
    const setCollateralFactorFailedResult = await setCollateralFactor(chain, admin.address, stoken, 95n * SCALAR / 100n)
    setCollateralFactorFailedResult.expectErr().expectUint(6n)

    /* set-max-assets */
    const setMaxAssetsCheckAdminResult = await setMaxAssets(chain, user1.address, 10n)
    setMaxAssetsCheckAdminResult.expectErr().expectUint(1n)
    const setMaxAssetsSuccessResult = await setMaxAssets(chain, admin.address, 10n)
    setMaxAssetsSuccessResult.expectOk().expectUint(0n)

    /* set-liquidation-incentive */
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
  name: 'Testing utility functions',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')
    if (!deployer) throw new Error('deployer not found')
    const stoken = `${deployer.address}.stoken`
    const user1 = accounts.get('wallet_1')
    if (!user1) throw new Error('user1 not found')

    // Initialize market
    await supportMarket(chain, deployer.address, stoken)
    const enterMarketsResult = await enterMarkets(chain, user1.address, [stoken])
    enterMarketsResult.expectList()
  },
})

// SafeMath functions
Clarinet.test({
  name: 'Testing exponential calculation',
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')
    if (!deployer) throw new Error('deployer not found')
    const user1 = accounts.get('wallet_1')
    if (!user1) throw new Error('user1 not found')

    /* get-exp */
    const getExpResult = await getExp(chain, user1.address, 4n, 2n)
    getExpResult.expectUint(2n * SCALAR)

    /* mul-exp */
    const mulExpResult = await mulExp(chain, user1.address, 4n * SCALAR, 2n * SCALAR)
    mulExpResult.expectUint(4n * 2n * SCALAR)

    /* mul-exp3 */
    const mulExp3Result = await mulExp3(chain, user1.address, 4n * SCALAR, 2n * SCALAR, 8n * SCALAR)
    mulExp3Result.expectUint(4n * 2n * 8n * SCALAR)

    /* div-exp */
    const divExpResult1 = await divExp(chain, user1.address, 4n * SCALAR, 2n * SCALAR)
    divExpResult1.expectUint(2n * SCALAR)
    const divExpResult2 = await divExp(chain, user1.address, 4n * SCALAR, 3n * SCALAR)
    divExpResult2.expectUint(4n * SCALAR / 3n)

    /* mul-scalar-truncate */
    const mulScalarTruncateResult = await mulScalarTruncate(chain, user1.address, 4n * SCALAR, 2n * SCALAR)
    mulScalarTruncateResult.expectUint(4n * 2n * SCALAR)

    /* mul-scalar-truncate-add-uint */
    const mulScalarTruncateAddUintResult = await mulScalarTruncateAddUint(chain, user1.address, 4n * SCALAR, 2n * SCALAR, 12n)
    mulScalarTruncateAddUintResult.expectUint(4n * 2n * SCALAR + 12n)

    /* truncate */
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

    /* get-underlying-price */
    // FIXME: Test trait
    const getUnderlyingPriceResult = await getUnderlyingPrice(chain, user1.address)
    getUnderlyingPriceResult.expectUint(3n * SCALAR / 10n)

    /* set-price-oracle */
    const setPriceOracleResult = await setPriceOracle(chain, user1.address, 3n * SCALAR)
    setPriceOracleResult.expectUint(0n)
  },
})
