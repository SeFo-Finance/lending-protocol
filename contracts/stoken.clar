(impl-trait .stoken-trait.stoken-trait)
(use-trait ir-trait .interest-rate-trait.ir-trait)
;; stoken
;; <add a description here>

;; constants
;;
(define-fungible-token stoken)
(define-constant name "stoken")
(define-constant symbol "sT")
(define-constant decimals u6)
(define-constant borrow-rate-max-mantissa u1000000)
(define-constant reserve-factor-max-mantissa u1000000)
;; data maps and vars
;;
(define-data-var admin principal .controller-g1)
(define-data-var pending-admin principal .controller-g1)
(define-data-var controller principal .controller-g1)
(define-data-var interest-rate-model principal .controller-g1)
(define-data-var initial-exchange-rate-mantissa uint u1)
(define-data-var reserve-factor-mantissa uint u1)
(define-data-var accrual-block uint u1)
(define-data-var borrow-index uint u0)
(define-data-var total-borrows uint u0)
(define-data-var total-reserves uint u0)
(define-data-var total-supply uint u0)
(define-map account-borrows principal {
    balance: uint, interest-index: uint
})
(define-map transfer-allowance {owner: principal, spender: principal} uint)


;; private functions
;;

(define-private (get-cash-prior) 
    (let (
        (contract-address (as-contract tx-sender))
        (contract-balance (unwrap! (contract-call? .token get-balances contract-address) (err u101)) )) 
        (ok contract-balance)))
;; public functions
;;

(define-read-only (get-name) (ok "sToken"))

(define-read-only (get-symbol) (ok "sT"))

(define-read-only (get-decimals) (ok u6))

(define-read-only (get-balances (user principal)) 
    (ok (ft-get-balance stoken user)))

(define-read-only (get-token-uri) (ok (some u"http://example.com")))

(define-read-only (get-total-supply) 
    (ok (ft-get-supply stoken))
)

(define-read-only (get-borrow-rate-per-block) 
    (let (     
        (contract-balance (try! (get-cash-prior)))
        (borrows (var-get total-borrows))
        (reserves (var-get total-reserves))
        ;; to-do change to ir-model 
        ;; (rate (unwrap! 
        ;;     (contract-call? .ir-model get-borrow-rate contract-balance borrows reserves) 
        ;;     (err u101)))
        (rate u100)) (ok rate)))

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
        (rate u100)) (ok rate)))

(define-read-only (get-cash) (ok (try! (get-cash-prior))))

(define-read-only (get-account-snapshot (user principal)) 
    (let (
        (stoken-balance (ft-get-balance stoken user))
        (borrow-balance (try! (get-borrow-balance-stored user)))
        (exchange-rate (try! (get-exchange-rate-stored)))) 
        (ok {
            stoken-balance: stoken-balance,
            borrow-balance: borrow-balance,
            exchange-rate: exchange-rate 
        })))

(define-read-only (get-borrow-balance-stored (user principal)) 
    (let (
        (borrow (default-to 
            {balance: u0, interest-index: u0} 
            (map-get? account-borrows user)))
        (borrow-balance (get balance borrow))
        (borrow-interest-index (get interest-index borrow))
        (borrow-i (var-get borrow-index))) 
        (if (is-eq borrow-balance u0) 
            (ok u0)  
            (begin 
             (asserts! (>= borrow-i u0) (err u101))
             (ok (/ (* borrow-balance borrow-interest-index) borrow-i))))
        ))

(define-read-only (get-exchange-rate-stored) 
    (begin 
        (if (is-eq (var-get total-supply) u0) 
            (ok (var-get initial-exchange-rate-mantissa)) 
            (let (
                (cash (try! (get-cash-prior)))
                (borrows (var-get total-borrows))
                (reserves (var-get total-reserves))
                (stoken-supply (var-get total-supply))
                (token-usage (- (+ cash borrows) reserves))
                (exchange-rate (/ token-usage stoken-supply))) 
                (ok exchange-rate)))))

(define-public (accrue-interest) 
    (let (
        (borrow-rate (try! (get-supply-rate-per-block)))
        (now-block block-height)
        (last-block (var-get accrual-block))
        )
        (asserts! (<= borrow-rate borrow-rate-max-mantissa) (err u101))
        (asserts! (>= now-block last-block) (err u101))
        
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
            (interest-accumulated (* interest-factor borrows))
            (new-borrows (+ interest-accumulated borrows) )
            (new-reserves (+ (* interest-accumulated reserve-factor) reserves))
            (new-borrow-i (+ (* interest-factor borrow-i) borrow-i)))
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
        (token-balance (unwrap! (contract-call? .token get-balances user) (err u101)) )
        (stoken-balance (* token-balance exchange-rate))) 
        (ok u0)))


(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34)))) 
    (begin 
        (asserts! (is-eq tx-sender sender) (err u101))
        (try! (ft-transfer? stoken amount sender recipient))
        (match memo to-print (print to-print) 0x)
        (ok true)
    )
)

;;         (total-borrows-current () (response uint uint)) 
;;         (borrow-balance-current (principal) (response uint uint)) 
;;         (borrow-balancestored (principal) (response uint uint)) 
;;         (exchange-rate-current () (response uint uint))
;;         (exchange-rate-stored () (response uint uint))
;;         (get-cash () (response uint uint))
;;         (accrue-interest () (response uint uint))
;;         (seize (uint principal principal) (response uint uint)) 