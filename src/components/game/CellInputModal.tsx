"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2, Search, UserCircle2, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useDebounced } from "@/hooks/useDebounced";
import { useGameStore } from "@/store/gameStore";
import { cn, tmdbImage } from "@/lib/utils";
import type { PersonSearchResult, Production } from "@/types/tmdb";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: number;
  col: number;
};

export function CellInputModal({ open, onOpenChange, row, col }: Props) {
  const { rows, cols, teams, currentTeam, claimCell } = useGameStore();
  const rowProd = rows[row] as Production | undefined;
  const colProd = cols[col] as Production | undefined;

  const [query, setQuery] = useState("");
  const debounced = useDebounced(query, 250);
  const [results, setResults] = useState<PersonSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [validatingId, setValidatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setSearching(false);
      setValidatingId(null);
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const q = debounced.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const ctrl = new AbortController();
    fetch(`/api/person/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setResults((data.results ?? []) as PersonSearchResult[]);
      })
      .catch((e) => {
        if (e.name === "AbortError") return;
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => {
      cancelled = true;
      ctrl.abort();
    };
  }, [debounced, open]);

  if (!rowProd || !colProd) return null;

  const onPick = async (person: PersonSearchResult) => {
    setError(null);
    setValidatingId(person.id);
    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personId: person.id,
          prodA: { id: rowProd.id, type: rowProd.type },
          prodB: { id: colProd.id, type: colProd.type },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Doğrulama başarısız");
        return;
      }
      if (data.valid) {
        claimCell(row, col, { personId: person.id, personName: data.person?.name ?? person.name });
        toast.success(`${data.person?.name ?? person.name} doğrulandı`, {
          description: `${teams[currentTeam].name} hücreyi aldı`,
        });
        onOpenChange(false);
      } else {
        setError(`${person.name}, bu iki yapımda da rol almamış.`);
      }
    } catch {
      setError("Bir hata oluştu, tekrar dene");
    } finally {
      setValidatingId(null);
    }
  };

  const isA = currentTeam === 0;
  const teamColor = isA ? "var(--team-a)" : "var(--team-b)";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="flex flex-col gap-0">
        <SheetHeader className="pb-2">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex h-2 w-2 rounded-full"
              style={{ background: teamColor, boxShadow: `0 0 12px ${teamColor}` }}
            />
            <span
              className="text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: teamColor }}
            >
              {teams[currentTeam].name}
            </span>
          </div>
          <SheetTitle className="font-display text-2xl leading-tight">Hücreyi al</SheetTitle>
        </SheetHeader>

        {/* Productions row */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-5 pb-3">
          <ProductionThumb production={rowProd} />
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--card)]">
            <X className="h-4 w-4 text-[var(--foreground-dim)]" strokeWidth={2.5} />
          </div>
          <ProductionThumb production={colProd} />
        </div>

        <div className="px-5 pb-2">
          <p className="text-xs text-[var(--foreground-muted)]">
            İki yapımda da rol almış bir oyuncu seç
          </p>
        </div>

        <div className="px-5 pb-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Oyuncu adı yaz..."
              className="h-12 pl-9 text-base"
              style={{ borderColor: query.length >= 2 ? teamColor : undefined }}
            />
          </div>
          {error && (
            <div className="anim-fade-in mt-2 rounded-xl border border-[var(--destructive)]/40 bg-[var(--destructive-soft)] px-3 py-2 text-xs text-[var(--destructive)]">
              {error}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-5 pt-3 pb-5">
          {searching && results.length === 0 && (
            <div className="flex items-center justify-center py-10 text-[var(--foreground-muted)]">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          )}
          {!searching && query.trim().length >= 2 && results.length === 0 && (
            <div className="py-10 text-center text-sm text-[var(--foreground-muted)]">
              Sonuç bulunamadı
            </div>
          )}
          {query.trim().length < 2 && results.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <UserCircle2 className="h-10 w-10 text-[var(--foreground-muted)]/40" />
              <p className="text-xs text-[var(--foreground-muted)]">
                Aramaya başlamak için en az 2 karakter yaz
              </p>
            </div>
          )}
          <ul className="flex flex-col gap-1.5">
            {results.map((p, i) => {
              const img = tmdbImage(p.profilePath, "w92");
              const isValidating = validatingId === p.id;
              return (
                <li key={p.id} className="anim-slide-up" style={{ animationDelay: `${i * 30}ms` }}>
                  <button
                    type="button"
                    onClick={() => onPick(p)}
                    disabled={validatingId !== null}
                    className={cn(
                      "press-scale flex w-full items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-left transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--card-elevated)] disabled:opacity-50"
                    )}
                  >
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full bg-[var(--card-elevated)] ring-1 ring-[var(--border)]">
                      {img ? (
                        <Image src={img} alt={p.name} fill sizes="48px" className="object-cover" />
                      ) : (
                        <UserCircle2 className="h-12 w-12 text-[var(--foreground-muted)]" />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="text-sm font-semibold text-[var(--foreground)] truncate">
                        {p.name}
                      </span>
                      {p.knownFor && (
                        <span className="text-xs text-[var(--foreground-muted)] truncate">
                          {p.knownFor}
                        </span>
                      )}
                    </div>
                    {isValidating ? (
                      <Loader2 className="h-4 w-4 animate-spin text-[var(--foreground-muted)]" />
                    ) : (
                      <Badge
                        className="shrink-0"
                        style={{
                          background: isA ? "var(--team-a-soft)" : "var(--team-b-soft)",
                          color: teamColor,
                          borderColor: teamColor,
                          border: "1px solid",
                        }}
                      >
                        Seç
                      </Badge>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ProductionThumb({ production }: { production: Production }) {
  const poster = tmdbImage(production.posterPath, "w185");
  return (
    <div className="flex items-center gap-2 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] p-1.5">
      <div className="relative h-12 w-9 shrink-0 overflow-hidden rounded-md bg-[var(--card-elevated)]">
        {poster && (
          <Image src={poster} alt={production.title} fill sizes="36px" className="object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-bold leading-tight line-clamp-2 text-[var(--foreground)]">
          {production.title}
        </div>
        {production.year && (
          <div className="text-[9px] text-[var(--foreground-muted)] tabular-numbers">
            {production.year}
          </div>
        )}
      </div>
    </div>
  );
}
