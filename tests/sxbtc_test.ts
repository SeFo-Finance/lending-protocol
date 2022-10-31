import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts'
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts'
import { calculateExchangeRate, getAssetBalance } from './helpers/helper.ts'
import {getTotalSupply, mint} from "./helpers/ft-helper.ts"
import { 
    getCash,
    getExchangeRate,
    getTotalBorrows,
    getTotalReserves,
    depositAndMint,
    redeem, 
    addReserves,
    borrow,
    repayBorrow,
} from './helpers/registry-helper.ts'
import { INITIAL_EXCHANGE_RATE_MANTISSA, SCALAR } from './common.ts'

const REGISTRY="sxbtc-registry"

Clarinet.test({
    name: "testing first Deposit",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer=accounts.get("deployer")
        if (!deployer) throw new Error("deployer not found")
        const user1=accounts.get("wallet_1")
        if (!user1) throw new Error("user1 not found")
        const depositXbtcAmount=1000000n
        mint(chain,"xbtc",user1.address,depositXbtcAmount)
        const mintSxbtcAmount_ex=depositXbtcAmount*INITIAL_EXCHANGE_RATE_MANTISSA/SCALAR
        const totalBorrows_ex=0n
        const totalReserves_ex=0n
        const exchangeRate_ex=calculateExchangeRate(
            depositXbtcAmount,totalBorrows_ex,totalReserves_ex,mintSxbtcAmount_ex
            )
        const sxbtcRegistryAddress=`${deployer.address}.sxbtc-registry`
        let sxbtcAmount = depositAndMint(chain,REGISTRY,user1.address,depositXbtcAmount)
        sxbtcAmount.expectUint(mintSxbtcAmount_ex)
        const xbtcForRegistry = getAssetBalance(chain,".xbtc.xbtc",sxbtcRegistryAddress)
        assertEquals(xbtcForRegistry, depositXbtcAmount)
        const sxbtcForUser = getAssetBalance(chain,".sxbtc.sxbtc",user1.address)
        assertEquals(sxbtcForUser, mintSxbtcAmount_ex)
        const totalBorrows=await getTotalBorrows(chain,REGISTRY,user1.address)
        totalBorrows.expectUint(totalBorrows_ex)
        const totalReserves=await getTotalReserves(chain,REGISTRY,user1.address)
        totalReserves.expectUint(totalReserves_ex)
        const cash=await getCash(chain,REGISTRY,user1.address)
        cash.expectUint(depositXbtcAmount)
        const supply=await getTotalSupply(chain,"sxbtc",user1.address)
        supply.expectUint(mintSxbtcAmount_ex)
        const exchangeRate=await getExchangeRate(chain,REGISTRY,user1.address)
        exchangeRate.expectUint(exchangeRate_ex)
    },
})

Clarinet.test({
    name: "testing Deposit and Redeem",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer=accounts.get("deployer")
        if (!deployer) throw new Error("deployer not found")
        const user1=accounts.get("wallet_1")
        if (!user1) throw new Error("user1 not found")
        const depositXbtcAmount=1000000n
        mint(chain,"xbtc",user1.address,depositXbtcAmount)
        const mintSxbtcAmount_ex=depositXbtcAmount*INITIAL_EXCHANGE_RATE_MANTISSA/SCALAR
        const totalBorrows_ex=0n
        const totalReserves_ex=0n
        const exchangeRate_ex=calculateExchangeRate(
            depositXbtcAmount,totalBorrows_ex,totalReserves_ex,mintSxbtcAmount_ex
            )
        let mintAmount = depositAndMint(chain,REGISTRY,user1.address,depositXbtcAmount)
        mintAmount.expectUint(mintSxbtcAmount_ex)
        const exchangeRate=await getExchangeRate(chain,REGISTRY,user1.address)
        exchangeRate.expectUint(exchangeRate_ex)
        const withdrawAmount_ex=(mintSxbtcAmount_ex*exchangeRate_ex)/SCALAR
        let withdrawAmount = redeem(chain,REGISTRY,user1.address,mintSxbtcAmount_ex)
        withdrawAmount.expectUint(withdrawAmount_ex)
    },
})

Clarinet.test({
    name: "testing add reserves",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer=accounts.get("deployer")
        if (!deployer) throw new Error("deployer not found")
        const user1=accounts.get("wallet_1")
        if (!user1) throw new Error("user1 not found")
        const addReserveAmount=1000000n
        mint(chain,"xbtc",user1.address,addReserveAmount)
        addReserves(chain,REGISTRY,user1.address,addReserveAmount)
        const totalReserves=await getTotalReserves(chain,REGISTRY,user1.address)
        totalReserves.expectUint(addReserveAmount)
        const exchangeRate=await getExchangeRate(chain,REGISTRY,user1.address)
        exchangeRate.expectUint(INITIAL_EXCHANGE_RATE_MANTISSA)
    },
})

Clarinet.test({
    name: "testing add Reserves and Deposit",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer=accounts.get("deployer")
        if (!deployer) throw new Error("deployer not found")
        const user1=accounts.get("wallet_1")
        if (!user1) throw new Error("user1 not found")
        const addReserveAmount=1000000n
        mint(chain,"xbtc",user1.address,addReserveAmount)
        addReserves(chain,REGISTRY,user1.address,addReserveAmount)
        let totalReserves=await getTotalReserves(chain,REGISTRY,user1.address)
        totalReserves.expectUint(addReserveAmount)
        const exchangeRate_1=await getExchangeRate(chain,REGISTRY,user1.address)
        exchangeRate_1.expectUint(INITIAL_EXCHANGE_RATE_MANTISSA)
        const depositXbtcAmount=2000000n
        mint(chain,"xbtc",user1.address,depositXbtcAmount)
        const mintSxbtcAmount_ex=depositXbtcAmount*INITIAL_EXCHANGE_RATE_MANTISSA/SCALAR
        const totalBorrows_ex=0n
        const totalReserves_ex=addReserveAmount
        const assetAmount=totalReserves_ex+depositXbtcAmount
        const exchangeRate_ex_2=calculateExchangeRate(
            assetAmount,totalBorrows_ex,totalReserves_ex,mintSxbtcAmount_ex
            )
        let mintAmount = depositAndMint(chain,REGISTRY,user1.address,depositXbtcAmount)
        mintAmount.expectUint(mintSxbtcAmount_ex)
        const cash=await getCash(chain,REGISTRY,user1.address)
        cash.expectUint(assetAmount)
        totalReserves=await getTotalReserves(chain,REGISTRY,user1.address)
        totalReserves.expectUint(totalReserves_ex)
        const exchangeRate_2=await getExchangeRate(chain,REGISTRY,user1.address)
        exchangeRate_2.expectUint(exchangeRate_ex_2)
    },
})

Clarinet.test({
    name: "testing Borrow",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer=accounts.get("deployer")
        if (!deployer) throw new Error("deployer not found")
        const user1=accounts.get("wallet_1")
        if (!user1) throw new Error("user1 not found")
        const addReserveAmount=1000000n
        mint(chain,"xbtc",user1.address,addReserveAmount)
        addReserves(chain,REGISTRY,user1.address,addReserveAmount)
        let totalReserves=await getTotalReserves(chain,REGISTRY,user1.address)
        totalReserves.expectUint(addReserveAmount)
        const depositXbtcAmount=2000000n
        mint(chain,"xbtc",user1.address,depositXbtcAmount)
        const mintSxbtcAmount_ex=depositXbtcAmount*INITIAL_EXCHANGE_RATE_MANTISSA/SCALAR
        const borrowAmount=500000n
        const totalBorrows_ex=borrowAmount
        const totalReserves_ex=addReserveAmount
        const assetAmount=totalReserves_ex+depositXbtcAmount-borrowAmount
        const exchangeRate_ex=calculateExchangeRate(
            assetAmount,totalBorrows_ex,totalReserves_ex,mintSxbtcAmount_ex
            )
        let mintAmount = depositAndMint(chain,REGISTRY,user1.address,depositXbtcAmount)
        mintAmount.expectUint(mintSxbtcAmount_ex)
        let borrowRes = borrow(chain,REGISTRY,user1.address,borrowAmount)
        borrowRes.expectUint(borrowAmount)
        const totalBorrow=await getTotalBorrows(chain,REGISTRY,user1.address)
        totalBorrow.expectUint(totalBorrows_ex)
        const exchangeRate=await getExchangeRate(chain,REGISTRY,user1.address)
        exchangeRate.expectUint(exchangeRate_ex)
    },
})

Clarinet.test({
    name: "testing Borrow",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer=accounts.get("deployer")
        if (!deployer) throw new Error("deployer not found")
        const user1=accounts.get("wallet_1")
        if (!user1) throw new Error("user1 not found")
        const addReserveAmount=1000000n
        mint(chain,"xbtc",user1.address,addReserveAmount)
        addReserves(chain,REGISTRY,user1.address,addReserveAmount)
        let totalReserves=await getTotalReserves(chain,REGISTRY,user1.address)
        totalReserves.expectUint(addReserveAmount)
        const depositXbtcAmount=2000000n
        mint(chain,"xbtc",user1.address,depositXbtcAmount)
        const mintSxbtcAmount_ex=depositXbtcAmount*INITIAL_EXCHANGE_RATE_MANTISSA/SCALAR
        const borrowAmount=500000n
        const totalBorrows_ex=borrowAmount
        const totalReserves_ex=addReserveAmount
        const assetAmount=totalReserves_ex+depositXbtcAmount-borrowAmount
        let mintAmount = depositAndMint(chain,REGISTRY,user1.address,depositXbtcAmount)
        mintAmount.expectUint(mintSxbtcAmount_ex)
        let borrowRes = borrow(chain,REGISTRY,user1.address,borrowAmount)
        borrowRes.expectUint(borrowAmount)
        let repayBorrowRes = repayBorrow(chain,REGISTRY,user1.address,borrowAmount)
        repayBorrowRes.expectUint(borrowAmount)
    },
})


