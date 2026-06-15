import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/misc";
import { TicketThread } from "@/components/ticket-thread";
import { TicketReply } from "@/components/forms/ticket-reply";
import { requireClient } from "@/lib/session";
import { getTicket } from "@/lib/data";
import { TICKET_STATUS, TICKET_CATEGORY } from "@/lib/labels";

export default async function MessageThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireClient();
  const { id } = await params;
  const ticket = await getTicket(id);
  if (!ticket || ticket.clientId !== user.clientId) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/messages" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> All messages
      </Link>

      <PageHeader
        eyebrow={ticket.reference}
        title={ticket.subject}
        actions={
          <>
            <Badge tone="neutral">{TICKET_CATEGORY[ticket.category]}</Badge>
            <StatusBadge meta={TICKET_STATUS[ticket.status]} />
          </>
        }
      />

      <Card>
        <CardContent className="p-6">
          {/* Clients never see internal notes. */}
          <TicketThread ticket={ticket} currentUserId={user.id} showInternal={false} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-sm">Reply</CardTitle></CardHeader>
        <CardContent><TicketReply ticketId={ticket.id} ticketRef={ticket.reference} /></CardContent>
      </Card>
    </div>
  );
}
