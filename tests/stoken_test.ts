import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts'
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts'
import {
    calculateBorrowBalance,
    calculateBorrowRate,
    calculateExchangeRate,
    getAssetBalance,
    simulateInterest
} from './helpers/helper.ts'
import {getTotalSupply} from "./helpers/ft-helper.ts"
import {
    getCash,
    getExchangeRate,
    getTotalBorrows,
    getTotalReserves,
    depositAndMint,
    redeem,
    addReserves,
    borrow,
    repayBorrow, getUserBorrow, getBorrowIndex,
} from './helpers/registry-helper.ts'
import { INITIAL_EXCHANGE_RATE_MANTISSA, SCALAR } from './common.ts'

const REGISTRY="stoken-registry"

Clarinet.test({
    name: "testing first Deposit",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer=accounts.get("deployer")
        if (!deployer) throw new Error("deployer not found")
        const user1=accounts.get("wallet_1")
        if (!user1) throw new Error("user1 not found")
        const depositStxAmount=1000000n
        const mintStokenAmount_ex=depositStxAmount*INITIAL_EXCHANGE_RATE_MANTISSA/SCALAR
        const totalBorrows_ex=0n
        const totalReserves_ex=0n
        const exchangeRate_ex=calculateExchangeRate(
            depositStxAmount,totalBorrows_ex,totalReserves_ex,mintStokenAmount_ex
            )
        const stokenRegistryAddress=`${deployer.address}.stoken-registry`
        let stokenAmount = depositAndMint(chain,REGISTRY,user1.address,depositStxAmount)
        stokenAmount.expectUint(mintStokenAmount_ex)
        const stxForRegistry = getAssetBalance(chain,"STX",stokenRegistryAddress)
        assertEquals(stxForRegistry, depositStxAmount)
        const stokenForUser = getAssetBalance(chain,".stoken.stoken",user1.address)
        assertEquals(stokenForUser, mintStokenAmount_ex)
        const totalBorrows=await getTotalBorrows(chain,REGISTRY,user1.address)
        totalBorrows.expectUint(totalBorrows_ex)
        const totalReserves=await getTotalReserves(chain,REGISTRY,user1.address)
        totalReserves.expectUint(totalReserves_ex)
        const cash=await getCash(chain,REGISTRY,user1.address)
        cash.expectUint(depositStxAmount)
        const supply=await getTotalSupply(chain,"stoken",user1.address)
        supply.expectUint(mintStokenAmount_ex)
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
        const depositStxAmount=1000000n
        const mintStokenAmount_ex=depositStxAmount*INITIAL_EXCHANGE_RATE_MANTISSA/SCALAR
        const totalBorrows_ex=0n
        const totalReserves_ex=0n
        const exchangeRate_ex=calculateExchangeRate(
            depositStxAmount,totalBorrows_ex,totalReserves_ex,mintStokenAmount_ex
            )
        let mintAmount = depositAndMint(chain,REGISTRY,user1.address,depositStxAmount)
        mintAmount.expectUint(mintStokenAmount_ex)
        const exchangeRate=await getExchangeRate(chain,REGISTRY,user1.address)
        exchangeRate.expectUint(exchangeRate_ex)
        const withdrawAmount_ex=(mintStokenAmount_ex*exchangeRate_ex)/SCALAR
        let withdrawAmount = redeem(chain,REGISTRY,user1.address,mintStokenAmount_ex)
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
        addReserves(chain,REGISTRY,user1.address,addReserveAmount)
        let totalReserves=await getTotalReserves(chain,REGISTRY,user1.address)
        totalReserves.expectUint(addReserveAmount)
        const exchangeRate_1=await getExchangeRate(chain,REGISTRY,user1.address)
        exchangeRate_1.expectUint(INITIAL_EXCHANGE_RATE_MANTISSA)

        const depositStxAmount=2000000n
        const mintStokenAmount_ex=depositStxAmount*INITIAL_EXCHANGE_RATE_MANTISSA/SCALAR
        const totalBorrows_ex=0n
        const totalReserves_ex=addReserveAmount
        const assetAmount=totalReserves_ex+depositStxAmount
        const exchangeRate_ex_2=calculateExchangeRate(
            assetAmount,totalBorrows_ex,totalReserves_ex,mintStokenAmount_ex
            )
        let mintAmount = depositAndMint(chain,REGISTRY,user1.address,depositStxAmount)
        mintAmount.expectUint(mintStokenAmount_ex)
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
        addReserves(chain,REGISTRY,user1.address,addReserveAmount)
        let totalReserves=await getTotalReserves(chain,REGISTRY,user1.address)
        totalReserves.expectUint(addReserveAmount)
        const depositStxAmount=2000000n
        const mintStokenAmount_ex=depositStxAmount*INITIAL_EXCHANGE_RATE_MANTISSA/SCALAR
        const borrowAmount=500000n
        const totalBorrows_ex=borrowAmount
        const totalReserves_ex=addReserveAmount
        const assetAmount=totalReserves_ex+depositStxAmount-borrowAmount
        const exchangeRate_ex=calculateExchangeRate(
            assetAmount,totalBorrows_ex,totalReserves_ex,mintStokenAmount_ex
            )
        let mintAmount = depositAndMint(chain,REGISTRY,user1.address,depositStxAmount)
        mintAmount.expectUint(mintStokenAmount_ex)
        let borrowRes = borrow(chain,REGISTRY,user1.address,borrowAmount)
        borrowRes.expectUint(borrowAmount)
        const totalBorrow=await getTotalBorrows(chain,REGISTRY,user1.address)
        totalBorrow.expectUint(totalBorrows_ex)
        const exchangeRate=await getExchangeRate(chain,REGISTRY,user1.address)
        exchangeRate.expectUint(exchangeRate_ex)
    },
})

Clarinet.test({
    name: "testing repay Borrow",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer=accounts.get("deployer")
        if (!deployer) throw new Error("deployer not found")
        const user1=accounts.get("wallet_1")
        if (!user1) throw new Error("user1 not found")
        let totalReserves_ex=0n
        let totalBorrows_ex=0n
        let cash_ex=0n
        let borrowIndex_ex=1000000n

        // add reserves
        const addReserveAmount=1000000n
        totalReserves_ex+=addReserveAmount
        cash_ex+=addReserveAmount
        addReserves(chain,REGISTRY,user1.address,addReserveAmount)
        let totalReserves=await getTotalReserves(chain,REGISTRY,user1.address)
        totalReserves.expectUint(totalReserves_ex)
        let borrowIndex=await getBorrowIndex(chain,REGISTRY,user1.address)
        borrowIndex.expectUint(borrowIndex_ex)
        console.log(borrowIndex)

        // deposit and mint
        const depositStxAmount=2000000n
        let borrowRate=calculateBorrowRate(cash_ex,totalBorrows_ex,totalReserves_ex)
        let req={
            borrowRate,blockInterval:1n,
            totalBorrows:totalBorrows_ex,
            totalReserves:totalReserves_ex,
            borrowIndex:borrowIndex_ex
        }
        let interest_ex=simulateInterest(req)
        const mintStokenAmount_ex=depositStxAmount*INITIAL_EXCHANGE_RATE_MANTISSA/SCALAR
        cash_ex+=depositStxAmount
        let mintAmount = depositAndMint(chain,REGISTRY,user1.address,depositStxAmount)
        mintAmount.expectUint(mintStokenAmount_ex)
        borrowIndex=await getBorrowIndex(chain,REGISTRY,user1.address)
        borrowIndex.expectUint(interest_ex.borrowIndex)

        // borrow
        const borrowAmount=500000n
        borrowIndex_ex=interest_ex.borrowIndex
        borrowRate=calculateBorrowRate(cash_ex,totalBorrows_ex,totalReserves_ex)
        req={
            borrowRate,blockInterval:1n,
            totalBorrows:totalBorrows_ex,
            totalReserves:totalReserves_ex,
            borrowIndex:borrowIndex_ex
        }
        interest_ex=simulateInterest(req)
        totalBorrows_ex+=borrowAmount
        cash_ex-=borrowAmount
        let borrowRes = borrow(chain,REGISTRY,user1.address,borrowAmount)
        borrowRes.expectUint(borrowAmount)
        borrowIndex=await getBorrowIndex(chain,REGISTRY,user1.address)
        borrowIndex.expectUint(interest_ex.borrowIndex)
        const {interestIndex}=await getUserBorrow(chain,REGISTRY,user1.address)
        const userInterestIndex=interest_ex.borrowIndex
        interestIndex.expectUint(userInterestIndex)


        // repay borrow
        borrowIndex_ex=interest_ex.borrowIndex
        borrowRate=calculateBorrowRate(cash_ex,totalBorrows_ex,totalReserves_ex)
        req={
            borrowRate,blockInterval:1n,
            totalBorrows:totalBorrows_ex,
            totalReserves:totalReserves_ex,
            borrowIndex:borrowIndex_ex
        }
        interest_ex=simulateInterest(req)
        let repayBorrowRes = repayBorrow(chain,REGISTRY,user1.address,borrowAmount)
        const repayBorrow_ex=calculateBorrowBalance(
            borrowAmount,
            userInterestIndex,
            interest_ex.borrowIndex
        )
        repayBorrowRes.expectUint(repayBorrow_ex)
        const newBorrowIndex=await getBorrowIndex(chain,REGISTRY,user1.address)
        newBorrowIndex.expectUint(interest_ex.borrowIndex)
    },
})


