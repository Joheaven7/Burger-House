# Burger House

**Crafted to Crave.** Premium 3D restaurant website with online ordering and an admin dashboard.

A luxury-branded digital restaurant experience built with Next.js 16, Express 5, MongoDB Atlas, and an interactive 3D burger presentation. Customers browse a cinematic menu, place orders, and track status. Administrators manage orders, menu items, and restaurant settings through a dedicated dashboard.

## Features

### Public Storefront
- **Editorial homepage** — cinematic hero with 3D burger, craft story, featured items, and CTA
- **Digital menu** — category navigation, product cards with availability badges, hover interactions
- **Product detail** — two-column layout with imagery, description, and add-to-cart
- **Cart & checkout** — two-column responsive layout, sticky order summary, custom radio cards for order type
- **Order confirmation** — luxury ticket receipt with 4-step visual progress stepper
- **3D experience** — interactive burger built with React Three Fiber, warm golden lighting, mobile-optimized

### Admin Dashboard
- **Overview** — 5-column KPI grid, ordering toggle, live recent orders stream
- **Order management** — search, filter, status transitions with conflict detection
- **Menu management** — items and categories CRUD, image URL validation
- **Settings** — restaurant info, ordering config, opening hours, pricing
- **Real-time alerts** — polling with sound notification for new orders

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 |
| 3D | React Three Fiber, Three.js |
| Backend | Node.js, Express 5, TypeScript, Zod |
| Database | MongoDB + Mongoose (Atlas recommended) |
| Auth | Server-side sessions (scrypt-hashed tokens, HttpOnly cookies) |

## Design System

| Token | Value | Purpose |
|---|---|---|
| Charcoal | `#171717` | Premium dark backgrounds |
| Warm Cream | `#F4EFE6` | Content sections |
| Burnt Orange | `#B85C32` | Primary actions, CTAs |
| Copper Gold | `#C49A62` | Accents, highlights, badges |
| Dark Surface | `#24201E` | Elevated dark cards |

**Typography:** Playfair Display (editorial headings), Oswald (display/uppercase), Inter (body/UI)

## Run Locally

Run each server in its own terminal from the repository root, and leave both running.

```powershell
# backend API (http://localhost:5000)
Set-Location backend
npm install
npm run dev
```

```powershell
# frontend (http://localhost:3000)
Set-Location frontend
npm install
npm run dev
```

> [!NOTE]
> The frontend fetches data from the backend during rendering. Start the backend first.
> On first run, seed sample data: `Set-Location backend; npm run seed:dev`

## Verification

Run before finishing any change:

```powershell
# Frontend
Set-Location frontend
npm run lint        # ESLint — expect 0 errors
npm run typecheck   # TypeScript — expect clean

# Backend
Set-Location backend
npm test            # Unit tests — expect 36/36 pass
npm run typecheck   # TypeScript (scripts have a known pre-existing issue)
```

## Project Structure

```
burger-house/
├── backend/
│   ├── src/
│   │   ├── config/        # Database, environment
│   │   ├── middleware/     # Auth, CSRF, rate-limit, validation
│   │   ├── models/         # Mongoose schemas
│   │   ├── routes/         # Express route handlers
│   │   ├── services/       # Business logic (pricing, orders)
│   │   └── tests/          # Unit tests (36 tests)
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── (public)/       # Storefront pages (home, menu, cart, order)
│   │   └── admin/          # Admin pages (login, dashboard, orders, menu, settings)
│   ├── components/
│   │   ├── 3d/             # Three.js burger scene
│   │   ├── admin/          # Admin dashboard components
│   │   ├── cart/            # Cart and quantity controls
│   │   ├── checkout/        # Checkout form and confirmation
│   │   ├── home/            # Homepage sections
│   │   ├── layout/          # Navbar, Footer
│   │   ├── menu/            # Product cards, category tabs
│   │   └── ui/              # Design system primitives
│   ├── features/            # Client-side state (cart, auth, live data)
│   ├── messages/            # All UI text (en.ts, admin.ts)
│   ├── services/            # API client functions
│   └── package.json
└── docs/
    ├── ASSETS.md            # Font and asset licences
    ├── CONVENTIONS.md       # Coding standards
    ├── DECISIONS.md         # Business and technical decisions
    ├── DEPLOYMENT.md        # Vercel + Render + Atlas setup
    ├── LAUNCH-CHECKLIST.md  # Pre-launch verification
    └── RUNBOOK.md           # Operations guide
```

## Documentation

| Document | Purpose |
|---|---|
| [CONVENTIONS.md](docs/CONVENTIONS.md) | Coding standards, design system rules |
| [DECISIONS.md](docs/DECISIONS.md) | Business and technical decisions log |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production setup (Vercel + Render + Atlas) |
| [LAUNCH-CHECKLIST.md](docs/LAUNCH-CHECKLIST.md) | Pre-launch quality gates |
| [RUNBOOK.md](docs/RUNBOOK.md) | Operations: backups, troubleshooting |
| [ASSETS.md](docs/ASSETS.md) | Font and asset licences |