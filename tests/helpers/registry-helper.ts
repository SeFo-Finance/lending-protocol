import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { SCALAR } from '../common.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';


export async function getTotalBorrows(
    chain:Chain,contract:string,sender:string
    ):Promise<String>{
    const res=await chain.callReadOnlyFn(
        contract,"get-total-borrows",[],sender  
    )
    return res.result.expectOk()
}

export async function getTotalReserves(
    chain:Chain,contract:string,sender:string
    ):Promise<String>{
    const res=await chain.callReadOnlyFn(
        contract,"get-total-reserves",[],sender  
    )
    return res.result.expectOk()
}

export async function getCash(
    chain:Chain,contract:string,sender:string
    ):Promise<String>{
    const res=await chain.callReadOnlyFn(
        contract,"get-cash",[],sender  
    )
    return res.result.expectOk()
}

export async function getExchangeRate(
    chain:Chain,contract:string,sender:string
    ):Promise<String>{
    const res=await chain.callReadOnlyFn(
        contract,"get-exchange-rate-stored",[],sender  
    )
    return res.result.expectOk()
}

export function depositAndMint(
    chain:Chain,contract:string,sender:string,depositAmount:bigint
    ):String{
    let block = chain.mineBlock([
        Tx.contractCall(
            contract,"deposit-and-mint",
            [types.uint(depositAmount)],
            sender
        )
    ]);
    const resTuple=block.receipts[0].result.expectOk().expectTuple()
    assertEquals(
        resTuple["token-amount"],
        types.uint(depositAmount),
        );
    if (!resTuple["stoken-amount"]) throw new Error(`stoken-amount not found`)
    return resTuple["stoken-amount"]
}

export function redeem(
    chain:Chain,contract:string,sender:string,withdrawAmount:bigint
    ):String{
    let block = chain.mineBlock([
        Tx.contractCall(
            contract,"redeem",
            [types.uint(withdrawAmount)],
            sender
        )
    ]);
    const resTuple=block.receipts[0].result.expectOk().expectTuple()
    assertEquals(
        resTuple["stoken-amount"],
        types.uint(withdrawAmount),
        );
    if (!resTuple["token-amount"]) throw new Error(`stx-amount not found`)
    return resTuple["token-amount"]
}

export function addReserves(
    chain:Chain,contract:string,sender:string,amount:bigint
    ){
    let block = chain.mineBlock([
        Tx.contractCall(
            contract,"add-reserves",
            [types.uint(amount)],
            sender
        )
    ]);
    block.receipts[0].result.expectOk().expectBool(true)
}

export function borrow(
    chain:Chain,contract:string,sender:string,amount:bigint
    ):String{
    let block = chain.mineBlock([
        Tx.contractCall(
            contract,"borrow",
            [types.uint(amount)],
            sender
        )
    ]);
    return block.receipts[0].result.expectOk()
}

export function repayBorrow(
    chain:Chain,contract:string,sender:string,amount:bigint
    ):String{
    let block = chain.mineBlock([
        Tx.contractCall(
            contract,"repay-borrow",
            [types.uint(amount)],
            sender
        )
    ]);
    return block.receipts[0].result.expectOk()
}
