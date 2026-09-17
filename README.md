# Oakview Resident Portal

Full-stack resident portal built with **Next.js 16**, **React 19**, **PostgreSQL**, and **Drizzle ORM**.

Tenants can sign in to pay rent with **Stripe Checkout** (card or US bank debit), enable **auto-pay**, submit maintenance requests, download documents, message the office, read announcements, and update their profile.

## Stack

- Next.js App Router (React Server Components + Server Actions)
- PostgreSQL (pgAdmin or any Postgres client)
- Drizzle ORM + `drizzle-kit push` for schema
- Session auth (HTTP-only cookie + signed JWT via `jose`)
- Tailwind CSS 4

## 1. PostgreSQL (pgAdmin)

1. Open pgAdmin and create a database, e.g. `resident_portal`.
2. Note your connection details (host, port, user, password).

## 2. Environment

Copy the example file and fill in your values:

```bash
cp .env.example .env.local
```

- `DATABASE_URL` — e.g. `postgresql://postgres:YOUR_PASSWORD@localhost:5432/resident_portal`
- `SESSION_SECRET` — at least 32 random characters
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY` — [Stripe test keys](https://dashboard.stripe.com/test/apikeys)
- `NEXT_PUBLIC_APP_URL` — e.g. `http://localhost:3000` (used for Checkout return URLs)
- `STRIPE_WEBHOOK_SECRET` — from Stripe CLI or Dashboard (see below)
- `CRON_SECRET` — optional; protects `/api/cron/charge-rent` in production

## 3. Install & database

```bash
npm install
npm run db:push
npm run db:seed
```

## 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Demo tenant (after seed):**

- Email: `alex.jordan@example.com`
- Password: `resident123`

## Portal routes

| Path | Purpose |
|------|---------|
| `/portal` | Dashboard |
| `/portal/payments` | Pay rent & history |
| `/portal/maintenance` | Submit & track requests |
| `/portal/documents` | Download files |
| `/portal/messages` | Inbox & new threads |
| `/portal/announcements` | Property news |
| `/portal/profile` | Contact info & lease summary |

## Stripe (local)

1. Add test keys to `.env.local` (see `.env.example`).
2. Start the app: `npm run dev`.
3. In another terminal, forward webhooks:

   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. Copy the printed `whsec_…` into `STRIPE_WEBHOOK_SECRET` in `.env.local` and restart `npm run dev`.

**Pay rent:** `/portal/payments` → **Pay with Stripe** (Checkout). After payment, the invoice is marked paid via webhook (and a success-page sync fallback).

**Auto-pay:** **Set up auto-pay** saves a payment method on your Stripe Customer. Run daily (on or after due dates):

```bash
npm run autopay:charge
```

Or schedule `POST /api/cron/charge-rent` with header `Authorization: Bearer YOUR_CRON_SECRET`.

Test card: `4242 4242 4242 4242`, any future expiry, any CVC.

## Production notes

- **Payments:** Use live Stripe keys, HTTPS, and a Dashboard webhook pointing to `/api/stripe/webhook`.
- **Documents:** Files live in `storage/documents/` on the same machine as the app (ideal for a small deployment). Back up that folder with your database. For serverless hosting later, use Cloudflare R2 or similar.
- **Staff admin UI:** Not included yet; staff users exist for seeded message replies. A property-manager dashboard can be added on the same schema.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server |
| `npm run db:push` | Apply schema to Postgres |
| `npm run db:seed` | Load demo property, tenant, invoices |
| `npm run autopay:charge` | Charge due invoices for tenants with auto-pay enabled |
