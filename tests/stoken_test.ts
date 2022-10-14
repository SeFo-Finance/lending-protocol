import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import {calculateExchangeRate, getAssetBalance,getTotalSupply} from "./helpers/helper.ts"
import { getCash,getExchangeRate, getTotalBorrows,getTotalReserves } from "./helpers/stokenRegistry-helper.ts"
import { INITIAL_EXCHANGE_RATE_MANTISSA, SCALAR } from './common.ts';

Clarinet.test({
    name: "testing first Deposit",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer=accounts.get("deployer");
        if (!deployer) throw new Error("deployer not found");
        const user1=accounts.get("wallet_1");
        if (!user1) throw new Error("user1 not found");
        const depositStxAmount=1000000n
        const mintStokenAmount_ex=depositStxAmount*INITIAL_EXCHANGE_RATE_MANTISSA/SCALAR
        const totalBorrows_ex=0n
        const totalReserves_ex=0n
        const exchangeRate_ex=calculateExchangeRate(
            depositStxAmount,totalBorrows_ex,totalReserves_ex,mintStokenAmount_ex
            )
        const stokenRegistryAddress=`${deployer.address}.stoken-registry`
        let block = chain.mineBlock([
            Tx.contractCall(
                "stoken-registry","despoit-and-mint",
                [types.uint(depositStxAmount)],
                user1.address
            )
        ]);
        assertEquals(
          block.receipts[0].result.expectOk().expectTuple(),
            {
              "stoken-amount":types.uint(mintStokenAmount_ex),
              "stx-amount":types.uint(depositStxAmount),
           });
        const stxForRegistry = getAssetBalance(chain,"STX",stokenRegistryAddress)
        assertEquals(stxForRegistry, depositStxAmount);
        const stokenForUser = getAssetBalance(chain,".stoken.stoken",user1.address)
        assertEquals(stokenForUser, mintStokenAmount_ex);
        const totalBorrows=await getTotalBorrows(chain,user1.address)
        totalBorrows.expectUint(totalBorrows_ex)
        const totalReserves=await getTotalReserves(chain,user1.address)
        totalReserves.expectUint(totalReserves_ex)
        const cash=await getCash(chain,user1.address)
        cash.expectUint(depositStxAmount)
        const supply=await getTotalSupply(chain,"stoken",user1.address)
        supply.expectUint(mintStokenAmount_ex)
        const exchangeRate=await getExchangeRate(chain,user1.address)
        exchangeRate.expectUint(exchangeRate_ex)
    },
});

Clarinet.test({
    name: "testing first Deposit",
    fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer=accounts.get("deployer");
        if (!deployer) throw new Error("deployer not found");
        const user1=accounts.get("wallet_1");
        if (!user1) throw new Error("user1 not found");
        const depositStxAmount=1000000n
        const mintStokenAmount_ex=depositStxAmount*INITIAL_EXCHANGE_RATE_MANTISSA/SCALAR
        const totalBorrows_ex=0n
        const totalReserves_ex=0n
        const exchangeRate_ex=calculateExchangeRate(
            depositStxAmount,totalBorrows_ex,totalReserves_ex,mintStokenAmount_ex
            )
        const stokenRegistryAddress=`${deployer.address}.stoken-registry`
        let block = chain.mineBlock([
            Tx.contractCall(
                "stoken-registry","despoit-and-mint",
                [types.uint(depositStxAmount)],
                user1.address
            )
        ]);
        assertEquals(
          block.receipts[0].result.expectOk().expectTuple(),
            {
              "stoken-amount":types.uint(mintStokenAmount_ex),
              "stx-amount":types.uint(depositStxAmount),
           });
        block = chain.mineBlock([
            Tx.contractCall(
                "stoken-registry","redeem",
                [types.uint(mintStokenAmount_ex)],
                user1.address
            )
        ]);
        assertEquals(
            block.receipts[0].result.expectOk().expectTuple(),
            {
                "stoken-amount":types.uint(mintStokenAmount_ex),
                "stx-amount":types.uint(depositStxAmount),
            });
    },
});
