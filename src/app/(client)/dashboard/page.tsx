import Link from "next/link";
import {
  Briefcase,
  FileWarning,
  Receipt,
  MessagesSquare,
  Upload,
  PlusCircle,
  Building2,
  CalendarClock,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/stat-card";
import { ProgressCard } from "@/components/progress-card";
import { Button, ButtonLink } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";
import { EmptyState, PageHeader, Separator } from "@/components/ui/misc";
import { Disclaimer } from "@/components/disclaimer";
import { requireClient, getT } from "@/lib/session";
import { getClientDashboard, getClientById, listNotificationsForUser } from "@/lib/data";
import { formatDate, formatMoney } from "@/lib/utils";
import { CASE_STATUS, INVOICE_STATUS, DOCUMENT_STATUS } from "@/lib/labels";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireClient();
  const t = await getT(user);
  const [data, client, notifications] = await Promise.all([
    getClientDashboard(user.clientId),
    getClientById(user.clientId),
    listNotificationsForUser(user.id),
  ]);

  // Derive concrete "next actions" the client must take.
  const nextActions = [
    ...data.pendingDocs.map((d) => ({
      id: d.id,
      label:
        d.status === "requested"
          ? `Upload requested document: ${d.title}`
          : `Replace document: ${d.title}`,
      href: "/documents",
      tone: "warning" as const,
    })),
    ...data.pendingInvoices
      .filter((i) => i.status === "overdue" || i.status === "pending_payment")
      .map((i) => ({
        id: i.id,
        label: `Settle invoice ${i.number} — ${formatMoney(i.amount - i.amountPaid, i.currency)}`,
        href: `/invoices/${i.id}`,
        tone: i.status === "overdue" ? ("danger" as const) : ("warning" as const),
      })),
    ...data.tickets
      .filter((tk) => tk.status === "waiting_client")
      .map((tk) => ({
        id: tk.id,
        label: `Reply to: ${tk.subject}`,
        href: `/messages/${tk.id}`,
        tone: "warning" as const,
      })),
  ];

  const renewals = data.companies.filter((c) => c.renewalDate);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={t.brand.tagline}
        title={`Welcome back, ${client?.primaryContactName.split(" ")[0] ?? ""}`}
        description="Here is an overview of your companies, cases and outstanding actions with JR & Firm."
        actions={
          <ButtonLink href="/services" variant="gold">
            <PlusCircle className="size-4" /> {t.nav.orderService}
          </ButtonLink>
        }
      />

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active services" value={data.activeCases.length} icon={<Briefcase className="size-5" />} href="/cases" />
        <StatCard
          label="Documents pending"
          value={data.pendingDocs.length}
          tone={data.pendingDocs.length ? "warning" : "default"}
          icon={<FileWarning className="size-5" />}
          href="/documents"
        />
        <StatCard
          label="Invoices due"
          value={data.pendingInvoices.length}
          tone={data.pendingInvoices.some((i) => i.status === "overdue") ? "danger" : "default"}
          icon={<Receipt className="size-5" />}
          href="/invoices"
        />
        <StatCard
          label="Open messages"
          value={data.tickets.filter((tk) => !["resolved", "closed"].includes(tk.status)).length}
          icon={<MessagesSquare className="size-5" />}
          href="/messages"
        />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <ButtonLink href="/documents" variant="secondary"><Upload className="size-4" /> {t.common.upload} documents</ButtonLink>
        <ButtonLink href="/services" variant="secondary"><PlusCircle className="size-4" /> {t.nav.orderService}</ButtonLink>
        <ButtonLink href="/messages" variant="secondary"><MessagesSquare className="size-4" /> Contact us</ButtonLink>
        <ButtonLink href="/invoices" variant="secondary"><Receipt className="size-4" /> View invoices</ButtonLink>
        <ButtonLink href="/companies" variant="secondary"><Building2 className="size-4" /> My companies</ButtonLink>
        <ButtonLink href="/services/svc_consultation" variant="secondary"><CalendarClock className="size-4" /> Book consultation</ButtonLink>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Service progress */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Service progress</h2>
            <Link href="/cases" className="text-sm text-primary hover:underline">{t.common.viewAll}</Link>
          </div>
          {data.activeCases.length === 0 ? (
            <EmptyState
              icon={<Briefcase className="size-8" />}
              title="No active services"
              description="Order a service to get started with JR & Firm."
              action={<ButtonLink href="/services" variant="primary">{t.nav.orderService}</ButtonLink>}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {data.activeCases.map((c) => (
                <ProgressCard key={c.id} record={c} />
              ))}
            </div>
          )}
        </div>

        {/* Next actions */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">{t.common.nextAction}s</h2>
          <Card>
            <CardContent className="p-0">
              {nextActions.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                  Nothing needs your attention right now.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {nextActions.map((a) => (
                    <li key={a.id}>
                      <Link href={a.href} className="flex items-start gap-3 px-5 py-3.5 hover:bg-accent">
                        <AlertCircle
                          className={
                            a.tone === "danger" ? "mt-0.5 size-4 shrink-0 text-destructive" : "mt-0.5 size-4 shrink-0 text-warning"
                          }
                        />
                        <span className="flex-1 text-sm">{a.label}</span>
                        <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {renewals.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <CalendarClock className="size-4 text-gold" /> Upcoming renewals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {renewals.map((c) => (
                  <div key={c.id} className="flex items-center justify-between">
                    <span className="truncate pr-2">{c.name}</span>
                    <span className="shrink-0 text-muted-foreground">{formatDate(c.renewalDate)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recent documents + invoices */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent documents</CardTitle>
            <Link href="/documents" className="text-sm text-primary hover:underline">{t.common.viewAll}</Link>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {data.documents.slice(0, 4).map((d) => (
                <li key={d.id} className="flex items-center justify-between px-5 py-3">
                  <span className="truncate pr-3 text-sm">{d.title}</span>
                  <StatusBadge meta={DOCUMENT_STATUS[d.status]} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent invoices</CardTitle>
            <Link href="/invoices" className="text-sm text-primary hover:underline">{t.common.viewAll}</Link>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {data.invoices.slice(0, 4).map((i) => (
                <li key={i.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <Link href={`/invoices/${i.id}`} className="block truncate text-sm font-medium hover:underline">
                      {i.number}
                    </Link>
                    <span className="text-xs text-muted-foreground">{formatMoney(i.amount, i.currency)} · due {formatDate(i.dueDate)}</span>
                  </div>
                  <StatusBadge meta={INVOICE_STATUS[i.status]} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Separator />
      <Disclaimer variant="subtle">{t.disclaimers.advice}</Disclaimer>
    </div>
  );
}
