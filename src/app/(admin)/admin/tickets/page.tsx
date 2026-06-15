import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/misc";
import { requireStaff } from "@/lib/session";
import { listAllTickets, listClients, listStaffUsers } from "@/lib/data";
import { TICKET_STATUS, TICKET_CATEGORY } from "@/lib/labels";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Tickets" };

const PRIORITY_TONE = { low: "neutral", normal: "info", high: "warning", urgent: "danger" } as const;

export default async function AdminTicketsPage() {
  await requireStaff();
  const [tickets, clients, staff] = await Promise.all([listAllTickets(), listClients(), listStaffUsers()]);
  const clientName = (id: string) => clients.find((c) => c.id === id)?.displayName ?? "—";
  const staffName = (id?: string) => staff.find((s) => s.id === id)?.fullName ?? "Unassigned";

  const sorted = [...tickets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="space-y-6">
      <PageHeader title="Tickets" description="Client inquiries and support requests." />
      <Card>
        <CardContent className="divide-y divide-border p-0">
          {sorted.map((tk) => (
            <Link key={tk.id} href={`/admin/tickets/${tk.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-accent">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-medium">{tk.subject}</p>
                  <Badge tone={PRIORITY_TONE[tk.priority]}>{tk.priority}</Badge>
                  <Badge tone="neutral">{TICKET_CATEGORY[tk.category]}</Badge>
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {tk.reference} · {clientName(tk.clientId)} · {staffName(tk.assignedStaffId)} · {formatDate(tk.updatedAt)}
                </p>
              </div>
              <StatusBadge meta={TICKET_STATUS[tk.status]} />
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
