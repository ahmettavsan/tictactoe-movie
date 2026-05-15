import "server-only";
import { tmdbFetch } from "./tmdb";
import { CAST_TOP_N } from "./cast";
import type { Difficulty, MediaMode } from "./difficulty";
import type {
  CombinedCreditsRaw,
  PersonSearchRaw,
  Production,
} from "@/types/tmdb";

/**
 * Curated popular Turkish actors with rich lead filmography across film+dizi.
 * Used as seed anchors so every cell of a 3×3 board is guaranteed solvable.
 */
const TURKISH_ANCHOR_NAMES = [
  "Cem Yılmaz",
  "Yılmaz Erdoğan",
  "Şahan Gökbakar",
  "Halit Ergenç",
  "Engin Akyürek",
  "Beren Saat",
  "Birce Akalay",
  "Tuba Büyüküstün",
  "Kıvanç Tatlıtuğ",
  "Çağatay Ulusoy",
  "Burak Özçivit",
  "Demet Özdemir",
  "Hande Erçel",
  "Aras Bulut İynemli",
  "Erdal Beşikçioğlu",
  "Demet Akbağ",
  "Engin Altan Düzyatan",
  "Haluk Bilginer",
  "Tarık Akan",
  "Şener Şen",
];

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function searchPersonId(name: string, language: string): Promise<number | null> {
  try {
    const data = await tmdbFetch<PersonSearchRaw>(
      "/search/person",
      { query: name, include_adult: false, language },
      { revalidate: 86400 * 30 } // 30d — names rarely change
    );
    return data.results[0]?.id ?? null;
  } catch {
    return null;
  }
}

async function popularPersonIds(language: string): Promise<number[]> {
  try {
    const data = await tmdbFetch<PersonSearchRaw>(
      "/person/popular",
      { language, page: 1 },
      { revalidate: 86400 }
    );
    return data.results.slice(0, 25).map((r) => r.id);
  } catch {
    return [];
  }
}

/** Productions where this person was billed in the top-N cast (lead role). */
async function getActorLeadProductions(
  personId: number,
  difficulty: Difficulty,
  mediaTypeFilter: (mt: "movie" | "tv") => boolean,
  language: string
): Promise<Production[]> {
  const data = await tmdbFetch<CombinedCreditsRaw>(
    `/person/${personId}/combined_credits`,
    { language },
    { revalidate: 86400 }
  );
  const topN = CAST_TOP_N[difficulty];
  // For TV: "lead" if appeared in many episodes. Heuristic: 5+ episodes.
  // (Hard mode is more permissive — no episode minimum.)
  const tvMinEpisodes = difficulty === "hard" ? 1 : 5;

  const out: Production[] = [];
  const seen = new Set<string>();

  for (const c of data.cast ?? []) {
    if (!c.poster_path) continue;
    if (!mediaTypeFilter(c.media_type)) continue;

    if (c.media_type === "movie") {
      if (c.order == null || c.order >= topN) continue;
    } else {
      if ((c.episode_count ?? 0) < tvMinEpisodes) continue;
    }

    const k = `${c.media_type}:${c.id}`;
    if (seen.has(k)) continue;
    seen.add(k);

    const title = c.media_type === "movie" ? c.title : c.name;
    if (!title) continue;
    const date = c.media_type === "movie" ? c.release_date : c.first_air_date;
    out.push({
      id: c.id,
      type: c.media_type,
      title,
      posterPath: c.poster_path,
      year: date ? date.slice(0, 4) : undefined,
    });
  }
  return out;
}

/**
 * Builds an anchor-driven seed: 6 productions all sharing one common actor.
 *
 * GUARANTEE: every (row, col) cell of the resulting 3×3 board has at least
 * one valid actor (the anchor), so no cell needs to be passed.
 */
export async function buildAnchorSeed(
  mode: MediaMode,
  difficulty: Difficulty
): Promise<{ rows: Production[]; cols: Production[] } | null> {
  const language = mode === "turkish" ? "tr-TR" : "en-US";

  // Resolve candidate anchor IDs
  let candidateIds: number[];
  if (mode === "turkish") {
    const ids = await Promise.all(
      TURKISH_ANCHOR_NAMES.map((n) => searchPersonId(n, "tr-TR"))
    );
    candidateIds = ids.filter((x): x is number => x !== null);
  } else {
    candidateIds = await popularPersonIds(language);
    if (candidateIds.length < 6) {
      // Fallback to globally popular if locale-specific list was thin
      const more = await popularPersonIds("en-US");
      candidateIds = [...new Set([...candidateIds, ...more])];
    }
  }
  if (candidateIds.length === 0) return null;

  const typeFilter = (mt: "movie" | "tv") => {
    if (mode === "movie") return mt === "movie";
    if (mode === "tv") return mt === "tv";
    return true; // mixed / turkish
  };

  // Try anchors in random order until one has at least 6 lead productions
  for (const anchorId of shuffle(candidateIds)) {
    const films = await getActorLeadProductions(anchorId, difficulty, typeFilter, language);
    if (films.length >= 6) {
      const picked = shuffle(films).slice(0, 6);
      return { rows: picked.slice(0, 3), cols: picked.slice(3, 6) };
    }
  }

  return null;
}
