import * as React from "react";
import { FileText, AlertTriangle, Clock, FolderCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { PageHeader, EmptyState, Separator } from "@/components/ui/misc";
import { Disclaimer } from "@/components/disclaimer";
import { UploadControl } from "@/components/forms/upload-control";
import { DownloadButton } from "@/components/forms/download-button";
import { requireClient, getT } from "@/lib/session";
import { listDocumentsForClient } from "@/lib/data";
import { DOCUMENT_STATUS, DOCUMENT_CATEGORY } from "@/lib/labels";
import { formatDate } from "@/lib/utils";
import type { DocumentRecord } from "@/lib/types";

export const metadata = { title: "Documents" };

export default async function DocumentsPage() {
  const user = await requireClient();
  const t = await getT(user);
  const docs = await listDocumentsForClient(user.clientId);

  const actionRequired = docs.filter((d) => ["requested", "rejected", "replacement_required"].includes(d.status));
  const inReview = docs.filter((d) => ["uploaded", "under_review"].includes(d.status));
  const deliverables = docs.filter((d) => d.direction === "firm_deliverable");
  const approvedUploads = docs.filter((d) => d.direction === "client_upload" && d.status === "approved");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Document Center"
        description="Securely upload requested documents and download files prepared by JR & Firm."
      />

      <Disclaimer>{t.disclaimers.consent}</Disclaimer>

      {/* Quick upload */}
      <Card>
        <CardHeader className="pb-3"><CardTitle>Upload a document</CardTitle></CardHeader>
        <CardContent>
          <UploadControl label="Drag &amp; drop or browse to upload" variant="primary" context={{ clientId: user.clientId }} />
        </CardContent>
      </Card>

      {actionRequired.length > 0 && (
        <Section
          title="Action required"
          icon={<AlertTriangle className="size-4 text-warning" />}
          subtitle="These documents are needed to move your cases forward."
        >
          {actionRequired.map((d) => (
            <DocRow key={d.id} doc={d} clientId={user.clientId} showUpload />
          ))}
        </Section>
      )}

      <Section
        title="In review"
        icon={<Clock className="size-4 text-primary" />}
        subtitle="Submitted documents currently being checked by our team."
        emptyLabel="Nothing in review."
      >
        {inReview.map((d) => <DocRow key={d.id} doc={d} />)}
      </Section>

      <Section
        title="Documents from JR & Firm"
        icon={<FolderCheck className="size-4 text-success" />}
        subtitle="Completed company documents and official files for download."
        emptyLabel="No documents available yet."
      >
        {deliverables.map((d) => <DocRow key={d.id} doc={d} showDownload />)}
      </Section>

      {approvedUploads.length > 0 && (
        <Section title="Your approved uploads" icon={<FileText className="size-4 text-muted-foreground" />}>
          {approvedUploads.map((d) => <DocRow key={d.id} doc={d} />)}
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  icon,
  subtitle,
  emptyLabel,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  subtitle?: string;
  emptyLabel?: string;
  children: React.ReactNode;
}) {
  const arr = React.Children.toArray(children);
  return (
    <section className="space-y-3">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold">{icon} {title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {arr.length ? (
        <Card><CardContent className="divide-y divide-border p-0">{children}</CardContent></Card>
      ) : emptyLabel ? (
        <EmptyState title={emptyLabel} />
      ) : null}
    </section>
  );
}

function DocRow({
  doc,
  clientId,
  showUpload,
  showDownload,
}: {
  doc: DocumentRecord;
  clientId?: string;
  showUpload?: boolean;
  showDownload?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <FileText className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{doc.title}</p>
          <p className="text-xs text-muted-foreground">
            {DOCUMENT_CATEGORY[doc.category]}
            {doc.fileName ? ` · ${doc.fileName}` : ""}
            {doc.uploadedAt ? ` · ${formatDate(doc.uploadedAt)}` : doc.requestedAt ? ` · requested ${formatDate(doc.requestedAt)}` : ""}
          </p>
          {doc.reviewerComment && (
            <p className="mt-1.5 rounded-md bg-destructive/5 px-2.5 py-1.5 text-xs text-destructive">
              {doc.reviewerComment}
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3 pl-8 sm:pl-0">
        <StatusBadge meta={DOCUMENT_STATUS[doc.status]} />
        {showUpload && (
          <UploadControl
            compact
            label={doc.status === "requested" ? "Upload" : "Replace"}
            context={
              clientId
                ? { clientId, caseId: doc.caseId, companyId: doc.companyId, requestId: doc.id, category: doc.category, title: doc.title }
                : undefined
            }
          />
        )}
        {showDownload && <DownloadButton documentId={doc.id} fileName={doc.fileName} />}
      </div>
    </div>
  );
}
