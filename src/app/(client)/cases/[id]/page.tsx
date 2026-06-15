import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Receipt, MessagesSquare, UserCircle, Quote } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { ProgressBar, DataList, PageHeader } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { CaseTimeline } from "@/components/case-timeline";
import { requireClient } from "@/lib/session";
import {
  getCase,
  getCompany,
  getUserById,
  listDocumentsForCase,
  listInvoicesForClient,
  listTicketsForClient,
} from "@/lib/data";
import { CASE_STATUS, INVOICE_STATUS, DOCUMENT_STATUS, SERVICE_CATEGORY } from "@/lib/labels";
import { formatDate, formatMoney } from "@/lib/utils";

const PRIORITY_TONE = { low: "neutral", normal: "info", high: "warning", urgent: "danger" } as const;

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireClient();
  const { id } = await params;
  const record = await getCase(id);
  if (!record || record.clientId !== user.clientId) notFound();

  const [company, manager, docs, allInvoices, allTickets] = await Promise.all([
    record.companyId ? getCompany(record.companyId) : Promise.resolve(undefined),
    record.assignedManagerId ? getUserById(record.assignedManagerId) : Promise.resolve(undefined),
    listDocumentsForCase(record.id),
    listInvoicesForClient(user.clientId),
    listTicketsForClient(user.clientId),
  ]);
  const invoices = allInvoices.filter((i) => i.caseId === record.id);
  const tickets = allTickets.filter((t) => t.caseId === record.id);

  return (
    <div className="space-y-6">
      <Link href="/cases" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All services
      </Link>

      <PageHeader
        eyebrow={record.reference}
        title={record.serviceTitle}
        description={SERVICE_CATEGORY[record.category].blurb}
        actions={
          <>
            <StatusBadge meta={CASE_STATUS[record.status]} />
            <Badge tone={PRIORITY_TONE[record.priority]}>{record.priority} priority</Badge>
          </>
        }
      />

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Overall progress</span>
            <span className="tabular-nums text-muted-foreground">{record.progressPercent}%</span>
          </div>
          <ProgressBar className="mt-2" value={record.progressPercent} tone={record.progressPercent === 100 ? "success" : "primary"} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {record.clientFacingNote && (
            <Card>
              <CardContent className="flex gap-3 p-5">
                <Quote className="size-5 shrink-0 text-gold" />
                <div>
                  <p className="text-sm font-medium">Update from your case manager</p>
                  <p className="mt-1 text-sm text-muted-foreground">{record.clientFacingNote}</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle>Progress timeline</CardTitle></CardHeader>
            <CardContent><CaseTimeline steps={record.timeline} /></CardContent>
          </Card>

          {docs.length > 0 && (
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><FileText className="size-4 text-muted-foreground" /> Documents</CardTitle>
                <Link href="/documents" className="text-sm text-primary hover:underline">Manage</Link>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-border">
                  {docs.map((d) => (
                    <li key={d.id} className="flex items-center justify-between px-5 py-3">
                      <span className="truncate pr-3 text-sm">{d.title}</span>
                      <StatusBadge meta={DOCUMENT_STATUS[d.status]} />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Case details</CardTitle></CardHeader>
            <CardContent>
              <DataList
                items={[
                  { label: "Reference", value: record.reference },
                  { label: "Company", value: company ? <Link className="text-primary hover:underline" href={`/companies/${company.id}`}>{company.name}</Link> : "—" },
                  { label: "Started", value: formatDate(record.startDate) },
                  { label: "Est. completion", value: formatDate(record.estimatedCompletion) },
                ]}
              />
            </CardContent>
          </Card>

          {manager && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Your case manager</CardTitle></CardHeader>
              <CardContent className="flex items-center gap-3">
                <UserCircle className="size-9 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">{manager.fullName}</p>
                  <p className="text-xs text-muted-foreground">{manager.email}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {invoices.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="flex items-center gap-2 text-sm"><Receipt className="size-4" /> Invoices</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {invoices.map((i) => (
                  <Link key={i.id} href={`/invoices/${i.id}`} className="flex items-center justify-between text-sm hover:underline">
                    <span>{i.number}</span>
                    <StatusBadge meta={INVOICE_STATUS[i.status]} />
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

          <ButtonLink href="/messages" variant="secondary" className="w-full">
            <MessagesSquare className="size-4" /> Message about this case
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
