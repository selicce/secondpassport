# Architecture — JR & Firm Client Portal

This document covers the product architecture, route structure, data model,
role/permission logic, security model, and the key module workflows.

---

## 1. System overview

```
                    ┌──────────────────────────────────────────────┐
   Browser  ───────▶│  Next.js App Router (RSC + Server Actions)    │
                    │                                              │
                    │  Route groups:                               │
                    │   (auth)    public auth pages                │
                    │   (client)  client portal  → requireClient() │
                    │   (admin)   staff workspace → requireStaff()  │
                    │                                              │
                    │  Data access layer  src/lib/data             │
                    │     demo → fixtures   |   prod → Supabase     │
                    └───────────────┬──────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────────┐
        ▼                           ▼                               ▼
   Supabase Auth            Postgres + RLS                 Supabase Storage
   (sessions, RBAC)     (client-isolated rows)         (private docs, signed URLs)
        │                           │                               │
        └─── Stripe (payments) ── Resend (email) ── Audit log ──────┘
```

The **data access layer** (`src/lib/data/index.ts`) is the single seam between UI
and storage. Pages are Server Components that call repository functions; those
functions read fixtures in demo mode or Supabase in production. Swapping providers
never touches page code.

---

## 2. Route structure

| Path | Group | Access | Purpose |
| --- | --- | --- | --- |
| `/` | — | any | Redirects to `/dashboard`, `/admin`, or `/sign-in` |
| `/sign-in` `/register` `/forgot-password` | (auth) | public | Authentication & onboarding entry |
| `/onboarding` | (client) | client | Post-login "what do you want to do?" flow |
| `/dashboard` | (client) | client | Executive overview, next actions, progress |
| `/companies` · `/companies/[id]` | (client) | client | Entities, officers, related records |
| `/cases` · `/cases/[id]` | (client) | client | Service progress + client-facing timeline |
| `/documents` | (client) | client | Secure upload/download center |
| `/invoices` · `/invoices/[id]` | (client) | client | Invoices + payment (Stripe/offline) |
| `/messages` · `/messages/new` · `/messages/[id]` | (client) | client | Tickets / support |
| `/services` · `/services/[id]` | (client) | client | Catalogue + order |
| `/intake/company` · `/intake/bank` | (client) | client | Structured intake flows |
| `/profile` | (client) | client | Contact, language, security |
| `/admin` | (admin) | staff | Operations dashboard |
| `/admin/clients` · `/[id]` | (admin) | `clients.view_all` | Client management |
| `/admin/companies` | (admin) | `companies.view` | All entities |
| `/admin/cases` · `/[id]` | (admin) | `cases.view` | Case management + internal notes |
| `/admin/documents` | (admin) | `documents.view` | Review queue (approve/reject) |
| `/admin/invoices` | (admin) | `invoices.view` | Billing + reconcile |
| `/admin/payments` | (admin) | `payments.view` | Payment records + export |
| `/admin/tickets` · `/[id]` | (admin) | `tickets.view` | Support inbox + internal notes |
| `/admin/services` | (admin) | `services.manage` | Catalogue management |
| `/admin/users` | (admin) | `users.manage` | Staff & roles |
| `/admin/audit` | (admin) | `audit.view` | Audit log |
| `/admin/settings` | (admin) | staff (write: `settings.manage`) | Global config |
| `/api/webhooks/stripe` | — | Stripe | Payment webhook |

Authorization is enforced twice: route-group **layouts** call `requireClient()` /
`requireStaff()`, and individual admin pages re-check `can(role, permission)` before
rendering sensitive controls. RLS enforces it a third time at the database.

---

## 3. Data model

Tables (see `supabase/migrations/0001_init.sql`):

```
clients ─┬─< profiles            (a client group has many users)
         ├─< companies
         ├─< cases ─┬─< case_internal_notes        (staff-only)
         │          ├─< documents
         │          ├─< invoices ─< payments
         │          └─< tickets ─< ticket_messages (internal flag)
         ├─< document_requests ─< documents
         ├─< service_orders
         ├─< company_registration_intakes
         └─< bank_account_intakes

service_catalogue ─< service_orders, cases
profiles ─< notifications, audit_logs
```

Key relationships:
- **user → client profile**: `profiles.client_id` (clients) / role-only (staff).
- **client → companies / cases / invoices / tickets**: `client_id` FK everywhere
  (the column RLS keys off for isolation).
- **case → documents / invoices / tickets**: optional `case_id` FKs link a thread
  of work together.
- **invoice → payments**: one invoice, many payment attempts/records.
- **document_request → document**: a request becomes a document on upload.

Enum-like unions in `src/lib/types.ts` mirror the Postgres enums exactly.

---

## 4. Roles & permissions

Five roles (`src/lib/rbac.ts`). Permissions are capability flags checked via
`can(role, permission)`:

| Capability | client | case_manager | finance | admin | super_admin |
| --- | :-: | :-: | :-: | :-: | :-: |
| View own data | ✓ | | | | |
| View all clients/cases/docs | | ✓ | ✓ | ✓ | ✓ |
| Manage cases / review docs | | ✓ | | ✓ | ✓ |
| Manage invoices | | | ✓ | ✓ | ✓ |
| Reconcile payments | | | ✓ | ✓ | ✓ |
| Payment settings | | | | | ✓ |
| Respond / assign tickets | | ✓ (respond) | | ✓ | ✓ |
| Manage service catalogue | | | | ✓ | ✓ |
| Manage users & roles | | | | | ✓ |
| View audit logs | | | | ✓ | ✓ |
| Manage global settings | | | | | ✓ |

The same matrix is mirrored by RLS predicates (`auth_role()`, `is_staff()`,
`auth_client_id()`).

---

## 5. Security model

- **Client data isolation** — every client-owned table carries `client_id`; RLS
  read policies are `client_id = auth_client_id() OR is_staff()`.
- **Internal vs client-facing** — `case_internal_notes` is staff-only; ticket
  internal notes filtered by an RLS predicate so clients literally cannot read them.
- **Private documents** — files live in a private Storage bucket; the app issues
  only short-lived signed URLs (`DOCUMENT_SIGNED_URL_TTL`) and records a
  `document_download` audit entry. No public URLs exist.
- **Privileged writes** — client-owned mutations run server-side via the service
  role (bypassing RLS) only after `can()` checks and audit logging, keeping logic
  centralized and tamper-resistant.
- **Audit trail** — `recordAudit()` captures login, document upload/download/delete,
  invoice creation, payment status changes, case status updates, role/permission
  changes.
- **Defense in depth** — UI gating + layout guards + RLS. Soft-delete (`deleted_at`)
  on clients, companies, cases, documents, invoices.
- **Disclaimers** — bank/government/no-advice/accuracy/consent surfaced in the
  relevant flows (`src/components/disclaimer.tsx`, i18n dictionary).

---

## 6. Module workflows

**Service order → case**
1. Client orders from the catalogue (or completes an intake form).
2. A `case` is created (+ `service_order`, + required-document checklist).
3. Admin is notified; client gets a confirmation; an invoice may be raised.
4. Status advances through the case timeline; client sees the client-facing
   timeline, staff see internal notes.

**Document lifecycle**
`requested → uploaded → under_review → approved | rejected | replacement_required`.
Staff with `documents.review` action items in the admin review queue; the client
sees status + reviewer comments and re-uploads as needed.

**Payment**
- Card: `createCheckoutSession()` → Stripe Checkout → webhook marks paid.
- Offline (bank/Wise): instructions shown, client uploads proof, finance reconciles
  (`payments.reconcile`) which records a payment and flips invoice status.

**Ticketing**
Client opens an inquiry (category, subject, message, attachment) → ticket created,
client services notified. Staff reply (optionally internal), assign, change status;
optional email to the client. Internal notes never reach the client.

---

## 7. Extensibility

The seams designed for the roadmap (e-signature, AI document checks, OCR passport
extraction, KYC questionnaire generation, CRM/Gmail integration, WeChat/WhatsApp
notifications, risk scoring, partner portal, renewal automation, multi-entity client
groups, staff workload dashboard):

- New provider integrations slot beside `payments/` and `email/` as boundary modules.
- New data lives behind the `src/lib/data` repository — pages are insulated.
- `client_id`-keyed multi-tenancy already supports multiple companies and entities
  per client group.
- The notification + audit primitives are channel-agnostic (add WeChat/WhatsApp as
  new senders).
