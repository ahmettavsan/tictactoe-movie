import { NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdb";
import { randomPage, type Difficulty, type MediaMode } from "@/lib/difficulty";
import { fetchTopCastIds } from "@/lib/cast";
import { buildAnchorSeed } from "@/lib/anchors";
import type {
  DiscoverMovieRaw,
  DiscoverTvRaw,
  Production,
} from "@/types/tmdb";

export const dynamic = "force-dynamic";

function isMode(v: string | null): v is MediaMode {
  return v === "movie" || v === "tv" || v === "mixed" || v === "turkish";
}

function isDifficulty(v: string | null): v is Difficulty {
  return v === "easy" || v === "medium" || v === "hard";
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type FetchOpts = { originCountry?: string; language?: string };

// TMDB genre IDs to exclude — these formats have isolated/nominal cast
// and almost never share actors with scripted content.
const EXCLUDE_MOVIE_GENRES = "99"; // Documentary
const EXCLUDE_TV_GENRES = "99,10763,10764,10767"; // Doc, News, Reality, Talk

async function fetchMoviesPage(
  page: number,
  opts: FetchOpts = {}
): Promise<Production[]> {
  const data = await tmdbFetch<DiscoverMovieRaw>("/discover/movie", {
    sort_by: "popularity.desc",
    include_adult: false,
    language: opts.language ?? "en-US",
    with_origin_country: opts.originCountry,
    without_genres: EXCLUDE_MOVIE_GENRES,
    "vote_count.gte": 50,
    page,
  });
  return data.results
    .filter((r) => r.poster_path)
    .map<Production>((r) => ({
      id: r.id,
      type: "movie",
      title: r.title,
      posterPath: r.poster_path,
      year: r.release_date ? r.release_date.slice(0, 4) : undefined,
    }));
}

async function fetchTvPage(page: number, opts: FetchOpts = {}): Promise<Production[]> {
  const data = await tmdbFetch<DiscoverTvRaw>("/discover/tv", {
    sort_by: "popularity.desc",
    include_adult: false,
    language: opts.language ?? "en-US",
    with_origin_country: opts.originCountry,
    without_genres: EXCLUDE_TV_GENRES,
    "vote_count.gte": 50,
    page,
  });
  return data.results
    .filter((r) => r.poster_path)
    .map<Production>((r) => ({
      id: r.id,
      type: "tv",
      title: r.name,
      posterPath: r.poster_path,
      year: r.first_air_date ? r.first_air_date.slice(0, 4) : undefined,
    }));
}

async function fetchMovies(difficulty: Difficulty, opts: FetchOpts = {}): Promise<Production[]> {
  return fetchMoviesPage(randomPage(difficulty), opts);
}

async function fetchTv(difficulty: Difficulty, opts: FetchOpts = {}): Promise<Production[]> {
  return fetchTvPage(randomPage(difficulty), opts);
}

// ---- Cast intersection helpers ---------------------------------------------

function scoreSelection(rowCasts: Set<number>[], colCasts: Set<number>[]): number {
  let solvable = 0;
  for (const rc of rowCasts) {
    for (const cc of colCasts) {
      let hit = false;
      for (const id of rc) {
        if (cc.has(id)) {
          hit = true;
          break;
        }
      }
      if (hit) solvable++;
    }
  }
  return solvable;
}

function makeCastGetter(seedDifficulty: Difficulty) {
  // Seed-time cast depth is intentionally looser than validate-time so the
  // board has enough overlap to be playable. Validate route still enforces
  // the user's chosen difficulty (top 8 / 25 / 80) when checking an answer.
  const castCache = new Map<string, Promise<Set<number>>>();
  return (p: Production) => {
    const k = `${p.type}:${p.id}:${seedDifficulty}`;
    let promise = castCache.get(k);
    if (!promise) {
      promise = fetchTopCastIds(p, seedDifficulty);
      castCache.set(k, promise);
    }
    return promise;
  };
}

// Seed validator uses a looser tier than the user's difficulty so easy/medium
// boards still have enough cast overlap to be playable. Validate route stays
// strict to the user's choice — some "valid in full cast" answers will fail
// validation in easy/medium (inFullCast hint shown to user in UI).
function seedTier(difficulty: Difficulty): Difficulty {
  if (difficulty === "easy") return "medium";
  return difficulty;
}

// Best 3-row / 3-col split out of a chosen 6 productions.
// C(6,3)/2 = 10 unique splits; small enough to enumerate.
function bestSplit(
  chosen: Production[],
  casts: Set<number>[]
): { rows: Production[]; cols: Production[]; score: number } {
  const idxs = [0, 1, 2, 3, 4, 5];
  // Generate combinations of 3 indices for rows
  const combos: number[][] = [];
  for (let i = 0; i < 6; i++)
    for (let j = i + 1; j < 6; j++)
      for (let k = j + 1; k < 6; k++) combos.push([i, j, k]);

  let best: { rows: Production[]; cols: Production[]; score: number } = {
    rows: chosen.slice(0, 3),
    cols: chosen.slice(3, 6),
    score: -1,
  };

  const seenSplits = new Set<string>();
  for (const rowIdx of combos) {
    const colIdx = idxs.filter((i) => !rowIdx.includes(i));
    // canonicalize (rows can be cols or vice versa); avoid scoring both
    const key = [rowIdx.slice().sort().join(","), colIdx.slice().sort().join(",")]
      .sort()
      .join("|");
    if (seenSplits.has(key)) continue;
    seenSplits.add(key);

    const rowCasts = rowIdx.map((i) => casts[i]);
    const colCasts = colIdx.map((i) => casts[i]);
    const score = scoreSelection(rowCasts, colCasts);
    if (score > best.score) {
      best = {
        rows: rowIdx.map((i) => chosen[i]),
        cols: colIdx.map((i) => chosen[i]),
        score,
      };
    }
  }
  return best;
}

// Greedy: start with a random seed, then for each next slot pick the
// candidate (from a sample of the pool) that overlaps most with chosen.
// Much higher solvable-cell counts on small / siloed pools (Turkish).
async function greedyPickSeed(
  pool: Production[],
  candidatesPerSlot: number,
  getCast: (p: Production) => Promise<Set<number>>
): Promise<{ rows: Production[]; cols: Production[]; score: number } | null> {
  if (pool.length < 6) return null;
  const shuffled = shuffle(pool);
  const chosen: Production[] = [shuffled[0]];
  const chosenCasts: Set<number>[] = [await getCast(shuffled[0])];

  while (chosen.length < 6) {
    const remaining = shuffled.filter(
      (p) => !chosen.some((c) => c.id === p.id && c.type === p.type)
    );
    const candidates = remaining.slice(0, candidatesPerSlot);
    if (candidates.length === 0) return null;

    const candCasts = await Promise.all(candidates.map(getCast));

    let bestIdx = 0;
    let bestScore = -1;
    for (let i = 0; i < candidates.length; i++) {
      const cast = candCasts[i];
      let score = 0;
      for (const cc of chosenCasts) {
        for (const id of cast) {
          if (cc.has(id)) {
            score++;
            break;
          }
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }
    chosen.push(candidates[bestIdx]);
    chosenCasts.push(candCasts[bestIdx]);
  }

  return bestSplit(chosen, chosenCasts);
}

// Pure random pick + best-split. Used for big pools (Hollywood) where
// random already gives high solvability.
async function randomPickSeed(
  pool: Production[],
  attempts: number,
  minScore: number,
  getCast: (p: Production) => Promise<Set<number>>
): Promise<{ rows: Production[]; cols: Production[]; score: number } | null> {
  let best: { rows: Production[]; cols: Production[]; score: number } | null = null;
  for (let i = 0; i < attempts; i++) {
    const picked = shuffle(pool).slice(0, 6);
    if (picked.length < 6) continue;
    const casts = await Promise.all(picked.map(getCast));
    const split = bestSplit(picked, casts);
    if (!best || split.score > best.score) best = split;
    if (split.score >= minScore) break;
  }
  return best;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawMode = url.searchParams.get("type");
  const rawDiff = url.searchParams.get("difficulty");
  const mode = isMode(rawMode) ? rawMode : "mixed";
  const difficulty = isDifficulty(rawDiff) ? rawDiff : "easy";

  try {
    // ANCHOR-DRIVEN seed: pick 6 productions all sharing one actor → every
    // cell guaranteed solvable (9/9). The anchor is a popular actor (curated
    // for Turkish, /person/popular for foreign) and the 6 productions are
    // sampled from their LEAD filmography (order < topN for movies, sufficient
    // episode count for tv) — so the answer-must-be-a-lead rule still holds.
    const anchor = await buildAnchorSeed(mode, difficulty);
    if (anchor) {
      return NextResponse.json({
        productions: [...anchor.rows, ...anchor.cols],
        solvableCells: 9,
      });
    }

    // FALLBACK: discover-driven greedy (no 9/9 guarantee, but variety)
    let pool: Production[] = [];
    if (mode === "movie") {
      pool = await fetchMovies(difficulty);
    } else if (mode === "tv") {
      pool = await fetchTv(difficulty);
    } else if (mode === "turkish") {
      // Turkish pool is small — fetch multiple pages to widen variety, so the
      // intersection-validator has more material to find a solvable seed.
      const trOpts: FetchOpts = { originCountry: "TR", language: "tr-TR" };
      const pages = [1, 2, 3, 4, 5];
      const fetched = await Promise.all([
        ...pages.map((p) => fetchMoviesPage(p, trOpts)),
        ...pages.map((p) => fetchTvPage(p, trOpts)),
      ]);
      pool = shuffle(fetched.flat());
    } else {
      const [m, t] = await Promise.all([fetchMovies(difficulty), fetchTv(difficulty)]);
      pool = shuffle([...m, ...t]);
    }

    // Dedupe by id+type
    const seen = new Set<string>();
    const unique = pool.filter((p) => {
      const k = `${p.type}:${p.id}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    if (unique.length < 6) {
      return NextResponse.json(
        { error: "Yeterli yapım bulunamadı, başka zorluk deneyin." },
        { status: 502 }
      );
    }

    // Pre-validate that the selected 6 productions form a solvable board.
    // Seed-time uses a relaxed tier (medium for easy) so the board has enough
    // overlap to be playable; validate route still enforces the chosen
    // difficulty strictly when accepting an answer.
    const getCast = makeCastGetter(seedTier(difficulty));
    const candidatesPerSlot = mode === "turkish" ? 14 : 12;
    // Easy mode benefits from extra greedy runs since lead-only intersection
    // is rare in the foreign popular pool (Hollywood casts cluster by franchise).
    const greedyRuns = difficulty === "easy" ? 8 : 4;
    const targetScore = mode === "turkish" ? 6 : 8;

    let seed: { rows: Production[]; cols: Production[]; score: number } | null = null;
    for (let i = 0; i < greedyRuns; i++) {
      const candidate = await greedyPickSeed(unique, candidatesPerSlot, getCast);
      if (!candidate) continue;
      if (!seed || candidate.score > seed.score) seed = candidate;
      if (seed.score >= targetScore) break;
    }

    if (!seed) {
      return NextResponse.json(
        { error: "Yeterli yapım bulunamadı, başka zorluk deneyin." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      productions: [...seed.rows, ...seed.cols],
      solvableCells: seed.score, // 0-9
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "TMDB hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
