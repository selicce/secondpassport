import * as React from "react";
import { cn, initials } from "@/lib/utils";

// ── Avatar ──────────────────────────────────────────────────────────────────
export function Avatar({
  name,
  color,
  size = 36,
  className,
}: {
  name: string;
  color?: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-medium text-white",
        className,
      )}
      style={{ width: size, height: size, backgroundColor: color ?? "#264f78", fontSize: size * 0.36 }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

// ── Progress bar ────────────────────────────────────────────────────────────
export function ProgressBar({
  value,
  className,
  tone = "primary",
}: {
  value: number;
  className?: string;
  tone?: "primary" | "gold" | "success";
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const bar =
    tone === "gold" ? "bg-gold" : tone === "success" ? "bg-success" : "bg-primary";
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-secondary", className)}>
      <div className={cn("h-full rounded-full transition-all", bar)} style={{ width: `${clamped}%` }} />
    </div>
  );
}

// ── Separator ───────────────────────────────────────────────────────────────
export function Separator({ className }: { className?: string }) {
  return <div className={cn("h-px w-full bg-border", className)} />;
}

// ── Page header ─────────────────────────────────────────────────────────────
export function PageHeader({
  title,
  description,
  actions,
  eyebrow,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  eyebrow?: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wider text-gold">{eyebrow}</p>
        )}
        <h1 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

// ── Empty state ─────────────────────────────────────────────────────────────
export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card/50 px-6 py-12 text-center">
      {icon && <div className="text-muted-foreground/70">{icon}</div>}
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {description && <p className="mx-auto max-w-sm text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

// ── Definition list (key/value detail rows) ─────────────────────────────────
export function DataList({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="divide-y divide-border">
      {items.map((it, i) => (
        <div key={i} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-3 sm:gap-4">
          <dt className="text-sm text-muted-foreground">{it.label}</dt>
          <dd className="text-sm font-medium sm:col-span-2">{it.value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}
