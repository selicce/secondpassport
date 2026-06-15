import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, FileText, Receipt, Briefcase, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { DataList, PageHeader, Separator } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Disclaimer } from "@/components/disclaimer";
import { requireClient } from "@/lib/session";
import {
  getCompany,
  listDocumentsForClient,
  listInvoicesForClient,
  listCasesForClient,
} from "@/lib/data";
import { BANK_STATUS, ACCOUNTING_STATUS, CASE_STATUS, INVOICE_STATUS, DOCUMENT_STATUS } from "@/lib/labels";
import { formatDate, formatMoney } from "@/lib/utils";

const PERSON_ROLE: Record<string, string> = {
  shareholder: "Shareholder",
  director: "Director",
  ubo: "Ultimate Beneficial Owner",
  secretary: "Company Secretary",
  legal_rep: "Legal Representative",
  supervisor: "Supervisor",
};

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireClient();
  const { id } = await params;
  const company = await getCompany(id);
  if (!company || company.clientId !== user.clientId) notFound(); // client-level isolation

  const [docs, invoices, cases] = await Promise.all([
    listDocumentsForClient(user.clientId),
    listInvoicesForClient(user.clientId),
    listCasesForClient(user.clientId),
  ]);
  const relatedDocs = docs.filter((d) => d.companyId === company.id);
  const relatedInvoices = invoices.filter((i) => i.companyId === company.id);
  const relatedCases = cases.filter((c) => c.companyId === company.id);

  return (
    <div className="space-y-6">
      <Link href="/companies" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All companies
      </Link>

      <PageHeader
        eyebrow={company.jurisdiction}
        title={company.name}
        description={company.nameChinese}
        actions={<Button variant="secondary">Request a change</Button>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader><CardTitle>Company details</CardTitle></CardHeader>
            <CardContent>
              <DataList
                items={[
                  { label: "Status", value: <Badge tone={company.status === "active" ? "success" : "warning"}>{company.status.replace("_", " ")}</Badge> },
                  { label: "Jurisdiction", value: company.jurisdiction },
                  { label: "Company number", value: company.companyNumber },
                  { label: "Incorporation date", value: formatDate(company.incorporationDate) },
                  { label: "Registered address", value: company.registeredAddress },
                  { label: "Business scope", value: company.businessScope },
                  { label: "Renewal date", value: company.renewalDate ? formatDate(company.renewalDate) : "—" },
                  { label: "Accounting status", value: <StatusBadge meta={ACCOUNTING_STATUS[company.accountingStatus]} /> },
                  { label: "Bank account status", value: <StatusBadge meta={BANK_STATUS[company.bankAccountStatus]} /> },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Users className="size-4 text-muted-foreground" /> Officers &amp; ownership</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {company.people.map((p, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border border-border px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {PERSON_ROLE[p.role]} {p.type ? `· ${p.type === "corporate" ? "Corporate" : "Individual"}` : ""}
                      {p.nationality ? ` · ${p.nationality}` : ""}
                    </p>
                  </div>
                  {typeof p.sharePercent === "number" && (
                    <Badge tone="gold">{p.sharePercent}%</Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Disclaimer variant="subtle">
            <span className="flex items-center gap-2 font-medium"><Info className="size-4" /> Official details are maintained by JR &amp; Firm.</span>
            To amend any registered particulars, please submit a change request. Changes are
            effective only after JR &amp; Firm processes the relevant statutory filings.
          </Disclaimer>
        </div>

        <div className="space-y-6">
          <RelatedList title="Related cases" icon={<Briefcase className="size-4" />} empty="No cases">
            {relatedCases.map((c) => (
              <Link key={c.id} href={`/cases/${c.id}`} className="flex items-center justify-between gap-2 px-5 py-3 hover:bg-accent">
                <span className="truncate text-sm">{c.serviceTitle}</span>
                <StatusBadge meta={CASE_STATUS[c.status]} />
              </Link>
            ))}
          </RelatedList>

          <RelatedList title="Related documents" icon={<FileText className="size-4" />} empty="No documents">
            {relatedDocs.map((d) => (
              <div key={d.id} className="flex items-center justify-between gap-2 px-5 py-3">
                <span className="truncate text-sm">{d.title}</span>
                <StatusBadge meta={DOCUMENT_STATUS[d.status]} />
              </div>
            ))}
          </RelatedList>

          <RelatedList title="Related invoices" icon={<Receipt className="size-4" />} empty="No invoices">
            {relatedInvoices.map((i) => (
              <Link key={i.id} href={`/invoices/${i.id}`} className="flex items-center justify-between gap-2 px-5 py-3 hover:bg-accent">
                <span className="truncate text-sm">{i.number} · {formatMoney(i.amount, i.currency)}</span>
                <StatusBadge meta={INVOICE_STATUS[i.status]} />
              </Link>
            ))}
          </RelatedList>
        </div>
      </div>
    </div>
  );
}

function RelatedList({
  title,
  icon,
  empty,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  empty: string;
  children: React.ReactNode;
}) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : !!children;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">{icon} {title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {hasChildren ? <div className="divide-y divide-border">{children}</div> : (
          <p className="px-5 py-4 text-sm text-muted-foreground">{empty}</p>
        )}
      </CardContent>
    </Card>
  );
}
