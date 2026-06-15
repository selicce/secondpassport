import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader, Separator } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/brand";
import { PayInvoice } from "@/components/forms/pay-invoice";
import { requireClient, getT } from "@/lib/session";
import { getInvoice, getClientById, getCompany, listPaymentsForInvoice } from "@/lib/data";
import { INVOICE_STATUS, PAYMENT_METHOD } from "@/lib/labels";
import { formatDate, formatMoney } from "@/lib/utils";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireClient();
  const t = await getT(user);
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice || invoice.clientId !== user.clientId) notFound();

  const [client, company, payments] = await Promise.all([
    getClientById(invoice.clientId),
    invoice.companyId ? getCompany(invoice.companyId) : Promise.resolve(undefined),
    listPaymentsForInvoice(invoice.id),
  ]);
  const amountDue = invoice.amount - invoice.amountPaid;
  const payable = ["sent", "pending_payment", "partially_paid", "overdue"].includes(invoice.status);

  return (
    <div className="space-y-6">
      <Link href="/invoices" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All invoices
      </Link>

      <PageHeader
        eyebrow="Invoice"
        title={invoice.number}
        actions={
          <>
            <StatusBadge meta={INVOICE_STATUS[invoice.status]} />
            <Button variant="outline" size="sm"><Printer className="size-4" /> Print / PDF</Button>
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Invoice document */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6 sm:p-8">
            <div className="flex items-start justify-between">
              <BrandMark variant="light" showTagline={false} />
              <div className="text-right text-sm">
                <p className="font-semibold">{invoice.number}</p>
                <p className="text-muted-foreground">Issued {formatDate(invoice.createdAt)}</p>
                <p className="text-muted-foreground">Due {formatDate(invoice.dueDate)}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Billed to</p>
                <p className="mt-1 font-medium">{client?.displayName}</p>
                <p className="text-muted-foreground">{client?.primaryContactName}</p>
                {company && <p className="text-muted-foreground">{company.name}</p>}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">From</p>
                <p className="mt-1 font-medium">JR &amp; Firm Limited</p>
                <p className="text-muted-foreground">Admiralty, Hong Kong</p>
              </div>
            </div>

            <Separator className="my-6" />

            <Table>
              <THead>
                <TR><TH>Description</TH><TH className="text-right">Qty</TH><TH className="text-right">Unit</TH><TH className="text-right">Amount</TH></TR>
              </THead>
              <TBody>
                {invoice.lines.map((l, i) => (
                  <TR key={i}>
                    <TD>{l.description}</TD>
                    <TD className="text-right tabular-nums">{l.quantity}</TD>
                    <TD className="text-right tabular-nums">{formatMoney(l.unitAmount, invoice.currency)}</TD>
                    <TD className="text-right tabular-nums">{formatMoney(l.unitAmount * l.quantity, invoice.currency)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>

            <div className="mt-4 ml-auto w-full max-w-xs space-y-1.5 text-sm">
              <Row label="Subtotal" value={formatMoney(invoice.amount, invoice.currency)} />
              <Row label="Paid" value={`− ${formatMoney(invoice.amountPaid, invoice.currency)}`} />
              <Separator className="my-1" />
              <Row label="Amount due" value={formatMoney(amountDue, invoice.currency)} strong />
            </div>

            {invoice.notes && <p className="mt-6 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">{invoice.notes}</p>}
          </CardContent>
        </Card>

        {/* Payment / history */}
        <div className="space-y-6">
          {payable ? (
            <Card>
              <CardHeader><CardTitle>Pay this invoice</CardTitle></CardHeader>
              <CardContent>
                <PayInvoice invoiceId={invoice.id} clientId={invoice.clientId} amountDue={amountDue} currency={invoice.currency} invoiceNumber={invoice.number} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-5 text-sm text-muted-foreground">
                This invoice is <strong className="text-foreground">{INVOICE_STATUS[invoice.status].label.toLowerCase()}</strong>. No payment is due.
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Payment history</CardTitle></CardHeader>
            <CardContent className="p-0">
              {payments.length === 0 ? (
                <p className="px-5 py-4 text-sm text-muted-foreground">No payments recorded.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {payments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between px-5 py-3 text-sm">
                      <div>
                        <p className="font-medium">{formatMoney(p.amount, p.currency)}</p>
                        <p className="text-xs text-muted-foreground">{PAYMENT_METHOD[p.method]} · {formatDate(p.createdAt)}</p>
                      </div>
                      <StatusBadge meta={{ label: p.status, tone: p.status === "succeeded" ? "success" : "warning" }} />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className={strong ? "font-semibold" : "text-muted-foreground"}>{label}</span>
      <span className={strong ? "font-serif text-lg font-semibold tabular-nums" : "tabular-nums"}>{value}</span>
    </div>
  );
}
