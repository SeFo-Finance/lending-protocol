import { Chain, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts'

const CONTROLLER = 'controller-1'

// Utility functions
export async function getExp(
    chain: Chain,
    sender: string,
    num: bigint,
    denom: bigint,
): Promise<String> {
    const res = await chain.callReadOnlyFn(
        CONTROLLER, 'get-exp', [types.uint(num), types.uint(denom)], sender  
    )
    return res.result
}

export async function mulExp(
    chain: Chain,
    sender: string,
    a: bigint,
    b: bigint,
): Promise<String> {
    const res = await chain.callReadOnlyFn(
        CONTROLLER, 'mul-exp', [types.uint(a), types.uint(b)], sender  
    )
    return res.result
}

export async function mulExp3(
    chain: Chain,
    sender: string,
    a: bigint,
    b: bigint,
    c: bigint,
): Promise<String> {
    const res = await chain.callReadOnlyFn(
        CONTROLLER, 'mul-exp3', [types.uint(a), types.uint(b), types.uint(c)], sender  
    )
    return res.result
}

export async function divExp(
    chain: Chain,
    sender: string,
    a: bigint,
    b: bigint,
): Promise<String> {
    const res = await chain.callReadOnlyFn(
        CONTROLLER, 'div-exp', [types.uint(a), types.uint(b)], sender  
    )
    return res.result
}

export async function mulScalarTruncate(
    chain: Chain,
    sender: string,
    exp: bigint,
    scalar: bigint,
): Promise<String> {
    const res = await chain.callReadOnlyFn(
        CONTROLLER, 'mul-scalar-truncate', [types.uint(exp), types.uint(scalar)], sender  
    )
    return res.result
}

export async function mulScalarTruncateAddUint(
    chain: Chain,
    sender: string,
    exp: bigint,
    scalar: bigint,
    addend: bigint,
): Promise<String> {
    const res = await chain.callReadOnlyFn(
        CONTROLLER, 'mul-scalar-truncate-add-uint', [types.uint(exp), types.uint(scalar), types.uint(addend)], sender  
    )
    return res.result
}

export async function truncate(
    chain: Chain,
    sender: string,
    exp: bigint,
): Promise<String> {
    const res = await chain.callReadOnlyFn(
        CONTROLLER, 'truncate', [types.uint(exp)], sender  
    )
    return res.result
}
