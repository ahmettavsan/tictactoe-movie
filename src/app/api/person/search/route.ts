import { NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdb";
import type { PersonSearchRaw, PersonSearchResult } from "@/types/tmdb";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ results: [] satisfies PersonSearchResult[] });
  }

  try {
    const data = await tmdbFetch<PersonSearchRaw>(
      "/search/person",
      { query: q, include_adult: false, language: "en-US", page: 1 },
      { revalidate: 300 }
    );

    const results: PersonSearchResult[] = data.results
      .slice(0, 8)
      .map((r) => ({
        id: r.id,
        name: r.name,
        profilePath: r.profile_path,
        knownFor:
          (r.known_for ?? [])
            .map((k) => k.title || k.name)
            .filter(Boolean)
            .slice(0, 3)
            .join(", ") || r.known_for_department || "",
      }));

    return NextResponse.json({ results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "TMDB hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
