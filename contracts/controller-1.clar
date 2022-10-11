(impl-trait .controller-trait.controller-trait)
(use-trait st-trait .stoken-trait.stoken-trait)

;; UnitrollerAdminStorage variables
;; FIXME (default value): Administrator for this contract
(define-data-var admin principal tx-sender)
;; FIXME (default value): Pending administrator for this contract
(define-data-var pending-admin principal tx-sender)
;; FIXME (default value): Active brains of Unitroller
(define-data-var controller-implementation principal tx-sender)
;; FIXME (default value): Pending brains of Unitroller
(define-data-var pending-controller-implementation principal tx-sender)

;; ComptrollerV1Storage variables
;; Oracle which gives the price of any given asset
;; PriceOracle public oracle;

;; FIXME (default value): Multiplier used to calculate the maximum repayAmount when liquidating a borrow
(define-data-var close-factor-mantissa uint u0)
;; FIXME (default value): Multiplier representing the discount on collateral that a liquidator receives
(define-data-var liquidation-incentive-mantissa uint u0)
;; FIXME (default value): Max number of assets a single account can participate in (borrow or use as collateral)
(define-data-var max-assets uint u0)
;; Per-account mapping of "assets you are in", capped by max-assets
;; (define-map account-assets principal (list 100 <st-trait>))
(define-map account-assets principal (list 100 principal))

;; ComptrollerG1 variables
(define-map markets principal {
  is-listed: bool,
  collateral-factor-mantissa: uint,
  ;; FIXME: Per-market mapping of "accounts in this asset"
  ;; mapping(address => bool) accountMembership;
})
(define-map markets-account-membership
  { stoken: principal, account: principal }
  bool
)
;; closeFactorMantissa must be strictly greater than this value
(define-constant close-factor-min-mantissa (* 5 (pow u10 u16)))  ;; 0.05
;; closeFactorMantissa must not exceed this value
(define-constant close-factor-max-mantissa (* 9 (pow u10 u17)))  ;; 0.9
;; No collateralFactorMantissa may exceed this value
(define-constant collateral-factor-max-mantissa (* 9 (pow u10 u17)))  ;; 0.9
;; liquidationIncentiveMantissa must be no less than this value
(define-constant liquidation-incentive-min-mantissa (pow u10 u18)) ;; liquidationIncentiveMinMantissa = mantissaOne;
;; liquidationIncentiveMantissa must be no greater than this value
(define-constant liquidation-incentive-max-mantissa (* 15 (pow u10 u18)))  ;; 1.5

(define-constant exp-scale (pow u10 u18))
(define-constant half-exp-scale (/ (var-get exp-scale) u2))

(define-constant ERR_INVALID_ACCOUNT (err u1))
(define-constant ERR_INVALID_STOKEN (err u2))
(define-constant ERR_INVALID_ACCOUNT_OR_STOKEN (err u3))
(define-constant ERR_REDEEM_TOKENS_ZERO (err u4))
(define-constant ERR_UNKNOWN (err u5))

(define-constant ERR_NO_ERROR u0)
(define-constant ERR_UNAUTHORIZED u1)
(define-constant ERR_CONTROLLER_MISMATCH u2)
(define-constant ERR_INSUFFICIENT_SHORTFALL u3)
(define-constant ERR_INSUFFICIENT_LIQUIDITY u4)
(define-constant ERR_INVALID_CLOSE_FACTOR u5)
(define-constant ERR_INVALID_COLLATERAL_FACTOR u6)
(define-constant ERR_INVALID_LIQUIDATION_INCENTIVE u7)
(define-constant ERR_MARKET_NOT_ENTERED u8)
(define-constant ERR_MARKET_NOT_LISTED u9)
(define-constant ERR_MARKET_ALREADY_LISTED u10)
(define-constant ERR_MATH_ERROR u11)
(define-constant ERR_NONZERO_BORROW_BALANCE u12)
(define-constant ERR_PRICE_ERROR u13)
(define-constant ERR_REJECTION u14)
(define-constant ERR_SNAPSHOT_ERROR u15)
(define-constant ERR_TOO_MANY_ASSETS u16)
(define-constant ERR_TOO_MUCH_REPAY u17)


;; Indicator that this is a Comptroller contract (for inspection)
(define-public (is-controller)
  (ok true)
)

;; @notice Returns the assets an account has entered
;; @param account The address of the account to pull assets for
;; @return A dynamic list with the assets the account has entered
(define-public (get-assets-in (account principal))
  (let
    (
      (assets-in (unwrap! (map-get? account-assets account) (err ERR_INVALID_ACCOUNT)))
    )
    (ok assets-in)
  )
)

;; @notice Returns whether the given account is entered in the given asset
;; @param account The address of the account to check
;; @param stoken The stoken to check
;; @return True if the account is in the asset, otherwise false.
(define-public (check-membership (account principal) (stoken <st-trait>))
  (let
    (
      (stoken-contract (contract-of stoken))
      (membership (try! (get-markets-account-membership stoken-contract account)))
    )
    (ok membership)
  )
)

;; @notice Add assets to be included in account liquidity calculation
;; @param stokens The list of addresses of the stoken markets to be enabled
;; @return Success indicator for whether each corresponding market was entered
(define-public (enter-markets (stokens (list 100 principal)))
  (let
    (
      (results (map check-enter-markets stokens))
    )
    (ok results)
  )
)

(define-private (check-enter-markets (stoken principal))
  (let
    (
      (market-to-join (try! (get-market stoken)))
    )
    (if (not (get is-listed market-to-join))
      (err ERR_MARKET_NOT_LISTED)
      (if (try! (get-markets-account-membership stoken tx-sender))
        (err ERR_NO_ERROR)
        (if (>= (len (unwrap! (map-get? account-assets tx-sender) (err ERR_INVALID_ACCOUNT))) (var-get max-assets))
          (err ERR_TOO_MANY_ASSETS)
          (begin
            (map-set markets-account-membership { stoken: stoken, account: tx-sender } true)
            ;; FIXME: accountAssets[msg.sender].push(cToken);
            (ok ERR_NO_ERROR)
          )
        )
      )
    )
  )
)

(define-public (exit-market (stoken-address principal))
  (let
    (

    )
  )
)

;; Policy Hooks

;; @param cToken The market to verify the mint against
;; @param minter The account which would get the minted tokens
;; @param mintAmount The amount of underlying being supplied to the market in exchange for tokens
;; @return 0 if the mint is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol)
(define-public (mint-allowed
    (stoken principal)
    (minter principal)
    (mint-amount uint)
  )
  (let
    (
      (market (try! (get-market stoken)))
    )
    (ok (if (not (get is-listed market)) ERR_MARKET_NOT_LISTED ERR_NO_ERROR))
  )
)

;; @param cToken Asset being minted
;; @param minter The address minting the tokens
;; @param mintAmount The amount of the underlying asset being minted
;; @param mintTokens The number of tokens being minted
(define-public (mint-verify
    (stoken principal)
    (minter principal)
    (mint-amount uint)
    (mint-tokens uint)
  )
  ;; if (false) {
  ;;   max-assets = max-assets
  ;; }
  (ok true)
)

;; @notice Checks if the account should be allowed to redeem tokens in the given market
;; @param cToken The market to verify the redeem against
;; @param redeemer The account which would redeem the tokens
;; @param redeemTokens The number of cTokens to exchange for the underlying asset in the market
;; @return 0 if the redeem is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol)
(define-public (redeem-allowed
    (stoken principal)
    (redeemer principal)
    (redeem-tokens uint)
  )
  (begin
    (ok (try! (redeem-allowed-internal stoken redeemer redeem-tokens)))
  )
)

(define-private (redeem-allowed-internal
    (stoken principal)
    (redeemer principal)
    (redeem-tokens uint)
  )
  (let
    (
      (market (try! (get-market stoken)))
    )
    (if (not (get is-listed market))
      (err ERR_MARKET_NOT_LISTED)
      (if (not (try! (get-markets-account-membership stoken tx-sender)))
        (err ERR_NO_ERROR)
        (let
          (
            (liquidity-result (try! (get-hypothetical-account-liquidity-internal redeemer stoken redeem-tokens u0)))
          )
          (if (not (is-eq (get error liquidity-result) (err ERR_NO_ERROR)))
            (err (get error liquidity-result))
            (if (> (get shortfall liquidity-result) u0)
              (err ERR_INSUFFICIENT_LIQUIDITY)
              (ok ERR_NO_ERROR)
            )
          )
        )
      )
    )
  )
)

;; @notice Validates redeem and reverts on rejection. May emit logs.
;; @param cToken Asset being redeemed
;; @param redeemer The address redeeming the tokens
;; @param redeemAmount The amount of the underlying asset being redeemed
;; @param redeemTokens The number of tokens being redeemed
(define-public (redeem-verify
    (stoken principal)
    (redeemer principal)
    (redeem-amount uint)
    (redeem-tokens uint)
  )
  (begin
    (if (and (is-eq redeem-tokens u0) (> redeem-amount u0))
      (err ERR_REDEEM_TOKENS_ZERO)
      (ok true)
    )
  )
)

;; @notice Checks if the account should be allowed to borrow the underlying asset of the given market
;; @param cToken The market to verify the borrow against
;; @param borrower The account which would borrow the asset
;; @param borrowAmount The amount of underlying the account would borrow
;; @return 0 if the borrow is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol)
(define-public (borrow-allowed
    (stoken principal)
    (borrower principal)
    (borrow-amount uint)
  )
  (let
    (
      (market (try! (get-market stoken)))
    )
    (if (not (get is-listed market))
      (err ERR_MARKET_NOT_LISTED)
      (if (not (try! (get-markets-account-membership stoken borrower)))
        (err ERR_MARKET_NOT_ENTERED)
        (if ()
        
        )
      )
    )
  )
)

;; @notice Validates borrow and reverts on rejection. May emit logs.
;; @param cToken Asset whose underlying is being borrowed
;; @param borrower The address borrowing the underlying
;; @param borrowAmount The amount of the underlying asset requested to borrow
(define-public (borrow-verify
    (stoken principal)
    (borrower principal)
    (borrow-amount uint)
  )
  ;; if (false) {
  ;;   max-assets = max-assets
  ;; }
  (ok true)
)

;; @notice Checks if the account should be allowed to repay a borrow in the given market
;; @param cToken The market to verify the repay against
;; @param payer The account which would repay the asset
;; @param borrower The account which would borrowed the asset
;; @param repayAmount The amount of the underlying asset the account would repay
;; @return 0 if the repay is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol)
(define-public (repay-borrow-allowed
    (stoken principal)
    (payer principal)
    (borrower principal)
    (repay-amount uint)
  )
  (let
    (
      (market (try! (get-market stoken)))
    )
    (ok (if (not (get is-listed market)) ERR_MARKET_NOT_LISTED ERR_NO_ERROR))
  )
)

;; @notice Validates repayBorrow and reverts on rejection. May emit logs.
;; @param cToken Asset being repaid
;; @param payer The address repaying the borrow
;; @param borrower The address of the borrower
;; @param repayAmount The amount of underlying being repaid
(define-public (repay-borrow-verify
    (stoken principal)
    (payer principal)
    (borrower principal)
    (repay-amount uint)
    (borrower-index uint)
  )
  ;; if (false) {
  ;;   max-assets = max-assets
  ;; }
  (ok true)
)

;; @notice Checks if the liquidation should be allowed to occur
;; @param cTokenBorrowed Asset which was borrowed by the borrower
;; @param cTokenCollateral Asset which was used as collateral and will be seized
;; @param liquidator The address repaying the borrow and seizing the collateral
;; @param borrower The address of the borrower
;; @param repayAmount The amount of underlying being repaid
(define-public (liquidate-borrow-allowed
    (stoken-borrowed principal)
    (stoken-collateral principal)
    (liquidator principal)
    (borrower principal)
    (repay-amount uint)
  )
  (let
    (
      (market-borrowed (try! (get-market stoken-borrowed)))
      (market-collateral (try! (get-market stoken-collateral)))
    )
    (if (or (not (get is-listed market-borrowed)) (not (get is-listed market-collateral)))
      (err ERR_MARKET_NOT_LISTED)
      (begin
      
      )
    )
  )
)

;; @notice Validates liquidateBorrow and reverts on rejection. May emit logs.
;; @param cTokenBorrowed Asset which was borrowed by the borrower
;; @param cTokenCollateral Asset which was used as collateral and will be seized
;; @param liquidator The address repaying the borrow and seizing the collateral
;; @param borrower The address of the borrower
;; @param repayAmount The amount of underlying being repaid
(define-public (liquidate-borrow-verify
    (stoken-borrowed principal)
    (stoken-collateral principal)
    (liquidator principal)
    (borrower principal)
    (repay-amount uint)
    (seize-tokens uint)
  )
  ;; if (false) {
  ;;   max-assets = max-assets
  ;; }
  (ok true)
)

;; @notice Checks if the seizing of assets should be allowed to occur
;; @param cTokenCollateral Asset which was used as collateral and will be seized
;; @param cTokenBorrowed Asset which was borrowed by the borrower
;; @param liquidator The address repaying the borrow and seizing the collateral
;; @param borrower The address of the borrower
;; @param seizeTokens The number of collateral tokens to seize
(define-public (seize-allowed
    (stoken-collateral principal)
    (stoken-borrowed principal)
    (liquidator principal)
    (borrower principal)
    (seize-tokens uint)
  )
  (let
    (
      (market-borrowed (try! (get-market stoken-borrowed)))
      (market-collateral (try! (get-market stoken-collateral)))
    )
    (if (or (not (get is-listed market-borrowed)) (not (get is-listed market-collateral)))
      (err ERR_MARKET_NOT_LISTED)
      (if (false)
        (err ERR_CONTROLLER_MISMATCH)
        (ok ERR_NO_ERROR)
      )
    )
  )
)

;; @notice Validates seize and reverts on rejection. May emit logs.
;; @param cTokenCollateral Asset which was used as collateral and will be seized
;; @param cTokenBorrowed Asset which was borrowed by the borrower
;; @param liquidator The address repaying the borrow and seizing the collateral
;; @param borrower The address of the borrower
;; @param seizeTokens The number of collateral tokens to seize
(define-public (seize-verify
    (stoken-collateral principal)
    (stoken-borrowed principal)
    (liquidator principal)
    (borrower principal)
    (seize-tokens uint)
  )
  ;; if (false) {
  ;;   max-assets = max-assets
  ;; }
  (ok true)
)

;; @notice Checks if the account should be allowed to transfer tokens in the given market
;; @param cToken The market to verify the transfer against
;; @param src The account which sources the tokens
;; @param dst The account which receives the tokens
;; @param transferTokens The number of cTokens to transfer
;; @return 0 if the transfer is allowed, otherwise a semi-opaque error code (See ErrorReporter.sol)
(define-public (transfer-allowed
    (stoken principal)
    (src principal)
    (dst principal)
    (transfer-tokens uint)
  )
  (begin

  )
)

;; @notice Validates transfer and reverts on rejection. May emit logs.
;; @param cToken Asset being transferred
;; @param src The account which sources the tokens
;; @param dst The account which receives the tokens
;; @param transferTokens The number of cTokens to transfer
(define-public (transfer-verify
    (stoken principal)
    (src principal)
    (dst principal)
    (transfer-tokens uint)
  )
  ;; if (false) {
  ;;   max-assets = max-assets
  ;; }
  (ok true)
)

;; @notice Determine the current account liquidity wrt collateral requirements
;; @return (possible error code (semi-opaque),
;;          account liquidity in excess of collateral requirements,
;;          account shortfall below collateral requirements)
(define-read-only (get-account-liquidity (account principal))
  (ok (try! (get-hypothetical-account-liquidity-internal account none u0 u0)))
)

;; @notice Determine the current account liquidity wrt collateral requirements
;; @return (possible error code,
;;          account liquidity in excess of collateral requirements,
;;          account shortfall below collateral requirements)
(define-private (get-account-liquidity-internal (account principal))
  (ok (try! (get-hypothetical-account-liquidity-internal account none u0 u0)))
)

;; @notice Determine what the account liquidity would be if the given amounts were redeemed/borrowed
;; @param cTokenModify The market to hypothetically redeem/borrow in
;; @param account The account to determine liquidity for
;; @param redeemTokens The number of tokens to hypothetically redeem
;; @param borrowAmount The amount of underlying to hypothetically borrow
;; @dev Note that we calculate the exchangeRateStored for each collateral cToken using stored data,
;;  without calculating accumulated interest.
;; @return (possible error code,
;;          hypothetical account liquidity in excess of collateral requirements,
;;          hypothetical account shortfall below collateral requirements)
(define-private (get-hypothetical-account-liquidity-internal
    (account principal)
    (stoken-modify (optional <st-trait>))
    (redeem-tokens uint)
    (borrow-amount uint)
  )
  (let
    (
      (assets (unwrap! (map-get? account-assets account) (err ERR_INVALID_ACCOUNT)))
      (asset (try! (element-at assets u0)))
      (account-snapshot-result (unwrap! (contract-call? asset get-account-snapshot account) (err ERR_UNKNOWN)))
      (sum-collateral u0)
      (sum-borrow-plus-effects u0)
    )
    (if (not (is-eq ((get error account-snapshot-result) u0)))
      (ok { error: ERR_SNAPSHOT_ERROR, liquidity: u0, shortfall: u0 })
      (let
        (
          (oracle-price-mantissa (try! (get-underlying-price asset)))
        )
        (if (is-eq oracle-price-mantissa u0)
          (ok { error: ERR_PRICE_ERROR, liquidity: u0, shortfall: u0 })
          (let
            (
              (asset-principal (contract-of asset))
              (market (try! (get-market asset-principal)))
              (token-to-ether (try! (mul-exp3 (get collateral-factor-mantissa market) (get exchange-rate-mantissa (var-get account-snapshot-result)) (var-get oracle-price-mantissa))))
            )
            (begin
              ;; FIXME?: sum-collateral, sum-borrow-plus-effects
              (var-set sum-collateral (try! (mul-scalar-truncate-add-uint (var-get token-to-ether) (get stoken-balance (var-get account-snapshot-result)) (var-get sum-collateral))))
              (var-set sum-borrow-plus-effects (try! (mul-scalar-truncate-add-uint (var-get oracle-price-mantissa) (get borrow-balance (var-get account-snapshot-result)) (var-get sum-borrow-plus-effects))))

              (if (is-eq asset (try! stoken-modify))
                (begin
                  ;; FIXME?: sum-borrow-plus-effects
                  (var-set sum-borrow-plus-effects (try! (mul-scalar-truncate-add-uint (var-get token-to-ether) redeem-tokens (var-get sum-borrow-plus-effects))))
                  (var-set sum-borrow-plus-effects (try! (mul-scalar-truncate-add-uint (var-get oracle-price-mantissa) (get borrow-balance (var-get account-snapshot-result)) (var-get sum-borrow-plus-effects))))

                  (if (> (var-get sum-collateral) (var-get sum-borrow-plus-effects))
                    (ok { error: ERR_NO_ERROR, liquidity: (- (var-get sum-collateral) (var-get sum-borrow-plus-effects)), shortfall: u0 })
                    (ok { error: ERR_NO_ERROR, liquidity: u0, shortfall: (- (var-get sum-borrow-plus-effects) (var-get sum-collateral)) })
                  )
                )
                (if (> (var-get sum-collateral) (var-get sum-borrow-plus-effects))
                  (ok { error: ERR_NO_ERROR, liquidity: (- (var-get sum-collateral) (var-get sum-borrow-plus-effects)), shortfall: u0 })
                  (ok { error: ERR_NO_ERROR, liquidity: u0, shortfall: (- (var-get sum-borrow-plus-effects) (var-get sum-collateral)) })
                )
              )
            )
          )
        )
      )
    )
  )
)

;; @notice Calculate number of tokens of collateral asset to seize given an underlying amount
;; @dev Used in liquidation (called in cToken.liquidateBorrowFresh)
;; @param cTokenBorrowed The address of the borrowed cToken
;; @param cTokenCollateral The address of the collateral cToken
;; @param actualRepayAmount The amount of cTokenBorrowed underlying to convert into cTokenCollateral tokens
;; @return (errorCode, number of cTokenCollateral tokens to be seized in a liquidation)
(define-public (liquidate-calculate-seize-tokens
    (stoken-borrowed <st-trait>)
    (stoken-collateral <st-trait>)
    (actual-repay-amount uint)
  )
  (let
    (
      (price-borrowed-mantissa (try! (get-underlying-price stoken-borrowed)))
      (price-collateral-mantissa (try! (get-underlying-price stoken-collateral)))
    )
    (if (or (is-eq price-borrowed-mantissa u0) (is-eq price-collateral-mantissa u0))
      (ok { error: ERR_PRICE_ERROR, seize-tokens: u0 })
      (let
        (
          (exchange-rate-mantissa (unwrap! (contract-call? stoken-collateral exchange-rate-stored) (err ERR_UNKNOWN)))
          (numerator (try! (mul-exp (var-get liquidation-incentive-mantissa) (var-get price-borrowed-mantissa))))
          (denominator (try! (mul-exp (var-get price-collateral-mantissa) exchange-rate-mantissa)))
          (ratio (try! (div-exp numerator denominator)))
          (seize-tokens (try! (mul-scalar-truncate ratio actual-repay-amount)))
        )
        (ok { error: ERR_NO_ERROR, seize-tokens: seize-tokens })
      )
    )
  )
)

;; Admin functions
;; @notice Sets a new price oracle for the comptroller
;; @dev Admin function to set a new price oracle
;; @return uint 0=success, otherwise a failure (see ErrorReporter.sol for details)
;; FIXME: oracle data type and logic
(define-public (set-price-oracle (new-oracle uint)) (ok true))

;; @notice Sets the closeFactor used when liquidating borrows
;; @dev Admin function to set closeFactor
;; @param newCloseFactorMantissa New close factor, scaled by 1e18
;; @return uint 0=success, otherwise a failure. (See ErrorReporter for details)
(define-public (set-close-factor (new-close-factor-mantissa uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
    (let
      (
        (low-limit (var-get close-factor-min-mantissa))
        (high-limit (var-get close-factor-max-mantissa))
      )
      (if (<= new-close-factor-mantissa low-limit)
        (err ERR_INVALID_CLOSE_FACTOR)
        (if (< high-limit new-close-factor-mantissa)
          (err ERR_INVALID_CLOSE_FACTOR)
          (begin
            (var-set close-factor-mantissa new-close-factor-mantissa)
            (ok ERR_NO_ERROR)
          )
        )
      )
    )
  )
)

;; @notice Sets the collateralFactor for a market
;; @dev Admin function to set per-market collateralFactor
;; @param cToken The market to set the factor on
;; @param newCollateralFactorMantissa The new collateral factor, scaled by 1e18
;; @return uint 0=success, otherwise a failure. (See ErrorReporter for details)
(define-public (set-collateral-factor
    (stoken <st-trait>)
    (new-collateral-factor-mantissa uint)
  )
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
    (let
      (
        (market (try! (get-market stoken)))
      )
      (if (not (get is-listed market))
        (err ERR_MARKET_NOT_LISTED)
        (let
          (
            (high-limit (var-get collateral-factor-max-mantissaa))
          )
          (if (< high-limit new-collateral-factor-mantissa)
            (err ERR_INVALID_COLLATERAL_FACTOR)
            (let
              (
                (price (try! (get-underlying-price stoken)))
              )
              (if (and (not (is-eq new-collateral-factor-mantissa u0)) (is-eq price u0))
                (err ERR_PRICE_ERROR)
                (let
                  (
                    (new-market (merge market { collateral-factor-mantissa: new-collateral-factor-mantissa }))
                  )
                  (map-set markets stoken new-market)
                  (ok ERR_NO_ERROR)
                )
              )
            )
          )
        )
      )
    )
  )
)

;; @notice Sets maxAssets which controls how many markets can be entered
;; @dev Admin function to set maxAssets
;; @param newMaxAssets New max assets
;; @return uint 0=success, otherwise a failure. (See ErrorReporter for details)
(define-public (set-max-assets (new-max-assets uint))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
    (var-set max-assets new-max-assets)
    (ok ERR_NO_ERROR)
  )
)

;; @notice Sets liquidationIncentive
;; @dev Admin function to set liquidationIncentive
;; @param newLiquidationIncentiveMantissa New liquidationIncentive scaled by 1e18
;; @return uint 0=success, otherwise a failure. (See ErrorReporter for details)
(define-public (set-liquidation-incentive (new-liquidation-incentive-mantissa))
  (begin
    (asserts! (is-eq tx-sender (var-get admin)) (err ERR_UNAUTHORIZED))
    (let
      (
        (min-liquidation-incentive (var-get liquidation-incentive-min-mantissa))
        (max-liquidation-incentive (var-get liquidation-incentive-max-mantissa))
      )
      (if (< new-liquidation-incentive-mantissa min-liquidation-incentive)
        (err ERR_INVALID_LIQUIDATION_INCENTIVE)
        (if (< max-liquidation-incentive new-liquidation-incentive-mantissa)
          (err ERR_INVALID_LIQUIDATION_INCENTIVE)
          (begin
            (var-set liquidation-incentive-mantissa new-liquidation-incentive-mantissa)
            (ok ERR_NO_ERROR)
          )
        )
      )
    )
  )
)

;; Utility functions
(define-private (get-market (stoken principal))
  (begin
    (ok (unwrap! (map-get? markets stoken) (err ERR_INVALID_STOKEN)))
  )
)

(define-private (get-markets-account-membership (stoken principal) (account principal))
  (begin
    (ok (unwrap! (map-get? markets-account-membership { stoken: stoken, account: account }) (err ERR_INVALID_ACCOUNT_OR_STOKEN)))
  )
)

;; SafeMath functions
(define-private (get-exp (num uint) (denom uint))
  (let
    (
      (scaled-numerator (* num (var-get exp-scale)))
      (rational (/ scaled-numerator denom))
    )
    (ok rational)
  )
)

(define-private (mul-exp (a uint) (b uint))
  (let
    (
      (double-scaled-product (* a b))
      (double-scaled-product-with-half-scale (+ double-scaled-product (var-get half-exp-scale)))
    )
    (ok (/ double-scaled-product-with-half-scale (var-get exp-scale)))
  )
)

(define-private (mul-exp3 (a uint) (b uint) (c uint))
  (let
    (
      (ab (try! (mul-exp a b)))
    )
    (ok (try! (mul-exp ab c)))
  )
)

(define-private (div-exp (a uint) (b uint))
  (ok (try! (get-exp a b)))
)

(define-private (mul-scalar-truncate (exp uint) (scalar uint))
  (let
    (
      (product (* exp scalar))
    )
    (ok (try! (truncate product)))
  )
)

(define-private (mul-scalar-truncate-add-uint (exp uint) (scalar uint) (addend uint))
  (let
    (
      (product (* exp scalar))
    )
    (ok (+ (try! (truncate product)) addend))
  )
)

(define-private (truncate (exp uint))
  (ok (/ exp (var-get exp-scale)))
)

;; Oracle functions
(define-private (get-underlying-price (asset <st-trait>))
  (ok (* 3 (pow u10 u17)))
)