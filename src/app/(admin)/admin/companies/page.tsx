import Link from "next/link";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader } from "@/components/ui/misc";
import { requireStaff } from "@/lib/session";
import { listAllCompanies, listClients } from "@/lib/data";
import { BANK_STATUS, ACCOUNTING_STATUS } from "@/lib/labels";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Companies" };

export default async function AdminCompaniesPage() {
  await requireStaff();
  const [companies, clients] = await Promise.all([listAllCompanies(), listClients()]);
  const clientName = (id: string) => clients.find((c) => c.id === id)?.displayName ?? "—";

  return (
    <div className="space-y-6">
      <PageHeader title="Companies" description={`${companies.length} entities under management.`} />
      <Table>
        <THead>
          <TR>
            <TH>Company</TH><TH>Client</TH><TH>Jurisdiction</TH><TH>Company no.</TH>
            <TH>Renewal</TH><TH>Bank</TH><TH>Accounting</TH>
          </TR>
        </THead>
        <TBody>
          {companies.map((c) => (
            <TR key={c.id}>
              <TD>
                <p className="font-medium">{c.name}</p>
                {c.status === "in_formation" && <Badge tone="warning">In formation</Badge>}
              </TD>
              <TD className="text-muted-foreground">
                <Link href={`/admin/clients/${c.clientId}`} className="hover:underline">{clientName(c.clientId)}</Link>
              </TD>
              <TD><Badge tone="info">{c.jurisdiction}</Badge></TD>
              <TD className="tabular-nums text-muted-foreground">{c.companyNumber ?? "—"}</TD>
              <TD className="text-muted-foreground">{formatDate(c.renewalDate)}</TD>
              <TD><StatusBadge meta={BANK_STATUS[c.bankAccountStatus]} /></TD>
              <TD><StatusBadge meta={ACCOUNTING_STATUS[c.accountingStatus]} /></TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
