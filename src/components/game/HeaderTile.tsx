"use client";

import Image from "next/image";
import { Film, Tv } from "lucide-react";
import type { Production } from "@/types/tmdb";
import { tmdbImage } from "@/lib/utils";

export function HeaderTile({ production }: { production: Production }) {
  const poster = tmdbImage(production.posterPath, "w342");
  const isMovie = production.type === "movie";
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-[0_4px_18px_-8px_rgba(0,0,0,0.6)]">
      <div className="relative w-full flex-1">
        {poster ? (
          <Image
            src={poster}
            alt={production.title}
            fill
            sizes="(max-width:640px) 22vw, 180px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[var(--card-elevated)]">
            {isMovie ? (
              <Film className="h-6 w-6 text-[var(--foreground-muted)]" />
            ) : (
              <Tv className="h-6 w-6 text-[var(--foreground-muted)]" />
            )}
          </div>
        )}
        {/* gradient overlay for text legibility */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/95 via-black/55 to-transparent" />
        {/* type badge */}
        <div className="absolute top-1 left-1 inline-flex items-center gap-0.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
          {isMovie ? <Film className="h-2.5 w-2.5" /> : <Tv className="h-2.5 w-2.5" />}
          <span className="hidden sm:inline">{isMovie ? "FILM" : "DİZİ"}</span>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-0 px-1.5 py-1.5">
        <div className="text-[10px] sm:text-xs font-bold leading-tight line-clamp-2 text-white drop-shadow-lg">
          {production.title}
        </div>
        {production.year && (
          <div className="text-[9px] sm:text-[10px] text-zinc-300 leading-none mt-0.5 tabular-numbers">
            {production.year}
          </div>
        )}
      </div>
    </div>
  );
}
