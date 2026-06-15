import * as React from "react";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/labels";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-secondary text-secondary-foreground border-border",
  info: "bg-primary/5 text-primary border-primary/20 dark:bg-primary/10",
  success: "bg-success/10 text-success border-success/25",
  warning: "bg-warning/10 text-warning border-warning/25",
  danger: "bg-destructive/10 text-destructive border-destructive/25",
  gold: "bg-gold/10 text-gold border-gold/30",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Badge driven by a {label, tone} meta object from src/lib/labels.ts. */
export function StatusBadge({ meta, className }: { meta: { label: string; tone: Tone }; className?: string }) {
  return (
    <Badge tone={meta.tone} className={className}>
      <span className={cn("h-1.5 w-1.5 rounded-full", DOT[meta.tone])} aria-hidden />
      {meta.label}
    </Badge>
  );
}

const DOT: Record<Tone, string> = {
  neutral: "bg-muted-foreground",
  info: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-destructive",
  gold: "bg-gold",
};
