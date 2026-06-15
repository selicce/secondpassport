"use client";
import * as React from "react";
import { Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IS_DEMO } from "@/lib/is-demo";
import { downloadDocumentAction } from "@/app/actions/portal";

/**
 * Secure download.
 *
 * Documents are NEVER served from public URLs. On click, production code calls a
 * server action that (1) checks the caller may access this document, (2) writes a
 * `document_download` audit entry, and (3) returns a short-lived signed URL
 * (DOCUMENT_SIGNED_URL_TTL) which the browser then opens. Demo simulates it.
 */
export function DownloadButton({ documentId, fileName }: { documentId: string; fileName?: string }) {
  const [loading, setLoading] = React.useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      if (IS_DEMO) {
        await new Promise((r) => setTimeout(r, 500));
        // eslint-disable-next-line no-alert
        alert(`Demo: a time-limited signed URL would now download "${fileName ?? documentId}".`);
      } else {
        const { url } = await downloadDocumentAction(documentId);
        if (url) window.open(url, "_blank", "noopener");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={handleDownload} disabled={loading}>
      {loading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
      Download
    </Button>
  );
}
