import Link from "next/link";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/misc";
import { ProgressBar } from "@/components/ui/misc";
import { requireStaff } from "@/lib/session";
import { listAllCases, listClients, listStaffUsers } from "@/lib/data";
import { CASE_STATUS } from "@/lib/labels";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Cases" };

const PRIORITY_TONE = { low: "neutral", normal: "info", high: "warning", urgent: "danger" } as const;

export default async function AdminCasesPage() {
  await requireStaff();
  const [cases, clients, staff] = await Promise.all([listAllCases(), listClients(), listStaffUsers()]);
  const clientName = (id: string) => clients.find((c) => c.id === id)?.displayName ?? "—";
  const staffName = (id?: string) => staff.find((s) => s.id === id)?.fullName ?? "Unassigned";

  const sorted = [...cases].sort((a, b) => {
    const order = { urgent: 0, high: 1, normal: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Cases" description={`${cases.length} service cases across all clients.`} />

      <Table>
        <THead>
          <TR>
            <TH>Reference</TH>
            <TH>Client</TH>
            <TH>Service</TH>
            <TH>Manager</TH>
            <TH>Priority</TH>
            <TH>Progress</TH>
            <TH>Status</TH>
            <TH>Due</TH>
          </TR>
        </THead>
        <TBody>
          {sorted.map((c) => (
            <TR key={c.id}>
              <TD>
                <Link href={`/admin/cases/${c.id}`} className="font-medium text-primary hover:underline">{c.reference}</Link>
              </TD>
              <TD className="text-muted-foreground">{clientName(c.clientId)}</TD>
              <TD className="max-w-[200px] truncate">{c.serviceTitle}</TD>
              <TD className="text-muted-foreground">{staffName(c.assignedManagerId)}</TD>
              <TD><Badge tone={PRIORITY_TONE[c.priority]}>{c.priority}</Badge></TD>
              <TD className="w-32">
                <div className="flex items-center gap-2">
                  <ProgressBar value={c.progressPercent} />
                  <span className="text-xs tabular-nums text-muted-foreground">{c.progressPercent}%</span>
                </div>
              </TD>
              <TD><StatusBadge meta={CASE_STATUS[c.status]} /></TD>
              <TD className="text-muted-foreground">{formatDate(c.estimatedCompletion)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
