/**
 * Airtable data provider — active when NEXT_PUBLIC_DATA_PROVIDER === "airtable".
 *
 * Reads the portal's structured records (clients, companies, cases, invoices,
 * etc.) from an Airtable base over the REST API. Implements the same `DataRepo`
 * interface as the demo and Supabase providers, so no page changes.
 *
 * ───────────────────────────────────────────────────────────────────────────
 *  PARTNER: this is the file to adapt to YOUR base.
 *   1. Set AIRTABLE_PAT + AIRTABLE_BASE_ID in .env.local (see .env.example).
 *   2. Rename the tables in `TABLES` to match your base.
 *   3. In each `map*` function, change the `f["..."]` field names to match your
 *      Airtable column names. The right-hand side (domain shape) must NOT change
 *      — those types are what the UI expects (see src/lib/types.ts).
 *  Structured sub-objects (company people, invoice line items, case timeline)
 *  are read from long-text fields holding JSON; store them that way or replace
 *  `json()` with your own assembly from linked tables.
 * ───────────────────────────────────────────────────────────────────────────
 *
 *  Notes:
 *   - Airtable has NO row-level security: isolation is enforced here by always
 *     filtering client-owned tables on the client field. Keep it that way.
 *   - Airtable is rate-limited to ~5 requests/sec per base; `get()` retries once
 *     on HTTP 429.
 *   - Do NOT store passports / bank documents as Airtable attachments (public
 *     URLs). Keep files in private storage — see MERGE_GUIDE.md.
 */
import "server-only";
import type { DataRepo } from "./repo";
import type {
  CaseRecord,
  Client,
  Company,
  DocumentRecord,
  Invoice,
  NotificationRecord,
  Payment,
  Service,
  Ticket,
  TicketMessage,
  UserProfile,
} from "@/lib/types";

// ── Table names — EDIT to match your base ────────────────────────────────────
const TABLES = {
  profiles: "Users",
  clients: "Clients",
  companies: "Companies",
  services: "Services",
  cases: "Cases",
  documents: "Documents",
  invoices: "Invoices",
  payments: "Payments",
  tickets: "Tickets",
  ticketMessages: "Ticket Messages",
  notifications: "Notifications",
  audit: "Audit Logs",
} as const;

// The Airtable field that links a row to its client (a text id or linked-record
// field). Used for the isolation filter on client-owned tables.
const CLIENT_FIELD = "Client Id";

type Fields = Record<string, any>;
type AtRecord = { id: string; fields: Fields; createdTime: string };

function config() {
  const token = process.env.AIRTABLE_PAT ?? process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  if (!token || !baseId) {
    throw new Error("Airtable is not configured. Set AIRTABLE_PAT and AIRTABLE_BASE_ID.");
  }
  return { token, baseId };
}

// ── REST helpers ─────────────────────────────────────────────────────────────
async function get(table: string, search: URLSearchParams): Promise<AtRecord[]> {
  const { token, baseId } = config();
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}?${search.toString()}`;
  let res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 1200)); // respect the rate limit, retry once
    res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  }
  if (!res.ok) throw new Error(`Airtable ${table} ${res.status}: ${await res.text()}`);
  return (await res.json()).records as AtRecord[];
}

/** Select all rows (following pagination), with optional formula + sort. */
async function selectAll(
  table: string,
  opts: { filter?: string; sortField?: string; sortDir?: "asc" | "desc" } = {},
): Promise<AtRecord[]> {
  const out: AtRecord[] = [];
  let offset: string | undefined;
  do {
    const p = new URLSearchParams({ pageSize: "100" });
    if (opts.filter) p.set("filterByFormula", opts.filter);
    if (opts.sortField) {
      p.set("sort[0][field]", opts.sortField);
      p.set("sort[0][direction]", opts.sortDir ?? "asc");
    }
    if (offset) p.set("offset", offset);
    const { token, baseId } = config();
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}?${p.toString()}`;
    let res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 1200));
      res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
    }
    if (!res.ok) throw new Error(`Airtable ${table} ${res.status}: ${await res.text()}`);
    const json = await res.json();
    out.push(...(json.records as AtRecord[]));
    offset = json.offset;
  } while (offset);
  return out;
}

async function findById(table: string, id: string): Promise<AtRecord | undefined> {
  const { token, baseId } = config();
  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}/${id}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (res.status === 404) return undefined;
  if (!res.ok) throw new Error(`Airtable ${table}/${id} ${res.status}`);
  return (await res.json()) as AtRecord;
}

// ── Small field coercion helpers ─────────────────────────────────────────────
const str = (v: any): string | undefined => (v == null || v === "" ? undefined : String(v));
const numOrNull = (v: any): number | null => (v == null || v === "" ? null : Number(v));
const num = (v: any): number => (v == null || v === "" ? 0 : Number(v));
/** Airtable linked fields are arrays of record ids — take the first. */
const link = (v: any): string | undefined => (Array.isArray(v) ? v[0] : str(v));
/** Parse a long-text field that holds JSON; fall back to a default. */
function json<T>(v: any, fallback: T): T {
  if (v == null || v === "") return fallback;
  if (typeof v !== "string") return v as T;
  try {
    return JSON.parse(v) as T;
  } catch {
    return fallback;
  }
}
const esc = (v: string) => v.replace(/'/g, "\\'");
const byClient = (clientId: string) => `{${CLIENT_FIELD}}='${esc(clientId)}'`;

// ── Mappers (Airtable fields → domain types) ─────────────────────────────────
function mapProfile(r: AtRecord): UserProfile {
  const f = r.fields;
  return {
    id: r.id,
    fullName: f["Full Name"] ?? "",
    email: f["Email"] ?? "",
    phone: str(f["Phone"]),
    messenger: str(f["Messenger"]),
    nationality: str(f["Nationality"]),
    countryOfResidence: str(f["Country of Residence"]),
    preferredLanguage: f["Preferred Language"] ?? "en",
    role: f["Role"] ?? "client",
    clientId: link(f["Client"]),
    avatarColor: str(f["Avatar Color"]),
    createdAt: r.createdTime,
  };
}

function mapClient(r: AtRecord): Client {
  const f = r.fields;
  return {
    id: r.id,
    displayName: f["Display Name"] ?? "",
    primaryContactName: f["Primary Contact"] ?? "",
    email: f["Email"] ?? "",
    phone: str(f["Phone"]),
    nationality: str(f["Nationality"]),
    countryOfResidence: str(f["Country of Residence"]),
    preferredLanguage: f["Preferred Language"] ?? "en",
    status: f["Status"] ?? "onboarding",
    riskRating: str(f["Risk Rating"]) as Client["riskRating"],
    createdAt: r.createdTime,
  };
}

function mapCompany(r: AtRecord): Company {
  const f = r.fields;
  return {
    id: r.id,
    clientId: link(f["Client"]) ?? "",
    name: f["Name"] ?? "",
    nameChinese: str(f["Name (Chinese)"]),
    jurisdiction: f["Jurisdiction"] ?? "Other",
    companyNumber: str(f["Company Number"]),
    incorporationDate: str(f["Incorporation Date"]),
    registeredAddress: str(f["Registered Address"]),
    businessScope: str(f["Business Scope"]),
    people: json(f["People (JSON)"], []),
    renewalDate: str(f["Renewal Date"]),
    accountingStatus: f["Accounting Status"] ?? "not_required",
    bankAccountStatus: f["Bank Account Status"] ?? "none",
    status: f["Status"] ?? "in_formation",
  };
}

function mapService(r: AtRecord): Service {
  const f = r.fields;
  return {
    id: r.id,
    category: f["Category"] ?? "consultation",
    title: f["Title"] ?? "",
    shortDescription: f["Short Description"] ?? "",
    description: f["Description"] ?? "",
    jurisdiction: str(f["Jurisdiction"]) as Service["jurisdiction"],
    startingPrice: numOrNull(f["Starting Price"]),
    currency: f["Currency"] ?? "USD",
    estimatedTimeline: f["Estimated Timeline"] ?? "",
    requiredDocuments: json(f["Required Documents (JSON)"], []),
    disclaimers: json(f["Disclaimers (JSON)"], []),
    active: f["Active"] ?? true,
  };
}

function mapCase(r: AtRecord): CaseRecord {
  const f = r.fields;
  return {
    id: r.id,
    reference: f["Reference"] ?? r.id,
    clientId: link(f["Client"]) ?? "",
    companyId: link(f["Company"]),
    serviceId: link(f["Service"]) ?? "",
    serviceTitle: f["Service Title"] ?? "",
    category: f["Category"] ?? "consultation",
    status: f["Status"] ?? "new_request",
    priority: f["Priority"] ?? "normal",
    assignedManagerId: link(f["Assigned Manager"]),
    startDate: f["Start Date"] ?? r.createdTime,
    estimatedCompletion: str(f["Estimated Completion"]),
    progressPercent: num(f["Progress Percent"]),
    clientFacingNote: str(f["Client-Facing Note"]),
    internalNotes: json(f["Internal Notes (JSON)"], []),
    timeline: json(f["Timeline (JSON)"], []),
    createdAt: r.createdTime,
  };
}

function mapDocument(r: AtRecord): DocumentRecord {
  const f = r.fields;
  return {
    id: r.id,
    clientId: link(f["Client"]) ?? "",
    caseId: link(f["Case"]),
    companyId: link(f["Company"]),
    category: f["Category"] ?? "other",
    title: f["Title"] ?? "",
    status: f["Status"] ?? "requested",
    direction: f["Direction"] ?? "client_upload",
    fileName: str(f["File Name"]),
    fileSize: f["File Size"] != null ? Number(f["File Size"]) : undefined,
    mimeType: str(f["MIME Type"]),
    reviewerComment: str(f["Reviewer Comment"]),
    requestedAt: str(f["Requested At"]),
    uploadedAt: str(f["Uploaded At"]),
    reviewedAt: str(f["Reviewed At"]),
    uploadedById: link(f["Uploaded By"]),
  };
}

function mapInvoice(r: AtRecord): Invoice {
  const f = r.fields;
  return {
    id: r.id,
    number: f["Number"] ?? r.id,
    clientId: link(f["Client"]) ?? "",
    companyId: link(f["Company"]),
    caseId: link(f["Case"]),
    serviceTitle: f["Service Title"] ?? "",
    lines: json(f["Line Items (JSON)"], []),
    currency: f["Currency"] ?? "USD",
    amount: num(f["Amount"]),
    amountPaid: num(f["Amount Paid"]),
    dueDate: f["Due Date"] ?? r.createdTime,
    status: f["Status"] ?? "draft",
    notes: str(f["Notes"]),
    createdAt: r.createdTime,
  };
}

function mapPayment(r: AtRecord): Payment {
  const f = r.fields;
  return {
    id: r.id,
    invoiceId: link(f["Invoice"]) ?? "",
    clientId: link(f["Client"]) ?? "",
    method: f["Method"] ?? "bank_transfer",
    amount: num(f["Amount"]),
    currency: f["Currency"] ?? "USD",
    status: f["Status"] ?? "pending",
    reference: str(f["Reference"]),
    proofDocumentId: link(f["Proof Document"]),
    recordedById: link(f["Recorded By"]),
    createdAt: r.createdTime,
  };
}

function mapTicketMessage(r: AtRecord): TicketMessage {
  const f = r.fields;
  return {
    id: r.id,
    ticketId: link(f["Ticket"]) ?? "",
    authorId: link(f["Author"]) ?? "",
    // Use Airtable lookup fields that pull the author's name/role onto the message.
    authorName: (Array.isArray(f["Author Name"]) ? f["Author Name"][0] : f["Author Name"]) ?? "Unknown",
    authorRole: (Array.isArray(f["Author Role"]) ? f["Author Role"][0] : f["Author Role"]) ?? "client",
    body: f["Body"] ?? "",
    internal: f["Internal"] ?? false,
    attachments: json(f["Attachments (JSON)"], undefined as any),
    createdAt: r.createdTime,
  };
}

function mapTicket(r: AtRecord, messages: TicketMessage[]): Ticket {
  const f = r.fields;
  return {
    id: r.id,
    reference: f["Reference"] ?? r.id,
    clientId: link(f["Client"]) ?? "",
    companyId: link(f["Company"]),
    caseId: link(f["Case"]),
    subject: f["Subject"] ?? "",
    category: f["Category"] ?? "general",
    status: f["Status"] ?? "open",
    priority: f["Priority"] ?? "normal",
    assignedStaffId: link(f["Assigned Staff"]),
    messages: messages.sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    createdAt: r.createdTime,
    updatedAt: f["Updated At"] ?? r.createdTime,
  };
}

function mapNotification(r: AtRecord): NotificationRecord {
  const f = r.fields;
  return {
    id: r.id,
    userId: link(f["User"]) ?? "",
    kind: f["Kind"] ?? "case_status",
    title: f["Title"] ?? "",
    body: f["Body"] ?? "",
    href: str(f["Href"]),
    read: f["Read"] ?? false,
    createdAt: r.createdTime,
  };
}

function mapAudit(r: AtRecord) {
  const f = r.fields;
  return {
    id: r.id,
    actorId: link(f["Actor"]) ?? "",
    actorName: f["Actor Name"] ?? "",
    actorRole: f["Actor Role"] ?? "client",
    action: f["Action"] ?? "login",
    target: str(f["Target"]),
    detail: str(f["Detail"]),
    ip: str(f["IP"]),
    createdAt: r.createdTime,
  };
}

/** Fetch the messages for a ticket (filtered by the linked Ticket id). */
async function messagesForTicket(ticketId: string): Promise<TicketMessage[]> {
  const rows = await selectAll(TABLES.ticketMessages, {
    filter: `SEARCH('${esc(ticketId)}', ARRAYJOIN({Ticket}))`,
  });
  return rows.map(mapTicketMessage);
}

// ── Repository ───────────────────────────────────────────────────────────────
export const airtableRepo: DataRepo = {
  async getUserById(id) {
    const r = await findById(TABLES.profiles, id);
    return r ? mapProfile(r) : undefined;
  },
  async listStaffUsers() {
    const rows = await selectAll(TABLES.profiles, { filter: "NOT({Role}='client')", sortField: "Full Name" });
    return rows.map(mapProfile);
  },
  async listAllUsers() {
    return (await selectAll(TABLES.profiles, { sortField: "Full Name" })).map(mapProfile);
  },

  async getClientById(id) {
    const r = await findById(TABLES.clients, id);
    return r ? mapClient(r) : undefined;
  },
  async listClients() {
    return (await selectAll(TABLES.clients)).map(mapClient);
  },

  async listCompaniesForClient(clientId) {
    return (await selectAll(TABLES.companies, { filter: byClient(clientId) })).map(mapCompany);
  },
  async getCompany(id) {
    const r = await findById(TABLES.companies, id);
    return r ? mapCompany(r) : undefined;
  },
  async listAllCompanies() {
    return (await selectAll(TABLES.companies, { sortField: "Name" })).map(mapCompany);
  },

  async listServices() {
    return (await selectAll(TABLES.services, { filter: "{Active}=TRUE()", sortField: "Title" })).map(mapService);
  },
  async getService(id) {
    const r = await findById(TABLES.services, id);
    return r ? mapService(r) : undefined;
  },
  async getServiceByCategory(category) {
    const rows = await selectAll(TABLES.services, { filter: `AND({Category}='${esc(category)}',{Active}=TRUE())` });
    return rows[0] ? mapService(rows[0]) : undefined;
  },

  async listCasesForClient(clientId) {
    return (await selectAll(TABLES.cases, { filter: byClient(clientId) })).map(mapCase);
  },
  async getCase(id) {
    const r = await findById(TABLES.cases, id);
    return r ? mapCase(r) : undefined;
  },
  async listAllCases() {
    return (await selectAll(TABLES.cases)).map(mapCase);
  },

  async listDocumentsForClient(clientId) {
    return (await selectAll(TABLES.documents, { filter: byClient(clientId) })).map(mapDocument);
  },
  async listDocumentsForCase(caseId) {
    return (await selectAll(TABLES.documents, { filter: `SEARCH('${esc(caseId)}', ARRAYJOIN({Case}))` })).map(mapDocument);
  },
  async getDocument(id) {
    const r = await findById(TABLES.documents, id);
    return r ? mapDocument(r) : undefined;
  },
  async listAllDocuments() {
    return (await selectAll(TABLES.documents)).map(mapDocument);
  },

  async listInvoicesForClient(clientId) {
    return (await selectAll(TABLES.invoices, { filter: byClient(clientId) })).map(mapInvoice);
  },
  async getInvoice(id) {
    const r = await findById(TABLES.invoices, id);
    return r ? mapInvoice(r) : undefined;
  },
  async listAllInvoices() {
    return (await selectAll(TABLES.invoices)).map(mapInvoice);
  },
  async listPaymentsForInvoice(invoiceId) {
    return (await selectAll(TABLES.payments, { filter: `SEARCH('${esc(invoiceId)}', ARRAYJOIN({Invoice}))` })).map(mapPayment);
  },
  async listAllPayments() {
    return (await selectAll(TABLES.payments)).map(mapPayment);
  },

  async listTicketsForClient(clientId) {
    const rows = await selectAll(TABLES.tickets, { filter: byClient(clientId), sortField: "Updated At", sortDir: "desc" });
    return Promise.all(rows.map(async (r) => mapTicket(r, await messagesForTicket(r.id))));
  },
  async getTicket(id) {
    const r = await findById(TABLES.tickets, id);
    if (!r) return undefined;
    return mapTicket(r, await messagesForTicket(r.id));
  },
  async listAllTickets() {
    const rows = await selectAll(TABLES.tickets, { sortField: "Updated At", sortDir: "desc" });
    return Promise.all(rows.map(async (r) => mapTicket(r, await messagesForTicket(r.id))));
  },

  async listNotificationsForUser(userId) {
    return (
      await selectAll(TABLES.notifications, {
        filter: `SEARCH('${esc(userId)}', ARRAYJOIN({User}))`,
        sortField: "Created At",
        sortDir: "desc",
      })
    ).map(mapNotification);
  },
  async listAuditLog() {
    return (await selectAll(TABLES.audit, { sortField: "Created At", sortDir: "desc" })).map(mapAudit);
  },
};
