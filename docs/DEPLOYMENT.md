# Deployment guide: Vercel (website) + Render (API) + MongoDB Atlas (database)

Dashboards change their wording over time. If a button is named slightly differently, look for the closest match.

## How the pieces fit

Browser -> Vercel (website) -> Render (API) -> MongoDB Atlas (database)

The admin login uses a cookie. Browsers only send it when the website and the API count as the SAME "site".
`something.vercel.app` and `something.onrender.com` are different sites, so there are two ways to set this up:

- **Mode A: proxy mode (no domain yet).** The browser only talks to the website's own `/api`; Vercel forwards
  those requests to Render. Use this until the restaurant has a domain.
- **Mode B: custom domain.** Website at `www.yourdomain.com`, API at `api.yourdomain.com`. The browser talks to
  the API directly. Recommended for the real launch.

## 0. Before you start
- A private GitHub repository with this project pushed. Check that no secret is committed:
  `git ls-files | Select-String "\.env"` must list ONLY `.env.example` files.
- Generate three long random values (run the command three times, keep each one safe):
  `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"`
  They are: SESSION_SECRET (production only), INTERNAL_API_KEY, and a strong database password.

## 1. MongoDB Atlas (production database)
1. Use a database name different from development, for example `burger-house-prod`
   (the sample-data script refuses names containing "prod" or "live").
2. Create a NEW database user for production with the role **readWrite on `burger-house-prod` only**.
3. Network Access: Render publishes the outbound IP addresses of its services (Render dashboard, your service,
   Connect, Outbound). Add them to Atlas. If you cannot, allow 0.0.0.0/0, which is acceptable for an MVP ONLY with
   a strong unique database password and the limited user from step 2.
4. Copy the connection string, with the database name in it:
   `mongodb+srv://PRODUSER:PASSWORD@CLUSTER.mongodb.net/burger-house-prod?retryWrites=true&w=majority`
   (URL-encode special characters in the password.)

## 2. Render (the API)
New, Web Service, connect the GitHub repository.

| Setting | Value |
|---|---|
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm install --include=dev && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |
| Region | the one closest to your Atlas cluster and customers |
| Instance type | see the warning below |

Why `--include=dev`: the TypeScript compiler is a development package, and Render may skip those in production.

**Free plan warning:** Render's free web services go to sleep after about 15 minutes without traffic and need about a
minute to wake up. The first customer or admin after a quiet spell would wait or time out. Fine for testing; for the
real restaurant use a paid instance that stays running (check Render's current plans).

Environment variables (Render, Environment):

| Name | Value |
|---|---|
| NODE_ENV | `production` |
| MONGODB_URI | the production connection string from step 1 |
| SESSION_SECRET | a NEW random value (not the one you use locally) |
| FRONTEND_ORIGIN | your website address, no trailing slash. First time use `https://example.com`, fix in step 4 |
| TRUST_PROXY | `1` for now, measured in step 5 |
| INTERNAL_API_KEY | a random value (the same goes on Vercel) |
| ALLOWED_IMAGE_HOSTS | hosts you use for menu photos, or empty |
| LOG_LEVEL | `info` |

After the first deploy, open `https://YOUR-API.onrender.com/api/health`. It should show `"status":"ok","database":"up"`.

## 3. Vercel (the website)
Add New, Project, import the repository.
- **Root Directory:** `frontend`. Framework: Next.js (automatic).
- Environment variables (Production):

| Name | Mode A (no domain) | Mode B (custom domain) |
|---|---|---|
| NEXT_PUBLIC_API_BASE_URL | `/api` | `https://api.yourdomain.com/api` |
| API_INTERNAL_URL | `https://YOUR-API.onrender.com/api` | `https://api.yourdomain.com/api` |
| INTERNAL_API_KEY | same value as on Render | same value as on Render |
| NEXT_PUBLIC_SITE_URL | `https://YOUR-SITE.vercel.app` | `https://www.yourdomain.com` |

Deploy. If the build stops with an error about `API_INTERNAL_URL`, you set `/api` without the second variable.

## 4. Connect them
1. Copy the website's PRODUCTION address from Vercel (for example `https://burger-house-abc.vercel.app`).
2. Render: set `FRONTEND_ORIGIN` to exactly that address (no trailing slash). Redeploy the API.
3. Vercel: make sure `NEXT_PUBLIC_SITE_URL` is that same address. Redeploy.
4. Admin sign-in only works on the PRODUCTION address. Vercel preview addresses have different origins and the
   security check correctly refuses them.

## 5. Check how the server sees visitors (TRUST_PROXY)
Rate limits and logs need each visitor's real IP address. Between a visitor and the API there are proxies, and
`TRUST_PROXY` must equal the number of them. Do not guess; measure:
1. Create the admin (step 6) and sign in on the live website.
2. Open `https://YOUR-SITE/api/admin/diagnostics` (Mode B: `https://api.yourdomain.com/api/admin/diagnostics`).
3. Find your real public IP (search "what is my IP" on the same device and network).
4. If `ip` is NOT your real IP, raise `TRUST_PROXY` by one on Render, redeploy, and reload the page.
5. Use the LOWEST value where `ip` equals your real IP. (A value that is too high lets someone forge their IP.)
6. If the value stays wrong for every number, tell your developer; do not leave it at a guess.

## 6. Create the production admin and enter real data
Run on YOUR computer, never commit these values. The database address and password are typed hidden:

```powershell
Set-Location backend
$uri = Read-Host "Production MongoDB URI" -AsSecureString
$env:MONGODB_URI = [System.Net.NetworkCredential]::new("", $uri).Password
$env:ADMIN_BOOTSTRAP_EMAIL = Read-Host "Admin email"
$pw = Read-Host "Admin password (12+ characters)" -AsSecureString
$env:ADMIN_BOOTSTRAP_PASSWORD = [System.Net.NetworkCredential]::new("", $pw).Password
npm run admin:create
Remove-Item Env:MONGODB_URI, Env:ADMIN_BOOTSTRAP_EMAIL, Env:ADMIN_BOOTSTRAP_PASSWORD
```

NEVER run `npm run seed:dev` against production. Instead sign in and fill in, in this order:
Settings (name, phone, address, hours, currency, delivery fee, pause off), then Menu, Categories, then Items.
Ask the owner for the real values; do not invent them (see docs/LAUNCH-CHECKLIST.md).

## 7. Go-live test
Follow docs/LAUNCH-CHECKLIST.md completely on the live address before telling customers.

## 8. Switching to a custom domain (Mode B)
1. Buy a domain. In Vercel, Settings, Domains: add `www.yourdomain.com` (and redirect the bare domain to it).
2. In Render, Settings, Custom Domains: add `api.yourdomain.com` and create the DNS record they show you.
3. Vercel variables: `NEXT_PUBLIC_API_BASE_URL` = `https://api.yourdomain.com/api`, `API_INTERNAL_URL` = the same,
   `NEXT_PUBLIC_SITE_URL` = `https://www.yourdomain.com`. Redeploy.
4. Render: `FRONTEND_ORIGIN` = `https://www.yourdomain.com`. Redeploy.
5. Repeat step 5 (TRUST_PROXY), because the number of proxies changes (Vercel is no longer in the middle).
6. Sign out and in again, then repeat the live checks.
`api.yourdomain.com` and `www.yourdomain.com` count as the same site, so the login cookie works.

## 9. Rolling back a bad release
- Website: Vercel, Deployments, pick the last good one, Promote to Production (instant).
- API: Render, your service, Events or Deploys, roll back to the previous deploy.
- There are no database migrations, so rolling back the code never needs a database rollback.
- A bad data change (for example a wrong price) is fixed in the admin screens.

## Known limitations
- Mode A: someone who finds the Render address and calls it directly can forge their IP and weaken the per-IP rate
  limits. The per-phone limit, the account lockout, idempotency and validation still apply. A custom domain (Mode B)
  removes the proxy in the middle, which is one more reason to buy one.
- No strict Content-Security-Policy yet (the other security headers are set).
- Atlas free clusters may not include automatic backups: use `npm run backup` (docs/RUNBOOK.md).