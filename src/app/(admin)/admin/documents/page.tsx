import { redirect } from "next/navigation";
import { FileText, Inbox } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, Badge } from "@/components/ui/badge";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { DocReview } from "@/components/forms/doc-review";
import { requireStaff } from "@/lib/session";
import { can } from "@/lib/rbac";
import { listAllDocuments, listClients } from "@/lib/data";
import { DOCUMENT_STATUS, DOCUMENT_CATEGORY } from "@/lib/labels";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Documents" };

export default async function AdminDocumentsPage() {
  const user = await requireStaff();
  if (!can(user.role, "documents.view")) redirect("/admin");
  const canReview = can(user.role, "documents.review");

  const [docs, clients] = await Promise.all([listAllDocuments(), listClients()]);
  const clientName = (id: string) => clients.find((c) => c.id === id)?.displayName ?? "—";
  const reviewQueue = docs.filter((d) => ["uploaded", "under_review"].includes(d.status));
  const actionNeeded = docs.filter((d) => ["requested", "rejected", "replacement_required"].includes(d.status));

  return (
    <div className="space-y-8">
      <PageHeader title="Documents" description="Review client submissions and manage deliverables." />

      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-semibold"><Inbox className="size-4 text-primary" /> Review queue ({reviewQueue.length})</h2>
        {reviewQueue.length === 0 ? (
          <EmptyState title="Nothing to review" description="Client submissions awaiting review will appear here." />
        ) : (
          <div className="space-y-3">
            {reviewQueue.map((d) => (
              <Card key={d.id}>
                <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <FileText className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{d.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {clientName(d.clientId)} · {DOCUMENT_CATEGORY[d.category]} · {d.fileName} · {formatDate(d.uploadedAt)}
                      </p>
                      <div className="mt-1"><StatusBadge meta={DOCUMENT_STATUS[d.status]} /></div>
                    </div>
                  </div>
                  {canReview ? (
                    <DocReview documentId={d.id} initialStatus={d.status} />
                  ) : (
                    <Badge tone="neutral">View only</Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Awaiting client ({actionNeeded.length})</h2>
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {actionNeeded.map((d) => (
              <div key={d.id} className="flex items-center justify-between px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.title}</p>
                  <p className="text-xs text-muted-foreground">{clientName(d.clientId)} · {DOCUMENT_CATEGORY[d.category]}</p>
                </div>
                <StatusBadge meta={DOCUMENT_STATUS[d.status]} />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
