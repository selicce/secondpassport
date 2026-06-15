/**
 * Domain types for the JR & Firm Client Portal.
 *
 * These mirror the database schema in supabase/migrations. Enum-like string
 * unions match the Postgres enums; keep both in sync when extending.
 */
import type { Role } from "./rbac";

export type ID = string;
export type ISODate = string;

export type Jurisdiction =
  | "Hong Kong"
  | "Mainland China"
  | "Singapore"
  | "UAE"
  | "USA"
  | "UK"
  | "Other";

export const JURISDICTIONS: Jurisdiction[] = [
  "Hong Kong",
  "Mainland China",
  "Singapore",
  "UAE",
  "USA",
  "UK",
  "Other",
];

export type Currency = "USD" | "HKD" | "CNY" | "EUR" | "GBP" | "AED";
export const CURRENCIES: Currency[] = ["USD", "HKD", "CNY", "EUR", "GBP", "AED"];

export type Language = "en" | "zh" | "ru" | "uz";

// ── Users / profiles ────────────────────────────────────────────────────────
export interface UserProfile {
  id: ID;
  fullName: string;
  email: string;
  phone?: string;
  messenger?: string; // WhatsApp / WeChat / Telegram handle
  nationality?: string;
  countryOfResidence?: string;
  preferredLanguage: Language;
  role: Role;
  clientId?: ID; // set when role === "client"
  avatarColor?: string;
  createdAt: ISODate;
}

// ── Clients (account / client group) ────────────────────────────────────────
export interface Client {
  id: ID;
  displayName: string;
  primaryContactName: string;
  email: string;
  phone?: string;
  nationality?: string;
  countryOfResidence?: string;
  preferredLanguage: Language;
  status: "active" | "onboarding" | "dormant";
  riskRating?: "low" | "medium" | "high"; // future: client risk scoring
  createdAt: ISODate;
}

// ── Companies / entities ────────────────────────────────────────────────────
export interface Person {
  name: string;
  role: "shareholder" | "director" | "ubo" | "secretary" | "legal_rep" | "supervisor";
  type?: "individual" | "corporate";
  sharePercent?: number;
  nationality?: string;
}

export type CompanyAccountingStatus = "not_required" | "pending" | "in_progress" | "filed" | "overdue";
export type BankAccountStatus = "none" | "preparing" | "submitted" | "under_review" | "approved" | "declined";

export interface Company {
  id: ID;
  clientId: ID;
  name: string;
  nameChinese?: string;
  jurisdiction: Jurisdiction;
  companyNumber?: string;
  incorporationDate?: ISODate;
  registeredAddress?: string;
  businessScope?: string;
  people: Person[];
  renewalDate?: ISODate;
  accountingStatus: CompanyAccountingStatus;
  bankAccountStatus: BankAccountStatus;
  status: "active" | "in_formation" | "dormant" | "deregistered";
}

// ── Service catalogue ───────────────────────────────────────────────────────
export type ServiceCategory =
  | "hk_company"
  | "cn_wfoe"
  | "cn_bank"
  | "hk_bank"
  | "renewal"
  | "accounting"
  | "immigration"
  | "import_export"
  | "vat_refund"
  | "trademark"
  | "legal_docs"
  | "restructuring"
  | "due_diligence"
  | "consultation";

export interface Service {
  id: ID;
  category: ServiceCategory;
  title: string;
  shortDescription: string;
  description: string;
  jurisdiction?: Jurisdiction;
  startingPrice: number | null; // null => "Request Quote"
  currency: Currency;
  estimatedTimeline: string; // e.g. "5–10 business days"
  requiredDocuments: string[];
  disclaimers: string[];
  active: boolean;
}

// ── Cases (a service order in progress) ─────────────────────────────────────
export type CaseStatus =
  | "new_request"
  | "awaiting_payment"
  | "awaiting_documents"
  | "documents_under_review"
  | "submitted_external" // to authority / bank / partner
  | "in_progress"
  | "additional_info_required"
  | "completed"
  | "on_hold"
  | "cancelled";

export type CasePriority = "low" | "normal" | "high" | "urgent";

export interface CaseTimelineStep {
  key: string;
  label: string;
  status: "done" | "current" | "pending";
  date?: ISODate;
}

export interface CaseRecord {
  id: ID;
  reference: string; // human-facing e.g. "JRF-2026-0142"
  clientId: ID;
  companyId?: ID;
  serviceId: ID;
  serviceTitle: string;
  category: ServiceCategory;
  status: CaseStatus;
  priority: CasePriority;
  assignedManagerId?: ID;
  startDate: ISODate;
  estimatedCompletion?: ISODate;
  progressPercent: number;
  clientFacingNote?: string;
  internalNotes?: { id: ID; authorId: ID; body: string; createdAt: ISODate }[];
  timeline: CaseTimelineStep[];
  createdAt: ISODate;
}

// ── Documents ───────────────────────────────────────────────────────────────
export type DocumentStatus =
  | "requested"
  | "uploaded"
  | "under_review"
  | "approved"
  | "rejected"
  | "replacement_required";

export type DocumentCategory =
  | "passport"
  | "id_card"
  | "proof_of_address"
  | "business_license"
  | "certificate_incorporation"
  | "articles_of_association"
  | "registration_cert" // NNC1 / NAR1 / BR
  | "bank_forms"
  | "kyc_forms"
  | "contract"
  | "invoice"
  | "tax"
  | "accounting"
  | "immigration"
  | "other";

export interface DocumentRecord {
  id: ID;
  clientId: ID;
  caseId?: ID;
  companyId?: ID;
  category: DocumentCategory;
  title: string;
  status: DocumentStatus;
  direction: "client_upload" | "firm_deliverable";
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  reviewerComment?: string;
  requestedAt?: ISODate;
  uploadedAt?: ISODate;
  reviewedAt?: ISODate;
  uploadedById?: ID;
}

// ── Invoices & payments ─────────────────────────────────────────────────────
export type InvoiceStatus =
  | "draft"
  | "sent"
  | "pending_payment"
  | "partially_paid"
  | "paid"
  | "overdue"
  | "cancelled"
  | "refunded";

export type PaymentMethod = "stripe" | "bank_transfer" | "wise" | "paypal" | "crypto";

export interface InvoiceLine {
  description: string;
  quantity: number;
  unitAmount: number;
}

export interface Invoice {
  id: ID;
  number: string;
  clientId: ID;
  companyId?: ID;
  caseId?: ID;
  serviceTitle: string;
  lines: InvoiceLine[];
  currency: Currency;
  amount: number;
  amountPaid: number;
  dueDate: ISODate;
  status: InvoiceStatus;
  notes?: string;
  createdAt: ISODate;
}

export interface Payment {
  id: ID;
  invoiceId: ID;
  clientId: ID;
  method: PaymentMethod;
  amount: number;
  currency: Currency;
  status: "pending" | "succeeded" | "failed" | "refunded";
  reference?: string;
  proofDocumentId?: ID; // client-uploaded proof for offline transfers
  recordedById?: ID; // finance staff who reconciled
  createdAt: ISODate;
}

// ── Tickets / messaging ─────────────────────────────────────────────────────
export type TicketCategory =
  | "company_registration"
  | "bank_account"
  | "accounting_tax"
  | "renewal"
  | "immigration"
  | "payment"
  | "document_issue"
  | "general"
  | "complaint"
  | "urgent";

export type TicketStatus =
  | "open"
  | "waiting_firm"
  | "waiting_client"
  | "in_progress"
  | "resolved"
  | "closed";

export interface TicketMessage {
  id: ID;
  ticketId: ID;
  authorId: ID;
  authorName: string;
  authorRole: Role;
  body: string;
  internal: boolean; // internal notes hidden from client
  attachments?: { name: string; documentId: ID }[];
  createdAt: ISODate;
}

export interface Ticket {
  id: ID;
  reference: string;
  clientId: ID;
  companyId?: ID;
  caseId?: ID;
  subject: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: CasePriority;
  assignedStaffId?: ID;
  messages: TicketMessage[];
  createdAt: ISODate;
  updatedAt: ISODate;
}

// ── Notifications ───────────────────────────────────────────────────────────
export type NotificationKind =
  | "document_requested"
  | "document_reviewed"
  | "invoice_issued"
  | "payment_received"
  | "case_status"
  | "ticket_reply"
  | "renewal_due"
  | "new_client"
  | "new_order"
  | "payment_proof";

export interface NotificationRecord {
  id: ID;
  userId: ID;
  kind: NotificationKind;
  title: string;
  body: string;
  href?: string;
  read: boolean;
  createdAt: ISODate;
}

// ── Audit log ───────────────────────────────────────────────────────────────
export type AuditAction =
  | "login"
  | "logout"
  | "login_failed"
  | "document_upload"
  | "document_download"
  | "document_delete"
  | "document_review"
  | "invoice_create"
  | "payment_status_change"
  | "case_status_update"
  | "role_change"
  | "permission_change";

export interface AuditEntry {
  id: ID;
  actorId: ID;
  actorName: string;
  actorRole: Role;
  action: AuditAction;
  target?: string;
  detail?: string;
  ip?: string;
  createdAt: ISODate;
}
