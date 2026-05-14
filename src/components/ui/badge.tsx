import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "teamA" | "teamB" | "muted";
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantClass =
    variant === "teamA"
      ? "bg-[var(--team-a-soft)] text-[var(--team-a)] border border-[var(--team-a)]/30"
      : variant === "teamB"
      ? "bg-[var(--team-b-soft)] text-[var(--team-b)] border border-[var(--team-b)]/30"
      : variant === "muted"
      ? "bg-[var(--muted)] text-[var(--muted-foreground)]"
      : "bg-[var(--primary)] text-[var(--primary-foreground)]";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium leading-none",
        variantClass,
        className
      )}
      {...props}
    />
  );
}
