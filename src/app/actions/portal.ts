"use server";
import { revalidatePath } from "next/cache";
import { isDemoMode, getInvoice, getClientById } from "@/lib/data";
import * as m from "@/lib/data/mutations";
import { createCheckoutSession } from "@/lib/payments/stripe";
import type { CaseStatus, DocumentStatus, PaymentMethod } from "@/lib/types";

/**
 * Server actions invoked by client components. In demo mode each is a no-op that
 * returns success (the component shows simulated feedback). With
 * NEXT_PUBLIC_DEMO_MODE="false" they perform the real Supabase mutation via
 * src/lib/data/mutations.ts (authz + audit enforced there).
 */

export async function uploadDocumentAction(formData: FormData) {
  if (isDemoMode()) return { ok: true };
  const file = formData.get("file");
  if (!(file instanceof File)) throw new Error("No file provided");
  await m.uploadDocument({
    file,
    clientId: String(formData.get("clientId") ?? ""),
    caseId: optional(formData.get("caseId")),
    companyId: optional(formData.get("companyId")),
    requestId: optional(formData.get("requestId")),
    category: String(formData.get("category") ?? "other"),
    title: String(formData.get("title") ?? file.name),
  });
  revalidatePath("/documents");
  return { ok: true };
}

export async function downloadDocumentAction(documentId: string): Promise<{ url: string }> {
  if (isDemoMode()) return { url: "" }; // demo: no real file; component shows a notice
  return m.createSignedDownloadUrl(documentId);
}

export async function reviewDocumentAction(documentId: string, status: DocumentStatus, comment?: string) {
  if (isDemoMode()) return { ok: true };
  await m.reviewDocument(documentId, status, comment);
  revalidatePath("/admin/documents");
  return { ok: true };
}

export async function updateCaseStatusAction(caseId: string, status: CaseStatus) {
  if (isDemoMode()) return { ok: true };
  await m.updateCaseStatus(caseId, status);
  revalidatePath(`/admin/cases/${caseId}`);
  return { ok: true };
}

export async function addCaseNoteAction(caseId: string, body: string) {
  if (isDemoMode()) return { ok: true };
  await m.addCaseInternalNote(caseId, body);
  revalidatePath(`/admin/cases/${caseId}`);
  return { ok: true };
}

export async function postTicketMessageAction(ticketId: string, body: string, internal = false) {
  if (isDemoMode()) return { ok: true };
  await m.postTicketMessage(ticketId, body, internal);
  revalidatePath(`/messages/${ticketId}`);
  revalidatePath(`/admin/tickets/${ticketId}`);
  return { ok: true };
}

/** Start a Stripe Checkout session and return the hosted URL. */
export async function startCheckoutAction(invoiceId: string): Promise<{ url: string; demo: boolean }> {
  const invoice = await getInvoice(invoiceId);
  if (!invoice) throw new Error("Invoice not found");
  const client = await getClientById(invoice.clientId);
  return createCheckoutSession(invoice, { customerEmail: client?.email });
}

export async function recordOfflinePaymentAction(invoiceId: string, method: PaymentMethod, amount: number) {
  if (isDemoMode()) return { ok: true };
  await m.recordOfflinePayment(invoiceId, method, amount);
  revalidatePath("/admin/invoices");
  return { ok: true };
}

function optional(v: FormDataEntryValue | null): string | undefined {
  const s = v == null ? "" : String(v);
  return s.length ? s : undefined;
}
