"use client";
import * as React from "react";
import { Send, Loader2, Paperclip, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { IS_DEMO } from "@/lib/is-demo";
import { postTicketMessageAction } from "@/app/actions/portal";

/**
 * Ticket reply composer. Demo simulates posting; production calls a server
 * action that inserts a `ticket_messages` row, flips ticket status, optionally
 * emails the counterparty, and records the activity.
 */
export function TicketReply({
  ticketId,
  ticketRef,
  allowInternal,
}: {
  ticketId: string;
  ticketRef: string;
  allowInternal?: boolean;
}) {
  const [body, setBody] = React.useState("");
  const [internal, setInternal] = React.useState(false);
  const [state, setState] = React.useState<"idle" | "sending" | "sent">("idle");

  async function send() {
    if (!body.trim()) return;
    setState("sending");
    if (IS_DEMO) {
      await new Promise((r) => setTimeout(r, 700));
    } else {
      await postTicketMessageAction(ticketId, body, internal);
    }
    setState("sent");
    setBody("");
    setTimeout(() => setState("idle"), 2500);
  }

  return (
    <div className="space-y-3">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={internal ? "Internal note — not visible to the client…" : `Reply regarding ${ticketRef}…`}
        rows={4}
        className={internal ? "border-warning/40 bg-warning/5" : undefined}
      />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="sm" className="text-muted-foreground">
            <Paperclip className="size-4" /> Attach
          </Button>
          {allowInternal && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={internal} onChange={(e) => setInternal(e.target.checked)} className="size-4 rounded border-input" />
              Internal note
            </label>
          )}
        </div>
        <div className="flex items-center gap-3">
          {state === "sent" && (
            <span className="flex items-center gap-1.5 text-sm text-success">
              <CheckCircle2 className="size-4" /> Sent
            </span>
          )}
          <Button onClick={send} disabled={state === "sending" || !body.trim()} variant={internal ? "secondary" : "primary"}>
            {state === "sending" ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            {internal ? "Add note" : "Send reply"}
          </Button>
        </div>
      </div>
    </div>
  );
}
