"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClaimedCell, TeamIndex } from "@/types/game";

type CellProps = {
  cell: ClaimedCell;
  currentTeam: TeamIndex;
  disabled: boolean;
  onClick: () => void;
};

export function Cell({ cell, currentTeam, disabled, onClick }: CellProps) {
  const baseClasses =
    "relative flex h-full w-full items-center justify-center rounded-xl border overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]";

  if (cell) {
    const isA = cell.claimedBy === 0;
    return (
      <div
        className={cn(
          baseClasses,
          "cursor-default anim-claim",
          isA
            ? "border-[var(--team-a)]/60 bg-[var(--team-a-soft)]"
            : "border-[var(--team-b)]/60 bg-[var(--team-b-soft)]"
        )}
        style={{
          boxShadow: isA
            ? "inset 0 0 0 1px var(--team-a-glow), 0 4px 18px -10px var(--team-a-glow)"
            : "inset 0 0 0 1px var(--team-b-glow), 0 4px 18px -10px var(--team-b-glow)",
        }}
      >
        <div className="flex flex-col items-center justify-center gap-0.5 px-1 text-center">
          <span
            className={cn(
              "text-[10px] sm:text-xs font-bold leading-tight line-clamp-3 px-0.5",
              isA ? "text-[var(--team-a)]" : "text-[var(--team-b)]"
            )}
          >
            {cell.personName}
          </span>
        </div>
      </div>
    );
  }

  const isTeamA = currentTeam === 0;
  const hoverClass = isTeamA
    ? "hover:border-[var(--team-a)]/50 hover:bg-[var(--team-a-soft)] hover:shadow-[0_0_0_1px_var(--team-a-glow)]"
    : "hover:border-[var(--team-b)]/50 hover:bg-[var(--team-b-soft)] hover:shadow-[0_0_0_1px_var(--team-b-glow)]";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        baseClasses,
        "press-scale border-dashed border-[var(--border-strong)] bg-[var(--card)] transition-all duration-200",
        !disabled && hoverClass,
        disabled && "opacity-40"
      )}
      aria-label={`Boş hücre — ${isTeamA ? "Takım A" : "Takım B"} oyuncu yaz`}
    >
      <Plus
        className={cn(
          "h-5 w-5 sm:h-6 sm:w-6 transition-colors",
          isTeamA ? "text-[var(--team-a)]/50" : "text-[var(--team-b)]/50"
        )}
      />
    </button>
  );
}
