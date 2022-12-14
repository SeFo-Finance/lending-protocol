(use-trait controller-trait .controller-trait.controller-trait)
(use-trait ir-trait .interest-rate-trait.ir-trait)

(define-trait stoken-registry-trait 
    (

        ;; ctoken-user-interface
        (underlying-balances (principal) (response uint uint))
        (get-account-snapshot (principal) (response 
            {stoken-balance: uint, borrow-balance: uint, exchange-rate: uint} 
            uint))
        (get-user-supply (principal) (response uint uint))
        (get-user-borrow (principal) (response 
            {balance: uint, interest-index: uint} 
            uint))
        (get-total-borrows () (response uint uint))
        (get-total-reserves () (response uint uint))
        (get-borrow-rate-per-block () (response uint uint))
        (get-supply-rate-per-block () (response uint uint)) 
        (total-borrows-current () (response uint uint)) 
        (borrow-balance-current (principal) (response uint uint)) 
        (get-borrow-balance-stored (principal) (response uint uint)) 
        (exchange-rate-current () (response uint uint))
        (get-exchange-rate-stored () (response uint uint))
        (get-cash () (response uint uint))
        (accrue-interest () (response bool uint))
        ;; (seize (uint principal principal) (response uint uint)) 

        ;;ctoken-admin-interface
        ;; (set-pending-admin (principal) (response uint uint)) 
        ;; (accept-admin () (response uint uint)) 
        ;; (set-controller (<controller-trait>) (response uint uint)) 
        ;; (set-reserve-factor (uint) (response uint uint)) 
        ;; (reduce-reserves (uint) (response uint uint))
        ;; (set-interest-rate-model (<ir-trait>) (response uint uint)) 

        ))