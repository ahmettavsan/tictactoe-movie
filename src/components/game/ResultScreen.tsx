"use client";

import { Crown, Handshake, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { selectWinner, useGameStore } from "@/store/gameStore";
import { cn } from "@/lib/utils";

export function ResultScreen() {
  const state = useGameStore();
  const { teams, scores, resetMatch, backToSetup } = state;
  const winner = selectWinner(state);

  const draw = winner === "draw";
  const idx = typeof winner === "number" ? winner : null;
  const winColor = idx === 0 ? "var(--team-a)" : idx === 1 ? "var(--team-b)" : "var(--foreground-muted)";

  return (
    <div className="relative mx-auto flex w-full max-w-md flex-col gap-7 px-4 py-10 sm:max-w-lg sm:py-14">
      {/* Confetti particles */}
      {!draw && <ConfettiBurst color={winColor} />}

      {/* Hero */}
      <div className="relative z-10 flex flex-col items-center gap-4 text-center">
        {draw ? (
          <div className="anim-rising-crown flex h-20 w-20 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)]">
            <Handshake className="h-9 w-9 text-[var(--foreground-dim)]" />
          </div>
        ) : (
          <div
            className="anim-rising-crown relative flex h-20 w-20 items-center justify-center rounded-full"
            style={{
              background: `radial-gradient(circle, ${idx === 0 ? "var(--team-a-soft)" : "var(--team-b-soft)"}, transparent 70%)`,
              boxShadow: `0 0 60px ${idx === 0 ? "var(--team-a-glow)" : "var(--team-b-glow)"}`,
            }}
          >
            <Crown
              className="h-12 w-12"
              fill={idx === 0 ? "var(--team-a)" : "var(--team-b)"}
              color={idx === 0 ? "var(--team-a)" : "var(--team-b)"}
            />
          </div>
        )}

        <div className="anim-slide-up flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--foreground-muted)]">
            {draw ? "Sonuç" : "Kazanan"}
          </span>
          <h1
            className="font-display text-5xl sm:text-6xl leading-none"
            style={{
              color: draw ? "var(--foreground)" : winColor,
              textShadow: draw ? "none" : `0 0 40px ${idx === 0 ? "var(--team-a-glow)" : "var(--team-b-glow)"}`,
            }}
          >
            {draw ? "BERABERE" : teams[idx!].name.toUpperCase()}
          </h1>
          <p className="mt-1 text-sm text-[var(--foreground-dim)]">
            {draw ? "İki takım da eşit hücre aldı." : "Daha çok hücre aldın — sinefil!"}
          </p>
        </div>
      </div>

      {/* Score cards */}
      <div className="relative z-10 grid grid-cols-2 gap-3 anim-slide-up">
        <ScoreCard name={teams[0].name} score={scores[0]} color="a" winner={idx === 0} />
        <ScoreCard name={teams[1].name} score={scores[1]} color="b" winner={idx === 1} />
      </div>

      <div className="relative z-10 flex flex-col gap-2 sm:flex-row anim-slide-up">
        <Button
          size="lg"
          onClick={resetMatch}
          className="press-scale h-12 flex-1"
          style={{ boxShadow: "0 8px 28px var(--primary-glow)" }}
        >
          <RefreshCw className="h-4 w-4" /> Rövanş
        </Button>
        <Button
          size="lg"
          variant="outline"
          onClick={backToSetup}
          className="press-scale h-12 flex-1"
        >
          <Home className="h-4 w-4" /> Yeni setup
        </Button>
      </div>
    </div>
  );
}

function ScoreCard({
  name,
  score,
  color,
  winner,
}: {
  name: string;
  score: number;
  color: "a" | "b";
  winner: boolean;
}) {
  const isA = color === "a";
  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-1 rounded-2xl border px-4 py-5 transition-all",
        isA
          ? "border-[var(--team-a)]/40 bg-[var(--team-a-soft)]"
          : "border-[var(--team-b)]/40 bg-[var(--team-b-soft)]"
      )}
      style={
        winner
          ? {
              boxShadow: `0 0 0 1px ${isA ? "var(--team-a)" : "var(--team-b)"}, 0 12px 36px -8px ${isA ? "var(--team-a-glow)" : "var(--team-b-glow)"}`,
            }
          : undefined
      }
    >
      {winner && (
        <Crown
          className="absolute -top-3 left-1/2 h-5 w-5 -translate-x-1/2"
          fill={isA ? "var(--team-a)" : "var(--team-b)"}
          color={isA ? "var(--team-a)" : "var(--team-b)"}
        />
      )}
      <span
        className={cn(
          "text-[10px] uppercase tracking-[0.2em] truncate w-full text-center font-bold",
          isA ? "text-[var(--team-a)]" : "text-[var(--team-b)]"
        )}
      >
        {name}
      </span>
      <span
        className={cn(
          "font-display text-5xl leading-none tabular-numbers",
          isA ? "text-[var(--team-a)]" : "text-[var(--team-b)]"
        )}
      >
        {score}
      </span>
      <span className="text-[10px] text-[var(--foreground-muted)] uppercase tracking-wider">
        {score === 1 ? "hücre" : "hücre"}
      </span>
    </div>
  );
}

function ConfettiBurst({ color }: { color: string }) {
  const dots = Array.from({ length: 18 });
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {dots.map((_, i) => {
        const left = (i * 53) % 100;
        const top = (i * 17) % 60;
        const delay = (i % 6) * 0.18;
        const size = 4 + (i % 3) * 2;
        return (
          <span
            key={i}
            className="anim-confetti absolute rounded-full"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: size,
              height: size,
              background: i % 3 === 0 ? "var(--primary)" : color,
              opacity: 0.5,
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
}
