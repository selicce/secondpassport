import Link from "next/link";
import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { Avatar, PageHeader } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/session";
import { listClients, listAllCompanies, listAllCases } from "@/lib/data";
import { LOCALE_LABELS } from "@/lib/i18n/config";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Clients" };

const STATUS_TONE = { active: "success", onboarding: "info", dormant: "neutral" } as const;
const RISK_TONE = { low: "success", medium: "warning", high: "danger" } as const;

export default async function AdminClientsPage() {
  await requireStaff();
  const [clients, companies, cases] = await Promise.all([listClients(), listAllCompanies(), listAllCases()]);
  const count = (clientId: string, arr: { clientId: string }[]) => arr.filter((x) => x.clientId === clientId).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description={`${clients.length} client accounts.`}
        actions={<Button variant="primary">Add client</Button>}
      />

      <Table>
        <THead>
          <TR>
            <TH>Client</TH>
            <TH>Status</TH>
            <TH>Risk</TH>
            <TH>Companies</TH>
            <TH>Cases</TH>
            <TH>Language</TH>
            <TH>Since</TH>
          </TR>
        </THead>
        <TBody>
          {clients.map((c) => (
            <TR key={c.id}>
              <TD>
                <Link href={`/admin/clients/${c.id}`} className="flex items-center gap-3 hover:underline">
                  <Avatar name={c.primaryContactName} size={34} />
                  <div>
                    <p className="font-medium">{c.displayName}</p>
                    <p className="text-xs text-muted-foreground">{c.primaryContactName} · {c.email}</p>
                  </div>
                </Link>
              </TD>
              <TD><Badge tone={STATUS_TONE[c.status]}>{c.status}</Badge></TD>
              <TD>{c.riskRating ? <Badge tone={RISK_TONE[c.riskRating]}>{c.riskRating}</Badge> : "—"}</TD>
              <TD className="tabular-nums">{count(c.id, companies)}</TD>
              <TD className="tabular-nums">{count(c.id, cases)}</TD>
              <TD className="text-muted-foreground">{LOCALE_LABELS[c.preferredLanguage]}</TD>
              <TD className="text-muted-foreground">{formatDate(c.createdAt)}</TD>
            </TR>
          ))}
        </TBody>
      </Table>
    </div>
  );
}
