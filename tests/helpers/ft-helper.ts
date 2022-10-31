import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';


export function mint(
    chain:Chain,contractAddress:string,sender:string,amount:bigint
):void{
    let block = chain.mineBlock([
        Tx.contractCall(
            contractAddress,"mint",
            [types.uint(amount)],
            sender
        )
    ]);
    const resTuple=block.receipts[0].result.expectOk().expectBool(true)
    return
}

export async function getTotalSupply(
    chain:Chain,contractAddress:string,sender:string
    ):Promise<String>{
    const res=await chain.callReadOnlyFn(
        contractAddress,"get-total-supply",[],sender  
    )
    return res.result.expectOk()
}
