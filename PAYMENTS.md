# Reservation and order payments

Online food orders require a 50% GCash deposit, rounded up to the nearest cent. Delivery deposits include the delivery fee. The rest is due at the cafe or on delivery. Table-only reservations require the configured reservation fee in full.

Set these Create React App environment variables before building:

- `REACT_APP_RESERVATION_FEE`: table-only fee in pesos, defaulting to 100. An explicit invalid or non-positive value blocks table-only submission.
- `REACT_APP_CAFE_GCASH_NUMBER`: the cafe's receiving account.
- `REACT_APP_CAFE_GCASH_QR_IMAGE`: the cafe's actual QR image URL or public path.

The default GCash number and QR image are placeholders. There is no payment gateway integration: submitting a reference records a payment claim awaiting verification. Staff must check the receiving account for the correct reference and amount, open order details, and choose **Verify Deposit** before accepting the request. The balance is the amount due after the verified payment; collecting the balance is manual.

Firebase security rules are not included in this repository. Before taking live payments, the deployed rules must restrict payment verification and order acceptance to staff, prevent customers from editing payment amounts or verified status, and validate prices and totals against trusted data. Client-side checks alone are not a security boundary.

Existing orders keep their original payment terms. This change does not introduce a cancellation penalty or refund policy.
