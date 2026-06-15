import { Lock } from "lucide-react";
import { Avatar } from "@/components/ui/misc";
import { cn, formatDate } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/rbac";
import type { Ticket } from "@/lib/types";

/**
 * Ticket conversation. `showInternal` controls visibility of internal staff
 * notes — always false for clients (enforced again by RLS on the server).
 */
export function TicketThread({
  ticket,
  currentUserId,
  showInternal,
}: {
  ticket: Ticket;
  currentUserId: string;
  showInternal: boolean;
}) {
  const messages = ticket.messages.filter((m) => showInternal || !m.internal);

  return (
    <div className="space-y-4">
      {messages.map((m) => {
        const mine = m.authorId === currentUserId;
        const staff = m.authorRole !== "client";
        return (
          <div key={m.id} className={cn("flex gap-3", mine && "flex-row-reverse")}>
            <Avatar name={m.authorName} size={36} color={staff ? "#264f78" : "#7a4f1f"} />
            <div className={cn("max-w-[80%] space-y-1", mine && "items-end text-right")}>
              <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", mine && "flex-row-reverse")}>
                <span className="font-medium text-foreground">{m.authorName}</span>
                <span>{ROLE_LABELS[m.authorRole]}</span>
                <span>·</span>
                <span>{formatDate(m.createdAt)}</span>
              </div>
              <div
                className={cn(
                  "rounded-lg border px-4 py-2.5 text-sm",
                  m.internal
                    ? "border-warning/30 bg-warning/5 text-foreground/80"
                    : mine
                      ? "border-primary/20 bg-primary/5"
                      : "border-border bg-card",
                )}
              >
                {m.internal && (
                  <span className="mb-1 flex items-center gap-1.5 text-xs font-medium text-warning">
                    <Lock className="size-3" /> Internal note — not visible to client
                  </span>
                )}
                <p className="whitespace-pre-wrap leading-relaxed">{m.body}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
