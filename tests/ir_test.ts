import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts'
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts'
import {
    calculateBorrowRate,
    calculateSupplyRate,
} from './helpers/helper.ts'
import {
    getBorrowRate,
    getSupplyRate
} from './helpers/ir-helper.ts'

Clarinet.test({
    name: "testing BorrowRate",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer=accounts.get("deployer")
        if (!deployer) throw new Error("deployer not found")
        const user1=accounts.get("wallet_1")
        if (!user1) throw new Error("user1 not found")

        let cash=0n
        let borrows=0n
        let reserves=0n
        let reserveFactor=0n
        let borrowRate=await getBorrowRate(chain,user1.address,cash,borrows,reserves)
        let borrowRate_exp=calculateBorrowRate(cash,borrows,reserves)
        borrowRate.expectUint(borrowRate_exp)
        let supplyRate=await getSupplyRate(chain,user1.address,cash,borrows,reserves,reserveFactor)
        let supplyRate_exp=calculateSupplyRate(cash,borrows,reserves,reserveFactor)
        supplyRate.expectUint(supplyRate_exp)

        cash=100000n
        borrows=10000n
        reserves=1000n
        reserveFactor=10000n
        borrowRate=await getBorrowRate(chain,user1.address,cash,borrows,reserves)
        borrowRate_exp=calculateBorrowRate(cash,borrows,reserves)
        borrowRate.expectUint(borrowRate_exp)
        supplyRate=await getSupplyRate(chain,user1.address,cash,borrows,reserves,reserveFactor)
        supplyRate_exp=calculateSupplyRate(cash,borrows,reserves,reserveFactor)
        supplyRate.expectUint(supplyRate_exp)
    },
})
