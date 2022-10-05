
(define-trait controller-trait
  (
    (is-controller () (response bool uint))

    ;; Assets You Are In
    (enter-markets ((list 100 principal)) (response (list 100 uint) uint))
    (exit-market (principal) (response uint uint))

    ;; Policy Hooks
    (mint-allowed (principal principal uint) (response uint uint))
    (mint-verify (principal principal uint uint) (response bool uint))

    (redeem-allowed (principal principal uint) (response uint uint))
    (redeem-verify (principal principal uint uint) (response bool uint))

    (borrow-allowed (principal principal uint) (response uint uint))
    (borrow-verify (principal principal uint) (response bool uint))

    (repay-borrow-allowed (principal principal principal uint) (response uint uint))
    (repay-borrow-verify (principal principal principal uint uint) (response bool uint))

    (liquidate-borrow-allowed (principal principal principal principal uint) (response uint uint))
    (liquidate-borrow-verify (principal principal principal principal uint uint) (response bool uint))

    (seize-allowed (principal principal principal principal uint) (response uint uint))
    (seize-verify (principal principal principal principal uint) (response bool uint))

    (transfer-allowed (principal principal principal uint) (response uint uint))
    (transfer-verify (principal principal principal uint) (response bool uint))

    ;; Liquidity/Liquidation Calculations
    (liquidate-calculate-seize-tokens
      (principal principal uint)
      (response {error: uint, seize-tokens: uint} uint)
    )
  )
)
