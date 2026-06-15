import "server-only";
import Stripe from "stripe";
import type { Invoice } from "@/lib/types";

/**
 * Stripe integration.
 *
 *   createCheckoutSession()  →  hosted Checkout URL (called from a server action)
 *   The webhook (src/app/api/webhooks/stripe/route.ts) confirms payment and
 *   applies it via mutations.applyStripePayment().
 *
 * Required env: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
 *               NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, NEXT_PUBLIC_APP_URL
 */
export interface CheckoutResult {
  url: string;
  demo: boolean;
}

let _stripe: Stripe | null = null;
/** Lazily constructed singleton so importing this module never needs the key. */
export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export async function createCheckoutSession(
  invoice: Invoice,
  opts: { customerEmail?: string } = {},
): Promise<CheckoutResult> {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "false") {
    // Demo: skip Stripe entirely; the UI confirms a simulated payment.
    return { url: `/invoices/${invoice.id}?demo_paid=1`, demo: true };
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const amountDue = invoice.amount - invoice.amountPaid;

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    client_reference_id: invoice.id,
    customer_email: opts.customerEmail,
    line_items: lineItems(invoice, amountDue),
    success_url: `${appUrl}/invoices/${invoice.id}?paid=1`,
    cancel_url: `${appUrl}/invoices/${invoice.id}`,
    metadata: { invoiceId: invoice.id, clientId: invoice.clientId, number: invoice.number },
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  return { url: session.url, demo: false };
}

/**
 * Build Checkout line items. If the invoice is partially paid we charge the
 * remaining balance as a single line to keep totals exact.
 */
function lineItems(invoice: Invoice, amountDue: number): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const currency = invoice.currency.toLowerCase();
  if (invoice.amountPaid > 0) {
    return [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: Math.round(amountDue * 100),
          product_data: { name: `Invoice ${invoice.number} — outstanding balance` },
        },
      },
    ];
  }
  return invoice.lines.map((l) => ({
    quantity: l.quantity,
    price_data: {
      currency,
      unit_amount: Math.round(l.unitAmount * 100),
      product_data: { name: l.description },
    },
  }));
}
