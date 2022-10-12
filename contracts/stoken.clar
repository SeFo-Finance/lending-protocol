(impl-trait .sip-010-ft-trait.ft-trait)
;; stoken
;; <add a description here>

;; constants
;;
(define-fungible-token stoken u1000000000000000000)
(define-constant name "stoken")
(define-constant symbol "sT")
(define-constant decimals u6)
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
    (ok "sToken"))

(define-read-only (get-symbol) (ok "sT"))

(define-read-only (get-decimals) (ok u6))

(define-read-only (get-balances (user principal)) 
    (ok (ft-get-balance stoken user)))

(define-read-only (get-token-uri) (ok (some u"http://example.com")))

(define-read-only (get-total-supply) 
    (ok (ft-get-supply stoken))
)

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34)))) 
    (begin 
        (asserts! (is-eq tx-sender sender) (err u101))
        (try! (ft-transfer? stoken amount sender recipient))
        (match memo to-print (print to-print) 0x)
        (ok true)
    )
)

(define-public (mint-for-registry (amount uint) (recipient principal)) 
    (begin  
        (asserts! (is-eq contract-caller .stoken-registry) (err u1000))
        (ft-mint? stoken amount recipient)
    )
)

(define-public (burn-for-registry (amount uint) (recipient principal)) 
    (begin  
        (asserts! (is-eq contract-caller .stoken-registry) (err u1001))
        (ft-burn? stoken amount recipient)
    )
)