/**
 * Supabase data provider — active when NEXT_PUBLIC_DEMO_MODE === "false".
 *
 * Reads go through the cookie-bound server client, so Postgres RLS
 * (supabase/migrations/0001_init.sql) enforces client-level isolation as the
 * signed-in user — the WHERE clauses here are for shape/ordering, not security.
 */
import "server-only";
import { createServerClient } from "@/lib/supabase/server";
import {
  mapAudit,
  mapCase,
  mapClient,
  mapCompany,
  mapDocument,
  mapInvoice,
  mapNotification,
  mapPayment,
  mapProfile,
  mapService,
  mapTicket,
} from "./mappers";
import type { DataRepo } from "./repo";

async function sb() {
  return createServerClient();
}

/** Throw on query error so failures are loud, not silently empty. */
function unwrap<T>(res: { data: T | null; error: { message: string } | null }): T | null {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

const CASE_SELECT = "*, case_internal_notes(*)";
const TICKET_SELECT = "*, ticket_messages(*, author:profiles(full_name, role))";

export const supabaseRepo: DataRepo = {
  // ── Users ──────────────────────────────────────────────────────────────────
  async getUserById(id) {
    const c = await sb();
    const row = unwrap(await c.from("profiles").select("*").eq("id", id).maybeSingle());
    return row ? mapProfile(row) : undefined;
  },
  async listStaffUsers() {
    const c = await sb();
    const rows = unwrap(await c.from("profiles").select("*").neq("role", "client").order("full_name")) ?? [];
    return rows.map(mapProfile);
  },
  async listAllUsers() {
    const c = await sb();
    const rows = unwrap(await c.from("profiles").select("*").order("full_name")) ?? [];
    return rows.map(mapProfile);
  },

  // ── Clients ────────────────────────────────────────────────────────────────
  async getClientById(id) {
    const c = await sb();
    const row = unwrap(await c.from("clients").select("*").eq("id", id).is("deleted_at", null).maybeSingle());
    return row ? mapClient(row) : undefined;
  },
  async listClients() {
    const c = await sb();
    const rows = unwrap(await c.from("clients").select("*").is("deleted_at", null).order("created_at", { ascending: false })) ?? [];
    return rows.map(mapClient);
  },

  // ── Companies ──────────────────────────────────────────────────────────────
  async listCompaniesForClient(clientId) {
    const c = await sb();
    const rows = unwrap(await c.from("companies").select("*").eq("client_id", clientId).is("deleted_at", null)) ?? [];
    return rows.map(mapCompany);
  },
  async getCompany(id) {
    const c = await sb();
    const row = unwrap(await c.from("companies").select("*").eq("id", id).maybeSingle());
    return row ? mapCompany(row) : undefined;
  },
  async listAllCompanies() {
    const c = await sb();
    const rows = unwrap(await c.from("companies").select("*").is("deleted_at", null).order("name")) ?? [];
    return rows.map(mapCompany);
  },

  // ── Services ───────────────────────────────────────────────────────────────
  async listServices() {
    const c = await sb();
    const rows = unwrap(await c.from("service_catalogue").select("*").eq("active", true).order("title")) ?? [];
    return rows.map(mapService);
  },
  async getService(id) {
    const c = await sb();
    const row = unwrap(await c.from("service_catalogue").select("*").eq("id", id).maybeSingle());
    return row ? mapService(row) : undefined;
  },
  async getServiceByCategory(category) {
    const c = await sb();
    const row = unwrap(await c.from("service_catalogue").select("*").eq("category", category).eq("active", true).limit(1).maybeSingle());
    return row ? mapService(row) : undefined;
  },

  // ── Cases ──────────────────────────────────────────────────────────────────
  async listCasesForClient(clientId) {
    const c = await sb();
    const rows = unwrap(await c.from("cases").select(CASE_SELECT).eq("client_id", clientId).is("deleted_at", null).order("created_at", { ascending: false })) ?? [];
    return rows.map(mapCase);
  },
  async getCase(id) {
    const c = await sb();
    const row = unwrap(await c.from("cases").select(CASE_SELECT).eq("id", id).maybeSingle());
    return row ? mapCase(row) : undefined;
  },
  async listAllCases() {
    const c = await sb();
    const rows = unwrap(await c.from("cases").select(CASE_SELECT).is("deleted_at", null).order("created_at", { ascending: false })) ?? [];
    return rows.map(mapCase);
  },

  // ── Documents ──────────────────────────────────────────────────────────────
  async listDocumentsForClient(clientId) {
    const c = await sb();
    const rows = unwrap(await c.from("documents").select("*").eq("client_id", clientId).is("deleted_at", null).order("created_at", { ascending: false })) ?? [];
    return rows.map(mapDocument);
  },
  async listDocumentsForCase(caseId) {
    const c = await sb();
    const rows = unwrap(await c.from("documents").select("*").eq("case_id", caseId).is("deleted_at", null)) ?? [];
    return rows.map(mapDocument);
  },
  async getDocument(id) {
    const c = await sb();
    const row = unwrap(await c.from("documents").select("*").eq("id", id).maybeSingle());
    return row ? mapDocument(row) : undefined;
  },
  async listAllDocuments() {
    const c = await sb();
    const rows = unwrap(await c.from("documents").select("*").is("deleted_at", null).order("created_at", { ascending: false })) ?? [];
    return rows.map(mapDocument);
  },

  // ── Invoices & payments ────────────────────────────────────────────────────
  async listInvoicesForClient(clientId) {
    const c = await sb();
    const rows = unwrap(await c.from("invoices").select("*").eq("client_id", clientId).is("deleted_at", null).order("created_at", { ascending: false })) ?? [];
    return rows.map(mapInvoice);
  },
  async getInvoice(id) {
    const c = await sb();
    const row = unwrap(await c.from("invoices").select("*").eq("id", id).maybeSingle());
    return row ? mapInvoice(row) : undefined;
  },
  async listAllInvoices() {
    const c = await sb();
    const rows = unwrap(await c.from("invoices").select("*").is("deleted_at", null).order("created_at", { ascending: false })) ?? [];
    return rows.map(mapInvoice);
  },
  async listPaymentsForInvoice(invoiceId) {
    const c = await sb();
    const rows = unwrap(await c.from("payments").select("*").eq("invoice_id", invoiceId).order("created_at", { ascending: false })) ?? [];
    return rows.map(mapPayment);
  },
  async listAllPayments() {
    const c = await sb();
    const rows = unwrap(await c.from("payments").select("*").order("created_at", { ascending: false })) ?? [];
    return rows.map(mapPayment);
  },

  // ── Tickets ────────────────────────────────────────────────────────────────
  async listTicketsForClient(clientId) {
    const c = await sb();
    const rows = unwrap(await c.from("tickets").select(TICKET_SELECT).eq("client_id", clientId).order("updated_at", { ascending: false })) ?? [];
    return rows.map(mapTicket).map(sortMessages);
  },
  async getTicket(id) {
    const c = await sb();
    const row = unwrap(await c.from("tickets").select(TICKET_SELECT).eq("id", id).maybeSingle());
    return row ? sortMessages(mapTicket(row)) : undefined;
  },
  async listAllTickets() {
    const c = await sb();
    const rows = unwrap(await c.from("tickets").select(TICKET_SELECT).order("updated_at", { ascending: false })) ?? [];
    return rows.map(mapTicket).map(sortMessages);
  },

  // ── Notifications & audit ──────────────────────────────────────────────────
  async listNotificationsForUser(userId) {
    const c = await sb();
    const rows = unwrap(await c.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false })) ?? [];
    return rows.map(mapNotification);
  },
  async listAuditLog() {
    const c = await sb();
    const rows = unwrap(await c.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200)) ?? [];
    return rows.map(mapAudit);
  },
};

function sortMessages<T extends { messages: { createdAt: string }[] }>(ticket: T): T {
  ticket.messages.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return ticket;
}
