/**
 * Data access layer (repository) — the single seam between UI and storage.
 *
 *   NEXT_PUBLIC_DEMO_MODE !== "false"  →  in-memory fixtures (./demo)
 *   NEXT_PUBLIC_DEMO_MODE === "false"  →  Supabase queries (./supabase, RLS-enforced)
 *
 * Pages/server components import the named functions below and never know which
 * provider is active. Writes live in ./mutations; auth in src/lib/session.ts.
 */
import { demoRepo } from "./demo";
import { supabaseRepo } from "./supabase";
import { airtableRepo } from "./airtable";
import type { DataRepo } from "./repo";

export const isDemoMode = () => process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

/**
 * Provider selection:
 *   NEXT_PUBLIC_DATA_PROVIDER = "demo" | "supabase" | "airtable"  (explicit), or
 *   falls back to NEXT_PUBLIC_DEMO_MODE (demo when not "false", else supabase).
 *
 * Tip: set DATA_PROVIDER="airtable" while keeping DEMO_MODE="true" to READ from
 * Airtable but keep writes simulated (client components use IS_DEMO) — handy
 * before the Airtable write path / auth are wired.
 */
type Provider = "demo" | "supabase" | "airtable";
const provider: Provider =
  (process.env.NEXT_PUBLIC_DATA_PROVIDER as Provider) || (isDemoMode() ? "demo" : "supabase");

const repo: DataRepo =
  provider === "airtable" ? airtableRepo : provider === "supabase" ? supabaseRepo : demoRepo;

// ── Re-export the repository surface ─────────────────────────────────────────
export const getUserById = repo.getUserById;
export const listStaffUsers = repo.listStaffUsers;
export const listAllUsers = repo.listAllUsers;
export const getClientById = repo.getClientById;
export const listClients = repo.listClients;
export const listCompaniesForClient = repo.listCompaniesForClient;
export const getCompany = repo.getCompany;
export const listAllCompanies = repo.listAllCompanies;
export const listServices = repo.listServices;
export const getService = repo.getService;
export const getServiceByCategory = repo.getServiceByCategory;
export const listCasesForClient = repo.listCasesForClient;
export const getCase = repo.getCase;
export const listAllCases = repo.listAllCases;
export const listDocumentsForClient = repo.listDocumentsForClient;
export const listDocumentsForCase = repo.listDocumentsForCase;
export const getDocument = repo.getDocument;
export const listAllDocuments = repo.listAllDocuments;
export const listInvoicesForClient = repo.listInvoicesForClient;
export const getInvoice = repo.getInvoice;
export const listAllInvoices = repo.listAllInvoices;
export const listPaymentsForInvoice = repo.listPaymentsForInvoice;
export const listAllPayments = repo.listAllPayments;
export const listTicketsForClient = repo.listTicketsForClient;
export const getTicket = repo.getTicket;
export const listAllTickets = repo.listAllTickets;
export const listNotificationsForUser = repo.listNotificationsForUser;
export const listAuditLog = repo.listAuditLog;

// ── Aggregations for dashboards (provider-agnostic) ──────────────────────────
export async function getClientDashboard(clientId: string) {
  const [clientCases, clientDocs, clientInvoices, clientTickets, clientCompanies] = await Promise.all([
    repo.listCasesForClient(clientId),
    repo.listDocumentsForClient(clientId),
    repo.listInvoicesForClient(clientId),
    repo.listTicketsForClient(clientId),
    repo.listCompaniesForClient(clientId),
  ]);

  const pendingDocs = clientDocs.filter((d) =>
    ["requested", "rejected", "replacement_required"].includes(d.status),
  );
  const pendingInvoices = clientInvoices.filter((i) =>
    ["sent", "pending_payment", "partially_paid", "overdue"].includes(i.status),
  );
  const activeCases = clientCases.filter((c) => !["completed", "cancelled"].includes(c.status));

  return {
    companies: clientCompanies,
    cases: clientCases,
    activeCases,
    documents: clientDocs,
    pendingDocs,
    invoices: clientInvoices,
    pendingInvoices,
    tickets: clientTickets,
  };
}

export async function getAdminDashboard() {
  const [allCases, allDocs, allInvoices, allTickets, allClients] = await Promise.all([
    repo.listAllCases(),
    repo.listAllDocuments(),
    repo.listAllInvoices(),
    repo.listAllTickets(),
    repo.listClients(),
  ]);

  const pendingDocs = allDocs.filter((d) => ["uploaded", "under_review"].includes(d.status));
  const pendingInvoices = allInvoices.filter((i) =>
    ["pending_payment", "partially_paid", "overdue"].includes(i.status),
  );
  const unansweredTickets = allTickets.filter((t) => ["open", "waiting_firm"].includes(t.status));
  const overdueInvoices = allInvoices.filter((i) => i.status === "overdue");
  const highPriorityCases = allCases.filter(
    (c) => ["high", "urgent"].includes(c.priority) && !["completed", "cancelled"].includes(c.status),
  );

  return {
    clients: allClients,
    cases: allCases,
    pendingDocs,
    pendingInvoices,
    overdueInvoices,
    unansweredTickets,
    highPriorityCases,
  };
}
