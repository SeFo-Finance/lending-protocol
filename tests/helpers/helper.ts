import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';
import {
    BASE_RATE_PER_BLOCK_MANTISSA,
    MULTIPLIER_PER_BLOCK_MANTISSA,
    RESERVE_FACTOR_MANTISSA,
    SCALAR
} from '../common.ts';


export function calculateUtilizationRate(
    cash:bigint,borrows:bigint,reserves:bigint
):bigint{
    if (borrows===0n) return 0n
    return (borrows)*SCALAR/(cash+borrows-reserves)
}

export function calculateBorrowRate(
    cash:bigint,borrows:bigint,reserves:bigint
):bigint{
    const ur=calculateUtilizationRate(cash,borrows,reserves)
    return (ur*MULTIPLIER_PER_BLOCK_MANTISSA)/SCALAR+BASE_RATE_PER_BLOCK_MANTISSA
}

export function calculateSupplyRate(
    cash:bigint,borrows:bigint,
    reserves:bigint,reserveFactorMantissa:bigint,
):bigint{
    const factor=SCALAR-reserveFactorMantissa
    const borrowRate=calculateBorrowRate(cash,borrows, reserves)
    const rateToPool=borrowRate*factor/SCALAR
    const ur=calculateUtilizationRate(cash,borrows,reserves)
    return (ur*rateToPool)/SCALAR
}

export function calculateExchangeRate(
    cash:bigint,borrows:bigint,reserves:bigint,supply:bigint
    ):bigint{
    if (supply===0n) return 0n
    return (cash+borrows-reserves)*SCALAR/supply
}


export function getAssetBalance(chain:Chain,asset:string,user:string):bigint{
    const assets=chain.getAssetsMaps().assets
    if (!assets[asset] || !assets[asset][user]) return 0n
    return BigInt(assets[asset][user])
}

export interface SimulateInterestReq{
    borrowRate:bigint
    blockInterval:bigint
    totalBorrows:bigint
    totalReserves:bigint
    borrowIndex:bigint
}

export interface SimulateInterestResp{
    totalBorrows:bigint
    totalReserves:bigint
    borrowIndex:bigint
}

export function simulateInterest(req:SimulateInterestReq):SimulateInterestResp{
    const {
        borrowRate,blockInterval,
        totalBorrows,totalReserves,
        borrowIndex
    }=req
    const interestFactor=borrowRate*blockInterval
    const interest=interestFactor*totalBorrows/SCALAR
    const addReserve=interest*RESERVE_FACTOR_MANTISSA/SCALAR
    const addBorrowIndex=interestFactor*borrowIndex/SCALAR
    const newBorrow=interest+totalBorrows
    const newReserve=addReserve+totalReserves
    const newBorrowIndex=addBorrowIndex+borrowIndex
    return {
        totalBorrows:newBorrow,
        totalReserves:newReserve,
        borrowIndex:newBorrowIndex,
    }
}

export function calculateBorrowBalance(
    userBalance:bigint,userInterestIndex:bigint,interestIndex:bigint
){
    if (userBalance===0n) return 0n
    return userBalance*userInterestIndex/interestIndex
}
