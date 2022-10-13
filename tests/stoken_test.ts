import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import {getAssetBalance} from "./helpers.ts"
import { INITIAL_EXCHANGE_RATE_MANTISSA, SCALAR } from './common.ts';
Clarinet.test({
    name: "testing first Deposit",
    fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer=accounts.get("deployer");
        if (!deployer) throw new Error("deployer not found");
        const user1=accounts.get("wallet_1");
        if (!user1) throw new Error("user1 not found");
        const dipositStxAmount=1000000n
        const mintStokenAmount_ex=dipositStxAmount*INITIAL_EXCHANGE_RATE_MANTISSA/SCALAR
        const stokenRegistryAddress=`${deployer.address}.stoken-registry`
        let block = chain.mineBlock([
            Tx.contractCall(
                "stoken-registry","despoit-and-mint",
                [types.uint(dipositStxAmount)],
                user1.address
            )
        ]);
        assertEquals(
          block.receipts[0].result.expectOk().expectTuple(),
            {
              "stoken-amount":types.uint(mintStokenAmount_ex),
              "stx-amount":types.uint(dipositStxAmount),
           });
        const stxForRegistry = getAssetBalance(chain,"STX",stokenRegistryAddress)
        assertEquals(stxForRegistry, dipositStxAmount);
        const stokenForUser = getAssetBalance(chain,".stoken.stoken",user1.address)
        assertEquals(stokenForUser, mintStokenAmount_ex);
    },
});
