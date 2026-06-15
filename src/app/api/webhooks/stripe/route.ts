import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/payments/stripe";
import { applyStripePayment } from "@/lib/data/mutations";

// Stripe signature verification + service-role DB writes require Node, not Edge.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Stripe webhook.
 *   1. Verify the signature against STRIPE_WEBHOOK_SECRET (constructEvent).
 *   2. On a completed/succeeded payment → applyStripePayment() inserts the
 *      payment, marks the invoice paid, audits, notifies, and emails the client
 *      (idempotent on the payment reference).
 *   3. 200 on success · 400 on bad signature · 500 so Stripe retries on failure.
 */
export async function POST(request: NextRequest) {
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "false") {
    return NextResponse.json({ received: true, demo: true });
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) {
    return new NextResponse("Webhook not configured", { status: 400 });
  }

  const rawBody = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    return new NextResponse(`Invalid signature: ${(err as Error).message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status === "paid") {
          const invoiceId = session.metadata?.invoiceId ?? session.client_reference_id;
          if (invoiceId) {
            await applyStripePayment({
              invoiceId,
              amount: (session.amount_total ?? 0) / 100,
              reference: stringId(session.payment_intent) ?? session.id,
            });
          }
        }
        break;
      }
      case "payment_intent.succeeded": {
        const pi = event.data.object as Stripe.PaymentIntent;
        const invoiceId = pi.metadata?.invoiceId;
        if (invoiceId) {
          await applyStripePayment({
            invoiceId,
            amount: (pi.amount_received ?? pi.amount ?? 0) / 100,
            reference: pi.id,
          });
        }
        break;
      }
      default:
        // Unhandled event types are acknowledged so Stripe stops retrying.
        break;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[stripe webhook] processing error:", err);
    return new NextResponse("Processing error", { status: 500 }); // Stripe will retry
  }

  return NextResponse.json({ received: true });
}

function stringId(v: string | { id: string } | null | undefined): string | undefined {
  if (!v) return undefined;
  return typeof v === "string" ? v : v.id;
}
