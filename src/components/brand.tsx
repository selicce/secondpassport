import { cn } from "@/lib/utils";

/**
 * JR & Firm wordmark. A restrained monogram in a gold-bordered square plus the
 * firm name — no illustration, in keeping with the private-banking aesthetic.
 */
export function BrandMark({
  size = "md",
  variant = "dark",
  showTagline = true,
  tagline = "Client Portal",
}: {
  size?: "sm" | "md" | "lg";
  variant?: "dark" | "light";
  showTagline?: boolean;
  tagline?: string;
}) {
  const box = size === "lg" ? "h-11 w-11 text-lg" : size === "sm" ? "h-8 w-8 text-xs" : "h-9 w-9 text-sm";
  const name = size === "lg" ? "text-xl" : size === "sm" ? "text-sm" : "text-base";
  const onLight = variant === "light";

  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-md border font-serif font-semibold tracking-tight",
          box,
          onLight
            ? "border-gold/40 bg-gold/10 text-gold"
            : "border-gold/50 bg-white/5 text-gold",
        )}
      >
        JR
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-serif font-semibold tracking-tight",
            name,
            onLight ? "text-foreground" : "text-white",
          )}
        >
          JR&nbsp;&amp;&nbsp;Firm
        </span>
        {showTagline && (
          <span
            className={cn(
              "mt-1 text-[10px] font-medium uppercase tracking-[0.18em]",
              onLight ? "text-muted-foreground" : "text-white/55",
            )}
          >
            {tagline}
          </span>
        )}
      </span>
    </span>
  );
}
