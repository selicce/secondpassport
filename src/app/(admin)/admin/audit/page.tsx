import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/misc";
import { requireStaff } from "@/lib/session";
import { can, ROLE_LABELS } from "@/lib/rbac";
import { listAuditLog } from "@/lib/data";
import type { AuditAction } from "@/lib/types";

export const metadata = { title: "Audit Logs" };

const ACTION_LABEL: Record<AuditAction, string> = {
  login: "Login",
  logout: "Logout",
  login_failed: "Failed login",
  document_upload: "Document upload",
  document_download: "Document download",
  document_delete: "Document delete",
  document_review: "Document review",
  invoice_create: "Invoice created",
  payment_status_change: "Payment status change",
  case_status_update: "Case status update",
  role_change: "Role change",
  permission_change: "Permission change",
};

const SENSITIVE: AuditAction[] = ["role_change", "permission_change", "document_delete", "login_failed"];

export default async function AdminAuditPage() {
  const user = await requireStaff();
  if (!can(user.role, "audit.view")) redirect("/admin");
  const entries = await listAuditLog();

  return (
    <div className="space-y-6">
      <PageHeader title="Audit Logs" description="Immutable record of sensitive actions across the portal." />
      <Table>
        <THead>
          <TR><TH>When</TH><TH>Actor</TH><TH>Action</TH><TH>Target</TH><TH>Detail</TH><TH>IP</TH></TR>
        </THead>
        <TBody>
          {entries.map((e) => (
            <TR key={e.id}>
              <TD className="whitespace-nowrap text-muted-foreground">{new Date(e.createdAt).toLocaleString("en-GB")}</TD>
              <TD>
                <p className="font-medium">{e.actorName}</p>
                <p className="text-xs text-muted-foreground">{ROLE_LABELS[e.actorRole]}</p>
              </TD>
              <TD>
                <Badge tone={SENSITIVE.includes(e.action) ? "danger" : "neutral"}>{ACTION_LABEL[e.action]}</Badge>
              </TD>
              <TD className="text-muted-foreground">{e.target ?? "—"}</TD>
              <TD className="max-w-[260px] truncate text-muted-foreground">{e.detail ?? "—"}</TD>
              <TD className="font-mono text-xs text-muted-foreground">{e.ip ?? "—"}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
