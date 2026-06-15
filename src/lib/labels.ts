/**
 * Presentation metadata: human labels + badge tones for every status enum.
 * Keeps JSX free of switch statements and guarantees consistent wording.
 */
import type {
  BankAccountStatus,
  CaseStatus,
  CompanyAccountingStatus,
  DocumentCategory,
  DocumentStatus,
  InvoiceStatus,
  PaymentMethod,
  ServiceCategory,
  TicketCategory,
  TicketStatus,
} from "./types";

export type Tone = "neutral" | "info" | "success" | "warning" | "danger" | "gold";

interface Meta {
  label: string;
  tone: Tone;
}

export const CASE_STATUS: Record<CaseStatus, Meta> = {
  new_request: { label: "New Request", tone: "info" },
  awaiting_payment: { label: "Awaiting Payment", tone: "warning" },
  awaiting_documents: { label: "Awaiting Documents", tone: "warning" },
  documents_under_review: { label: "Documents Under Review", tone: "info" },
  submitted_external: { label: "Submitted to Authority / Bank", tone: "info" },
  in_progress: { label: "In Progress", tone: "info" },
  additional_info_required: { label: "Additional Info Required", tone: "warning" },
  completed: { label: "Completed", tone: "success" },
  on_hold: { label: "On Hold", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "danger" },
};

export const DOCUMENT_STATUS: Record<DocumentStatus, Meta> = {
  requested: { label: "Requested", tone: "warning" },
  uploaded: { label: "Uploaded", tone: "info" },
  under_review: { label: "Under Review", tone: "info" },
  approved: { label: "Approved", tone: "success" },
  rejected: { label: "Rejected", tone: "danger" },
  replacement_required: { label: "Replacement Required", tone: "danger" },
};

export const DOCUMENT_CATEGORY: Record<DocumentCategory, string> = {
  passport: "Passport",
  id_card: "ID Card",
  proof_of_address: "Proof of Address",
  business_license: "Business License",
  certificate_incorporation: "Certificate of Incorporation",
  articles_of_association: "Articles of Association",
  registration_cert: "Registration Certificate (NNC1 / NAR1 / BR)",
  bank_forms: "Bank Forms",
  kyc_forms: "KYC Forms",
  contract: "Contract",
  invoice: "Invoice",
  tax: "Tax Document",
  accounting: "Accounting Document",
  immigration: "Immigration Document",
  other: "Other",
};

export const INVOICE_STATUS: Record<InvoiceStatus, Meta> = {
  draft: { label: "Draft", tone: "neutral" },
  sent: { label: "Sent", tone: "info" },
  pending_payment: { label: "Pending Payment", tone: "warning" },
  partially_paid: { label: "Partially Paid", tone: "warning" },
  paid: { label: "Paid", tone: "success" },
  overdue: { label: "Overdue", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "neutral" },
  refunded: { label: "Refunded", tone: "neutral" },
};

export const PAYMENT_METHOD: Record<PaymentMethod, string> = {
  stripe: "Card (Stripe)",
  bank_transfer: "Bank Transfer",
  wise: "Wise",
  paypal: "PayPal",
  crypto: "Crypto",
};

export const TICKET_STATUS: Record<TicketStatus, Meta> = {
  open: { label: "Open", tone: "info" },
  waiting_firm: { label: "Waiting for JR & Firm", tone: "warning" },
  waiting_client: { label: "Waiting for Client", tone: "warning" },
  in_progress: { label: "In Progress", tone: "info" },
  resolved: { label: "Resolved", tone: "success" },
  closed: { label: "Closed", tone: "neutral" },
};

export const TICKET_CATEGORY: Record<TicketCategory, string> = {
  company_registration: "Company Registration",
  bank_account: "Bank Account",
  accounting_tax: "Accounting / Tax",
  renewal: "Renewal",
  immigration: "Immigration",
  payment: "Payment",
  document_issue: "Document Issue",
  general: "General Inquiry",
  complaint: "Complaint",
  urgent: "Urgent Matter",
};

export const ACCOUNTING_STATUS: Record<CompanyAccountingStatus, Meta> = {
  not_required: { label: "Not Required", tone: "neutral" },
  pending: { label: "Pending", tone: "warning" },
  in_progress: { label: "In Progress", tone: "info" },
  filed: { label: "Filed", tone: "success" },
  overdue: { label: "Overdue", tone: "danger" },
};

export const BANK_STATUS: Record<BankAccountStatus, Meta> = {
  none: { label: "Not Started", tone: "neutral" },
  preparing: { label: "Preparing", tone: "info" },
  submitted: { label: "Submitted", tone: "info" },
  under_review: { label: "Under Review", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
  declined: { label: "Declined", tone: "danger" },
};

export interface ServiceCategoryMeta {
  label: string;
  blurb: string;
}

export const SERVICE_CATEGORY: Record<ServiceCategory, ServiceCategoryMeta> = {
  hk_company: { label: "Hong Kong Company Registration", blurb: "Incorporate a Hong Kong limited company." },
  cn_wfoe: { label: "Mainland China WFOE Registration", blurb: "Establish a wholly foreign-owned enterprise." },
  cn_bank: { label: "China Bank Account Opening", blurb: "Coordination for Mainland corporate accounts." },
  hk_bank: { label: "Hong Kong Bank / Fintech Account", blurb: "Bank & fintech account preparation support." },
  renewal: { label: "Renewal / Annual Maintenance", blurb: "Annual returns, BR renewal, secretary." },
  accounting: { label: "Accounting & Tax Filing", blurb: "Bookkeeping, audit liaison, tax filing." },
  immigration: { label: "Work / Residence Permit", blurb: "Visa and work permit application support." },
  import_export: { label: "Import / Export & Customs", blurb: "Trade licenses and customs registration." },
  vat_refund: { label: "VAT Refund Support", blurb: "Export VAT refund preparation." },
  trademark: { label: "Trademark / IP", blurb: "Trademark filing and IP protection." },
  legal_docs: { label: "Contract / Legal Documents", blurb: "Contract drafting and legal documents." },
  restructuring: { label: "Corporate Restructuring", blurb: "Share transfers and group restructuring." },
  due_diligence: { label: "Due Diligence", blurb: "Counterparty and corporate due diligence." },
  consultation: { label: "Consultation", blurb: "Advisory consultation session." },
};
