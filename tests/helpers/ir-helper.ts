import { Chain, Tx, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts'

const IR_CONTRACT = 'interest-rate'

export async function getBorrowRate(
    chain: Chain,
    sender: string,
    cash: bigint,
    borrows: bigint,
    reserves: bigint,
):Promise<String> {
    const res = await chain.callReadOnlyFn(
        IR_CONTRACT, 'get-borrow-rate',
        [types.uint(cash), types.uint(borrows),types.uint(reserves)],
        sender
    )
    return res.result.expectOk()
}

export async function getSupplyRate(
    chain: Chain,
    sender: string,
    cash: bigint,
    borrows: bigint,
    reserves: bigint,
    reserveFactorMantissa: bigint,
):Promise<String> {
    const res = await chain.callReadOnlyFn(
        IR_CONTRACT, 'get-supply-rate',
        [
            types.uint(cash), types.uint(borrows),
            types.uint(reserves),types.uint(reserveFactorMantissa)
        ], sender
    )
    return res.result.expectOk()
}
