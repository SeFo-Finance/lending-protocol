import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import {BASE_RATE_PER_BLOCK_MANTISSA, MULTIPLIER_PER_BLOCK_MANTISSA, SCALAR} from '../common.ts';


export function calculateUtilizationRate(
    cash:bigint,borrows:bigint,reserves:bigint
):bigint{
    if (borrows===0n) return 0n
    return (borrows)*SCALAR/(cash+borrows-reserves)
}

export function calculateBorrowRate(
    cash:bigint,borrows:bigint,reserves:bigint
):bigint{
    const ur=calculateUtilizationRate(cash,borrows,reserves)
    return (ur*MULTIPLIER_PER_BLOCK_MANTISSA)/SCALAR+BASE_RATE_PER_BLOCK_MANTISSA
}

export function calculateSupplyRate(
    cash:bigint,borrows:bigint,
    reserves:bigint,reserveFactorMantissa:bigint,
):bigint{
    const factor=SCALAR-reserveFactorMantissa
    const borrowRate=calculateBorrowRate(cash,borrows, reserves)
    const rateToPool=borrowRate*factor/SCALAR
    const ur=calculateUtilizationRate(cash,borrows,reserves)
    return (ur*rateToPool)/SCALAR
}

export function calculateExchangeRate(
    cash:bigint,borrows:bigint,reserves:bigint,supply:bigint
    ):bigint{
    if (supply===0n) return 0n
    return (cash+borrows-reserves)*SCALAR/supply
}


export function getAssetBalance(chain:Chain,asset:string,user:string):bigint{
    const assets=chain.getAssetsMaps().assets
    if (!assets[asset] || !assets[asset][user]) return 0n
    return BigInt(assets[asset][user])
}

export async function getTotalSupply(
    chain:Chain,contractAddress:string,sender:string
    ):Promise<String>{
    const res=await chain.callReadOnlyFn(
        contractAddress,"get-total-supply",[],sender  
    )
    return res.result.expectOk()
}
