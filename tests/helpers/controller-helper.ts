import { Chain, Tx, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts'

const CONTROLLER_CONTRACT = 'controller-1'

export async function isController(
  chain: Chain,
  sender: string,
): Promise<String> {
  const block = chain.mineBlock([
    Tx.contractCall(
      CONTROLLER_CONTRACT, 'is-controller', [], sender
    )
  ])
  return block.receipts[0].result.expectOk()
}

export async function mintVerify(
  chain: Chain,
  sender: string,
  stoken: string,
  minter: string,
  mintAmount: bigint,
  mintTokens: bigint,
): Promise<String> {
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

export async function redeemVerify(
  chain: Chain,
  sender: string,
  stoken: string,
  redeemer: string,
  redeemAmount: bigint,
  redeemTokens: bigint,
): Promise<String> {
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

export async function borrowVerify(
  chain: Chain,
  sender: string,
  stoken: string,
  borrower: string,
  borrowAmount: bigint,
): Promise<String> {
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

export async function repayBorrowVerify(
  chain: Chain,
  sender: string,
  stoken: string,
  payer: string,
  borrower: string,
  repayAmount: bigint,
  borrowerIndex: bigint,
): Promise<String> {
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

export async function liquidateBorrowVerify(
	chain: Chain,
	sender: string,
	stokenBorrowed: string,
  stokenCollateral: string,
	liquidator: string,
  borrower: string,
	repayAmount: bigint,
	seizeTokens: bigint,
): Promise<String> {
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

export async function seizeVerify(
	chain: Chain,
	sender: string,
  stokenCollateral: string,
	stokenBorrowed: string,
	liquidator: string,
  borrower: string,
	seizeTokens: bigint,
): Promise<String> {
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

export async function transferVerify(
	chain: Chain,
	sender: string,
  stoken: string,
	src: string,
	dst: string,
	transferTokens: bigint,
): Promise<String> {
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

// Utility functions
export async function getExp(
  chain: Chain,
  sender: string,
  num: bigint,
  denom: bigint,
): Promise<String> {
  const res = await chain.callReadOnlyFn(
    CONTROLLER_CONTRACT, 'get-exp', [types.uint(num), types.uint(denom)], sender  
  )
  return res.result
}

export async function mulExp(
  chain: Chain,
  sender: string,
  a: bigint,
  b: bigint,
): Promise<String> {
  const res = await chain.callReadOnlyFn(
    CONTROLLER_CONTRACT, 'mul-exp', [types.uint(a), types.uint(b)], sender  
  )
  return res.result
}

export async function mulExp3(
  chain: Chain,
  sender: string,
  a: bigint,
  b: bigint,
  c: bigint,
): Promise<String> {
  const res = await chain.callReadOnlyFn(
    CONTROLLER_CONTRACT, 'mul-exp3', [types.uint(a), types.uint(b), types.uint(c)], sender  
  )
  return res.result
}

export async function divExp(
  chain: Chain,
  sender: string,
  a: bigint,
  b: bigint,
): Promise<String> {
  const res = await chain.callReadOnlyFn(
    CONTROLLER_CONTRACT, 'div-exp', [types.uint(a), types.uint(b)], sender  
  )
  return res.result
}

export async function mulScalarTruncate(
  chain: Chain,
  sender: string,
  exp: bigint,
  scalar: bigint,
): Promise<String> {
  const res = await chain.callReadOnlyFn(
    CONTROLLER_CONTRACT, 'mul-scalar-truncate', [types.uint(exp), types.uint(scalar)], sender  
  )
  return res.result
}

export async function mulScalarTruncateAddUint(
  chain: Chain,
  sender: string,
  exp: bigint,
  scalar: bigint,
  addend: bigint,
): Promise<String> {
  const res = await chain.callReadOnlyFn(
    CONTROLLER_CONTRACT, 'mul-scalar-truncate-add-uint', [types.uint(exp), types.uint(scalar), types.uint(addend)], sender  
  )
  return res.result
}

export async function truncate(
  chain: Chain,
  sender: string,
  exp: bigint,
): Promise<String> {
  const res = await chain.callReadOnlyFn(
    CONTROLLER_CONTRACT, 'truncate', [types.uint(exp)], sender  
  )
  return res.result
}
