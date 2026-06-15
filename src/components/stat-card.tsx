import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

/** Compact KPI card for dashboards. Optionally links to a drill-down. */
export function StatCard({
  label,
  value,
  hint,
  icon,
  href,
  tone = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  href?: string;
  tone?: "default" | "warning" | "danger" | "success";
}) {
  const toneStyles = {
    default: { chip: "bg-primary/10 text-primary ring-primary/15", bar: "from-primary/60 to-gold" },
    warning: { chip: "bg-warning/10 text-warning ring-warning/15", bar: "from-warning/60 to-warning" },
    danger: { chip: "bg-destructive/10 text-destructive ring-destructive/15", bar: "from-destructive/60 to-destructive" },
    success: { chip: "bg-success/10 text-success ring-success/15", bar: "from-success/60 to-success" },
  }[tone];

  const inner = (
    <Card className={cn("relative overflow-hidden p-5", href && "card-lift")}>
      {/* thin accent rail along the top */}
      <span className={cn("pointer-events-none absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r opacity-80", toneStyles.bar)} />
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="font-serif text-3xl font-semibold leading-none tabular-nums">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {icon && (
          <div className={cn("grid size-10 shrink-0 place-items-center rounded-xl ring-1 [&_svg]:size-5", toneStyles.chip)}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );

  return href ? (
    <Link href={href} className="block rounded-lg focus-ring">
      {inner}
    </Link>
  ) : (
    inner
  );
}
