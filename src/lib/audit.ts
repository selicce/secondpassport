import "server-only";
import type { AuditAction, UserProfile } from "@/lib/types";

/**
 * Append-only audit logging.
 *
 * Sensitive actions (login, document upload/download/delete, invoice creation,
 * payment status change, case status update, role/permission changes) must call
 * this. In production it inserts into the `audit_logs` table via the
 * service-role client so entries cannot be tampered with by the acting user.
 */
export interface AuditInput {
  /** For system events (e.g. a Stripe webhook), pass id: "" so actor_id is null. */
  actor: { id: string; fullName: string; role: UserProfile["role"] };
  action: AuditAction;
  target?: string;
  detail?: string;
  ip?: string;
}

export async function recordAudit(input: AuditInput): Promise<void> {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "false") {
    // eslint-disable-next-line no-console
    console.info(
      `[audit] ${input.actor.role}:${input.actor.fullName} → ${input.action}` +
        (input.target ? ` (${input.target})` : ""),
    );
    return;
  }

  // ── Production: append-only insert via the service role ────────────────────
  const { createServiceRoleClient } = await import("@/lib/supabase/server");
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("audit_logs").insert({
    actor_id: input.actor.id || null, // "" → null for system actors
    actor_name: input.actor.fullName,
    actor_role: input.actor.role,
    action: input.action,
    target: input.target ?? null,
    detail: input.detail ?? null,
    ip: input.ip ?? null,
  });
  if (error) {
    // Auditing must not break the originating action; log and move on.
    // eslint-disable-next-line no-console
    console.error("[audit] insert failed:", error.message);
  }
}
