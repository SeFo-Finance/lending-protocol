(impl-trait .sip-010-ft-trait.ft-trait)

(define-fungible-token xbtc)

;; get the token balance of owner
(define-read-only (get-balances (owner principal))
  (ok (ft-get-balance xbtc owner))
)

;; returns the total number of tokens
(define-read-only (get-total-supply)
  (ok (ft-get-supply xbtc))
)

;; returns the token name
(define-read-only (get-name)
  (ok "xBTC")
)

;; the symbol or "ticker" for this token
(define-read-only (get-symbol)
  (ok "xBTC")
)

;; the number of decimals used
(define-read-only (get-decimals)
  (ok u8)
)

;; Transfers tokens to a recipient
(define-public (transfer
    (amount uint)
    (sender principal)
    (recipient principal)
    (memo (optional (buff 34)))
  )
  (if (is-eq tx-sender sender)
    (begin
      (try! (ft-transfer? xbtc amount sender recipient))
      (ok true)
    )
    (err u4)
  )
)

(define-public (get-token-uri)
  (ok (some u"https://example.com"))
)

(define-public (mint (amount uint))
  (begin 
    (try! (ft-mint? xbtc amount tx-sender)) 
    (ok true)
  )
)

;; Mint this token to a few people when deployed
(ft-mint? xbtc u100000000000000 tx-sender)
