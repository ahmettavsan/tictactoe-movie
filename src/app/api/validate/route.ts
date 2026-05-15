import { NextResponse } from "next/server";
import { tmdbFetch } from "@/lib/tmdb";
import { fetchProductionCast, CAST_TOP_N } from "@/lib/cast";
import type { Difficulty } from "@/lib/difficulty";
import type { MediaType, PersonDetailRaw } from "@/types/tmdb";

export const dynamic = "force-dynamic";

type Body = {
  personId: number;
  prodA: { id: number; type: MediaType };
  prodB: { id: number; type: MediaType };
  difficulty?: Difficulty;
};

function isDifficulty(v: unknown): v is Difficulty {
  return v === "easy" || v === "medium" || v === "hard";
}

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
  const difficulty: Difficulty = isDifficulty(body.difficulty) ? body.difficulty : "hard";
  const topN = CAST_TOP_N[difficulty];

  try {
    // Fetch full cast for both productions (cached) + person detail in parallel.
    const [castA, castB, detail] = await Promise.all([
      fetchProductionCast(prodA),
      fetchProductionCast(prodB),
      tmdbFetch<PersonDetailRaw>(
        `/person/${personId}`,
        { language: "en-US" },
        { revalidate: 86400 }
      ),
    ]);

    const aTop = castA.slice(0, topN);
    const bTop = castB.slice(0, topN);

    const aHit = aTop.find((c) => c.id === personId);
    const bHit = bTop.find((c) => c.id === personId);
    const valid = Boolean(aHit && bHit);

    // If easy/medium check failed, also tell the client whether the actor
    // is at least in the FULL cast — UX hint so the user understands "yes
    // that actor is in both, but not as a lead — try someone bigger".
    let inFullCast: boolean | undefined;
    if (!valid && difficulty !== "hard") {
      const inFullA = castA.some((c) => c.id === personId);
      const inFullB = castB.some((c) => c.id === personId);
      inFullCast = inFullA && inFullB;
    }

    return NextResponse.json({
      valid,
      person: { id: detail.id, name: detail.name },
      difficulty,
      topN,
      inFullCast,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "TMDB hatası";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
