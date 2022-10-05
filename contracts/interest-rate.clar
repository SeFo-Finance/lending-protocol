(impl-trait .interest-rate-trait.ir-trait)
(define-constant BASE (pow u10 u18))
(define-data-var base-rate-per-block uint u0) ;; manual input param before run
(define-data-var multiplier-per-block uint u0) ;; manual input param before run

(define-public (utilization-rate (cash uint) (borrows uint) (reserves uint)) 
    (if (is-eq borrows u0) u0 ((/ (* borrows BASE) ((- (+ cash borrows) reserves)))))
)

(define-public (get-borrow-rate (cash uint) (borrows uint) (reserves uint)) 
    (begin  
        (define-data-var ur uint (utilization-rate cash borrows reserves))
        (ok (+ (/ (* ur multiplier-per-block) BASE) base-rate-per-block))
    )
)

(define-public (get-supply-rate (cash uint) (borrows uint) (reserves uint) (reserve-factor-mantissa uint)) 
    (begin  
        (define-data-var one-minus-reserve-factor uint (- BASE reserve-factor-mantissa))
        (define-data-var borrowRate uint (get-borrow-rate cash borrows reserves))
        (define-data-var rateToPool uint (/ (* borrowRate one-minus-reserve-factor) BASE))
        (ok ur)
    )
)