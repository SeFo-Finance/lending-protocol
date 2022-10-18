import { Chain, Tx, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts'

const CONTROLLER_CONTRACT = 'controller-1'

// Authorization function
export const isController = async (
  chain: Chain,
  sender: string,
): Promise<String> => {
  const block = chain.mineBlock([
    Tx.contractCall(
      CONTROLLER_CONTRACT, 'is-controller', [], sender
    )
  ])
  return block.receipts[0].result.expectOk()
}

// Verification functions
export const mintVerify = async (
  chain: Chain,
  sender: string,
  stoken: string,
  minter: string,
  mintAmount: bigint,
  mintTokens: bigint,
): Promise<String> => {
  const block = chain.mineBlock([
    Tx.contractCall(
      CONTROLLER_CONTRACT,
      'mint-verify',
      [
        types.principal(stoken),
        types.principal(minter),
        types.uint(mintAmount),
        types.uint(mintTokens),
      ],
      sender,
    )
  ])
  return block.receipts[0].result.expectOk()
}

export const redeemVerify = async (
  chain: Chain,
  sender: string,
  stoken: string,
  redeemer: string,
  redeemAmount: bigint,
  redeemTokens: bigint,
): Promise<String> => {
  const block = chain.mineBlock([
    Tx.contractCall(
      CONTROLLER_CONTRACT,
      'redeem-verify',
      [
        types.principal(stoken),
        types.principal(redeemer),
        types.uint(redeemAmount),
        types.uint(redeemTokens),
      ],
      sender,
    )
  ])
  return block.receipts[0].result
}

export const borrowVerify = async (
  chain: Chain,
  sender: string,
  stoken: string,
  borrower: string,
  borrowAmount: bigint,
): Promise<String> => {
  const block = chain.mineBlock([
    Tx.contractCall(
      CONTROLLER_CONTRACT,
      'borrow-verify',
      [
        types.principal(stoken),
        types.principal(borrower),
        types.uint(borrowAmount),
      ],
      sender,
    )
  ])
  return block.receipts[0].result.expectOk()
}

export const repayBorrowVerify = async (
  chain: Chain,
  sender: string,
  stoken: string,
  payer: string,
  borrower: string,
  repayAmount: bigint,
  borrowerIndex: bigint,
): Promise<String> => {
  const block = chain.mineBlock([
    Tx.contractCall(
      CONTROLLER_CONTRACT,
      'repay-borrow-verify',
      [
        types.principal(stoken),
        types.principal(payer),
        types.principal(borrower),
        types.uint(repayAmount),
        types.uint(borrowerIndex),
      ],
      sender,
    )
  ])
  return block.receipts[0].result.expectOk()
}

export const liquidateBorrowVerify = async (
  chain: Chain,
  sender: string,
  stokenBorrowed: string,
  stokenCollateral: string,
  liquidator: string,
  borrower: string,
  repayAmount: bigint,
  seizeTokens: bigint,
): Promise<String> => {
  const block = chain.mineBlock([
    Tx.contractCall(
      CONTROLLER_CONTRACT,
      'liquidate-borrow-verify',
      [
        types.principal(stokenBorrowed),
        types.principal(stokenCollateral),
        types.principal(liquidator),
        types.principal(borrower),
        types.uint(repayAmount),
        types.uint(seizeTokens),
      ],
      sender,
    )
  ])
  return block.receipts[0].result.expectOk()
}

export const seizeVerify = async (
  chain: Chain,
  sender: string,
  stokenCollateral: string,
  stokenBorrowed: string,
  liquidator: string,
  borrower: string,
  seizeTokens: bigint,
): Promise<String> => {
  const block = chain.mineBlock([
    Tx.contractCall(
      CONTROLLER_CONTRACT,
      'seize-verify',
      [
        types.principal(stokenCollateral),
        types.principal(stokenBorrowed),
        types.principal(liquidator),
        types.principal(borrower),
        types.uint(seizeTokens),
      ],
      sender,
    )
  ])
  return block.receipts[0].result.expectOk()
}

export const transferVerify = async (
  chain: Chain,
  sender: string,
  stoken: string,
  src: string,
  dst: string,
  transferTokens: bigint,
): Promise<String> => {
  const block = chain.mineBlock([
    Tx.contractCall(
      CONTROLLER_CONTRACT,
      'transfer-verify',
      [
        types.principal(stoken),
        types.principal(src),
        types.principal(dst),
        types.uint(transferTokens),
      ],
      sender,
    )
  ])
  return block.receipts[0].result.expectOk()
}

// Allowance functions
export const mintAllowed = async (
  chain: Chain,
  sender: string,
  stoken: string,
  minter: string,
  mintAmount: bigint,
): Promise<String> => {
  const block = chain.mineBlock([
    Tx.contractCall(
      CONTROLLER_CONTRACT,
      'mint-allowed',
      [
        types.principal(stoken),
        types.principal(minter),
        types.uint(mintAmount),
      ],
      sender,
    )
  ])
  return block.receipts[0].result
}

// Getter functions
export const getMarket = async (
  chain: Chain,
  sender: string,
  stoken: principal,
): Promise<String> => {
  const block = chain.mineBlock([
    Tx.contractCall(CONTROLLER_CONTRACT, 'get-market', [types.principal(stoken)], sender)
  ])
  return block.receipts[0].result
}

// Admin setter functions
export const setCloseFactor = async (
  chain: Chain,
  sender: string,
  newCloseFactorMantissa: bigint,
): Promise<String> => {
  const block = chain.mineBlock([
    Tx.contractCall(CONTROLLER_CONTRACT, 'set-close-factor', [types.uint(newCloseFactorMantissa)], sender)
  ])
  return block.receipts[0].result
}

export const setCollateralFactor = async (
  chain: Chain,
  sender: string,
  stoken: string,
  newCollateralFactorMantissa: bigint,
): Promise<String> => {
  const block = chain.mineBlock([
    Tx.contractCall(
      CONTROLLER_CONTRACT,
      'set-collateral-factor',
      [types.principal(stoken) ,types.uint(newCollateralFactorMantissa)],
      sender
    )
  ])
  return block.receipts[0].result
}

export const setMaxAssets = async (
  chain: Chain,
  sender: string,
  newMaxAssets: bigint,
): Promise<String> => {
  const block = chain.mineBlock([
    Tx.contractCall(CONTROLLER_CONTRACT, 'set-max-assets', [types.uint(newMaxAssets)], sender)
  ])
  return block.receipts[0].result
}

export const setLiquidationIncentive = async (
  chain: Chain,
  sender: string,
  newLiquidationIncentiveMantissa: bigint,
): Promise<String> => {
  const block = chain.mineBlock([
    Tx.contractCall(CONTROLLER_CONTRACT, 'set-liquidation-incentive', [types.uint(newLiquidationIncentiveMantissa)], sender)
  ])
  return block.receipts[0].result
}

export const supportMarket = async (
  chain: Chain,
  sender: string,
  stoken: principal,
): Promise<String> => {
  const block = chain.mineBlock([
    Tx.contractCall(CONTROLLER_CONTRACT, 'support-market', [types.principal(stoken)], sender)
  ])
  return block.receipts[0].result
}

// Utility functions
export const getExp = async (
  chain: Chain,
  sender: string,
  num: bigint,
  denom: bigint,
): Promise<String> => {
  const res = await chain.callReadOnlyFn(
    CONTROLLER_CONTRACT, 'get-exp', [types.uint(num), types.uint(denom)], sender  
  )
  return res.result
}

export const mulExp = async (
  chain: Chain,
  sender: string,
  a: bigint,
  b: bigint,
): Promise<String> => {
  const res = await chain.callReadOnlyFn(
    CONTROLLER_CONTRACT, 'mul-exp', [types.uint(a), types.uint(b)], sender  
  )
  return res.result
}

export const mulExp3 = async (
  chain: Chain,
  sender: string,
  a: bigint,
  b: bigint,
  c: bigint,
): Promise<String> => {
  const res = await chain.callReadOnlyFn(
    CONTROLLER_CONTRACT, 'mul-exp3', [types.uint(a), types.uint(b), types.uint(c)], sender  
  )
  return res.result
}

export const divExp = async (
  chain: Chain,
  sender: string,
  a: bigint,
  b: bigint,
): Promise<String> => {
  const res = await chain.callReadOnlyFn(
    CONTROLLER_CONTRACT, 'div-exp', [types.uint(a), types.uint(b)], sender  
  )
  return res.result
}

export const mulScalarTruncate = async (
  chain: Chain,
  sender: string,
  exp: bigint,
  scalar: bigint,
): Promise<String> => {
  const res = await chain.callReadOnlyFn(
    CONTROLLER_CONTRACT, 'mul-scalar-truncate', [types.uint(exp), types.uint(scalar)], sender  
  )
  return res.result
}

export const mulScalarTruncateAddUint = async (
  chain: Chain,
  sender: string,
  exp: bigint,
  scalar: bigint,
  addend: bigint,
): Promise<String> => {
  const res = await chain.callReadOnlyFn(
    CONTROLLER_CONTRACT, 'mul-scalar-truncate-add-uint', [types.uint(exp), types.uint(scalar), types.uint(addend)], sender  
  )
  return res.result
}

export const truncate = async (
  chain: Chain,
  sender: string,
  exp: bigint,
): Promise<String> => {
  const res = await chain.callReadOnlyFn(
    CONTROLLER_CONTRACT, 'truncate', [types.uint(exp)], sender  
  )
  return res.result
}

// Oracle functions
export const getUnderlyingPrice = async (
  chain: Chain,
  sender: string,
  asset?: string,
): Promise<String> => {
  const res = await chain.callReadOnlyFn(
    CONTROLLER_CONTRACT, 'get-underlying-price', [asset ? types.some(asset) : types.none()], sender  
  )
  return res.result
}

export const setPriceOracle = async (
  chain: Chain,
  sender: string,
  newOracle: bigint,
): Promise<String> => {
  const block = chain.mineBlock([
    Tx.contractCall(CONTROLLER_CONTRACT, 'set-price-oracle', [types.uint(newOracle)], sender)
  ])
  return block.receipts[0].result.expectOk()
}