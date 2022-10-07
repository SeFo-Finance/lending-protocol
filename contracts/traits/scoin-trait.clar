(use-trait stoken-trait .stoken-trait.stoken-trait)
;; scoin-trait
;; <add a description here>
(use-trait ft-trait .sip-010-ft-trait.ft-trait)

(define-trait scoin-trait 
    (
        ;; user-interface
        (deposit-and-mint (<ft-trait> uint) (response uint uint))
        (redeem (uint) (response uint uint))
        (redeem-underlying (uint) (response uint uint))
        (borrow (uint) (response uint uint))
        (repay-borrow (uint) (response uint uint))
        (repay-borrow-behalf (uint principal) (response uint uint))
        (liquidate-borrow (<stoken-trait> uint principal) (response uint uint))

        ;; admin-interface
        (add-reserves (uint) (response uint uint)) 
        
        ))