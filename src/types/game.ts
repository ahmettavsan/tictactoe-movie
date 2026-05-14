import type { Difficulty, MediaMode } from "@/lib/difficulty";
import type { Production } from "./tmdb";

export type TeamIndex = 0 | 1;

export type ClaimedCell = {
  claimedBy: TeamIndex;
  personId: number;
  personName: string;
} | null;

export type MatchStatus = "setup" | "loading" | "playing" | "finished";

export type Team = { name: string };

export type ProductionTriplet = [Production, Production, Production];

export type SetupOptions = {
  mode: MediaMode;
  difficulty: Difficulty;
  teams: [string, string];
};
