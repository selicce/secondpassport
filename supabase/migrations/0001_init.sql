-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ JR & Firm Client Portal — initial schema                                  ║
-- ║ PostgreSQL / Supabase. Run via `supabase db push` or the SQL editor.      ║
-- ╚══════════════════════════════════════════════════════════════════════════╝
-- Security model:
--   • Every table has Row-Level Security ENABLED.
--   • Clients can only see rows belonging to their own client_id.
--   • Staff roles (case_manager, finance, admin, super_admin) get broader read
--     access; write access is gated by role via helper predicates.
--   • Documents are stored in a PRIVATE storage bucket; only signed URLs are
--     ever issued (handled in app code), never public URLs.

create extension if not exists "pgcrypto";

-- ── Enums ────────────────────────────────────────────────────────────────────
create type user_role        as enum ('client','case_manager','finance','admin','super_admin');
create type client_status    as enum ('active','onboarding','dormant');
create type risk_rating       as enum ('low','medium','high');
create type jurisdiction      as enum ('Hong Kong','Mainland China','Singapore','UAE','USA','UK','Other');
create type currency_code     as enum ('USD','HKD','CNY','EUR','GBP','AED');
create type language_code     as enum ('en','zh','ru','uz');
create type company_status    as enum ('active','in_formation','dormant','deregistered');
create type accounting_status as enum ('not_required','pending','in_progress','filed','overdue');
create type bank_status       as enum ('none','preparing','submitted','under_review','approved','declined');
create type case_status       as enum ('new_request','awaiting_payment','awaiting_documents','documents_under_review','submitted_external','in_progress','additional_info_required','completed','on_hold','cancelled');
create type case_priority     as enum ('low','normal','high','urgent');
create type doc_status        as enum ('requested','uploaded','under_review','approved','rejected','replacement_required');
create type doc_direction     as enum ('client_upload','firm_deliverable');
create type doc_category       as enum ('passport','id_card','proof_of_address','business_license','certificate_incorporation','articles_of_association','registration_cert','bank_forms','kyc_forms','contract','invoice','tax','accounting','immigration','other');
create type invoice_status    as enum ('draft','sent','pending_payment','partially_paid','paid','overdue','cancelled','refunded');
create type payment_method    as enum ('stripe','bank_transfer','wise','paypal','crypto');
create type payment_status    as enum ('pending','succeeded','failed','refunded');
create type ticket_category   as enum ('company_registration','bank_account','accounting_tax','renewal','immigration','payment','document_issue','general','complaint','urgent');
create type ticket_status     as enum ('open','waiting_firm','waiting_client','in_progress','resolved','closed');
create type service_category  as enum ('hk_company','cn_wfoe','cn_bank','hk_bank','renewal','accounting','immigration','import_export','vat_refund','trademark','legal_docs','restructuring','due_diligence','consultation');
create type audit_action      as enum ('login','logout','login_failed','document_upload','document_download','document_delete','document_review','invoice_create','payment_status_change','case_status_update','role_change','permission_change');

-- ── Core identity ────────────────────────────────────────────────────────────
-- Clients = the account / client group. A client may have many companies & users.
create table clients (
  id                   uuid primary key default gen_random_uuid(),
  display_name         text not null,
  primary_contact_name text not null,
  email                text not null,
  phone                text,
  nationality          text,
  country_of_residence text,
  preferred_language   language_code not null default 'en',
  status               client_status not null default 'onboarding',
  risk_rating          risk_rating,
  created_at           timestamptz not null default now(),
  deleted_at           timestamptz                          -- soft delete
);

-- profiles 1:1 with auth.users; clients link to a client group.
create table profiles (
  id                   uuid primary key references auth.users(id) on delete cascade,
  full_name            text not null,
  email                text not null,
  phone                text,
  messenger            text,
  nationality          text,
  country_of_residence text,
  preferred_language   language_code not null default 'en',
  role                 user_role not null default 'client',
  client_id            uuid references clients(id) on delete set null,
  avatar_color         text,
  created_at           timestamptz not null default now()
);
create index on profiles(client_id);
create index on profiles(role);

-- ── Companies ────────────────────────────────────────────────────────────────
create table companies (
  id                 uuid primary key default gen_random_uuid(),
  client_id          uuid not null references clients(id) on delete cascade,
  name               text not null,
  name_chinese       text,
  jurisdiction       jurisdiction not null,
  company_number     text,
  incorporation_date date,
  registered_address text,
  business_scope     text,
  people             jsonb not null default '[]',           -- [{name, role, type, sharePercent, nationality}]
  renewal_date       date,
  accounting_status  accounting_status not null default 'not_required',
  bank_account_status bank_status not null default 'none',
  status             company_status not null default 'in_formation',
  created_at         timestamptz not null default now(),
  deleted_at         timestamptz
);
create index on companies(client_id);

-- ── Service catalogue ────────────────────────────────────────────────────────
create table service_catalogue (
  id                 uuid primary key default gen_random_uuid(),
  category           service_category not null,
  title              text not null,
  short_description  text not null,
  description        text not null,
  jurisdiction       jurisdiction,
  starting_price     numeric(12,2),                          -- null => request quote
  currency           currency_code not null default 'USD',
  estimated_timeline text not null,
  required_documents jsonb not null default '[]',
  disclaimers        jsonb not null default '[]',
  active             boolean not null default true,
  created_at         timestamptz not null default now()
);

-- ── Service orders & cases ───────────────────────────────────────────────────
create table service_orders (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,
  service_id  uuid not null references service_catalogue(id),
  company_id  uuid references companies(id) on delete set null,
  notes       text,
  created_at  timestamptz not null default now()
);

create table cases (
  id                    uuid primary key default gen_random_uuid(),
  reference             text not null unique,
  client_id             uuid not null references clients(id) on delete cascade,
  company_id            uuid references companies(id) on delete set null,
  service_id            uuid not null references service_catalogue(id),
  service_title         text not null,
  category              service_category not null,
  status                case_status not null default 'new_request',
  priority              case_priority not null default 'normal',
  assigned_manager_id   uuid references profiles(id) on delete set null,
  start_date            date not null default current_date,
  estimated_completion  date,
  progress_percent      int not null default 0 check (progress_percent between 0 and 100),
  client_facing_note    text,
  timeline              jsonb not null default '[]',
  created_at            timestamptz not null default now(),
  deleted_at            timestamptz
);
create index on cases(client_id);
create index on cases(status);

-- Internal notes are a separate table so RLS can hide them from clients entirely.
create table case_internal_notes (
  id         uuid primary key default gen_random_uuid(),
  case_id    uuid not null references cases(id) on delete cascade,
  author_id  uuid not null references profiles(id),
  body       text not null,
  created_at timestamptz not null default now()
);

-- ── Documents ────────────────────────────────────────────────────────────────
create table document_requests (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references clients(id) on delete cascade,
  case_id     uuid references cases(id) on delete cascade,
  category    doc_category not null,
  title       text not null,
  requested_by uuid references profiles(id),
  created_at  timestamptz not null default now()
);

create table documents (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references clients(id) on delete cascade,
  case_id           uuid references cases(id) on delete set null,
  company_id        uuid references companies(id) on delete set null,
  request_id        uuid references document_requests(id) on delete set null,
  category          doc_category not null,
  title             text not null,
  status            doc_status not null default 'requested',
  direction         doc_direction not null default 'client_upload',
  storage_path      text,                                   -- key in private bucket; NEVER public
  file_name         text,
  file_size         bigint,
  mime_type         text,
  reviewer_comment  text,
  uploaded_by       uuid references profiles(id),
  reviewed_by       uuid references profiles(id),
  requested_at      timestamptz,
  uploaded_at       timestamptz,
  reviewed_at       timestamptz,
  created_at        timestamptz not null default now(),
  deleted_at        timestamptz
);
create index on documents(client_id);
create index on documents(case_id);

-- ── Invoices & payments ──────────────────────────────────────────────────────
create table invoices (
  id            uuid primary key default gen_random_uuid(),
  number        text not null unique,
  client_id     uuid not null references clients(id) on delete cascade,
  company_id    uuid references companies(id) on delete set null,
  case_id       uuid references cases(id) on delete set null,
  service_title text not null,
  lines         jsonb not null default '[]',                -- [{description, quantity, unitAmount}]
  currency      currency_code not null default 'USD',
  amount        numeric(12,2) not null,
  amount_paid   numeric(12,2) not null default 0,
  due_date      date not null,
  status        invoice_status not null default 'draft',
  notes         text,
  created_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index on invoices(client_id);

create table payments (
  id                uuid primary key default gen_random_uuid(),
  invoice_id        uuid not null references invoices(id) on delete cascade,
  client_id         uuid not null references clients(id) on delete cascade,
  method            payment_method not null,
  amount            numeric(12,2) not null,
  currency          currency_code not null,
  status            payment_status not null default 'pending',
  reference         text,
  proof_document_id uuid references documents(id) on delete set null,
  recorded_by       uuid references profiles(id),
  created_at        timestamptz not null default now()
);

-- ── Tickets ──────────────────────────────────────────────────────────────────
create table tickets (
  id                uuid primary key default gen_random_uuid(),
  reference         text not null unique,
  client_id         uuid not null references clients(id) on delete cascade,
  company_id        uuid references companies(id) on delete set null,
  case_id           uuid references cases(id) on delete set null,
  subject           text not null,
  category          ticket_category not null default 'general',
  status            ticket_status not null default 'open',
  priority          case_priority not null default 'normal',
  assigned_staff_id uuid references profiles(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index on tickets(client_id);

create table ticket_messages (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references tickets(id) on delete cascade,
  author_id   uuid not null references profiles(id),
  body        text not null,
  internal    boolean not null default false,              -- hidden from client via RLS
  attachments jsonb not null default '[]',
  created_at  timestamptz not null default now()
);

-- ── Intake forms ─────────────────────────────────────────────────────────────
create table company_registration_intakes (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients(id) on delete cascade,
  case_id    uuid references cases(id) on delete set null,
  jurisdiction jurisdiction not null,
  payload    jsonb not null,                                -- full structured form
  created_at timestamptz not null default now()
);

create table bank_account_intakes (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references clients(id) on delete cascade,
  company_id uuid references companies(id) on delete set null,
  case_id    uuid references cases(id) on delete set null,
  payload    jsonb not null,
  created_at timestamptz not null default now()
);

-- ── Notifications & audit ────────────────────────────────────────────────────
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references profiles(id) on delete cascade,
  kind       text not null,
  title      text not null,
  body       text not null,
  href       text,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);
create index on notifications(user_id, read);

create table audit_logs (
  id         uuid primary key default gen_random_uuid(),
  actor_id   uuid references profiles(id) on delete set null,
  actor_name text not null,
  actor_role user_role not null,
  action     audit_action not null,
  target     text,
  detail     text,
  ip         inet,
  created_at timestamptz not null default now()
);
create index on audit_logs(created_at desc);

-- ╔══════════════════════════════════════════════════════════════════════════╗
-- ║ Row-Level Security                                                        ║
-- ╚══════════════════════════════════════════════════════════════════════════╝

-- Helper predicates (SECURITY DEFINER so they can read profiles under RLS).
create or replace function auth_role() returns user_role
  language sql stable security definer set search_path = public as
$$ select role from profiles where id = auth.uid() $$;

create or replace function auth_client_id() returns uuid
  language sql stable security definer set search_path = public as
$$ select client_id from profiles where id = auth.uid() $$;

create or replace function is_staff() returns boolean
  language sql stable security definer set search_path = public as
$$ select coalesce(auth_role() <> 'client', false) $$;

-- Enable RLS everywhere.
do $$
declare t text;
begin
  foreach t in array array[
    'clients','profiles','companies','service_catalogue','service_orders','cases',
    'case_internal_notes','document_requests','documents','invoices','payments',
    'tickets','ticket_messages','company_registration_intakes','bank_account_intakes',
    'notifications','audit_logs'
  ] loop
    execute format('alter table %I enable row level security;', t);
  end loop;
end $$;

-- profiles: a user sees their own profile; staff see all.
create policy profiles_self_read   on profiles for select using (id = auth.uid() or is_staff());
create policy profiles_self_update on profiles for update using (id = auth.uid());

-- clients: client members see their own client; staff see all.
create policy clients_read on clients for select using (id = auth_client_id() or is_staff());
create policy clients_staff_write on clients for all using (auth_role() in ('admin','super_admin')) with check (auth_role() in ('admin','super_admin'));

-- Generic pattern: client-owned tables visible to that client + all staff.
-- (write policies restrict mutation to staff; clients mutate via server actions
--  running with the service role, which bypasses RLS and re-checks in app code.)
create policy companies_read  on companies  for select using (client_id = auth_client_id() or is_staff());
create policy cases_read      on cases      for select using (client_id = auth_client_id() or is_staff());
create policy docreq_read     on document_requests for select using (client_id = auth_client_id() or is_staff());
create policy documents_read  on documents  for select using (client_id = auth_client_id() or is_staff());
create policy invoices_read   on invoices   for select using (client_id = auth_client_id() or is_staff());
create policy payments_read   on payments   for select using (client_id = auth_client_id() or is_staff());
create policy tickets_read    on tickets    for select using (client_id = auth_client_id() or is_staff());
create policy orders_read     on service_orders for select using (client_id = auth_client_id() or is_staff());
create policy reg_intake_read on company_registration_intakes for select using (client_id = auth_client_id() or is_staff());
create policy bank_intake_read on bank_account_intakes for select using (client_id = auth_client_id() or is_staff());

-- Service catalogue: readable by all authenticated users.
create policy catalogue_read on service_catalogue for select using (auth.uid() is not null);
create policy catalogue_write on service_catalogue for all using (auth_role() in ('admin','super_admin')) with check (auth_role() in ('admin','super_admin'));

-- Internal notes: STAFF ONLY — never exposed to clients.
create policy internal_notes_staff on case_internal_notes for select using (is_staff());

-- Ticket messages: client sees non-internal messages on their tickets; staff see all.
create policy ticket_msg_read on ticket_messages for select using (
  is_staff() or (
    internal = false and exists (
      select 1 from tickets t where t.id = ticket_messages.ticket_id and t.client_id = auth_client_id()
    )
  )
);

-- Notifications: each user sees only their own.
create policy notifications_own on notifications for select using (user_id = auth.uid());
create policy notifications_update on notifications for update using (user_id = auth.uid());

-- Audit logs: readable only by roles with the audit capability.
create policy audit_read on audit_logs for select using (auth_role() in ('admin','super_admin'));

-- NOTE: INSERT/UPDATE/DELETE for client-owned tables is intentionally performed
-- server-side with the service-role key (see src/lib/supabase/server.ts), which
-- bypasses RLS. The application enforces RBAC (src/lib/rbac.ts) before every
-- such write and records an audit entry. This keeps mutation logic centralized
-- and auditable while RLS guarantees read isolation for the anon/auth clients.
