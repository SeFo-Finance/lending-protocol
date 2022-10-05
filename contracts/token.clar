(impl-trait .sip-010-ft-trait.ft-trait)
;; token
;; <add a description here>

;; constants
;;

(define-fungible-token token)
(define-constant err-owner-only (err u101))
(define-constant err-authorized (err u102))
;; data maps and vars
;;

;; private functions
;;

;; public functions
;;

(define-read-only (get-total-supply) 
    (ok (ft-get-supply token))
)

(define-read-only (get-name) (ok "mock-token"))

(define-read-only (get-symbol) (ok "MT"))

(define-read-only (get-decimals) (ok u6))

(define-read-only (get-balances (who principal)) 
    (ok (ft-get-balance token who))
)

(define-public (get-token-uri) 
    (ok (some u"uri"))
)

(define-public (get-token-uri-1 (a (list 5 uint))) 
    (ok (some u"uri"))
)

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34)))) 
    (begin 
        (asserts! (is-eq tx-sender sender) err-owner-only)
        (try! (ft-transfer? token amount sender recipient))
        (match memo to-print (print to-print) 0x)
        (ok true)
    )
)

;; for development
(define-public (mint (amount uint) (recipient principal)) 
    (begin  
        (ft-mint? token amount recipient)
    )
)




