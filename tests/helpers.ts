import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';


export function getAssetBalance(chain:Chain,asset:string,user:string):bigint{
    const assets=chain.getAssetsMaps().assets
    if (!assets[asset] || !assets[asset][user]) return 0n
    return BigInt(assets[asset][user])
}