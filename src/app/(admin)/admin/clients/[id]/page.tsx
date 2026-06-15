import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2, Briefcase, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Avatar, DataList, PageHeader } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/session";
import {
  getClientById,
  listCompaniesForClient,
  listCasesForClient,
  listInvoicesForClient,
} from "@/lib/data";
import { CASE_STATUS, INVOICE_STATUS, BANK_STATUS } from "@/lib/labels";
import { LOCALE_LABELS } from "@/lib/i18n/config";
import { formatDate, formatMoney } from "@/lib/utils";

export default async function AdminClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const client = await getClientById(id);
  if (!client) notFound();

  const [companies, cases, invoices] = await Promise.all([
    listCompaniesForClient(client.id),
    listCasesForClient(client.id),
    listInvoicesForClient(client.id),
  ]);

  return (
    <div className="space-y-6">
      <Link href="/admin/clients" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All clients
      </Link>

      <PageHeader
        title={client.displayName}
        description={`Primary contact: ${client.primaryContactName}`}
        actions={<><Button variant="outline">Message</Button><Button variant="primary">Create case</Button></>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="space-y-4 p-5">
            <div className="flex items-center gap-3">
              <Avatar name={client.primaryContactName} size={48} />
              <div>
                <p className="font-medium">{client.primaryContactName}</p>
                <Badge tone={client.status === "active" ? "success" : "info"}>{client.status}</Badge>
              </div>
            </div>
            <DataList
              items={[
                { label: "Email", value: client.email },
                { label: "Phone", value: client.phone },
                { label: "Nationality", value: client.nationality },
                { label: "Residence", value: client.countryOfResidence },
                { label: "Language", value: LOCALE_LABELS[client.preferredLanguage] },
                { label: "Risk rating", value: client.riskRating ?? "—" },
                { label: "Client since", value: formatDate(client.createdAt) },
              ]}
            />
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="size-4 text-muted-foreground" /> Companies ({companies.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {companies.map((co) => (
                  <li key={co.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium">{co.name}</p>
                      <p className="text-xs text-muted-foreground">{co.jurisdiction} · {co.companyNumber ?? "in formation"}</p>
                    </div>
                    <StatusBadge meta={BANK_STATUS[co.bankAccountStatus]} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Briefcase className="size-4 text-muted-foreground" /> Cases ({cases.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {cases.map((c) => (
                  <li key={c.id}>
                    <Link href={`/admin/cases/${c.id}`} className="flex items-center justify-between px-5 py-3 hover:bg-accent">
                      <div>
                        <p className="text-sm font-medium">{c.serviceTitle}</p>
                        <p className="text-xs text-muted-foreground">{c.reference}</p>
                      </div>
                      <StatusBadge meta={CASE_STATUS[c.status]} />
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Receipt className="size-4 text-muted-foreground" /> Invoices ({invoices.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-border">
                {invoices.map((i) => (
                  <li key={i.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium">{i.number}</p>
                      <p className="text-xs text-muted-foreground">{formatMoney(i.amount, i.currency)} · due {formatDate(i.dueDate)}</p>
                    </div>
                    <StatusBadge meta={INVOICE_STATUS[i.status]} />
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
