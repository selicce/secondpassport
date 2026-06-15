"use client";
import * as React from "react";
import { Upload, CheckCircle2, Loader2, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IS_DEMO } from "@/lib/is-demo";
import { uploadDocumentAction } from "@/app/actions/portal";

const ACCEPT = ".pdf,.jpg,.jpeg,.png,.doc,.docx";
const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

/** Where an uploaded file should be filed (required for real uploads). */
export interface UploadContext {
  clientId: string;
  caseId?: string;
  companyId?: string;
  requestId?: string;
  category?: string;
  title?: string;
}

/**
 * Secure upload control.
 *
 * Demo: validates type/size client-side and simulates a successful upload.
 * Production: POST the file to a server action that streams it into the private
 * Supabase Storage bucket (never a public URL), writes a `documents` row with
 * status "uploaded", and records an audit entry. See comments below.
 */
export function UploadControl({
  label = "Upload file",
  variant = "secondary",
  compact = false,
  context,
}: {
  label?: string;
  variant?: "primary" | "secondary";
  compact?: boolean;
  context?: UploadContext;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [state, setState] = React.useState<"idle" | "uploading" | "done" | "error">("idle");
  const [fileName, setFileName] = React.useState<string>("");
  const [error, setError] = React.useState<string>("");

  async function handleFile(file: File) {
    setError("");
    if (file.size > MAX_BYTES) {
      setState("error");
      setError("File exceeds the 15 MB limit.");
      return;
    }
    setFileName(file.name);
    setState("uploading");

    try {
      if (IS_DEMO || !context) {
        await new Promise((r) => setTimeout(r, 900)); // simulate network
      } else {
        // Stream to the private bucket via the server action (DB row + audit).
        const fd = new FormData();
        fd.append("file", file);
        fd.append("clientId", context.clientId);
        if (context.caseId) fd.append("caseId", context.caseId);
        if (context.companyId) fd.append("companyId", context.companyId);
        if (context.requestId) fd.append("requestId", context.requestId);
        fd.append("category", context.category ?? "other");
        fd.append("title", context.title ?? file.name);
        await uploadDocumentAction(fd);
      }
      setState("done");
    } catch {
      setState("error");
      setError("Upload failed. Please try again.");
    }
  }

  if (compact) {
    return (
      <>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        <Button
          type="button"
          size="sm"
          variant={state === "done" ? "secondary" : variant}
          onClick={() => inputRef.current?.click()}
          disabled={state === "uploading"}
        >
          {state === "uploading" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : state === "done" ? (
            <CheckCircle2 className="size-4 text-success" />
          ) : (
            <FileUp className="size-4" />
          )}
          {state === "done" ? "Uploaded" : label}
        </Button>
        {error && <span className="ml-2 text-xs text-destructive">{error}</span>}
      </>
    );
  }

  return (
    <div
      className={cn(
        "rounded-lg border-2 border-dashed p-6 text-center transition-colors",
        state === "error" ? "border-destructive/40 bg-destructive/5" : "border-border hover:border-primary/40",
      )}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      {state === "done" ? (
        <div className="flex flex-col items-center gap-2 text-success">
          <CheckCircle2 className="size-7" />
          <p className="text-sm font-medium">{fileName} uploaded securely</p>
          <Button type="button" size="sm" variant="ghost" onClick={() => setState("idle")}>
            Upload another
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="size-7 text-muted-foreground" />
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">PDF, JPG, PNG or Word · up to 15 MB</p>
          <Button
            type="button"
            size="sm"
            variant={variant}
            className="mt-1"
            onClick={() => inputRef.current?.click()}
            disabled={state === "uploading"}
          >
            {state === "uploading" ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
            {state === "uploading" ? "Uploading…" : "Choose file"}
          </Button>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}
