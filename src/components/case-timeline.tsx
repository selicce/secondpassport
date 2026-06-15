import { Check } from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { CaseTimelineStep } from "@/lib/types";

/** Vertical client-facing progress timeline for a case. Internal notes excluded. */
export function CaseTimeline({ steps }: { steps: CaseTimelineStep[] }) {
  return (
    <ol className="relative space-y-0">
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={step.key} className="relative flex gap-4 pb-6 last:pb-0">
            {!last && (
              <span
                className={cn(
                  "absolute left-[11px] top-6 h-full w-px",
                  step.status === "done" ? "bg-primary" : "bg-border",
                )}
                aria-hidden
              />
            )}
            <span
              className={cn(
                "z-10 mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                step.status === "done" && "border-primary bg-primary text-primary-foreground",
                step.status === "current" && "border-gold bg-gold/15 text-gold",
                step.status === "pending" && "border-border bg-card text-muted-foreground",
              )}
            >
              {step.status === "done" ? (
                <Check className="size-3.5" />
              ) : (
                <span className={cn("size-2 rounded-full", step.status === "current" ? "bg-gold" : "bg-muted-foreground/40")} />
              )}
            </span>
            <div className="flex-1 pt-0.5">
              <p
                className={cn(
                  "text-sm font-medium",
                  step.status === "pending" && "text-muted-foreground",
                )}
              >
                {step.label}
              </p>
              {step.date && <p className="text-xs text-muted-foreground">{formatDate(step.date)}</p>}
              {step.status === "current" && !step.date && (
                <p className="text-xs font-medium text-gold">In progress</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
