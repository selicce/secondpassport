# Merge / Integration Guide — for the backend partner

This is the **JR & Firm Client Portal** frontend: a complete Next.js 16 + React 19
application (client portal + staff admin) with a **swappable data layer**. It was
built so a backend can drop in without rewriting any pages.

You (the backend partner) only need to touch a handful of files. This guide tells
you exactly which ones and how the two projects fit together.

---

## 1. The one integration point: `DataRepo`

Every page reads data through a single interface — it never talks to a database
directly:

- **`src/lib/data/repo.ts`** — the `DataRepo` interface (all read methods the UI
  needs: clients, companies, cases, documents, invoices, payments, tickets,
  notifications, audit).
- **`src/lib/data/index.ts`** — picks an implementation at runtime and re-exports it.
- Three implementations already exist and all satisfy `DataRepo`:
  - `src/lib/data/demo.ts` — in-memory fixtures (no backend; the default).
  - `src/lib/data/supabase.ts` — Supabase/Postgres queries.
  - **`src/lib/data/airtable.ts` — Airtable REST API (this is your path — see §1a).**

The provider is chosen by env in `src/lib/data/index.ts`:

```ts
// NEXT_PUBLIC_DATA_PROVIDER = "demo" | "supabase" | "airtable"
const repo: DataRepo =
  provider === "airtable" ? airtableRepo : provider === "supabase" ? supabaseRepo : demoRepo;
```

The domain shapes you must return are in **`src/lib/types.ts`** (camelCase).

---

## 1a. Airtable — the concrete path (your base)

A working Airtable provider is already written: **`src/lib/data/airtable.ts`**.
It reads every record type the portal needs over the Airtable REST API. You only
need to point it at your base and align field names.

**Turn it on:**

```bash
# .env.local
NEXT_PUBLIC_DATA_PROVIDER="airtable"
AIRTABLE_PAT="pat_..."        # Personal Access Token, scope data.records:read, granted to the base
AIRTABLE_BASE_ID="app..."     # your base id
# Keep NEXT_PUBLIC_DEMO_MODE="true" for now → reads come from Airtable, writes
# stay simulated until the write path is wired (see §2). Flip to "false" later.
```

**Then adapt `src/lib/data/airtable.ts` to your base (top of the file):**
1. `TABLES` — rename to your table names.
2. `CLIENT_FIELD` — the field that links a row to its client (used for isolation).
3. In each `map*()` function, change the `f["Field Name"]` strings to your column names.

**Expected fields per table** (rename in the mappers, or name your columns to match):

| Table | Key fields the mappers read |
| --- | --- |
| Users | Full Name, Email, Role, Client (link), Preferred Language, Phone, Avatar Color |
| Clients | Display Name, Primary Contact, Email, Status, Risk Rating, Preferred Language |
| Companies | Name, Client (link), Jurisdiction, Company Number, Incorporation Date, Registered Address, Renewal Date, Accounting Status, Bank Account Status, Status, **People (JSON)** |
| Services | Title, Category, Short Description, Description, Starting Price, Currency, Estimated Timeline, Active, **Required Documents (JSON)**, **Disclaimers (JSON)** |
| Cases | Reference, Client (link), Company (link), Service (link), Service Title, Category, Status, Priority, Assigned Manager (link), Start Date, Estimated Completion, Progress Percent, Client-Facing Note, **Timeline (JSON)**, **Internal Notes (JSON)** |
| Documents | Title, Client (link), Case (link), Category, Status, Direction, File Name, Reviewer Comment, Uploaded At, Requested At |
| Invoices | Number, Client (link), Company/Case (link), Service Title, Amount, Amount Paid, Currency, Due Date, Status, **Line Items (JSON)** |
| Payments | Invoice (link), Client (link), Method, Amount, Currency, Status, Reference |
| Tickets | Reference, Client (link), Subject, Category, Status, Priority, Assigned Staff (link), Updated At |
| Ticket Messages | Ticket (link), Author (link), Body, Internal, **Author Name / Author Role (lookups)** |
| Notifications | User (link), Kind, Title, Body, Href, Read |
| Audit Logs | Actor (link), Actor Name, Actor Role, Action, Target, Detail, IP |

Fields marked **(JSON)** hold a nested structure (company officers, invoice line
items, case timeline) as JSON text — Airtable cells can't model them natively.
Store JSON in a long-text field, or replace the `json()` calls with your own
assembly from linked tables.

**Airtable realities baked in / to respect:**
- **No row-level security.** Isolation is enforced *in `airtable.ts`* by filtering
  every client-owned query on `CLIENT_FIELD`. Don't remove those filters.
- **Rate limit** ~5 req/sec per base (the provider retries once on HTTP 429).
- **Records have ids** like `recXXXXXXXX`; all the portal's `id`s become Airtable
  record ids — linked fields resolve naturally.
- **Documents:** do **not** use Airtable attachments for passports/bank forms
  (their URLs are public). Keep files in private storage (§2).

---

## 2. Writes, auth, storage (the other seams)

These are already implemented against Supabase; adapt them to your backend if it
owns these responsibilities.

| Concern | File(s) | What to change |
| --- | --- | --- |
| **Writes** (doc review, case status, tickets, payments, orders, intake) | `src/lib/data/mutations.ts` → `src/app/actions/portal.ts` | Re-point the mutation bodies at your backend. The server actions and UI stay the same. |
| **Auth** (login/session) | `src/lib/session.ts`, `src/app/actions/auth.ts` | `getCurrentUser()` must return the signed-in user as a `UserProfile`. Swap Supabase Auth for whatever you use. |
| **Documents** (upload / signed download) | `src/lib/data/mutations.ts` (`uploadDocument`, `createSignedDownloadUrl`) | Keep files in **private** storage; return short-lived signed URLs. **Do not** expose public file URLs (passports/bank docs). |
| **Payments** | `src/lib/payments/stripe.ts`, `src/app/api/webhooks/stripe/route.ts` | Already complete for Stripe; leave as-is or adapt. |
| **Email** | `src/lib/email/mailer.ts` | Resend/SendGrid/Postmark over REST; pick one via `EMAIL_PROVIDER`. |
| **Audit log** | `src/lib/audit.ts` | `recordAudit()` should persist to your store. |

> Important: the frontend assumes **per-client data isolation** is enforced by the
> backend (Postgres RLS does this today — see `supabase/migrations/0001_init.sql`).
> If your backend has no row-level security, you MUST filter every query by the
> caller's `clientId` server-side. One missed filter leaks one client's passports
> to another.

**For the Airtable setup specifically:** Airtable can't do client login or private
files, so the recommended shape is a **hybrid** — Airtable holds the records
(reads via `airtable.ts`), while **auth stays on Supabase Auth (or Clerk/Auth0)**
and **documents stay in private storage (Supabase Storage / S3, signed URLs)**.
For writes you have two options: (a) keep them simulated for now via
`NEXT_PUBLIC_DEMO_MODE="true"` while reading real data from Airtable, or (b) add
an Airtable write path — Airtable supports `POST/PATCH /v0/{base}/{table}` with a
`data.records:write` token; mirror the structure in `airtable.ts` and call it
from `src/lib/data/mutations.ts`.

---

## 3. Two ways to physically merge the repos

**Option A — Frontend calls your backend as a service (recommended).**
Keep the two repos separate. Your backend exposes an API; the new
`src/lib/data/<yourbackend>.ts` calls it. Cleanest separation; deploy
independently. Set the backend base URL via an env var.

**Option B — Monorepo.**
Put your backend in a subfolder of this repo (e.g. `/server` or `/backend`) and
this app in `/web` (or leave it at the root). Wire the data layer to call the
backend in-process or over localhost. Good if you want one repo / one deploy.

Either way, the contract is the same: implement `DataRepo` + the write/auth/
storage seams above.

---

## 4. Running it

```bash
npm install
cp .env.example .env.local      # demo mode is on by default — runs with NO backend
npm run dev                     # http://localhost:3000
```

- **Demo mode** (`NEXT_PUBLIC_DEMO_MODE=true`): in-memory fixtures + a top-bar
  role switcher. Use this to explore the UI before wiring anything.
- Set `NEXT_PUBLIC_DEMO_MODE=false` to use a real backend.
- All required env vars are documented in **`.env.example`**.
- Build is webpack (`npm run build`); Turbopack is disabled because it crashes on
  some CPUs (see README). `npm run build:turbo` exists for capable hardware.

Local Supabase (if you go the Supabase route): `npm run dev:local` (needs Docker)
— boots Postgres+Auth+Storage and applies `supabase/migrations/*` + `seed.sql`.

---

## 5. What's in the box

- `src/app` — routes: `(auth)`, `(client)`, `(admin)`, server actions, Stripe webhook.
- `src/components` — UI primitives, layout/chrome, forms.
- `src/lib` — `rbac.ts` (5 roles + permission matrix), `types.ts`, `labels.ts`,
  `i18n/` (en/zh/ru/uz), `data/` (the seam), `session.ts`, `payments/`, `email/`, `audit.ts`.
- `supabase/` — schema + RLS (`0001`), auth trigger + private bucket (`0002`),
  `seed.sql`, `config.toml`.
- `ARCHITECTURE.md` — full design (routes, data model, RBAC matrix, security, workflows).
- `README.md` — run + deploy details.

---

## 6. Merge checklist for the partner

- [ ] `npm install` and run in demo mode — confirm the UI builds and renders.
- [ ] Read `ARCHITECTURE.md` (data model + RBAC) and `src/lib/types.ts`.
- [ ] Map your tables/fields to the `DataRepo` return shapes.
- [ ] Implement `src/lib/data/<yourbackend>.ts` (reads) + adapt `mutations.ts` (writes).
- [ ] Wire `getCurrentUser()` to your auth; enforce per-client isolation server-side.
- [ ] Keep documents in private storage with signed URLs.
- [ ] Set `.env.local`, flip `NEXT_PUBLIC_DEMO_MODE=false`, and test end to end.

Questions about the frontend contract → start with `repo.ts`, `types.ts`, and
`ARCHITECTURE.md`. Everything else follows from those.

---

## Do NOT commit / merge these
`node_modules/`, `.next/`, `.env.local` (secrets), and editor folders are
git-ignored. Only source is shared.
