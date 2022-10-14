import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { SCALAR } from '../common.ts';

const STOKEN_REGISTRY="stoken-registry"


export async function getTotalBorrows(
    chain:Chain,sender:string
    ):Promise<String>{
    const res=await chain.callReadOnlyFn(
        STOKEN_REGISTRY,"get-total-borrows",[],sender  
    )
    return res.result.expectOk()
}

export async function getTotalReserves(
    chain:Chain,sender:string
    ):Promise<String>{
    const res=await chain.callReadOnlyFn(
        STOKEN_REGISTRY,"get-total-reserves",[],sender  
    )
    return res.result.expectOk()
}

export async function getCash(
    chain:Chain,sender:string
    ):Promise<String>{
    const res=await chain.callReadOnlyFn(
        STOKEN_REGISTRY,"get-cash",[],sender  
    )
    return res.result.expectOk()
}

export async function getExchangeRate(
    chain:Chain,sender:string
    ):Promise<String>{
    const res=await chain.callReadOnlyFn(
        STOKEN_REGISTRY,"get-exchange-rate-stored",[],sender  
    )
    return res.result.expectOk()
}