(impl-trait .sip-010-ft-trait.ft-trait)
;; sxbtc
;; <add a description here>

;; constants
;;
(define-fungible-token sxbtc u1000000000000000000)
(define-constant name "s-xBTC")
(define-constant symbol "sxBTC")
(define-constant decimals u8)
(define-constant err-invalid-amount (err u101))
(define-constant err-get-token-balances (err u102))
(define-constant err-get-balances (err u103))
(define-constant err-invalid-block (err u104))
(define-constant err-balance-not-enough (err u105))
;; data maps and vars
;;


;; private functions
;;

;; public functions
;;

(define-read-only (get-name) 
    (ok name))

(define-read-only (get-symbol) (ok symbol))

(define-read-only (get-decimals) (ok decimals))

(define-read-only (get-balances (user principal)) 
    (ok (ft-get-balance sxbtc user)))

(define-read-only (get-token-uri) (ok (some u"http://example.com")))

(define-read-only (get-total-supply) 
    (ok (ft-get-supply sxbtc))
)

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34)))) 
    (begin 
        (asserts! (is-eq tx-sender sender) (err u101))
        (try! (ft-transfer? sxbtc amount sender recipient))
        (match memo to-print (print to-print) 0x)
        (ok true)
    )
)

(define-public (mint-for-registry (amount uint) (recipient principal)) 
    (begin  
        (asserts! (is-eq contract-caller .sxbtc-registry) (err u1000))
        (ft-mint? sxbtc amount recipient)
    )
)

(define-public (burn-for-registry (amount uint) (recipient principal)) 
    (begin  
        (asserts! (is-eq contract-caller .sxbtc-registry) (err u1001))
        (ft-burn? sxbtc amount recipient)
    )
)