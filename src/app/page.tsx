"use client";

import { useGameStore } from "@/store/gameStore";
import { SetupScreen } from "@/components/setup/SetupScreen";
import { GameBoard } from "@/components/game/GameBoard";
import { ResultScreen } from "@/components/game/ResultScreen";

export default function Home() {
  const status = useGameStore((s) => s.status);

  if (status === "setup" || status === "loading") {
    return <SetupScreen />;
  }
  if (status === "finished") {
    return <ResultScreen />;
  }
  return <GameBoard />;
}
