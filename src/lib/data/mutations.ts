import "server-only";
import { randomUUID } from "node:crypto";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { sendEmail, emailTemplates } from "@/lib/email/mailer";
import { can } from "@/lib/rbac";
import { formatMoney } from "@/lib/utils";
import type { CaseStatus, Currency, DocumentStatus, ID, NotificationKind, PaymentMethod } from "@/lib/types";

/**
 * Privileged writes.
 *
 * These run with the service-role client (bypassing RLS) AFTER authenticating
 * the caller and checking RBAC here — keeping mutation + audit logic in one
 * trusted place. Reads remain RLS-protected via the user-scoped client.
 *
 * Never imported by client components directly; the server actions in
 * src/app/actions/portal.ts wrap these.
 */

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "client-documents";

async function requireUserOrThrow() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Not authenticated");
  return user;
}

type Svc = ReturnType<typeof createServiceRoleClient>;

/** Fan out in-app notifications to a client's members and (optionally) finance/admin. */
async function notify(
  svc: Svc,
  opts: { clientId: string; toFinance?: boolean; kind: NotificationKind; title: string; body: string; href?: string },
) {
  const recipients = new Set<string>();
  const { data: clientUsers } = await svc.from("profiles").select("id").eq("client_id", opts.clientId);
  (clientUsers ?? []).forEach((u: { id: string }) => recipients.add(u.id));
  if (opts.toFinance) {
    const { data: staff } = await svc.from("profiles").select("id").in("role", ["finance", "admin", "super_admin"]);
    (staff ?? []).forEach((u: { id: string }) => recipients.add(u.id));
  }
  if (recipients.size === 0) return;
  await svc.from("notifications").insert(
    [...recipients].map((user_id) => ({
      user_id,
      kind: opts.kind,
      title: opts.title,
      body: opts.body,
      href: opts.href ?? null,
    })),
  );
}

/** Verify the caller may touch a row belonging to `ownerClientId`. */
function assertClientScope(user: { role: string; clientId?: string }, ownerClientId: string | null) {
  if (user.role !== "client") return; // staff scope checked per-permission by callers
  if (!ownerClientId || user.clientId !== ownerClientId) {
    throw new Error("Forbidden: cross-client access");
  }
}

// ── Documents ────────────────────────────────────────────────────────────────
export async function uploadDocument(input: {
  file: File;
  clientId: ID;
  caseId?: ID;
  companyId?: ID;
  requestId?: ID;
  category: string;
  title: string;
}) {
  const user = await requireUserOrThrow();
  assertClientScope(user, input.clientId);

  const svc = createServiceRoleClient();
  const ext = input.file.name.split(".").pop() ?? "bin";
  const storagePath = `${input.clientId}/${input.caseId ?? "general"}/${randomUUID()}.${ext}`;

  // Private bucket — no public URL is ever produced.
  const up = await svc.storage.from(BUCKET).upload(storagePath, input.file, {
    contentType: input.file.type || "application/octet-stream",
    upsert: false,
  });
  if (up.error) throw new Error(up.error.message);

  const { data, error } = await svc
    .from("documents")
    .insert({
      client_id: input.clientId,
      case_id: input.caseId ?? null,
      company_id: input.companyId ?? null,
      request_id: input.requestId ?? null,
      category: input.category,
      title: input.title,
      status: "uploaded",
      direction: "client_upload",
      storage_path: storagePath,
      file_name: input.file.name,
      file_size: input.file.size,
      mime_type: input.file.type,
      uploaded_by: user.id,
      uploaded_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await recordAudit({ actor: user, action: "document_upload", target: input.file.name });
  return { id: data.id as string };
}

/** Authorize, audit, and return a short-lived signed URL (never public). */
export async function createSignedDownloadUrl(documentId: ID) {
  const user = await requireUserOrThrow();
  const svc = createServiceRoleClient();

  const { data: doc, error } = await svc
    .from("documents")
    .select("client_id, storage_path, file_name")
    .eq("id", documentId)
    .maybeSingle();
  if (error || !doc) throw new Error("Document not found");
  assertClientScope(user, doc.client_id);
  if (!doc.storage_path) throw new Error("No file to download");

  const ttl = Number(process.env.DOCUMENT_SIGNED_URL_TTL ?? 120);
  const signed = await svc.storage.from(BUCKET).createSignedUrl(doc.storage_path, ttl, {
    download: doc.file_name ?? true,
  });
  if (signed.error) throw new Error(signed.error.message);

  await recordAudit({ actor: user, action: "document_download", target: doc.file_name ?? documentId });
  return { url: signed.data.signedUrl };
}

export async function reviewDocument(documentId: ID, status: DocumentStatus, comment?: string) {
  const user = await requireUserOrThrow();
  if (!can(user.role, "documents.review")) throw new Error("Forbidden");
  const svc = createServiceRoleClient();

  const { error } = await svc
    .from("documents")
    .update({
      status,
      reviewer_comment: comment ?? null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", documentId);
  if (error) throw new Error(error.message);

  await recordAudit({ actor: user, action: "document_review", target: documentId, detail: `→ ${status}` });
}

// ── Cases ────────────────────────────────────────────────────────────────────
export async function updateCaseStatus(caseId: ID, status: CaseStatus) {
  const user = await requireUserOrThrow();
  if (!can(user.role, "cases.manage")) throw new Error("Forbidden");
  const svc = createServiceRoleClient();

  const { error } = await svc.from("cases").update({ status }).eq("id", caseId);
  if (error) throw new Error(error.message);

  await recordAudit({ actor: user, action: "case_status_update", target: caseId, detail: `→ ${status}` });
}

export async function addCaseInternalNote(caseId: ID, body: string) {
  const user = await requireUserOrThrow();
  if (!can(user.role, "cases.manage")) throw new Error("Forbidden");
  const svc = createServiceRoleClient();
  const { error } = await svc.from("case_internal_notes").insert({ case_id: caseId, author_id: user.id, body });
  if (error) throw new Error(error.message);
}

// ── Tickets ──────────────────────────────────────────────────────────────────
export async function postTicketMessage(ticketId: ID, body: string, internal = false) {
  const user = await requireUserOrThrow();
  const svc = createServiceRoleClient();

  const { data: ticket } = await svc.from("tickets").select("client_id").eq("id", ticketId).maybeSingle();
  if (!ticket) throw new Error("Ticket not found");
  assertClientScope(user, ticket.client_id);
  if (internal && user.role === "client") throw new Error("Forbidden"); // clients can't post internal notes

  const { error } = await svc.from("ticket_messages").insert({
    ticket_id: ticketId,
    author_id: user.id,
    body,
    internal,
  });
  if (error) throw new Error(error.message);

  // Move the ticket to the other party's court (skip for internal notes).
  if (!internal) {
    await svc
      .from("tickets")
      .update({ status: user.role === "client" ? "waiting_firm" : "waiting_client", updated_at: new Date().toISOString() })
      .eq("id", ticketId);
  }
}

// ── Orders & intake ──────────────────────────────────────────────────────────
export async function createCaseFromService(serviceId: ID) {
  const user = await requireUserOrThrow();
  if (user.role !== "client" || !user.clientId) throw new Error("Forbidden");
  const svc = createServiceRoleClient();

  const { data: service } = await svc.from("service_catalogue").select("*").eq("id", serviceId).maybeSingle();
  if (!service) throw new Error("Service not found");

  const reference = `JRF-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const { data, error } = await svc
    .from("cases")
    .insert({
      reference,
      client_id: user.clientId,
      service_id: serviceId,
      service_title: service.title,
      category: service.category,
      status: "new_request",
      priority: "normal",
      progress_percent: 5,
      timeline: [{ key: "ordered", label: "Order received", status: "current" }],
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await svc.from("service_orders").insert({ client_id: user.clientId, service_id: serviceId });
  // TODO: generate the required-document checklist + notify staff (in-app/email).
  return { id: data.id as string };
}

export async function submitIntake(kind: "company" | "bank", payload: Record<string, string>) {
  const user = await requireUserOrThrow();
  if (user.role !== "client" || !user.clientId) throw new Error("Forbidden");
  const svc = createServiceRoleClient();

  if (kind === "bank") {
    const { error } = await svc.from("bank_account_intakes").insert({
      client_id: user.clientId,
      company_id: payload.company || null,
      payload,
    });
    if (error) throw new Error(error.message);
  } else {
    const { error } = await svc.from("company_registration_intakes").insert({
      client_id: user.clientId,
      jurisdiction: payload.jurisdiction || "Hong Kong",
      payload,
    });
    if (error) throw new Error(error.message);
  }
}

// ── Payments ─────────────────────────────────────────────────────────────────
export async function recordOfflinePayment(invoiceId: ID, method: PaymentMethod, amount: number) {
  const user = await requireUserOrThrow();
  if (!can(user.role, "payments.reconcile")) throw new Error("Forbidden");
  const svc = createServiceRoleClient();

  const { data: inv } = await svc
    .from("invoices")
    .select("client_id, currency, amount, amount_paid")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!inv) throw new Error("Invoice not found");

  const newPaid = Number(inv.amount_paid) + amount;
  const status = newPaid >= Number(inv.amount) ? "paid" : "partially_paid";

  const { error: payErr } = await svc.from("payments").insert({
    invoice_id: invoiceId,
    client_id: inv.client_id,
    method,
    amount,
    currency: inv.currency,
    status: "succeeded",
    recorded_by: user.id,
  });
  if (payErr) throw new Error(payErr.message);

  const { error: invErr } = await svc.from("invoices").update({ amount_paid: newPaid, status }).eq("id", invoiceId);
  if (invErr) throw new Error(invErr.message);

  await recordAudit({ actor: user, action: "payment_status_change", target: invoiceId, detail: `+${amount} (${method})` });
}

/**
 * Apply a confirmed Stripe payment. Called by the webhook (no user session — the
 * Stripe signature is the trust boundary, verified in the route). Idempotent on
 * the payment reference so retried webhook deliveries don't double-count.
 */
export async function applyStripePayment(input: { invoiceId: ID; amount: number; reference: string }) {
  const svc = createServiceRoleClient();

  const { data: existing } = await svc.from("payments").select("id").eq("reference", input.reference).maybeSingle();
  if (existing) return { duplicate: true };

  const { data: inv } = await svc
    .from("invoices")
    .select("client_id, currency, amount, amount_paid, number")
    .eq("id", input.invoiceId)
    .maybeSingle();
  if (!inv) throw new Error("Invoice not found for Stripe payment");

  const newPaid = Number(inv.amount_paid) + input.amount;
  const status = newPaid >= Number(inv.amount) ? "paid" : "partially_paid";

  const { error: payErr } = await svc.from("payments").insert({
    invoice_id: input.invoiceId,
    client_id: inv.client_id,
    method: "stripe",
    amount: input.amount,
    currency: inv.currency,
    status: "succeeded",
    reference: input.reference,
  });
  if (payErr) throw new Error(payErr.message);

  const { error: invErr } = await svc.from("invoices").update({ amount_paid: newPaid, status }).eq("id", input.invoiceId);
  if (invErr) throw new Error(invErr.message);

  await recordAudit({
    actor: { id: "", fullName: "System (Stripe)", role: "super_admin" },
    action: "payment_status_change",
    target: inv.number,
    detail: `Stripe payment ${formatMoney(input.amount, inv.currency as Currency)} → ${status}`,
  });

  await notify(svc, {
    clientId: inv.client_id,
    toFinance: true,
    kind: "payment_received",
    title: "Payment received",
    body: `Invoice ${inv.number} — ${formatMoney(input.amount, inv.currency as Currency)} received.`,
    href: "/invoices",
  });

  // Email the client's primary contact.
  const { data: client } = await svc
    .from("clients")
    .select("email, primary_contact_name")
    .eq("id", inv.client_id)
    .maybeSingle();
  if (client?.email) {
    const tpl = emailTemplates.paymentReceived(
      client.primary_contact_name ?? "Client",
      inv.number,
      formatMoney(input.amount, inv.currency as Currency),
    );
    await sendEmail({ to: client.email, ...tpl });
  }

  return { duplicate: false, status };
}
