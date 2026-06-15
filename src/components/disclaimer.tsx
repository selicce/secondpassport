import { ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Compliance disclaimer block. Used wherever sensitive expectations must be set
 * (bank/government approval, no legal advice, data consent). Copy is sourced
 * from the i18n dictionary so it stays consistent and translatable.
 */
export function Disclaimer({
  children,
  className,
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "subtle";
}) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-md border px-4 py-3 text-sm",
        variant === "default"
          ? "border-warning/30 bg-warning/5 text-foreground/80"
          : "border-border bg-muted/40 text-muted-foreground",
        className,
      )}
      role="note"
    >
      <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
      <div className="space-y-1 leading-relaxed">{children}</div>
    </div>
  );
}

export function DisclaimerList({ items, className }: { items: string[]; className?: string }) {
  if (!items.length) return null;
  return (
    <Disclaimer className={className}>
      <ul className="list-disc space-y-1 pl-4">
        {items.map((d, i) => (
          <li key={i}>{d}</li>
        ))}
      </ul>
    </Disclaimer>
  );
}
