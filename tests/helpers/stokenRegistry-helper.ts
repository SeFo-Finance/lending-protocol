import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { SCALAR } from '../common.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

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

export function depositAndMint(
    chain:Chain,sender:string,depositAmount:bigint
    ):String{
    let block = chain.mineBlock([
        Tx.contractCall(
            "stoken-registry","despoit-and-mint",
            [types.uint(depositAmount)],
            sender
        )
    ]);
    const resTuple=block.receipts[0].result.expectOk().expectTuple()
    assertEquals(
        resTuple["stx-amount"],
        types.uint(depositAmount),
        );
    if (!resTuple["stoken-amount"]) throw new Error(`stoken-amount not found`)
    return resTuple["stoken-amount"]
}

export function redeem(
    chain:Chain,sender:string,withdrawAmount:bigint
    ):String{
    let block = chain.mineBlock([
        Tx.contractCall(
            "stoken-registry","redeem",
            [types.uint(withdrawAmount)],
            sender
        )
    ]);
    const resTuple=block.receipts[0].result.expectOk().expectTuple()
    assertEquals(
        resTuple["stoken-amount"],
        types.uint(withdrawAmount),
        );
    if (!resTuple["stx-amount"]) throw new Error(`stx-amount not found`)
    return resTuple["stx-amount"]
}

export function addReserves(
    chain:Chain,sender:string,amount:bigint
    ){
    let block = chain.mineBlock([
        Tx.contractCall(
            "stoken-registry","add-reserves",
            [types.uint(amount)],
            sender
        )
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
}

export function borrow(
    chain:Chain,sender:string,amount:bigint
    ):String{
    let block = chain.mineBlock([
        Tx.contractCall(
            "stoken-registry","borrow",
            [types.uint(amount)],
            sender
        )
    ]);
    return block.receipts[0].result.expectOk()
}

export function repayBorrow(
    chain:Chain,sender:string,amount:bigint
    ):String{
    let block = chain.mineBlock([
        Tx.contractCall(
            "stoken-registry","repay-borrow",
            [types.uint(amount)],
            sender
        )
    ]);
    return block.receipts[0].result.expectOk()
}