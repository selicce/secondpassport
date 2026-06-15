import Link from "next/link";
import { Receipt } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { StatCard } from "@/components/stat-card";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { requireClient } from "@/lib/session";
import { listInvoicesForClient } from "@/lib/data";
import { INVOICE_STATUS } from "@/lib/labels";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata = { title: "Invoices & Payments" };

export default async function InvoicesPage() {
  const user = await requireClient();
  const invoices = await listInvoicesForClient(user.clientId);

  const outstanding = invoices
    .filter((i) => ["sent", "pending_payment", "partially_paid", "overdue"].includes(i.status))
    .reduce((sum, i) => sum + (i.amount - i.amountPaid), 0);
  const currency = invoices[0]?.currency ?? "USD";
  const overdueCount = invoices.filter((i) => i.status === "overdue").length;

  return (
    <div className="space-y-6">
      <PageHeader title="Invoices & Payments" description="Review, download and settle your invoices." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Outstanding balance" value={formatMoney(outstanding, currency)} tone={outstanding > 0 ? "warning" : "default"} />
        <StatCard label="Overdue invoices" value={overdueCount} tone={overdueCount ? "danger" : "default"} />
        <StatCard label="Total invoices" value={invoices.length} />
      </div>

      {invoices.length === 0 ? (
        <EmptyState icon={<Receipt className="size-8" />} title="No invoices yet" />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Invoice</TH>
              <TH>Service</TH>
              <TH>Amount</TH>
              <TH>Due</TH>
              <TH>Status</TH>
              <TH className="text-right">Action</TH>
            </TR>
          </THead>
          <TBody>
            {invoices.map((i) => (
              <TR key={i.id}>
                <TD className="font-medium">{i.number}</TD>
                <TD className="max-w-[220px] truncate text-muted-foreground">{i.serviceTitle}</TD>
                <TD className="tabular-nums">{formatMoney(i.amount, i.currency)}</TD>
                <TD className="text-muted-foreground">{formatDate(i.dueDate)}</TD>
                <TD><StatusBadge meta={INVOICE_STATUS[i.status]} /></TD>
                <TD className="text-right">
                  <ButtonLink href={`/invoices/${i.id}`} size="sm" variant="outline">View</ButtonLink>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
