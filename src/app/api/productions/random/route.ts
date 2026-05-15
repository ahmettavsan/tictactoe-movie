import { NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdb";
import { randomPage, type Difficulty, type MediaMode } from "@/lib/difficulty";
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

async function fetchMovies(difficulty: Difficulty, opts: FetchOpts = {}): Promise<Production[]> {
  const page = randomPage(difficulty);
  const data = await tmdbFetch<DiscoverMovieRaw>("/discover/movie", {
    sort_by: "popularity.desc",
    include_adult: false,
    language: opts.language ?? "en-US",
    with_origin_country: opts.originCountry,
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

async function fetchTv(difficulty: Difficulty, opts: FetchOpts = {}): Promise<Production[]> {
  const page = randomPage(difficulty);
  const data = await tmdbFetch<DiscoverTvRaw>("/discover/tv", {
    sort_by: "popularity.desc",
    include_adult: false,
    language: opts.language ?? "en-US",
    with_origin_country: opts.originCountry,
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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawMode = url.searchParams.get("type");
  const rawDiff = url.searchParams.get("difficulty");
  const mode = isMode(rawMode) ? rawMode : "mixed";
  const difficulty = isDifficulty(rawDiff) ? rawDiff : "easy";

  try {
    let pool: Production[] = [];
    if (mode === "movie") {
      pool = await fetchMovies(difficulty);
    } else if (mode === "tv") {
      pool = await fetchTv(difficulty);
    } else if (mode === "turkish") {
      const trOpts: FetchOpts = { originCountry: "TR", language: "tr-TR" };
      const [m, t] = await Promise.all([
        fetchMovies(difficulty, trOpts),
        fetchTv(difficulty, trOpts),
      ]);
      pool = shuffle([...m, ...t]);
    } else {
      const [m, t] = await Promise.all([
        fetchMovies(difficulty),
        fetchTv(difficulty),
      ]);
      pool = shuffle([...m, ...t]);
    }

    // Dedupe by id+type just in case
    const seen = new Set<string>();
    const unique = pool.filter((p) => {
      const k = `${p.type}:${p.id}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    const picked = shuffle(unique).slice(0, 6);
    if (picked.length < 6) {
      return NextResponse.json(
        { error: "Yeterli yapım bulunamadı, başka zorluk deneyin." },
        { status: 502 }
      );
    }

    return NextResponse.json({ productions: picked });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "TMDB hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
