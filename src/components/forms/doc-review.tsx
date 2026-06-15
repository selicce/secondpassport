"use client";
import * as React from "react";
import { Check, X, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { IS_DEMO } from "@/lib/is-demo";
import { reviewDocumentAction } from "@/app/actions/portal";
import type { DocumentStatus } from "@/lib/types";

/**
 * Document review actions for staff with `documents.review`.
 *
 * Production: each action calls a server action that updates the document
 * status, stores the reviewer comment, notifies the client (in-app + email),
 * and writes a `document_review` audit entry. Demo updates local state only.
 */
export function DocReview({ documentId, initialStatus }: { documentId: string; initialStatus: DocumentStatus }) {
  const [status, setStatus] = React.useState<DocumentStatus>(initialStatus);
  const [busy, setBusy] = React.useState<DocumentStatus | null>(null);
  const [comment, setComment] = React.useState("");
  const [showComment, setShowComment] = React.useState<null | "rejected" | "replacement_required">(null);

  async function apply(next: DocumentStatus) {
    setBusy(next);
    if (IS_DEMO) {
      await new Promise((r) => setTimeout(r, 500));
    } else {
      await reviewDocumentAction(documentId, next, comment || undefined);
    }
    setStatus(next);
    setBusy(null);
    setShowComment(null);
    setComment("");
  }

  if (["approved"].includes(status)) {
    return <span className="text-sm font-medium text-success">Approved</span>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="primary" onClick={() => apply("approved")} disabled={!!busy}>
          {busy === "approved" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Approve
        </Button>
        <Button size="sm" variant="outline" onClick={() => setShowComment("replacement_required")} disabled={!!busy}>
          <RotateCcw className="size-4" /> Request replacement
        </Button>
        <Button size="sm" variant="destructive" onClick={() => setShowComment("rejected")} disabled={!!busy}>
          <X className="size-4" /> Reject
        </Button>
      </div>

      {showComment && (
        <div className="space-y-2 rounded-md border border-border p-3">
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Reason shown to the client (required)…"
          />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setShowComment(null)}>Cancel</Button>
            <Button size="sm" variant={showComment === "rejected" ? "destructive" : "primary"} onClick={() => apply(showComment)} disabled={!comment.trim() || !!busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null} Confirm
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
