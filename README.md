# Movie Tac Toe

Football Tic Tac Toe için film/dizi versiyonu. 4×4 ızgara, iki takım, satır+sütun yapımlarının kesişiminde rol almış oyuncuyu bul, en çok hücreyi alan kazansın.

Mobile-first, web app (kurulum gerektirmez, tarayıcıdan açılır).

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind v4 + Radix primitives + lucide-react
- Zustand (game state, platform-agnostic — online multiplayer'a açık)
- TMDB API (server-side Route Handlers; token client'a sızmaz)
- Bebas Neue + Geist (next/font/google)

## Çalıştır

```bash
pnpm install
cp .env.local.example .env.local
# .env.local içine TMDB v4 Bearer token (read access) yapıştır
pnpm dev
```

Aç: http://localhost:3000

## TMDB Token

https://www.themoviedb.org/settings/api → "API Read Access Token" kopyala → `.env.local`'e yaz:

```
TMDB_API_KEY="eyJ..."
```

## Oyun

- **Setup:** İki takım ismi, mod (film / dizi / karışık), zorluk (kolay / orta / zor) seç.
- **Maç:** Boş hücreye dokun → bottom sheet açılır → oyuncu adı yaz (autocomplete) → seç → TMDB `combined_credits` ile satır+sütun yapımlarının ikisinde de oynamış mı kontrol → geçerliyse hücre takım renginde dolar, geçersizse sıra senin kalır.
- **Pas:** Sırayı geç. İki ardışık pas → maç biter.
- **Kazanma:** 9 hücre dolduğunda veya iki pas sonrası en çok hücreyi alan kazanır.

## Yapı

```
src/
  app/
    api/
      productions/random/   # 6 rastgele yapım (mod+zorluk filtreli)
      person/search/        # autocomplete proxy
      validate/             # combined_credits intersection
    layout.tsx              # font + ambient blob layer
    page.tsx                # status → screen router
  components/
    setup/SetupScreen.tsx
    game/{GameBoard,HeaderTile,Cell,Scoreboard,CellInputModal,ResultScreen}.tsx
    ui/{button,input,sheet,radio-group,badge,skeleton}.tsx
  lib/
    tmdb.ts                 # server-only fetch wrapper
    difficulty.ts           # popularity band → page range
    utils.ts                # cn() + tmdbImage()
  store/
    gameStore.ts            # Zustand: actions + selectors
  types/{game,tmdb}.ts
```

## Scripts

```bash
pnpm dev          # dev server (Turbopack)
pnpm build        # production build
pnpm start        # production server
pnpm lint         # eslint
```

## Roadmap

- [ ] Online multiplayer (oda kodu, Supabase Realtime veya Socket.IO)
- [ ] Tur süresi opsiyonel timer
- [ ] Geçmiş maç istatistikleri
- [ ] Daha çok dil (TMDB `language` parametresi)
