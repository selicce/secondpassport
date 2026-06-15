import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, FileText, Receipt, FilePlus2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { DataList, PageHeader, ProgressBar, Avatar } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { CaseTimeline } from "@/components/case-timeline";
import { CaseStatusControl } from "@/components/forms/case-status-control";
import { requireStaff } from "@/lib/session";
import { can } from "@/lib/rbac";
import {
  getCase,
  getClientById,
  getCompany,
  getUserById,
  listDocumentsForCase,
  listInvoicesForClient,
} from "@/lib/data";
import { CASE_STATUS, INVOICE_STATUS, DOCUMENT_STATUS } from "@/lib/labels";
import { formatDate, formatMoney } from "@/lib/utils";

const PRIORITY_TONE = { low: "neutral", normal: "info", high: "warning", urgent: "danger" } as const;

export default async function AdminCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireStaff();
  const { id } = await params;
  const record = await getCase(id);
  if (!record) notFound();

  const [client, company, manager, docs, allInvoices] = await Promise.all([
    getClientById(record.clientId),
    record.companyId ? getCompany(record.companyId) : Promise.resolve(undefined),
    record.assignedManagerId ? getUserById(record.assignedManagerId) : Promise.resolve(undefined),
    listDocumentsForCase(record.id),
    listInvoicesForClient(record.clientId),
  ]);
  const invoices = allInvoices.filter((i) => i.caseId === record.id);
  const canManage = can(user.role, "cases.manage");

  return (
    <div className="space-y-6">
      <Link href="/admin/cases" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All cases
      </Link>

      <PageHeader
        eyebrow={record.reference}
        title={record.serviceTitle}
        description={client ? `Client: ${client.displayName}` : undefined}
        actions={
          <>
            <Badge tone={PRIORITY_TONE[record.priority]}>{record.priority}</Badge>
            <StatusBadge meta={CASE_STATUS[record.status]} />
          </>
        }
      />

      {canManage && (
        <Card>
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1">
              <p className="mb-1 text-sm font-medium">Update case status</p>
              <CaseStatusControl caseId={record.id} initial={record.status} />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm"><FilePlus2 className="size-4" /> Request document</Button>
              <Button variant="outline" size="sm"><Receipt className="size-4" /> Create invoice</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Progress</span>
                <span className="tabular-nums text-muted-foreground">{record.progressPercent}%</span>
              </div>
              <ProgressBar className="mt-2" value={record.progressPercent} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Timeline</CardTitle></CardHeader>
            <CardContent><CaseTimeline steps={record.timeline} /></CardContent>
          </Card>

          {/* Internal notes — staff only */}
          <Card className="border-warning/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-warning"><Lock className="size-4" /> Internal notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {record.internalNotes?.length ? (
                record.internalNotes.map((n) => (
                  <div key={n.id} className="rounded-md bg-warning/5 p-3 text-sm">
                    <p>{n.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(n.createdAt)}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No internal notes yet.</p>
              )}
              <Textarea rows={2} placeholder="Add an internal note (not visible to the client)…" />
              <div className="flex justify-end"><Button size="sm" variant="secondary">Add note</Button></div>
            </CardContent>
          </Card>

          {docs.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="size-4 text-muted-foreground" /> Documents</CardTitle></CardHeader>
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
            <CardHeader><CardTitle className="text-sm">Details</CardTitle></CardHeader>
            <CardContent>
              <DataList
                items={[
                  { label: "Client", value: client ? <Link className="text-primary hover:underline" href={`/admin/clients/${client.id}`}>{client.displayName}</Link> : "—" },
                  { label: "Company", value: company?.name ?? "—" },
                  { label: "Started", value: formatDate(record.startDate) },
                  { label: "Est. completion", value: formatDate(record.estimatedCompletion) },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Assigned to</CardTitle></CardHeader>
            <CardContent className="flex items-center gap-3">
              {manager ? (
                <>
                  <Avatar name={manager.fullName} color={manager.avatarColor} size={36} />
                  <div>
                    <p className="text-sm font-medium">{manager.fullName}</p>
                    <p className="text-xs text-muted-foreground">{manager.email}</p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Unassigned</p>
              )}
            </CardContent>
          </Card>

          {invoices.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Invoices</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {invoices.map((i) => (
                  <div key={i.id} className="flex items-center justify-between text-sm">
                    <span>{i.number} · {formatMoney(i.amount, i.currency)}</span>
                    <StatusBadge meta={INVOICE_STATUS[i.status]} />
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
