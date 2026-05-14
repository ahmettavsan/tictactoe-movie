"use client";

import { useState } from "react";
import { Home, RefreshCw, Swords } from "lucide-react";
import { HeaderTile } from "./HeaderTile";
import { Cell } from "./Cell";
import { Scoreboard } from "./Scoreboard";
import { CellInputModal } from "./CellInputModal";
import { useGameStore, selectIsCellPlayable } from "@/store/gameStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DIFFICULTY_LABELS, MODE_LABELS } from "@/lib/difficulty";

export function GameBoard() {
  const state = useGameStore();
  const { rows, cols, cells, currentTeam, status, mode, difficulty, backToSetup, resetMatch } = state;
  const [picker, setPicker] = useState<{ row: number; col: number } | null>(null);

  if (rows.length !== 3 || cols.length !== 3) return null;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-3 px-3 pt-3 pb-6 sm:max-w-2xl sm:px-4 sm:pt-5">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-2 anim-fade-in">
        <Button variant="ghost" size="icon" onClick={backToSetup} aria-label="Setup'a dön" className="press-scale">
          <Home className="h-4 w-4" />
        </Button>
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <Badge variant="muted">{MODE_LABELS[mode]}</Badge>
          <Badge variant="muted">{DIFFICULTY_LABELS[difficulty]}</Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={resetMatch}
          aria-label="Yeni yapımlarla başla"
          className="press-scale"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </header>

      {/* Sticky scoreboard */}
      <div className="sticky top-2 z-20 anim-slide-up">
        <Scoreboard />
      </div>

      {/* Board */}
      <div className="grid aspect-square w-full grid-cols-4 grid-rows-4 gap-1.5 sm:gap-2 anim-fade-in">
        {/* (0,0) — VS emblem */}
        <div className="relative flex items-center justify-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--card)]">
          <Swords className="h-5 w-5 text-[var(--foreground-muted)] sm:h-6 sm:w-6" />
        </div>
        {/* column headers (top row) */}
        {cols.map((p, i) => (
          <HeaderTile key={`col-${i}`} production={p} />
        ))}
        {/* rows */}
        {rows.map((rowProd, r) => (
          <RowGroup
            key={`row-${r}`}
            rowProd={rowProd}
            r={r}
            cells={cells[r]}
            currentTeam={currentTeam}
            onCellClick={(c) => {
              if (selectIsCellPlayable(state, r, c)) setPicker({ row: r, col: c });
            }}
            playing={status === "playing"}
          />
        ))}
      </div>

      {picker && (
        <CellInputModal
          open={picker !== null}
          onOpenChange={(o) => {
            if (!o) setPicker(null);
          }}
          row={picker.row}
          col={picker.col}
        />
      )}
    </div>
  );
}

function RowGroup({
  rowProd,
  r,
  cells,
  currentTeam,
  onCellClick,
  playing,
}: {
  rowProd: ReturnType<typeof useGameStore.getState>["rows"][number];
  r: number;
  cells: ReturnType<typeof useGameStore.getState>["cells"][number];
  currentTeam: 0 | 1;
  onCellClick: (c: number) => void;
  playing: boolean;
}) {
  return (
    <>
      <HeaderTile production={rowProd} />
      {[0, 1, 2].map((c) => (
        <Cell
          key={`cell-${r}-${c}`}
          cell={cells[c]}
          currentTeam={currentTeam}
          disabled={!playing || cells[c] !== null}
          onClick={() => onCellClick(c)}
        />
      ))}
    </>
  );
}
