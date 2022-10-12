(impl-trait .stoken-registry-trait.stoken-registry-trait)
(use-trait ir-trait .interest-rate-trait.ir-trait)
(use-trait scoin-trait .scoin-trait.scoin-trait)
;; stoken
;; <add a description here>

;; constants
;;
(define-constant borrow-rate-max-mantissa u1000000)
(define-constant reserve-factor-max-mantissa u1000000)
(define-constant initial-exchange-rate-mantissa u1000000)
(define-constant exp-scale u1000000)
(define-constant err-invalid-amount (err u101))
(define-constant err-get-token-balances (err u102))
(define-constant err-get-balances (err u103))
(define-constant err-invalid-block (err u104))
(define-constant err-balance-not-enough (err u105))
;; data maps and vars
;;
(define-data-var admin principal .controller-g1)
(define-data-var pending-admin principal .controller-g1)
(define-data-var controller principal .controller-g1)
(define-data-var interest-rate-model principal .controller-g1)
(define-data-var reserve-factor-mantissa uint u1)
(define-data-var accrual-block uint u1)
(define-data-var borrow-index uint u0)
(define-data-var total-borrows uint u0)
(define-data-var total-reserves uint u0)
(define-map account-borrows principal {
    balance: uint, interest-index: uint
})


;; private functions
;;

(define-private (get-cash-prior) 
    (let (
        (contract-address (as-contract tx-sender))
        (contract-balance (unwrap! (contract-call? .token get-balances contract-address) err-get-token-balances) )) 
        (ok contract-balance)))

(define-private (div-scalar-by-exp-truncate (value uint)) 
    (ok (/ value exp-scale)))

;; public functions
;;

(define-read-only (get-borrow-rate-per-block) 
    (let (     
        (contract-balance (try! (get-cash-prior)))
        (borrows (var-get total-borrows))
        (reserves (var-get total-reserves))
        ;; to-do change to ir-model 
        ;; (rate (unwrap! 
        ;;     (contract-call? .ir-model get-borrow-rate contract-balance borrows reserves) 
        ;;     (err u101)))
        (rate u1000000)) (ok rate)))

(define-read-only (get-supply-rate-per-block) 
    (let (     
        (contract-balance (try! (get-cash-prior)))
        (borrows (var-get total-borrows))
        (reserves (var-get total-reserves))
        (reserve-factor (var-get reserve-factor-mantissa))
        ;; to-do change to ir-model 
        ;; (rate (unwrap! 
        ;;     (contract-call? .ir-model get-supply-rate contract-balance borrows reserves reserve-factor) 
        ;;     (err u101)))
        (rate u1000000)) (ok rate)))

(define-read-only (get-cash) (ok (try! (get-cash-prior))))

(define-read-only (get-account-snapshot (user principal)) 
    (let (
        (stoken-balance (unwrap! (contract-call? .stoken get-balances user) (err u111)))
        (borrow-balance (try! (get-borrow-balance-stored user)))
        (exchange-rate (try! (get-exchange-rate-stored)))) 
        (ok {
            stoken-balance: stoken-balance,
            borrow-balance: borrow-balance,
            exchange-rate: exchange-rate 
        })))

(define-read-only (get-borrow-balance-stored (user principal)) 
    (let (
        (user-borrow (default-to 
            {balance: u0, interest-index: u0} 
            (map-get? account-borrows user)))
        (borrow-balance (get balance user-borrow))
        (borrow-interest-index (get interest-index user-borrow))
        (borrow-i (var-get borrow-index))) 
        (if (is-eq borrow-balance u0) 
            (ok u0)  
            (begin 
             (asserts! (>= borrow-i u0) (err u101))
             (ok (/ (* borrow-balance borrow-interest-index) borrow-i))))
        ))

(define-read-only (get-exchange-rate-stored) 
    (let (
        (supply (unwrap! (contract-call? .stoken get-total-supply) (err u111)))
        (cash (try! (get-cash-prior)))
        (borrows (var-get total-borrows))
        (reserves (var-get total-reserves))
        (token-usage (- (+ cash borrows) reserves))) 
        (if (> supply u0) 
            (ok (/ (* token-usage exp-scale) supply))
            (ok initial-exchange-rate-mantissa))))

(define-public (accrue-interest) 
    (let (
        (borrow-rate (try! (get-supply-rate-per-block)))
        (now-block block-height)
        (last-block (var-get accrual-block))
        )
        (asserts! (<= borrow-rate borrow-rate-max-mantissa) (err u101))
        (asserts! (>= now-block last-block) err-invalid-block)
        
        ;; Calculate the interest accumulated into borrows and reserves and the new index:
        ;; simpleInterestFactor = borrowRate * blockDelta
        ;; interestAccumulated = simpleInterestFactor * totalBorrows
        ;; totalBorrowsNew = interestAccumulated + totalBorrows
        ;; totalReservesNew = interestAccumulated * reserveFactor + totalReserves
        ;; borrowIndexNew = simpleInterestFactor * borrowIndex + borrowIndex
    
        (let (
            (borrows (var-get total-borrows))
            (reserves (var-get total-reserves))
            (reserve-factor (var-get reserve-factor-mantissa))
            (borrow-i (var-get borrow-index))
            (block-interval (- now-block last-block))
            (interest-factor (* borrow-rate block-interval))
            (interest-accumulated (unwrap! 
                (div-scalar-by-exp-truncate (* interest-factor borrows)) 
                (err u101)))
            (new-borrows (+ interest-accumulated borrows) )
            (new-reserves (unwrap!
                (div-scalar-by-exp-truncate (+ (* interest-accumulated reserve-factor) reserves))
                (err u101)))
            (new-borrow-i (unwrap!
                (div-scalar-by-exp-truncate (+ (* interest-factor borrow-i) borrow-i))
                (err u101))))
            (var-set accrual-block now-block)
            (var-set total-borrows new-borrows)
            (var-set total-reserves new-reserves)
            (var-set borrow-index new-borrow-i))
        (ok true)))

(define-public (borrow-balance-current (user principal)) 
    (begin 
        (asserts! (try! (accrue-interest)) (err u101))
        (ok (try! (get-borrow-balance-stored user)))))

(define-public (exchange-rate-current) 
    (begin 
        (asserts! (try! (accrue-interest)) (err u101))
        (ok (try! (get-exchange-rate-stored)))))

(define-public (total-borrows-current) 
    (begin 
        (asserts! (try! (accrue-interest)) (err u101))
        (ok (var-get total-borrows))))

(define-public (underlying-balances (user principal)) 
    (let (
        (exchange-rate (try! (exchange-rate-current)))
        (stoken-balance (unwrap! (contract-call? .stoken get-balances user) (err u111)))
        (token-balance (unwrap! 
            (div-scalar-by-exp-truncate (* stoken-balance exchange-rate))
            (err u1111)))) 
        (ok token-balance)))

(define-public (despoit-and-mint (amount uint)) 
    (begin 
        (asserts! (try! (accrue-interest)) (err u101))
        ;; to-do:controller verify
        (let (
            (minter tx-sender)
            (coin-recipient (as-contract tx-sender))
            (block-accrual (var-get accrual-block))
            (block-now block-height)
            (exchange-rate (try! (get-exchange-rate-stored)))
            (coin-balance (unwrap! (contract-call? .token get-balances minter) err-get-token-balances))
            (mint-stoken-amount (/ amount exchange-rate))) 
            (begin 
                (asserts! (> amount u0) err-invalid-amount)
                (asserts! (is-eq block-now block-accrual) err-invalid-block)
                (asserts! (>= coin-balance amount) err-balance-not-enough)
                (asserts! (unwrap! (contract-call? .token transfer amount minter coin-recipient none) (err u111)) (err u1011))
                (asserts! (unwrap! (contract-call? .stoken mint-for-registry amount minter) (err u1001)) (err u1011))
                (ok {
                    stoken-amount: mint-stoken-amount,
                    token-amount: amount
                })))))

(define-public (redeem (amount uint)) 
    (begin 
        (asserts! (try! (accrue-interest)) (err u101))
        ;; to-do:controller verify
        (let (
            (redeemer tx-sender)
            (sender (as-contract tx-sender))
            (block-accrual (var-get accrual-block))
            (block-now block-height)
            (exchange-rate (try! (get-exchange-rate-stored)))
            (token-amount (unwrap! 
                (div-scalar-by-exp-truncate (* amount exchange-rate))
                (err u111))))
            (begin 
                (asserts! (> amount u0) err-invalid-amount)
                (asserts! (is-eq block-now block-accrual) err-invalid-block)
                (asserts! (>= token-amount u0) (err u101))
                (asserts! (unwrap! 
                    (as-contract 
                        (contract-call? .token transfer token-amount sender redeemer none)) 
                        (err u111))
                    (err u1011)))
                (asserts! (unwrap! (contract-call? .stoken burn-for-registry amount redeemer) (err u1001)) (err u1011))
                (ok {
                    stoken-amount: amount,
                    token-amount: token-amount
                }))))

(define-public (borrow (amount uint)) 
    (begin 
        (asserts! (try! (accrue-interest)) (err u101))
        ;; to-do:controller verify
        (let (
            (borrower tx-sender)
            (sender (as-contract tx-sender))
            (block-accrual (var-get accrual-block))
            (block-now block-height)
            (contract-token-balance (try! (get-cash-prior)))
            (borrow-balance (try! (get-borrow-balance-stored borrower)))
            (total-borrow-balance (var-get total-borrows))
            (new-borrow-balance (+ borrow-balance amount))
            (new-total-borrow-balance (+ total-borrow-balance amount))
            (borrow-i (var-get borrow-index)))
            (begin 
                (asserts! (> amount u0) err-invalid-amount)
                (asserts! (is-eq block-now block-accrual) err-invalid-block)
                (asserts! (>= contract-token-balance amount) err-balance-not-enough)
                (asserts! (unwrap! 
                    (as-contract 
                        (contract-call? .token transfer amount sender borrower none)) 
                        (err u111))
                    (err u1011)))
                (map-set account-borrows borrower {
                    balance: new-borrow-balance,
                    interest-index: borrow-i
                })
                (var-set total-borrows new-total-borrow-balance)
                (ok amount))))

(define-public (repay-borrow (amount uint)) 
    (begin 
        (asserts! (try! (accrue-interest)) (err u101))
        ;; to-do:controller verify
        (let (
            (borrower tx-sender)
            (recipient (as-contract tx-sender))
            (block-accrual (var-get accrual-block))
            (block-now block-height)
            (coin-balance (unwrap! (contract-call? .token get-balances borrower) err-get-token-balances))
            (user-repay (try! (borrow-balance-current borrower)))
            (repay-amount (if (>= user-repay amount) amount user-repay))
            (total-borrow-balance (var-get total-borrows))
            (new-borrow-balance (- user-repay repay-amount))
            (new-total-borrow-balance (- total-borrow-balance repay-amount))
            (borrow-i (var-get borrow-index)))
            (begin 
                (asserts! (> amount u0) err-invalid-amount)
                (asserts! (is-eq block-now block-accrual) err-invalid-block)
                (asserts! (>= coin-balance repay-amount) err-balance-not-enough)
                (asserts! (unwrap! 
                    (as-contract 
                        (contract-call? .token transfer repay-amount borrower recipient none)) 
                        (err u111))
                    (err u1011)))
                (map-set account-borrows borrower {
                    balance: new-borrow-balance,
                    interest-index: borrow-i
                })
                (var-set total-borrows new-total-borrow-balance)
                (ok repay-amount))))

(define-public (add-reserves (amount uint)) 
    (begin 
        (asserts! (try! (accrue-interest)) (err u101))
        ;; to-do:controller verify
        (let (
            (minter tx-sender)
            (coin-recipient (as-contract tx-sender))
            (block-accrual (var-get accrual-block))
            (block-now block-height)
            (exchange-rate (try! (get-exchange-rate-stored)))
            (coin-balance (unwrap! (contract-call? .token get-balances minter) err-get-token-balances))
            (reserves (var-get total-reserves))
            (new-reserves (+ reserves amount))) 
            (begin 
                (asserts! (> amount u0) err-invalid-amount)
                (asserts! (is-eq block-now block-accrual) (err u101))
                (asserts! (>= coin-balance amount) err-balance-not-enough)
                (asserts! (unwrap! (contract-call? .token transfer amount minter coin-recipient none) (err u111)) (err u1011))
                (asserts! (var-set total-reserves new-reserves) (err u1011))
                (ok true)))))
