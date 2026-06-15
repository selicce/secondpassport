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
  const accent =
    tone === "warning"
      ? "text-warning"
      : tone === "danger"
        ? "text-destructive"
        : tone === "success"
          ? "text-success"
          : "text-primary";

  const inner = (
    <Card className={cn("p-5 transition-shadow", href && "hover:shadow-elevated")}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="font-serif text-2xl font-semibold tabular-nums">{value}</p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {icon && <div className={cn("rounded-md bg-muted p-2", accent)}>{icon}</div>}
      </div>
    </Card>
  );

  return href ? (
    <Link href={href} className="block focus-ring rounded-lg">
      {inner}
    </Link>
  ) : (
    inner
  );
}
