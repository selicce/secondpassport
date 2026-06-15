# JR & Firm — Client Portal

A premium, secure client portal for **JR & Firm**, a boutique corporate consultancy
(company formation, corporate structuring, banking coordination, immigration-related
business support, tax/accounting coordination, and cross-border market entry across
Hong Kong, Mainland China and other jurisdictions).

Built as a production-oriented foundation — not a toy demo. It runs **immediately**
in a self-contained demo mode and is structured to flip to a real Supabase backend
for production.

---

## Quick start

```bash
cd jr-firm-portal
npm install
cp .env.example .env.local      # demo mode is on by default
npm run dev                     # http://localhost:3000
```

The portal opens in **demo mode** (`NEXT_PUBLIC_DEMO_MODE=true`): rich in-memory
fixtures, no external services required, and a **role switcher** in the top bar so
you can move between a client and every staff role.

### Demo accounts (one-click on the sign-in page)

| Account | Role | Sees |
| --- | --- | --- |
| Mei Lin Chow | Client | Client portal (companies, cases, documents, invoices, messages) |
| Rachel Ng | Super Admin | Everything, incl. users / audit / settings |
| Jonathan Reyes | Administrator | Clients, cases, documents, invoices, services |
| Priya Anand | Case Manager | Assigned cases, documents review, tickets |
| Marco Bianchi | Finance | Invoices, payments, reconciliation |

---

## Local development with a real Supabase (Docker)

To run the app against a **real** Supabase stack locally (instead of demo
fixtures) — one command, provided [Docker](https://www.docker.com/products/docker-desktop/)
is installed and running:

```bash
npm install
npm run dev:local
```

`npm run dev:local` ([scripts/dev-local.mjs](scripts/dev-local.mjs)):

1. checks Docker is running,
2. runs `supabase start` — boots Postgres, Auth, Storage and Studio and applies
   `supabase/migrations/*` + `supabase/seed.sql` (per [supabase/config.toml](supabase/config.toml)),
3. writes the local URL + anon/service keys into `.env.local` (with
   `NEXT_PUBLIC_DEMO_MODE=false`), merging rather than clobbering your secrets,
4. starts `next dev --webpack`.

Handy URLs once it's up: **Studio** http://localhost:54323 (table + SQL editor),
**Inbucket** http://localhost:54324 (catches auth/confirmation emails locally).
Email sending stays on `console` so nothing leaves your machine.

Supporting scripts: `npm run db:stop` (stop the stack), `npm run db:reset`
(wipe + re-apply migrations and seed), `npm run db:status`.

> Tip: email confirmations are disabled in `config.toml` for local convenience,
> so a sign-up at `/register` can log in immediately. Turn them on for production.

---

## Tech stack

- **Next.js 16** (App Router, Server Components, Server Actions) + **React 19**
- **TypeScript** (strict)
- **Tailwind CSS** with a custom private-banking design system (`src/app/globals.css`)
- **Supabase** (Postgres + Auth + private Storage) for production — see `supabase/`
- **Stripe** payments, **Resend/SendGrid/Postmark** email — integration boundaries
  with clear wiring points (`src/lib/payments`, `src/lib/email`)
- **lucide-react** icons, **class-variance-authority** for component variants

---

## Going to production (Supabase)

The Supabase backend is **wired**, not stubbed. Flipping `NEXT_PUBLIC_DEMO_MODE`
to `false` switches the whole app from in-memory fixtures to live Supabase —
auth, reads (RLS-enforced), writes, and private document storage.

1. Create a Supabase project. Apply both migrations and the optional seed:
   ```bash
   supabase db push      # 0001_init.sql (schema + RLS), 0002_auth_storage.sql
   #                       (profile trigger, updated_at trigger, private bucket)
   # then run supabase/seed.sql in the SQL editor for starter catalogue data
   ```
   The private `client-documents` bucket is created by migration `0002`.
2. Fill `.env.local`:
   ```
   NEXT_PUBLIC_DEMO_MODE=false
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...        # server-only, privileged writes + signed URLs
   NEXT_PUBLIC_APP_URL=https://portal.jrandfirm.com
   STRIPE_SECRET_KEY=...  STRIPE_WEBHOOK_SECRET=...   # for live card payments
   RESEND_API_KEY=...                                  # for live emails
   ```
3. `npm run build && npm start`.

### What's wired

| Area | File(s) | Status |
| --- | --- | --- |
| Auth (sign in/up/out, reset) | `app/actions/auth.ts`, `lib/session.ts` | Live — Supabase Auth |
| Reads (RLS-scoped) | `lib/data/supabase.ts` + `mappers.ts` | Live — selected when demo off |
| Writes (review, status, tickets, payments, orders, intake) | `lib/data/mutations.ts` → `app/actions/portal.ts` | Live — service role + RBAC + audit |
| Document storage | `lib/data/mutations.ts` | Live — private bucket + signed URLs |
| Session refresh | `src/proxy.ts` | Live — refreshes the auth cookie |
| New-user provisioning | `supabase/migrations/0002` | Live — `handle_new_user` trigger |
| Stripe Checkout + webhook | `lib/payments/stripe.ts`, `app/api/webhooks/stripe/route.ts` | Live — Checkout session + signature-verified webhook → `applyStripePayment` (idempotent: payment row, invoice paid, audit, notify, email) |
| Email | `lib/email/mailer.ts` | Live — Resend / SendGrid / Postmark via their REST APIs (set `EMAIL_PROVIDER` + key) |

The data layer is a runtime switch (`lib/data/index.ts`): demo and Supabase both
implement the same `DataRepo` interface (`lib/data/repo.ts`), so no page changed.

### Remaining to finish before live use
- Add real keys: **Stripe** (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) and register the webhook endpoint
  (`/api/webhooks/stripe`) in the Stripe dashboard; **email** (`EMAIL_PROVIDER`
  + the matching key, and verify your sending domain with the provider).
- Decide upload semantics for *requested* documents (insert-new vs update-in-place).
- End-to-end test against a real Supabase project (couldn't be done in the build
  environment — no Docker/CLI for a local instance).

### Verified in this environment
- `tsc` + `npm run build` clean (0 warnings). Demo runtime: all pages + RBAC.
- Stripe webhook **demo** path → `200 {received,demo:true}`; **prod** path (with
  `DEMO_MODE=false` + dummy keys) rejects a missing/forged signature with `400`
  via Stripe's real `constructEvent`, confirming verification executes.

---

## Project structure

```
src/
  app/
    (auth)/              sign-in, register, forgot-password  (split-screen shell)
    (client)/            dashboard, companies, cases, documents, invoices,
                         messages, services, intake, profile, onboarding
    (admin)/             admin dashboard + clients, companies, cases, documents,
                         invoices, payments, tickets, services, users, audit, settings
    actions/             server actions (session, auth, orders, portal)
    api/webhooks/stripe/ payment webhook stub
  components/
    ui/                  primitives (button, card, badge, table, field, misc)
    layout/              app shell, sidebar/topbar chrome, nav config
    forms/               upload, download, pay, ticket reply, doc review, …
  lib/
    rbac.ts              roles + permission matrix + can()
    types.ts             domain types (mirror the SQL schema)
    labels.ts            status → label + badge tone maps
    data/                repo.ts (interface) · demo.ts · supabase.ts · airtable.ts
                         · mappers.ts · mutations.ts (writes) · index.ts (provider switch)
    i18n/                locales + en/zh/ru/uz dictionaries
    supabase/            server/browser clients
    payments/ email/ audit/ session.ts is-demo.ts utils.ts
supabase/
  config.toml                local Supabase CLI config (ports, auth, buckets)
  migrations/0001_init.sql   schema + RLS
  migrations/0002_auth_storage.sql   profile trigger, updated_at, private bucket
  seed.sql
scripts/
  dev-local.mjs              one-command local Supabase + next dev
```

See **[ARCHITECTURE.md](ARCHITECTURE.md)** for the full design: route map, data model,
RBAC matrix, security model, and module workflows.

---

## Languages

English (default), 中文, Русский, O‘zbekcha — switch via the globe menu. UI chrome is
translated through `src/lib/i18n/dictionaries.ts`; page strings can be migrated in
incrementally.

---

## Security highlights

- Role-based access control (5 roles) enforced in the app **and** mirrored by
  Postgres Row-Level Security (client-level data isolation).
- Private document storage — only short-lived signed URLs, never public links.
- Audit logging for sensitive actions; soft-delete on key records.
- Permission checks on every protected route (route-group layouts + `can()`).
- Compliance disclaimers surfaced in every sensitive flow (banking, government,
  no-advice, accuracy, data consent).

> This is a foundation intended for real use. Before handling live client data,
> complete the production wiring above and conduct a security review.

### Dependency status

- On **Next.js 16** + **React 19** (upgraded from 14/18). The dynamic APIs were
  migrated to their async forms — `await cookies()` and `params`/`searchParams`
  as Promises — across `lib/session.ts`, the server actions, and all dynamic
  routes. `npm audit --omit=dev` is clean. `tsc` and the production build both
  pass; all routes were runtime-smoke-tested (rendering + RBAC redirects).

### Build engine — webpack, not Turbopack

`npm run dev` and `npm run build` pass `--webpack` on purpose. Next 16 defaults
to **Turbopack**, but its native binary crashes with an illegal-instruction fault
(`0xC000001D`) on CPUs lacking the newer instruction set it requires — which is
the case on the current build machine. The webpack path produces identical output
and is fully supported. On hardware with Turbopack support you can drop the flag
(or run `npm run build:turbo`) for faster builds.
