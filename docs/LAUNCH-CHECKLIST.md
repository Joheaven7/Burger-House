# Launch checklist

## 1. Owner decisions (docs/DECISIONS.md). Do not launch with invented values.
- [ ] D-01 Currency confirmed; are menu prices tax-inclusive?
- [ ] D-02 Delivery: real fee and coverage area (or delivery switched off)
- [ ] D-03 Opening hours entered; "only accept orders during opening hours" decided
- [ ] D-04 Real address, phone, logo and brand text approved
- [ ] D-05 Confirmation message wording approved (it must not promise payment or time unless true)
- [ ] D-06 Phone country confirmed
- [ ] D-07 Add-ons, sizes and combos: confirmed not needed (or planned as a new phase)
- [ ] D-09 Minimum order decided
- [ ] D-10 How long to keep customer details decided
- [ ] D-11 Staff know the alert method (dashboard + sound) and who watches it
- [ ] D-12 Photos and fonts: licences recorded in docs/ASSETS.md
- [ ] D-13 Domain bought (recommended) or the interim proxy mode accepted in writing
- [ ] **Privacy notice**: owner or lawyer provides the text (the site collects names, phones, addresses); then a /privacy page is added and linked in the footer
- [ ] Sample data is NOT in production (no "Sample" items, real prices only)

## 2. Automated checks (on your computer)
- [ ] `backend`: `npm run typecheck`, `npm test` (36 pass), `npm run test:integration` (19 pass)
- [ ] `frontend`: `npm run lint`, `npm run typecheck`, `npm run build`
- [ ] GitHub Actions are green

## 3. Quality checks
- [ ] Lighthouse (Chrome DevTools, Mobile) on the live home page and /menu. Targets: Performance >= 80, Accessibility >= 95,
      Best Practices >= 95, SEO >= 95. Record the numbers: ______ / ______ / ______ / ______
- [ ] Largest Contentful Paint <= 2.5 s on Slow 4G with the 3D disabled (DevTools: Rendering, emulate reduced motion)
- [ ] 3D hero on a real mid-range phone: smooth scrolling; text and buttons usable immediately
- [ ] 3D failure: with reduced motion on, the flat burger shows and everything still works
- [ ] Accessibility: axe DevTools extension finds no serious issues on home, menu, cart, checkout, confirmation, admin login, orders
- [ ] Keyboard only: place a complete order, then handle it in admin without a mouse
- [ ] Screen reader quick pass (NVDA on Windows is free): checkout errors and order status changes are announced
- [ ] Browsers: Chrome, Edge, Firefox, Safari (iPhone if possible), Android Chrome. Admin sign-in works in each
- [ ] Layout at 360 px wide, tablet and desktop: no sideways scrolling

## 4. Live checks (on the deployed address, after EVERY release)
- [ ] `https://YOUR-API/api/health` is ok; the site loads quickly (not after a long wait)
- [ ] Place a real test order as Pickup, then as Delivery. Numbers look like `BH-YYMMDD-0001`
- [ ] The admin sees it within about 20 seconds (banner, badge, tab title, sound). Move it Preparing, Ready, Completed; cancel another with a reason
- [ ] Print ticket works. Pause ordering blocks checkout; un-pause restores it
- [ ] Change a price and mark an item sold out; both show on the site at once
- [ ] Sign out; `/admin` sends you to login; `/api/admin/stats` returns 401 when signed out
- [ ] Cookie flags (browser DevTools, Application, Cookies): `bh_session` is HttpOnly, Secure, SameSite=Lax
- [ ] Security headers present: `curl.exe -I https://YOUR-SITE/` shows X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security
- [ ] TRUST_PROXY measured (docs/DEPLOYMENT.md step 5)
- [ ] Six wrong passwords in a row lock the account (then sign in after 15 minutes, or reset via admin:create)
- [ ] `https://YOUR-SITE/robots.txt` and `/sitemap.xml` open; `/admin` is not in the sitemap

## 5. Operations
- [ ] A backup was made and a restore drill succeeded (docs/RUNBOOK.md)
- [ ] The restaurant's helper knows: how to pause ordering, how to mark sold out, whom to call
- [ ] Render instance is the always-on type (not the free plan that sleeps), or the owner accepts slow first loads
- [ ] Atlas Network Access is as tight as the plan allows; production database user can only write its own database
- [ ] Secrets are stored in a password manager, not in chat, Git or screenshots

Signed off by: ______________________  Date: ____________