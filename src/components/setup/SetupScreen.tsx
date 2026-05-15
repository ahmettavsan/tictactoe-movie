"use client";

import { useEffect, useState } from "react";
import { Clapperboard, Loader2, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useGameStore } from "@/store/gameStore";
import {
  DIFFICULTY_LABELS,
  MODE_LABELS,
  type Difficulty,
  type MediaMode,
} from "@/lib/difficulty";

const STORAGE_KEY = "movie-tac-toe:setup";

type Persisted = {
  teamA: string;
  teamB: string;
  mode: MediaMode;
  difficulty: Difficulty;
};

export function SetupScreen() {
  const { teams, mode, difficulty, status, startError, setTeams, setMode, setDifficulty, startMatch } =
    useGameStore();
  const [teamA, setTeamA] = useState(teams[0].name);
  const [teamB, setTeamB] = useState(teams[1].name);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as Partial<Persisted>;
      if (p.teamA) setTeamA(p.teamA);
      if (p.teamB) setTeamB(p.teamB);
      if (p.mode) setMode(p.mode);
      if (p.difficulty) setDifficulty(p.difficulty);
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loading = status === "loading";

  const handleStart = async () => {
    setTeams([teamA, teamB]);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ teamA, teamB, mode, difficulty } satisfies Persisted)
      );
    } catch {
      /* ignore */
    }
    await startMatch();
  };

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-7 px-4 py-8 sm:max-w-lg sm:py-12 stagger">
      {/* Hero */}
      <header className="flex flex-col items-center gap-3 text-center anim-slide-up">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--foreground-dim)] backdrop-blur">
          <Sparkles className="h-3 w-3 text-[var(--team-b)]" />
          <span>3×3 ikili oyun</span>
        </div>
        <h1 className="font-display text-5xl sm:text-6xl leading-[0.95]">
          <span className="bg-gradient-to-br from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
            MOVIE
          </span>
          <br />
          <span className="bg-gradient-to-br from-[var(--team-a)] via-[var(--primary)] to-[var(--team-b)] bg-clip-text text-transparent">
            TAC TOE
          </span>
        </h1>
        <p className="max-w-xs text-sm leading-relaxed text-[var(--foreground-dim)]">
          Satır ve sütundaki iki yapımda da rol almış bir oyuncu bul. <br className="hidden sm:block" />
          <span className="text-[var(--foreground-muted)]">En çok hücreyi alan kazanır.</span>
        </p>
      </header>

      {/* Teams */}
      <section className="flex flex-col gap-3 anim-slide-up">
        <h2 className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--foreground-muted)]">
          Takımlar
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="relative">
            <span
              className="absolute -top-2 left-3 z-10 rounded-full bg-[var(--team-a)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white"
              style={{ boxShadow: "0 4px 12px var(--team-a-glow)" }}
            >
              Takım A
            </span>
            <Input
              value={teamA}
              onChange={(e) => setTeamA(e.target.value)}
              maxLength={20}
              placeholder="İsim..."
              className="border-[var(--team-a)]/30 bg-[var(--team-a-soft)] focus-visible:ring-[var(--team-a)]"
            />
          </div>
          <div className="relative">
            <span
              className="absolute -top-2 left-3 z-10 rounded-full bg-[var(--team-b)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-black"
              style={{ boxShadow: "0 4px 12px var(--team-b-glow)" }}
            >
              Takım B
            </span>
            <Input
              value={teamB}
              onChange={(e) => setTeamB(e.target.value)}
              maxLength={20}
              placeholder="İsim..."
              className="border-[var(--team-b)]/30 bg-[var(--team-b-soft)] focus-visible:ring-[var(--team-b)]"
            />
          </div>
        </div>
      </section>

      {/* Mode */}
      <section className="flex flex-col gap-3 anim-slide-up">
        <h2 className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--foreground-muted)]">
          Mod
        </h2>
        <RadioGroup
          value={mode}
          onValueChange={(v) => setMode(v as MediaMode)}
          className="grid-cols-1"
        >
          {(Object.keys(MODE_LABELS) as MediaMode[]).map((m) => (
            <RadioGroupItem
              key={m}
              value={m}
              label={MODE_LABELS[m]}
              hint={
                m === "movie"
                  ? "Sadece sinema filmleri"
                  : m === "tv"
                  ? "Sadece TV dizileri"
                  : m === "turkish"
                  ? "Sadece Türk yapımları (film + dizi)"
                  : "Film + dizi, daha geniş havuz"
              }
            />
          ))}
        </RadioGroup>
      </section>

      {/* Difficulty */}
      <section className="flex flex-col gap-3 anim-slide-up">
        <h2 className="text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--foreground-muted)]">
          Zorluk
        </h2>
        <RadioGroup
          value={difficulty}
          onValueChange={(v) => setDifficulty(v as Difficulty)}
          className="grid-cols-1"
        >
          {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((d) => (
            <RadioGroupItem
              key={d}
              value={d}
              label={DIFFICULTY_LABELS[d]}
              hint={
                d === "easy"
                  ? "Tanınan oyuncular — başrol + önemli yan rol"
                  : d === "medium"
                  ? "Geniş kadro — tüm ana & tekrarlayan oyuncular"
                  : "Tüm cast — guest / minor roller da geçer"
              }
            />
          ))}
        </RadioGroup>
      </section>

      {startError && (
        <div className="anim-fade-in rounded-xl border border-[var(--destructive)]/40 bg-[var(--destructive-soft)] px-3 py-2.5 text-sm text-[var(--destructive)]">
          {startError}
        </div>
      )}

      <Button
        size="lg"
        onClick={handleStart}
        disabled={loading}
        className="press-scale h-14 w-full text-base font-semibold tracking-wide anim-slide-up"
        style={{ boxShadow: loading ? "none" : "0 8px 32px var(--primary-glow)" }}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Yapımlar yükleniyor…
          </>
        ) : (
          <>
            <Clapperboard className="h-5 w-5" />
            <span>MAÇI BAŞLAT</span>
            <Play className="h-3.5 w-3.5 opacity-70" />
          </>
        )}
      </Button>
    </div>
  );
}
