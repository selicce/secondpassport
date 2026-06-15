/**
 * Row mappers: Postgres (snake_case) → domain types (camelCase).
 *
 * Supabase returns numeric columns as strings, so money/percent fields are
 * coerced with Number(). jsonb columns (people, lines, timeline, attachments)
 * arrive already shaped to match the domain types.
 */
import type {
  AuditEntry,
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

type Row = Record<string, any>;

const num = (v: unknown) => (v === null || v === undefined ? 0 : Number(v));
const numOrNull = (v: unknown) => (v === null || v === undefined ? null : Number(v));

export function mapProfile(r: Row): UserProfile {
  return {
    id: r.id,
    fullName: r.full_name,
    email: r.email,
    phone: r.phone ?? undefined,
    messenger: r.messenger ?? undefined,
    nationality: r.nationality ?? undefined,
    countryOfResidence: r.country_of_residence ?? undefined,
    preferredLanguage: r.preferred_language,
    role: r.role,
    clientId: r.client_id ?? undefined,
    avatarColor: r.avatar_color ?? undefined,
    createdAt: r.created_at,
  };
}

export function mapClient(r: Row): Client {
  return {
    id: r.id,
    displayName: r.display_name,
    primaryContactName: r.primary_contact_name,
    email: r.email,
    phone: r.phone ?? undefined,
    nationality: r.nationality ?? undefined,
    countryOfResidence: r.country_of_residence ?? undefined,
    preferredLanguage: r.preferred_language,
    status: r.status,
    riskRating: r.risk_rating ?? undefined,
    createdAt: r.created_at,
  };
}

export function mapCompany(r: Row): Company {
  return {
    id: r.id,
    clientId: r.client_id,
    name: r.name,
    nameChinese: r.name_chinese ?? undefined,
    jurisdiction: r.jurisdiction,
    companyNumber: r.company_number ?? undefined,
    incorporationDate: r.incorporation_date ?? undefined,
    registeredAddress: r.registered_address ?? undefined,
    businessScope: r.business_scope ?? undefined,
    people: r.people ?? [],
    renewalDate: r.renewal_date ?? undefined,
    accountingStatus: r.accounting_status,
    bankAccountStatus: r.bank_account_status,
    status: r.status,
  };
}

export function mapService(r: Row): Service {
  return {
    id: r.id,
    category: r.category,
    title: r.title,
    shortDescription: r.short_description,
    description: r.description,
    jurisdiction: r.jurisdiction ?? undefined,
    startingPrice: numOrNull(r.starting_price),
    currency: r.currency,
    estimatedTimeline: r.estimated_timeline,
    requiredDocuments: r.required_documents ?? [],
    disclaimers: r.disclaimers ?? [],
    active: r.active,
  };
}

export function mapCase(r: Row): CaseRecord {
  return {
    id: r.id,
    reference: r.reference,
    clientId: r.client_id,
    companyId: r.company_id ?? undefined,
    serviceId: r.service_id,
    serviceTitle: r.service_title,
    category: r.category,
    status: r.status,
    priority: r.priority,
    assignedManagerId: r.assigned_manager_id ?? undefined,
    startDate: r.start_date,
    estimatedCompletion: r.estimated_completion ?? undefined,
    progressPercent: num(r.progress_percent),
    clientFacingNote: r.client_facing_note ?? undefined,
    // Internal notes are loaded separately (staff-only) and attached by the caller.
    internalNotes: (r.case_internal_notes ?? []).map((n: Row) => ({
      id: n.id,
      authorId: n.author_id,
      body: n.body,
      createdAt: n.created_at,
    })),
    timeline: r.timeline ?? [],
    createdAt: r.created_at,
  };
}

export function mapDocument(r: Row): DocumentRecord {
  return {
    id: r.id,
    clientId: r.client_id,
    caseId: r.case_id ?? undefined,
    companyId: r.company_id ?? undefined,
    category: r.category,
    title: r.title,
    status: r.status,
    direction: r.direction,
    fileName: r.file_name ?? undefined,
    fileSize: r.file_size ?? undefined,
    mimeType: r.mime_type ?? undefined,
    reviewerComment: r.reviewer_comment ?? undefined,
    requestedAt: r.requested_at ?? undefined,
    uploadedAt: r.uploaded_at ?? undefined,
    reviewedAt: r.reviewed_at ?? undefined,
    uploadedById: r.uploaded_by ?? undefined,
  };
}

export function mapInvoice(r: Row): Invoice {
  return {
    id: r.id,
    number: r.number,
    clientId: r.client_id,
    companyId: r.company_id ?? undefined,
    caseId: r.case_id ?? undefined,
    serviceTitle: r.service_title,
    lines: r.lines ?? [],
    currency: r.currency,
    amount: num(r.amount),
    amountPaid: num(r.amount_paid),
    dueDate: r.due_date,
    status: r.status,
    notes: r.notes ?? undefined,
    createdAt: r.created_at,
  };
}

export function mapPayment(r: Row): Payment {
  return {
    id: r.id,
    invoiceId: r.invoice_id,
    clientId: r.client_id,
    method: r.method,
    amount: num(r.amount),
    currency: r.currency,
    status: r.status,
    reference: r.reference ?? undefined,
    proofDocumentId: r.proof_document_id ?? undefined,
    recordedById: r.recorded_by ?? undefined,
    createdAt: r.created_at,
  };
}

export function mapTicketMessage(r: Row): TicketMessage {
  // Expects an embedded `author:profiles(full_name, role)` join.
  const author = r.author ?? {};
  return {
    id: r.id,
    ticketId: r.ticket_id,
    authorId: r.author_id,
    authorName: author.full_name ?? "Unknown",
    authorRole: author.role ?? "client",
    body: r.body,
    internal: r.internal,
    attachments: r.attachments ?? undefined,
    createdAt: r.created_at,
  };
}

export function mapTicket(r: Row): Ticket {
  return {
    id: r.id,
    reference: r.reference,
    clientId: r.client_id,
    companyId: r.company_id ?? undefined,
    caseId: r.case_id ?? undefined,
    subject: r.subject,
    category: r.category,
    status: r.status,
    priority: r.priority,
    assignedStaffId: r.assigned_staff_id ?? undefined,
    messages: (r.ticket_messages ?? []).map(mapTicketMessage),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function mapNotification(r: Row): NotificationRecord {
  return {
    id: r.id,
    userId: r.user_id,
    kind: r.kind,
    title: r.title,
    body: r.body,
    href: r.href ?? undefined,
    read: r.read,
    createdAt: r.created_at,
  };
}

export function mapAudit(r: Row): AuditEntry {
  return {
    id: r.id,
    actorId: r.actor_id,
    actorName: r.actor_name,
    actorRole: r.actor_role,
    action: r.action,
    target: r.target ?? undefined,
    detail: r.detail ?? undefined,
    ip: r.ip ?? undefined,
    createdAt: r.created_at,
  };
}
