import "server-only";

/**
 * Transactional email.
 *
 * Implemented against provider REST APIs (no SDK dependency) so any of Resend /
 * SendGrid / Postmark works by setting EMAIL_PROVIDER + the matching key. In demo
 * mode (or EMAIL_PROVIDER="console") it logs instead of sending, so flows are
 * testable without credentials.
 */
export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail(message: EmailMessage): Promise<{ id: string; delivered: boolean }> {
  const provider = process.env.EMAIL_PROVIDER ?? "console";
  const from = process.env.EMAIL_FROM ?? "JR & Firm <noreply@jrandfirm.com>";
  const to = Array.isArray(message.to) ? message.to : [message.to];
  const replyTo = message.replyTo ?? process.env.EMAIL_SUPPORT;

  if (provider === "console" || process.env.NEXT_PUBLIC_DEMO_MODE !== "false") {
    // eslint-disable-next-line no-console
    console.info(`[email:console] from=${from} to=${to.join(", ")} subject="${message.subject}"`);
    return { id: "demo-email", delivered: false };
  }

  try {
    switch (provider) {
      case "resend":
        return await sendViaResend({ from, to, replyTo, message });
      case "sendgrid":
        return await sendViaSendGrid({ from, to, replyTo, message });
      case "postmark":
        return await sendViaPostmark({ from, to, replyTo, message });
      default:
        throw new Error(`Unknown EMAIL_PROVIDER "${provider}"`);
    }
  } catch (err) {
    // Email must never break the request that triggered it; log and continue.
    // eslint-disable-next-line no-console
    console.error("[email] send failed:", err);
    return { id: "error", delivered: false };
  }
}

interface SendArgs {
  from: string;
  to: string[];
  replyTo?: string;
  message: EmailMessage;
}

async function sendViaResend({ from, to, replyTo, message }: SendArgs) {
  const key = requireKey("RESEND_API_KEY");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject: message.subject, html: message.html, reply_to: replyTo }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Resend ${res.status}: ${JSON.stringify(body)}`);
  return { id: (body as { id?: string }).id ?? "sent", delivered: true };
}

async function sendViaSendGrid({ from, to, replyTo, message }: SendArgs) {
  const key = requireKey("SENDGRID_API_KEY");
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      personalizations: [{ to: to.map((email) => ({ email })) }],
      from: parseAddress(from),
      reply_to: replyTo ? { email: replyTo } : undefined,
      subject: message.subject,
      content: [{ type: "text/html", value: message.html }],
    }),
  });
  if (!res.ok) throw new Error(`SendGrid ${res.status}: ${await res.text()}`);
  return { id: res.headers.get("x-message-id") ?? "sent", delivered: true };
}

async function sendViaPostmark({ from, to, replyTo, message }: SendArgs) {
  const key = requireKey("POSTMARK_SERVER_TOKEN");
  const res = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: { "X-Postmark-Server-Token": key, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      From: from,
      To: to.join(", "),
      ReplyTo: replyTo,
      Subject: message.subject,
      HtmlBody: message.html,
      MessageStream: "outbound",
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Postmark ${res.status}: ${JSON.stringify(body)}`);
  return { id: (body as { MessageID?: string }).MessageID ?? "sent", delivered: true };
}

function requireKey(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required for the selected email provider.`);
  return v;
}

/** "Name <email@x.com>" → { email, name }; "email@x.com" → { email }. */
function parseAddress(addr: string): { email: string; name?: string } {
  const m = addr.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  return m ? { name: m[1] || undefined, email: m[2] } : { email: addr.trim() };
}

/** Semantic templates keep call sites declarative and centralize copy. */
export const emailTemplates = {
  documentRequested: (clientName: string, docTitle: string) => ({
    subject: "Action required: a document has been requested",
    html: wrap(
      `<p>Dear ${esc(clientName)},</p><p>JR &amp; Firm has requested the following document for your case: <strong>${esc(docTitle)}</strong>. Please sign in to your portal to upload it securely.</p>`,
    ),
  }),
  invoiceIssued: (clientName: string, invoiceNumber: string) => ({
    subject: `New invoice ${invoiceNumber} from JR & Firm`,
    html: wrap(`<p>Dear ${esc(clientName)},</p><p>Invoice <strong>${esc(invoiceNumber)}</strong> is now available in your portal.</p>`),
  }),
  paymentReceived: (clientName: string, invoiceNumber: string, amount: string) => ({
    subject: `Payment received — invoice ${invoiceNumber}`,
    html: wrap(
      `<p>Dear ${esc(clientName)},</p><p>We have received your payment of <strong>${esc(amount)}</strong> for invoice <strong>${esc(invoiceNumber)}</strong>. Thank you.</p>`,
    ),
  }),
  newInquiry: (subject: string) => ({
    subject: `[Portal] New client inquiry: ${subject}`,
    html: wrap(`<p>A new inquiry has been submitted via the client portal.</p>`),
  }),
};

function wrap(inner: string): string {
  return `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#1a2433;line-height:1.6">
    <div style="border-bottom:2px solid #b8924a;padding-bottom:8px;margin-bottom:16px;font-weight:600;font-size:18px">JR &amp; Firm</div>
    ${inner}
    <p style="margin-top:24px;color:#6b7280;font-size:12px">This is an automated message from the JR &amp; Firm Client Portal. Please do not reply directly.</p>
  </div>`;
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
