export type Difficulty = "easy" | "medium" | "hard";
export type MediaMode = "movie" | "tv" | "mixed" | "turkish";

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Kolay",
  medium: "Orta",
  hard: "Zor",
};

export const MODE_LABELS: Record<MediaMode, string> = {
  movie: "Sadece film",
  tv: "Sadece dizi",
  mixed: "Karışık",
  turkish: "Türk yapımları",
};

// TMDB popularity-sorted discover. Lower page = more popular.
export function pageRangeFor(difficulty: Difficulty): { min: number; max: number } {
  switch (difficulty) {
    case "easy":
      return { min: 1, max: 3 };
    case "medium":
      return { min: 1, max: 10 };
    case "hard":
      return { min: 1, max: 50 };
  }
}

export function randomPage(difficulty: Difficulty): number {
  const { min, max } = pageRangeFor(difficulty);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
