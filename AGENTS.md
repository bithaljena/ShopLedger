# Stack

- Node.js CommonJS app using Express 4 and body-parser.
- Browser UI is static HTML, CSS, and JavaScript under `public/`.
- App records are stored as JSON in `data/db.json` by `lib/store.js`.

# Module map

- `routes/customers.js` — lists customers and settlements; records khata settlements.
- `routes/orders.js` — lists, gets, creates, and cancels orders.
- `routes/products.js` — lists/searches products and lists active coupons.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, admin export.
- `lib/coupons.js` — normalizes, validates, calculates, and lists configured coupons.
- `lib/dates.js` — formats today's date and normalizes dates / fiscal years.
- `lib/inventory.js` — finds products, checks/reserves/releases stock, summarizes inventory.
- `lib/invoice.js` — computes invoice figures and renders printable invoice HTML.
- `lib/ledger.js` — customer balances, khata order charges/reversals, settlements.
- `lib/orders.js` — adds, gets, lists, and cancels orders.
- `lib/pricing.js` — calculates subtotal, discounts, GST, and order totals.
- `lib/reports.js` — dashboard summary and invoice-to-ledger GST reconciliation.
- `lib/store.js` — reads/writes `data/db.json` and appends audit entries.
- `lib/tax.js` — resolves GST rates and splits GST into CGST and SGST.

# Commands

- Start the app: `npm start` (runs `node server.js`).
- Run tests: `node --test`.

# Rules

1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

# Current ticket

Invoice total and GST breakdown do not match what the customer was billed.
Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
