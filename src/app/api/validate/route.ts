import { NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdb";
import type { CombinedCreditsRaw, MediaType, PersonDetailRaw } from "@/types/tmdb";

export const dynamic = "force-dynamic";

type Body = {
  personId: number;
  prodA: { id: number; type: MediaType };
  prodB: { id: number; type: MediaType };
};

function isValidBody(v: unknown): v is Body {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  if (typeof o.personId !== "number") return false;
  const a = o.prodA as Record<string, unknown> | undefined;
  const b = o.prodB as Record<string, unknown> | undefined;
  if (!a || !b) return false;
  if (typeof a.id !== "number" || (a.type !== "movie" && a.type !== "tv")) return false;
  if (typeof b.id !== "number" || (b.type !== "movie" && b.type !== "tv")) return false;
  return true;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz JSON" }, { status: 400 });
  }

  if (!isValidBody(body)) {
    return NextResponse.json({ error: "Geçersiz parametreler" }, { status: 400 });
  }

  const { personId, prodA, prodB } = body;

  try {
    const [credits, detail] = await Promise.all([
      tmdbFetch<CombinedCreditsRaw>(
        `/person/${personId}/combined_credits`,
        { language: "en-US" },
        { revalidate: 3600 }
      ),
      tmdbFetch<PersonDetailRaw>(
        `/person/${personId}`,
        { language: "en-US" },
        { revalidate: 3600 }
      ),
    ]);

    const cast = credits.cast ?? [];

    const findCredit = (target: { id: number; type: MediaType }) =>
      cast.find(
        (c) => c.id === target.id && c.media_type === target.type
      );

    const aCredit = findCredit(prodA);
    const bCredit = findCredit(prodB);
    const valid = Boolean(aCredit && bCredit);

    return NextResponse.json({
      valid,
      person: { id: detail.id, name: detail.name },
      characters: valid
        ? { a: aCredit?.character ?? null, b: bCredit?.character ?? null }
        : undefined,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "TMDB hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
