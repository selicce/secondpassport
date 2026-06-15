import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { CASE_STATUS } from "@/lib/labels";
import { cn, formatDate } from "@/lib/utils";
import type { CaseRecord } from "@/lib/types";

/** Circular progress indicator (navy→gold sweep, green when complete). */
function ProgressRing({ percent, done, id }: { percent: number; done: boolean; id: string }) {
  const r = 16;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, percent));
  const dash = (pct / 100) * circumference;
  return (
    <div className="relative size-12 shrink-0">
      <svg viewBox="0 0 40 40" className="size-12 -rotate-90">
        <circle cx="20" cy="20" r={r} fill="none" stroke="hsl(var(--muted))" strokeWidth="4" />
        <circle
          cx="20"
          cy="20"
          r={r}
          fill="none"
          stroke={done ? "hsl(var(--success))" : `url(#ring-${id})`}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
        />
        <defs>
          <linearGradient id={`ring-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(219 52% 32%)" />
            <stop offset="100%" stopColor="hsl(38 58% 52%)" />
          </linearGradient>
        </defs>
      </svg>
      <span className="absolute inset-0 grid place-items-center text-[11px] font-semibold tabular-nums">{pct}</span>
    </div>
  );
}

/** Service progress card shown on the client dashboard and case list. */
export function ProgressCard({ record }: { record: CaseRecord }) {
  const pct = Math.max(0, Math.min(100, record.progressPercent));
  const done = record.progressPercent === 100;
  return (
    <Link href={`/cases/${record.id}`} className="group block rounded-lg focus-ring">
      <Card className="card-lift p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{record.serviceTitle}</p>
            <p className="text-xs text-muted-foreground">{record.reference}</p>
            <div className="mt-3">
              <StatusBadge meta={CASE_STATUS[record.status]} />
            </div>
          </div>
          <ProgressRing percent={record.progressPercent} done={done} id={record.id} />
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              Progress
              <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
            </span>
            <span className="font-medium tabular-nums">{pct}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full bg-gradient-to-r transition-all",
                done ? "from-success to-success" : "from-primary to-gold",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {record.estimatedCompletion && (
          <p className="mt-3 text-xs text-muted-foreground">
            Est. completion {formatDate(record.estimatedCompletion)}
          </p>
        )}
      </Card>
    </Link>
  );
}
