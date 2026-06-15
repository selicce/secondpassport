import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { requireStaff } from "@/lib/session";
import { can } from "@/lib/rbac";
import { listAllPayments, listAllInvoices, listClients } from "@/lib/data";
import { PAYMENT_METHOD } from "@/lib/labels";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata = { title: "Payments" };

export default async function AdminPaymentsPage() {
  const user = await requireStaff();
  if (!can(user.role, "payments.view")) redirect("/admin");
  const canExport = can(user.role, "payments.reconcile");

  const [payments, invoices, clients] = await Promise.all([listAllPayments(), listAllInvoices(), listClients()]);
  const clientName = (id: string) => clients.find((c) => c.id === id)?.displayName ?? "—";
  const invoiceNo = (id: string) => invoices.find((i) => i.id === id)?.number ?? "—";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments"
        description="Reconciled and recorded payments."
        actions={canExport ? <Button variant="outline"><Download className="size-4" /> Export CSV</Button> : undefined}
      />

      {payments.length === 0 ? (
        <EmptyState title="No payments recorded yet" />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Date</TH><TH>Invoice</TH><TH>Client</TH><TH>Method</TH><TH>Reference</TH><TH>Amount</TH><TH>Status</TH>
            </TR>
          </THead>
          <TBody>
            {payments.map((p) => (
              <TR key={p.id}>
                <TD className="text-muted-foreground">{formatDate(p.createdAt)}</TD>
                <TD className="font-medium">{invoiceNo(p.invoiceId)}</TD>
                <TD className="text-muted-foreground">{clientName(p.clientId)}</TD>
                <TD><Badge tone="neutral">{PAYMENT_METHOD[p.method]}</Badge></TD>
                <TD className="text-xs text-muted-foreground">{p.reference ?? "—"}</TD>
                <TD className="tabular-nums">{formatMoney(p.amount, p.currency)}</TD>
                <TD><StatusBadge meta={{ label: p.status, tone: p.status === "succeeded" ? "success" : "warning" }} /></TD>
              </TR>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
