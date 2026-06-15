import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { ProgressBar } from "@/components/ui/misc";
import { CASE_STATUS } from "@/lib/labels";
import { formatDate } from "@/lib/utils";
import type { CaseRecord } from "@/lib/types";

/** Service progress card shown on the client dashboard and case list. */
export function ProgressCard({ record }: { record: CaseRecord }) {
  return (
    <Link href={`/cases/${record.id}`} className="group block focus-ring rounded-lg">
      <Card className="p-5 transition-shadow group-hover:shadow-elevated">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate font-medium">{record.serviceTitle}</p>
            <p className="text-xs text-muted-foreground">{record.reference}</p>
          </div>
          <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <StatusBadge meta={CASE_STATUS[record.status]} />
            <span className="font-medium tabular-nums text-muted-foreground">{record.progressPercent}%</span>
          </div>
          <ProgressBar
            value={record.progressPercent}
            tone={record.progressPercent === 100 ? "success" : "primary"}
          />
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
