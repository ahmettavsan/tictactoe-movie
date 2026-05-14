"use client";

import { create } from "zustand";
import type { Difficulty, MediaMode } from "@/lib/difficulty";
import type { ClaimedCell, MatchStatus, ProductionTriplet, Team, TeamIndex } from "@/types/game";
import type { Production } from "@/types/tmdb";

type State = {
  status: MatchStatus;
  mode: MediaMode;
  difficulty: Difficulty;
  teams: [Team, Team];
  rows: ProductionTriplet | [];
  cols: ProductionTriplet | [];
  cells: ClaimedCell[][]; // 3x3
  currentTeam: TeamIndex;
  consecutivePasses: number;
  scores: [number, number];
  startError: string | null;
};

type ClaimPayload = { personId: number; personName: string };

type Actions = {
  setTeams: (teams: [string, string]) => void;
  setMode: (mode: MediaMode) => void;
  setDifficulty: (d: Difficulty) => void;
  startMatch: () => Promise<void>;
  claimCell: (row: number, col: number, p: ClaimPayload) => void;
  pass: () => void;
  resetMatch: () => void;
  backToSetup: () => void;
};

const empty3x3 = (): ClaimedCell[][] =>
  Array.from({ length: 3 }, () => Array.from({ length: 3 }, () => null));

const initial: State = {
  status: "setup",
  mode: "mixed",
  difficulty: "easy",
  teams: [{ name: "Takım A" }, { name: "Takım B" }],
  rows: [],
  cols: [],
  cells: empty3x3(),
  currentTeam: 0,
  consecutivePasses: 0,
  scores: [0, 0],
  startError: null,
};

export const useGameStore = create<State & Actions>()((set, get) => ({
  ...initial,

  setTeams: (names) => {
    set({
      teams: [
        { name: names[0].trim() || "Takım A" },
        { name: names[1].trim() || "Takım B" },
      ],
    });
  },

  setMode: (mode) => set({ mode }),
  setDifficulty: (difficulty) => set({ difficulty }),

  startMatch: async () => {
    set({ status: "loading", startError: null });
    try {
      const { mode, difficulty } = get();
      const res = await fetch(
        `/api/productions/random?type=${mode}&difficulty=${difficulty}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `HTTP ${res.status}`);
      }
      const data = (await res.json()) as { productions: Production[] };
      if (!data.productions || data.productions.length < 6) {
        throw new Error("Yeterli yapım bulunamadı");
      }
      const rows = data.productions.slice(0, 3) as ProductionTriplet;
      const cols = data.productions.slice(3, 6) as ProductionTriplet;
      set({
        rows,
        cols,
        cells: empty3x3(),
        currentTeam: 0,
        consecutivePasses: 0,
        scores: [0, 0],
        status: "playing",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Bilinmeyen hata";
      set({ status: "setup", startError: msg });
    }
  },

  claimCell: (row, col, p) => {
    const state = get();
    if (state.status !== "playing") return;
    if (state.cells[row][col]) return;

    const newCells = state.cells.map((r) => r.slice());
    newCells[row][col] = {
      claimedBy: state.currentTeam,
      personId: p.personId,
      personName: p.personName,
    };

    const scores: [number, number] = [state.scores[0], state.scores[1]];
    scores[state.currentTeam] += 1;

    const totalClaimed = newCells.flat().filter(Boolean).length;
    const finished = totalClaimed === 9;

    set({
      cells: newCells,
      scores,
      consecutivePasses: 0,
      currentTeam: state.currentTeam === 0 ? 1 : 0,
      status: finished ? "finished" : "playing",
    });
  },

  pass: () => {
    const state = get();
    if (state.status !== "playing") return;
    const next = state.consecutivePasses + 1;
    if (next >= 2) {
      set({ consecutivePasses: next, status: "finished" });
    } else {
      set({
        consecutivePasses: next,
        currentTeam: state.currentTeam === 0 ? 1 : 0,
      });
    }
  },

  resetMatch: () => {
    set({
      cells: empty3x3(),
      currentTeam: 0,
      consecutivePasses: 0,
      scores: [0, 0],
      status: "loading",
      startError: null,
    });
    void get().startMatch();
  },

  backToSetup: () => {
    set({
      status: "setup",
      rows: [],
      cols: [],
      cells: empty3x3(),
      currentTeam: 0,
      consecutivePasses: 0,
      scores: [0, 0],
      startError: null,
    });
  },
}));

// ---------- Selectors ----------

export function selectIsBoardFull(state: State): boolean {
  return state.cells.flat().every((c) => c !== null);
}

export function selectWinner(state: State): TeamIndex | "draw" | null {
  if (state.status !== "finished") return null;
  const [a, b] = state.scores;
  if (a === b) return "draw";
  return a > b ? 0 : 1;
}

export function selectIsCellPlayable(state: State, row: number, col: number): boolean {
  if (state.status !== "playing") return false;
  return state.cells[row]?.[col] == null;
}
