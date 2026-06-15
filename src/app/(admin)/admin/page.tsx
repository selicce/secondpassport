import Link from "next/link";
import {
  Users,
  FolderKanban,
  FileWarning,
  Receipt,
  LifeBuoy,
  AlertOctagon,
  CalendarClock,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/misc";
import { requireStaff, getT } from "@/lib/session";
import { getAdminDashboard, listClients, listAllCompanies } from "@/lib/data";
import { CASE_STATUS, INVOICE_STATUS, TICKET_STATUS } from "@/lib/labels";
import { ROLE_LABELS } from "@/lib/rbac";
import { formatDate, formatMoney, daysUntil } from "@/lib/utils";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const user = await requireStaff();
  const t = await getT(user);
  const [data, clients, companies] = await Promise.all([
    getAdminDashboard(),
    listClients(),
    listAllCompanies(),
  ]);
  const clientName = (id: string) => clients.find((c) => c.id === id)?.displayName ?? "—";

  const upcomingRenewals = companies
    .filter((c) => c.renewalDate)
    .map((c) => ({ ...c, days: daysUntil(c.renewalDate) ?? 9999 }))
    .filter((c) => c.days <= 180)
    .sort((a, b) => a.days - b.days);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Staff workspace"
        title={`Good day, ${user.fullName.split(" ")[0]}`}
        description={`Signed in as ${ROLE_LABELS[user.role]} — here is the firm-wide operations overview.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Clients" value={clients.length} icon={<Users className="size-5" />} href="/admin/clients" />
        <StatCard label="Active cases" value={data.cases.filter((c) => !["completed", "cancelled"].includes(c.status)).length} icon={<FolderKanban className="size-5" />} href="/admin/cases" />
        <StatCard label="Docs to review" value={data.pendingDocs.length} tone={data.pendingDocs.length ? "warning" : "default"} icon={<FileWarning className="size-5" />} href="/admin/documents" />
        <StatCard label="Overdue invoices" value={data.overdueInvoices.length} tone={data.overdueInvoices.length ? "danger" : "default"} icon={<Receipt className="size-5" />} href="/admin/invoices" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* High-priority cases */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><AlertOctagon className="size-4 text-destructive" /> High-priority cases</CardTitle>
            <Link href="/admin/cases" className="text-sm text-primary hover:underline">{t.common.viewAll}</Link>
          </CardHeader>
          <CardContent className="p-0">
            {data.highPriorityCases.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">No high-priority cases.</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.highPriorityCases.map((c) => (
                  <li key={c.id}>
                    <Link href={`/admin/cases/${c.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-accent">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{c.serviceTitle}</p>
                        <p className="text-xs text-muted-foreground">{c.reference} · {clientName(c.clientId)}</p>
                      </div>
                      <Badge tone={c.priority === "urgent" ? "danger" : "warning"}>{c.priority}</Badge>
                      <StatusBadge meta={CASE_STATUS[c.status]} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Unanswered tickets */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><LifeBuoy className="size-4 text-primary" /> Needs a reply</CardTitle>
            <Link href="/admin/tickets" className="text-sm text-primary hover:underline">All</Link>
          </CardHeader>
          <CardContent className="p-0">
            {data.unansweredTickets.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">Inbox zero 🎉</p>
            ) : (
              <ul className="divide-y divide-border">
                {data.unansweredTickets.map((tk) => (
                  <li key={tk.id}>
                    <Link href={`/admin/tickets/${tk.id}`} className="block px-5 py-3 hover:bg-accent">
                      <p className="truncate text-sm font-medium">{tk.subject}</p>
                      <p className="text-xs text-muted-foreground">{clientName(tk.clientId)}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pending invoices */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Outstanding invoices</CardTitle>
            <Link href="/admin/invoices" className="text-sm text-primary hover:underline">{t.common.viewAll}</Link>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {data.pendingInvoices.map((i) => (
                <li key={i.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{i.number} · {clientName(i.clientId)}</p>
                    <p className="text-xs text-muted-foreground">{formatMoney(i.amount, i.currency)} · due {formatDate(i.dueDate)}</p>
                  </div>
                  <StatusBadge meta={INVOICE_STATUS[i.status]} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Upcoming renewals */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><CalendarClock className="size-4 text-gold" /> Upcoming renewals</CardTitle></CardHeader>
          <CardContent className="p-0">
            {upcomingRenewals.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">No renewals in the next 6 months.</p>
            ) : (
              <ul className="divide-y divide-border">
                {upcomingRenewals.map((c) => (
                  <li key={c.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{clientName(c.clientId)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatDate(c.renewalDate)}</p>
                      <p className={`text-xs ${c.days < 30 ? "text-destructive" : "text-muted-foreground"}`}>in {c.days} days</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
