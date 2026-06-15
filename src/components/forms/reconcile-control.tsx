"use client";
import * as React from "react";
import { Check, Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IS_DEMO } from "@/lib/is-demo";
import { recordOfflinePaymentAction } from "@/app/actions/portal";

/**
 * Finance reconciliation actions (requires `payments.reconcile`).
 * "Mark received" records the payment, updates invoice status, and writes a
 * `payment_status_change` audit entry. Reminders are simulated (wire to email).
 */
export function ReconcileControl({
  invoiceId,
  amountDue,
  canReconcile,
}: {
  invoiceId: string;
  amountDue: number;
  canReconcile: boolean;
}) {
  const [state, setState] = React.useState<"idle" | "paid" | "reminded">("idle");
  const [busy, setBusy] = React.useState<"" | "paid" | "remind">("");

  async function run(kind: "paid" | "remind") {
    setBusy(kind);
    if (IS_DEMO || kind === "remind") {
      await new Promise((r) => setTimeout(r, 500));
    } else {
      await recordOfflinePaymentAction(invoiceId, "bank_transfer", amountDue);
    }
    setBusy("");
    setState(kind === "paid" ? "paid" : "reminded");
    if (kind === "remind") setTimeout(() => setState("idle"), 2000);
  }

  if (state === "paid") return <span className="text-sm font-medium text-success">Marked paid</span>;

  return (
    <div className="flex justify-end gap-2">
      <Button size="sm" variant="ghost" onClick={() => run("remind")} disabled={!!busy}>
        {busy === "remind" ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />}
        {state === "reminded" ? "Sent" : "Remind"}
      </Button>
      {canReconcile && (
        <Button size="sm" variant="outline" onClick={() => run("paid")} disabled={!!busy}>
          {busy === "paid" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Mark received
        </Button>
      )}
    </div>
  );
}
