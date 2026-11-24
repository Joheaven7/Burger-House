# Decisions

## Confirmed technology
- Frontend: Next.js (App Router), TypeScript, Tailwind CSS
- Backend: Node.js, Express, TypeScript, Zod
- Database: MongoDB + Mongoose on a replica set (Atlas recommended)
- Money: integer minor units; currency comes from settings
- Local dev OS: Windows PowerShell

## Open business decisions (not invented; temporary defaults only)
| ID | Question | Temporary default | Needed by |
|----|----------|-------------------|-----------|
| D-01 | Currency, and are prices tax-inclusive? | TEMPORARY: ETB set in services/settings.ts until the owner confirms; no tax calculation | Phase 3 |code is a setting (ETB is likely; confirm) | Phase 3 |

| D-02 | Delivery fee and coverage area | TEMPORARY: delivery ON with a placeholder fee in services/settings.ts, for testing only. Real fee and area must come from the owner. | Phase 4 |
| D-05 | What "order received" promises customers | "The restaurant has received your order request." plus a configurable estimate line. No payment claim. | Phase 4 |
| D-06 | Phone number country/format | TEMPORARY: default country ET (Ethiopia); numbers are validated and stored as E.164 | Phase 4 |
| D-09 | Minimum order value | Off (null) in settings; works when a value is set | Phase 4 |


## Admin UI decisions made in Phase 6
- The admin dashboard is English only. Public text is in messages/en.ts; admin text is in messages/admin.ts.
- New-order alerts use polling every 20 seconds plus an optional beep that staff switch on each visit (browsers require a click). No email/SMS/Telegram yet (D-11 default).
- Cancelling an order does NOT message the customer; staff call them.
- Menu photos are an image address (https, from hosts listed in ALLOWED_IMAGE_HOSTS). There is no upload feature yet.
- Revenue on the dashboard = orders created today (restaurant timezone) that are not cancelled.

## Technical decisions made in Phase 5
- Passwords use Node's built-in scrypt (no native packages to build on Windows). Spec SEC-01 named Argon2id or bcrypt; this is a deliberate deviation.
- Admin sessions are server-side in MongoDB (hashed token, 2h idle / 12h absolute), HttpOnly SameSite=Lax cookie.
- Business values (currency, delivery fee, hours, contact) now live in the database settings. The dev seed script sets SAMPLE values only.
- Admin routes are under /api/admin/*; customers' order lookup does not exist (the confirmation page is the only view).
- Order creation is idempotent (24h) and limited to 3 orders per phone number per hour.

| D-02 | Delivery fee and coverage area | Delivery disabled until configured | Phase 4 |
| D-03 | Opening hours; accept orders when closed? | Hours are a setting; closed means rejected | Phase 4 |
| D-04 | Real address, phone, logo, social links | Hidden when empty | Phase 1 |
| D-05 | What "order received" promises customers | "The restaurant received your request" | Phase 4 |
| D-06 | Phone number country/format | Validated with a configurable default country | Phase 4 |
| D-07 | Add-ons / sizes / combos | Excluded; order note only | Phase 3 |
| D-08 | Languages | One language, strings kept in messages/ | Phase 1 |
| D-09 | Minimum order value | Off | Phase 4 |
| D-10 | How long to keep customer phone/address data | Not decided | Phase 7 |
| D-11 | How staff are alerted to new orders | Dashboard auto-refresh + sound | Phase 6 |
| D-12 | 3D burger model source and licence | Simple self-made model | Phase 2 |
| D-13 | Domains / hosting | Frontend and API on the same parent domain | Phase 7 |


## Production decisions made in Phase 7
- Hosting: website on Vercel, API on Render, database on MongoDB Atlas.
- No custom domain yet: "proxy mode" (the website forwards /api to the API) keeps the admin login cookie first-party. Buy a domain before public launch and switch to api.<domain> + www.<domain> (docs/DEPLOYMENT.md, section 8).
- TRUST_PROXY is set by measuring with /api/admin/diagnostics, never by guessing.
- Page loads made by the website's own server use a shared secret (INTERNAL_API_KEY) so they do not share the visitors' rate limit.
- Every API response is Cache-Control: no-store.
- Automated browser tests (Playwright) are deferred; the manual checklist in docs/LAUNCH-CHECKLIST.md is the launch gate.
- A strict Content-Security-Policy is deferred (needs a per-request nonce setup in Next.js).
- A privacy notice page is blocked on owner/legal text.