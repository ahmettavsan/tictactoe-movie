import "server-only";

const TMDB_BASE = "https://api.themoviedb.org/3";

type TmdbFetchOpts = {
  /** seconds; default 3600 (1h). pass 0 to disable. */
  revalidate?: number;
};

export async function tmdbFetch<T>(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
  opts: TmdbFetchOpts = {}
): Promise<T> {
  const token = process.env.TMDB_API_KEY?.trim().replace(/^["']|["']$/g, "");
  if (!token) {
    throw new Error("TMDB_API_KEY is not configured in env");
  }

  const url = new URL(`${TMDB_BASE}${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }

  const revalidate = opts.revalidate ?? 3600;

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    next: revalidate > 0 ? { revalidate } : undefined,
    cache: revalidate === 0 ? "no-store" : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`TMDB ${path} failed: ${res.status} ${text}`);
  }

  return (await res.json()) as T;
}
