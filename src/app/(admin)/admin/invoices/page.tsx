import { redirect } from "next/navigation";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { StatCard } from "@/components/stat-card";
import { PageHeader } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { ReconcileControl } from "@/components/forms/reconcile-control";
import { requireStaff } from "@/lib/session";
import { can } from "@/lib/rbac";
import { listAllInvoices, listClients } from "@/lib/data";
import { INVOICE_STATUS } from "@/lib/labels";
import { formatDate, formatMoney } from "@/lib/utils";

export const metadata = { title: "Invoices" };

export default async function AdminInvoicesPage() {
  const user = await requireStaff();
  if (!can(user.role, "invoices.view")) redirect("/admin");
  const canManage = can(user.role, "invoices.manage");
  const canReconcile = can(user.role, "payments.reconcile");

  const [invoices, clients] = await Promise.all([listAllInvoices(), listClients()]);
  const clientName = (id: string) => clients.find((c) => c.id === id)?.displayName ?? "—";

  const outstanding = invoices
    .filter((i) => ["pending_payment", "partially_paid", "overdue"].includes(i.status))
    .reduce((s, i) => s + (i.amount - i.amountPaid), 0);
  const collected = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Invoices"
        description="All invoices across clients."
        actions={canManage ? <Button variant="primary">Create invoice</Button> : undefined}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Outstanding" value={formatMoney(outstanding, "USD")} tone={outstanding ? "warning" : "default"} />
        <StatCard label="Collected (paid)" value={formatMoney(collected, "USD")} tone="success" />
        <StatCard label="Overdue" value={invoices.filter((i) => i.status === "overdue").length} tone="danger" />
      </div>

      <Table>
        <THead>
          <TR>
            <TH>Invoice</TH><TH>Client</TH><TH>Amount</TH><TH>Due</TH><TH>Status</TH><TH className="text-right">Action</TH>
          </TR>
        </THead>
        <TBody>
          {invoices.map((i) => {
            const payable = ["pending_payment", "partially_paid", "overdue"].includes(i.status);
            return (
              <TR key={i.id}>
                <TD>
                  <p className="font-medium">{i.number}</p>
                  <p className="max-w-[220px] truncate text-xs text-muted-foreground">{i.serviceTitle}</p>
                </TD>
                <TD className="text-muted-foreground">{clientName(i.clientId)}</TD>
                <TD className="tabular-nums">{formatMoney(i.amount, i.currency)}</TD>
                <TD className="text-muted-foreground">{formatDate(i.dueDate)}</TD>
                <TD><StatusBadge meta={INVOICE_STATUS[i.status]} /></TD>
                <TD>{payable ? <ReconcileControl invoiceId={i.id} amountDue={i.amount - i.amountPaid} canReconcile={canReconcile} /> : <span className="block text-right text-xs text-muted-foreground">—</span>}</TD>
              </TR>
            );
          })}
        </TBody>
      </Table>
    </div>
  );
}
