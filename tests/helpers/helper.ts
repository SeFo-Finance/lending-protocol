import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import { SCALAR } from '../common.ts';



export function calculateExchangeRate(
    cash:bigint,borrows:bigint,reserves:bigint,supply:bigint
    ):bigint{
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