;; (use-trait stoken-trait .stoken-trait.stoken-trait)
;; scoin-trait
;; <add a description here>

(define-trait scoin-trait 
    (
        ;; user-interface
        (deposit-and-mint (uint) (response {
            stoken-amount: uint,
            token-amount: uint
        } uint))
        (redeem (uint) (response {
            stoken-amount: uint,
            token-amount: uint
         } uint))
        ;; (redeem-underlying (uint) (response uint uint))
        (borrow (uint) (response uint uint))
        (repay-borrow (uint) (response uint uint))
        ;; (repay-borrow-behalf (uint principal) (response uint uint))
        ;; (liquidate-borrow (<stoken-trait> uint principal) (response uint uint))

        ;; admin-interface
        (add-reserves (uint) (response uint uint)) 
        
        ))
