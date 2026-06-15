import Link from "next/link";
import { MessagesSquare, ChevronRight, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { PageHeader, EmptyState } from "@/components/ui/misc";
import { ButtonLink } from "@/components/ui/button";
import { requireClient } from "@/lib/session";
import { listTicketsForClient } from "@/lib/data";
import { TICKET_STATUS, TICKET_CATEGORY } from "@/lib/labels";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Messages" };

export default async function MessagesPage() {
  const user = await requireClient();
  const tickets = (await listTicketsForClient(user.clientId)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Messages & Support"
        description="Open inquiries and support tickets with the JR & Firm team."
        actions={<ButtonLink href="/messages/new" variant="gold"><Plus className="size-4" /> New inquiry</ButtonLink>}
      />

      {tickets.length === 0 ? (
        <EmptyState
          icon={<MessagesSquare className="size-8" />}
          title="No messages yet"
          description="Start a conversation with our team whenever you need assistance."
          action={<ButtonLink href="/messages/new">New inquiry</ButtonLink>}
        />
      ) : (
        <Card>
          <CardContent className="divide-y divide-border p-0">
            {tickets.map((tk) => {
              const last = tk.messages.filter((m) => !m.internal).at(-1);
              return (
                <Link key={tk.id} href={`/messages/${tk.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-accent">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{tk.subject}</p>
                      <Badge tone="neutral">{TICKET_CATEGORY[tk.category]}</Badge>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {tk.reference} · {last ? `${last.authorName}: ${last.body}` : "No messages"}
                    </p>
                  </div>
                  <div className="hidden shrink-0 text-right sm:block">
                    <StatusBadge meta={TICKET_STATUS[tk.status]} />
                    <p className="mt-1 text-xs text-muted-foreground">{formatDate(tk.updatedAt)}</p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                </Link>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
