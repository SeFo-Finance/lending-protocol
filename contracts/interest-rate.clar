(impl-trait .interest-rate-trait.ir-trait)
(define-constant BASE (pow u10 u8))
(define-constant block-per-year u52560) ;; 1 year / 10 min
(define-data-var base-rate-per-block uint u0) ;; manual input param before run
(define-data-var multiplier-per-block uint u0) ;; manual input param before run

(define-private (utilization-rate (cash uint) (borrows uint) (reserves uint)) 
    (if (is-eq borrows u0)
        u0
        (/ (* borrows BASE) (- (+ cash borrows) reserves)))
)

(define-read-only (get-borrow-rate (cash uint) (borrows uint) (reserves uint))
    (let (
        (ur (utilization-rate cash borrows reserves))
        (multiplier (var-get multiplier-per-block))
        (base-rate (var-get base-rate-per-block)))
        (ok (+ (/ (* ur multiplier) BASE) base-rate))
    )
)

(define-read-only (get-supply-rate (cash uint) (borrows uint) (reserves uint) (reserve-factor-mantissa uint))
    (let  (
        (one-minus-reserve-factor (- BASE reserve-factor-mantissa))
        (borrow-rate (unwrap! (get-borrow-rate cash borrows reserves) (err u101)))
        (rate-to-pool (/ (* borrow-rate one-minus-reserve-factor) BASE))
        (ur (utilization-rate cash borrows reserves) )
        (supply-rate (/ (* ur rate-to-pool) BASE)))
        (ok supply-rate)
    )
)

(begin 
    (var-set base-rate-per-block (/ u10000000 block-per-year))
    (var-set multiplier-per-block (/ u45000000 block-per-year))
    )
