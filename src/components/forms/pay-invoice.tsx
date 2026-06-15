"use client";
import * as React from "react";
import { CreditCard, Building, Landmark, Wallet, Bitcoin, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UploadControl } from "@/components/forms/upload-control";
import { cn, formatMoney } from "@/lib/utils";
import { IS_DEMO } from "@/lib/is-demo";
import { startCheckoutAction } from "@/app/actions/portal";
import type { PaymentMethod } from "@/lib/types";

const METHODS: { id: PaymentMethod; label: string; icon: React.ElementType; enabled: boolean; note?: string }[] = [
  { id: "stripe", label: "Card payment", icon: CreditCard, enabled: true, note: "Visa, Mastercard, Amex via Stripe" },
  { id: "bank_transfer", label: "Bank transfer", icon: Building, enabled: true, note: "Telegraphic transfer to JR & Firm" },
  { id: "wise", label: "Wise", icon: Landmark, enabled: true, note: "Multi-currency transfer" },
  { id: "paypal", label: "PayPal", icon: Wallet, enabled: false, note: "Coming soon" },
  { id: "crypto", label: "Crypto", icon: Bitcoin, enabled: false, note: "On request" },
];

/**
 * Invoice payment panel.
 *
 * Card: production calls createCheckoutSession() and redirects to Stripe.
 * Offline (bank/Wise): shows transfer instructions and lets the client upload
 * proof of payment, which finance reconciles (marks the invoice paid).
 */
export function PayInvoice({
  invoiceId,
  clientId,
  amountDue,
  currency,
  invoiceNumber,
}: {
  invoiceId: string;
  clientId: string;
  amountDue: number;
  currency: string;
  invoiceNumber: string;
}) {
  const [method, setMethod] = React.useState<PaymentMethod>("stripe");
  const [cardState, setCardState] = React.useState<"idle" | "loading" | "done">("idle");
  const active = METHODS.find((m) => m.id === method)!;

  async function payByCard() {
    setCardState("loading");
    if (IS_DEMO) {
      await new Promise((r) => setTimeout(r, 1100));
      setCardState("done");
      return;
    }
    const { url, demo } = await startCheckoutAction(invoiceId);
    if (!demo && url) {
      window.location.href = url; // redirect to Stripe Checkout
    } else {
      setCardState("done");
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {METHODS.map((m) => {
          const Icon = m.icon;
          const selected = method === m.id;
          return (
            <button
              key={m.id}
              type="button"
              disabled={!m.enabled}
              onClick={() => setMethod(m.id)}
              className={cn(
                "flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors",
                selected ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-border hover:bg-accent",
                !m.enabled && "cursor-not-allowed opacity-50 hover:bg-transparent",
              )}
            >
              <Icon className={cn("size-5", selected ? "text-primary" : "text-muted-foreground")} />
              <span className="text-sm font-medium">{m.label}</span>
              {m.note && <span className="text-[11px] text-muted-foreground">{m.note}</span>}
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-border bg-muted/30 p-4">
        {method === "stripe" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You’ll be redirected to a secure Stripe checkout to pay{" "}
              <strong className="text-foreground">{formatMoney(amountDue, currency)}</strong>.
            </p>
            {cardState === "done" ? (
              <p className="flex items-center gap-2 text-sm font-medium text-success">
                <CheckCircle2 className="size-4" /> Demo payment confirmed. Finance has been notified.
              </p>
            ) : (
              <Button onClick={payByCard} disabled={cardState === "loading"}>
                {cardState === "loading" ? <Loader2 className="size-4 animate-spin" /> : <CreditCard className="size-4" />}
                Pay {formatMoney(amountDue, currency)}
              </Button>
            )}
          </div>
        )}

        {(method === "bank_transfer" || method === "wise") && (
          <div className="space-y-4">
            <div className="space-y-1 text-sm">
              <p className="font-medium">{active.label} instructions</p>
              <dl className="mt-2 grid grid-cols-3 gap-y-1.5 text-sm">
                <dt className="text-muted-foreground">Beneficiary</dt>
                <dd className="col-span-2 font-medium">JR &amp; Firm Limited</dd>
                <dt className="text-muted-foreground">Bank</dt>
                <dd className="col-span-2 font-medium">The Hongkong and Shanghai Banking Corp.</dd>
                <dt className="text-muted-foreground">Account</dt>
                <dd className="col-span-2 font-medium tabular-nums">004-123-456789-838</dd>
                <dt className="text-muted-foreground">Reference</dt>
                <dd className="col-span-2 font-medium">{invoiceNumber}</dd>
              </dl>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Upload proof of payment</p>
              <UploadControl
                compact
                label="Upload receipt"
                context={{ clientId, category: "invoice", title: `Payment proof — ${invoiceNumber}` }}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Finance will reconcile your transfer and mark the invoice as paid.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
