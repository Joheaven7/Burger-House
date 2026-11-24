# Runbook: looking after Burger House

## Routine
**Every service day:** open Admin, Overview. Switch Sound alerts on. Watch for the yellow "New order" banner.
**Weekly:** make a backup (below) and keep it somewhere private.
**Monthly:**
- Do a restore drill (below), because a backup you have never restored is only a hope.
- In each of `backend` and `frontend` run `npm audit` and fix serious findings.
- Skim the Render logs for repeated errors. Check Atlas storage.

## Run a script against PRODUCTION (backup, retention, admin)
The production address is typed hidden and exists only for that one command:

```powershell
Set-Location backend
$uri = Read-Host "Production MongoDB URI" -AsSecureString
$env:MONGODB_URI = [System.Net.NetworkCredential]::new("", $uri).Password
# ... run the npm command here ...
Remove-Item Env:MONGODB_URI
```

## Backup
Run the block above with `npm run backup`. It creates `backend\backups\<date>\`.
The files contain customers' names, phones and addresses: keep them private, encrypted if possible, never in Git.
They do NOT contain admin passwords.

## Restore drill (safe, never touches live data)
1. In Atlas make an EMPTY test database name, for example `burger-house-restore-test` (a database appears when written to).
2. Use a connection string ending in `/burger-house-restore-test`, and run
   `npm run restore -- backups\<the backup folder>`.
3. It prints a table; every count must match. Then delete the test database in Atlas.
It refuses to restore into a database that already has data.

## Real disaster recovery
Create a new empty database and user, run the restore into it, point Render's `MONGODB_URI` at it, redeploy, and
run `npm run admin:create` (admin accounts are not in backups).

## Admin accounts
- **Forgot password / add an admin:** run `npm run admin:create` (see docs/DEPLOYMENT.md step 6). The same email
  resets the password and signs that admin out everywhere.
- There is one admin role. Anyone with an account can do everything.

## Secrets
- **Rotate SESSION_SECRET** (Render): everyone is signed out. Do it if you suspect a leak.
- **Rotate INTERNAL_API_KEY:** change it on Render AND Vercel, then redeploy both.
- **Database password:** change in Atlas, update `MONGODB_URI` on Render, redeploy.

## Customer data retention (decision D-10)
When the owner chooses how long to keep customer details (for example 365 days), run the production block with:
`npm run retention -- --days 365` (preview), then `npm run retention -- --days 365 --apply`.
It removes names, phones, addresses and notes from old orders and keeps totals and items.
For one customer's deletion request, use Atlas, Browse Collections, `orders`, find the order number and clear those fields.

## When something goes wrong
- **Site shows "Something went wrong":** open `https://YOUR-API/api/health`. If it is down, check the Render logs. On the free plan it may simply be waking up.
- **Admin says it cannot reach the server:** same check; also confirm `FRONTEND_ORIGIN` on Render exactly equals the website address.
- **Orders look wrong (price, sold out):** change it in Admin, Menu. New orders use it immediately.
- **Prank or spam orders:** switch Pause ordering on (Overview), cancel the orders with a reason, and call real customers back.
- **Quote the Request ID:** every error shown to a customer carries one, and the Render logs (JSON lines) contain the same `requestId`. Logs never contain phone numbers or addresses.

## Updating the software
Push to GitHub. CI must be green (the Actions tab). Vercel and Render redeploy automatically. After each release run the short live check in docs/LAUNCH-CHECKLIST.md (section 4).