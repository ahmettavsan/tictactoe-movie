"use client";

import { SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useGameStore } from "@/store/gameStore";

export function Scoreboard() {
  const { teams, scores, currentTeam, status, pass } = useGameStore();
  const isPlaying = status === "playing";

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-1.5 backdrop-blur-xl">
      <div className="grid flex-1 grid-cols-2 gap-1.5">
        <TeamChip
          name={teams[0].name}
          score={scores[0]}
          active={isPlaying && currentTeam === 0}
          color="a"
        />
        <TeamChip
          name={teams[1].name}
          score={scores[1]}
          active={isPlaying && currentTeam === 1}
          color="b"
        />
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={pass}
        disabled={!isPlaying}
        className="press-scale shrink-0 self-stretch"
        title="Sırayı geç — iki kez ardışık pas geçilirse maç biter"
      >
        <SkipForward className="h-3.5 w-3.5" /> Pas
      </Button>
    </div>
  );
}

function TeamChip({
  name,
  score,
  active,
  color,
}: {
  name: string;
  score: number;
  active: boolean;
  color: "a" | "b";
}) {
  const isA = color === "a";
  return (
    <div
      className={cn(
        "relative flex items-center justify-between gap-2 rounded-xl border px-3 py-2 transition-all",
        isA
          ? "border-[var(--team-a)]/40 bg-[var(--team-a-soft)]"
          : "border-[var(--team-b)]/40 bg-[var(--team-b-soft)]",
        active && (isA ? "active-glow-a" : "active-glow-b")
      )}
    >
      {/* Active indicator dot */}
      {active && (
        <span
          className={cn(
            "absolute top-1.5 right-1.5 inline-flex h-1.5 w-1.5 rounded-full",
            isA ? "bg-[var(--team-a)]" : "bg-[var(--team-b)]"
          )}
        >
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              isA ? "bg-[var(--team-a)]" : "bg-[var(--team-b)]"
            )}
          />
        </span>
      )}

      <div className="flex min-w-0 flex-col leading-tight">
        <span
          className={cn(
            "text-[9px] uppercase tracking-[0.2em] opacity-75 truncate",
            isA ? "text-[var(--team-a)]" : "text-[var(--team-b)]"
          )}
        >
          {active ? "Sıra" : "Takım"}
        </span>
        <span
          className={cn(
            "text-sm font-bold truncate",
            isA ? "text-[var(--team-a)]" : "text-[var(--team-b)]"
          )}
        >
          {name}
        </span>
      </div>
      <span
        className={cn(
          "font-display text-3xl leading-none tabular-numbers",
          isA ? "text-[var(--team-a)]" : "text-[var(--team-b)]"
        )}
      >
        {score}
      </span>
    </div>
  );
}
