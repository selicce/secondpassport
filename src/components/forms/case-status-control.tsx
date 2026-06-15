"use client";
import * as React from "react";
import { Loader2, Check } from "lucide-react";
import { Select } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { CASE_STATUS } from "@/lib/labels";
import { IS_DEMO } from "@/lib/is-demo";
import { updateCaseStatusAction } from "@/app/actions/portal";
import type { CaseStatus } from "@/lib/types";

/**
 * Staff control to advance a case. Production calls a server action that updates
 * the case, recomputes the timeline, notifies the client, and writes a
 * `case_status_update` audit entry.
 */
export function CaseStatusControl({ caseId, initial }: { caseId: string; initial: CaseStatus }) {
  const [status, setStatus] = React.useState<CaseStatus>(initial);
  const [pending, setPending] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const dirty = status !== initial;

  async function save() {
    setPending(true);
    if (IS_DEMO) {
      await new Promise((r) => setTimeout(r, 500));
    } else {
      await updateCaseStatusAction(caseId, status);
    }
    setPending(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={status} onChange={(e) => setStatus(e.target.value as CaseStatus)} className="max-w-[260px]">
        {(Object.keys(CASE_STATUS) as CaseStatus[]).map((s) => (
          <option key={s} value={s}>{CASE_STATUS[s].label}</option>
        ))}
      </Select>
      <Button size="sm" onClick={save} disabled={!dirty || pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : saved ? <Check className="size-4" /> : null}
        {saved ? "Saved" : "Update"}
      </Button>
    </div>
  );
}
