import "server-only";
import { tmdbFetch } from "./tmdb";
import type { Difficulty } from "./difficulty";
import type { MediaType } from "@/types/tmdb";

type CastResp = {
  cast: { id: number; name: string }[];
};

/**
 * Cast depth per difficulty.
 * - easy:   top 8 — only billed leads count
 * - medium: top 25 — leads + recurring
 * - hard:   top 80 — full known cast
 */
export const CAST_TOP_N: Record<Difficulty, number> = {
  easy: 8,
  medium: 25,
  hard: 80,
};

/**
 * Fetches the production's full cast list (top 80) and returns it.
 * Cached 24h via tmdbFetch revalidate so subsequent calls are free.
 *
 * - movies use /movie/{id}/credits, sorted by billing order
 * - tv uses /tv/{id}/aggregate_credits, sorted by total_episode_count desc
 *   (multi-season shows have rotating cast — aggregate captures all of it)
 */
export async function fetchProductionCast(
  prod: { id: number; type: MediaType }
): Promise<{ id: number; name: string }[]> {
  const path =
    prod.type === "tv"
      ? `/tv/${prod.id}/aggregate_credits`
      : `/movie/${prod.id}/credits`;
  try {
    const data = await tmdbFetch<CastResp>(path, { language: "en-US" }, { revalidate: 86400 });
    return (data.cast ?? []).slice(0, 80);
  } catch {
    return [];
  }
}

/** Set of person ids in the top-N cast of a production (per difficulty). */
export async function fetchTopCastIds(
  prod: { id: number; type: MediaType },
  difficulty: Difficulty
): Promise<Set<number>> {
  const cast = await fetchProductionCast(prod);
  const n = CAST_TOP_N[difficulty];
  return new Set(cast.slice(0, n).map((c) => c.id));
}
