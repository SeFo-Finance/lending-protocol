;; interest-rate-trait
;; <add a description here>

(define-trait ir-trait 
    (
        (get-borrow-rate (uint uint uint) (response uint uint))
        (get-supply-rate (uint uint uint uint) (response uint uint))
    ))