import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { DataList, PageHeader } from "@/components/ui/misc";
import { Select } from "@/components/ui/field";
import { TicketThread } from "@/components/ticket-thread";
import { TicketReply } from "@/components/forms/ticket-reply";
import { requireStaff } from "@/lib/session";
import { can } from "@/lib/rbac";
import { getTicket, getClientById, getUserById, listStaffUsers } from "@/lib/data";
import { TICKET_STATUS, TICKET_CATEGORY } from "@/lib/labels";
import type { TicketStatus } from "@/lib/types";

export default async function AdminTicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireStaff();
  const { id } = await params;
  const ticket = await getTicket(id);
  if (!ticket) notFound();

  const [client, assignee, staff] = await Promise.all([
    getClientById(ticket.clientId),
    ticket.assignedStaffId ? getUserById(ticket.assignedStaffId) : Promise.resolve(undefined),
    listStaffUsers(),
  ]);
  const canRespond = can(user.role, "tickets.respond");
  const canAssign = can(user.role, "tickets.assign");

  return (
    <div className="space-y-6">
      <Link href="/admin/tickets" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All tickets
      </Link>

      <PageHeader
        eyebrow={ticket.reference}
        title={ticket.subject}
        description={client ? `${client.displayName} · ${client.primaryContactName}` : undefined}
        actions={<><Badge tone="neutral">{TICKET_CATEGORY[ticket.category]}</Badge><StatusBadge meta={TICKET_STATUS[ticket.status]} /></>}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              {/* Staff see internal notes. */}
              <TicketThread ticket={ticket} currentUserId={user.id} showInternal />
            </CardContent>
          </Card>

          {canRespond && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm">Reply</CardTitle></CardHeader>
              <CardContent><TicketReply ticketId={ticket.id} ticketRef={ticket.reference} allowInternal /></CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Properties</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Status</label>
                <Select defaultValue={ticket.status} disabled={!canRespond}>
                  {(Object.keys(TICKET_STATUS) as TicketStatus[]).map((s) => (
                    <option key={s} value={s}>{TICKET_STATUS[s].label}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Assigned to</label>
                <Select defaultValue={ticket.assignedStaffId ?? ""} disabled={!canAssign}>
                  <option value="">Unassigned</option>
                  {staff.map((s) => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Linked</CardTitle></CardHeader>
            <CardContent>
              <DataList
                items={[
                  { label: "Client", value: client ? <Link className="text-primary hover:underline" href={`/admin/clients/${client.id}`}>{client.displayName}</Link> : "—" },
                  { label: "Case", value: ticket.caseId ? <Link className="text-primary hover:underline" href={`/admin/cases/${ticket.caseId}`}>{ticket.caseId}</Link> : "—" },
                  { label: "Assignee", value: assignee?.fullName ?? "Unassigned" },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
