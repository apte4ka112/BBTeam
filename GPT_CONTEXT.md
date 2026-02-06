# BBTeam — Project Context for LLM

## Overview

BBTeam is a **Nuxt 3** crypto portfolio dashboard. Users connect a wallet (EVM via MetaMask, or manually enter BTC/TON address), view token balances, OHLC price charts, transaction history, crypto news, and an AI chat assistant powered by GigaChat.

**Stack:** Nuxt 3, Vue 3 (Composition API `<script setup>`), TailwindCSS, TradingView Lightweight Charts v4.2, Nitro server, TypeScript.

**Theme:** Dark (slate-950 background), glassmorphism style (white/5, backdrop-blur, white/10 borders).

---

## Project Structure

```
BBTeam/
├── app.vue                           # Root: auth check, NuxtPage
├── nuxt.config.ts                    # Nuxt config, Tailwind module, runtimeConfig
├── package.json                      # Dependencies (lightweight-charts, moralis, nuxt, vue)
│
├── pages/
│   ├── index.vue                     # Landing page with wallet connect modal
│   ├── portfolio.vue                 # Main dashboard (chart, tokens, transactions, AI chat)
│   └── news.vue                      # Crypto news feed
│
├── components/
│   ├── MarketChart.vue               # TradingView Lightweight Charts (OHLC + line)
│   ├── AiChat.vue                    # GigaChat-powered AI assistant
│   ├── TransactionHistory.vue        # Wallet transaction list
│   ├── WalletModal.vue               # Wallet connect modal (MetaMask / manual BTC / TON)
│   ├── NewsBlock.vue                 # News card component
│   └── FeatureCard.vue               # Landing page feature card
│
├── composables/
│   └── useWallet.ts                  # Wallet state management (useState + cookie persistence)
│
├── types/
│   └── market.ts                     # OhlcCandle, MarketChartResponse, OhlcRange, ChartMode
│
└── server/
    ├── api/
    │   ├── market/[symbol].get.ts    # GET /api/market/:symbol — OHLC data with SWR cache
    │   ├── portfolio.post.ts         # POST /api/portfolio — token balances (Moralis/Blockstream/TonAPI)
    │   ├── transactions.post.ts      # POST /api/transactions — transaction history
    │   ├── chat.post.ts              # POST /api/chat — GigaChat proxy
    │   └── news.get.ts               # GET /api/news — crypto news
    ├── utils/
    │   ├── market-cache.ts           # SWRCache<T> class, cache singletons, TTL constants
    │   ├── coingecko.ts              # Symbol-to-CoinGecko ID mapping + resolveCoinId()
    │   ├── spot-price.ts             # getCachedSpotPrice() — SWR-cached spot prices
    │   └── gigachat.ts               # GigaChat API client
    └── routes/
        └── sitemap.xml.ts            # Dynamic sitemap generation
```

---

## Chart System Architecture

### Data Flow

```
User clicks token → portfolio.vue passes symbol to MarketChart.vue
    → MarketChart fetches GET /api/market/{SYMBOL}?range=7d
        → server resolves symbol to CoinGecko ID (coingecko.ts)
        → checks SWR cache (market-cache.ts)
        → if miss: fetches CoinGecko OHLC API, caches result
        → returns MarketChartResponse { candles: OhlcCandle[] }
    → MarketChart renders via lightweight-charts
```

### Types (`types/market.ts`)

```typescript
type OhlcInterval = '1h' | '1d'
type OhlcRange = '1d' | '7d' | '30d' | '90d' | '365d'
type ChartMode = 'line' | 'candlestick'

interface OhlcCandle {
  time: number    // Unix SECONDS (not ms — Lightweight Charts format)
  open: number
  high: number
  low: number
  close: number
}

interface MarketChartResponse {
  symbol: string
  interval: OhlcInterval
  range: OhlcRange
  candles: OhlcCandle[]
  cachedAt: number
}
```

### Backend: Market Endpoint (`server/api/market/[symbol].get.ts`)

**Route:** `GET /api/market/:symbol?range=7d&interval=1d`

**Logic:**
1. Validate `range` (1d/7d/30d/90d/365d) and `interval` (1h/1d, auto-inferred from range)
2. Resolve symbol → CoinGecko ID via `resolveCoinId()` (50+ static mappings + Search API fallback)
3. SWR cache check (`ohlcCache`):
   - **Fresh** → return immediately
   - **Stale** → return stale data + fire-and-forget background refresh (deduplicated via `markRefreshing()`)
   - **Miss** → synchronous fetch from CoinGecko, cache result
4. CoinGecko API: `GET /coins/{id}/ohlc?vs_currency=usd&days={N}`
   - Returns `[timestamp_ms, open, high, low, close][]`
   - Normalized: `time = Math.floor(timestamp / 1000)` (ms → seconds)
5. Rate limit (429) → return stale if available, else 429

### Backend: SWR Cache (`server/utils/market-cache.ts`)

Generic `SWRCache<T>` class with:
- `Map<string, CacheEntry<T>>` storage
- `get(key)` → `{ data, stale: boolean } | null`
- `set(key, data, ttl)` — stores with TTL
- `markRefreshing(key)` → returns `true` if lock acquired (prevents duplicate background fetches)
- `clearRefreshing(key)` → releases lock on error
- LRU eviction when exceeding `maxEntries`
- `cleanup()` removes entries older than 2 hours (runs every 10 min via `setInterval`)

**Singletons:**
| Cache | Max entries | Purpose |
|---|---|---|
| `ohlcCache` | 200 | OHLC candle arrays |
| `spotPriceCache` | 100 | Spot prices for BTC/TON in portfolio.post.ts |
| `coinIdCache` | unbounded Map | Permanent symbol→CoinGecko ID mapping |

**TTLs:**
| Key | Value | Used for |
|---|---|---|
| `CACHE_TTL.SPOT_PRICE` | 45 sec | Spot prices |
| `CACHE_TTL.OHLC_1H` | 5 min | 1h-interval charts (range=1d) |
| `CACHE_TTL.OHLC_1D` | 30 min | 1d-interval charts (range=7d/30d/90d/365d) |

### Backend: Symbol Resolver (`server/utils/coingecko.ts`)

- `SYMBOL_TO_COINGECKO` — 50+ hardcoded mappings (ETH→ethereum, BTC→bitcoin, etc.)
- `resolveCoinId(symbol)`:
  1. Check static map
  2. Check permanent `coinIdCache`
  3. Fallback: CoinGecko Search API → cache result permanently

### Backend: Spot Price (`server/utils/spot-price.ts`)

- `getCachedSpotPrice(coinId)` — SWR-cached via `spotPriceCache` (TTL: 45 sec)
- Used in `portfolio.post.ts` for BTC and TON USD conversion
- Same SWR pattern: fresh→return, stale→return+background refresh, miss→sync fetch

### Frontend: MarketChart Component (`components/MarketChart.vue`)

**Library:** TradingView Lightweight Charts v4.2 (dynamic import)

**Key architectural decisions:**
- `chart` and `series` are plain JS variables (NOT `ref`/`reactive`) — avoids Vue proxy on chart internals
- `autoSize: true` — chart auto-resizes with container
- Chart container is ALWAYS visible (`absolute inset-0`); loading/error are overlays — prevents 0-dimension canvas issues with `display: none`
- `ColorType.Solid` must be specified for `background` (v4.2 requirement)
- TradingView attribution logo hidden via `:deep(#tv-attr-logo) { display: none }`

**Chart modes:**
- **Line** — `addLineSeries()`, data: `{ time, value: close }`
- **Candlestick** — `addCandlestickSeries()`, data: `{ time, open, high, low, close }`
- Switching mode calls `applySeries()` only (no refetch)

**Periods:** 24h (`range:1d`) / 7D (`7d`) / 30D (`30d`) / 1Y (`365d`)

**Custom tooltip:**
- `subscribeCrosshairMove(onCrosshairMove)` — custom HTML tooltip, not built-in chart tooltip
- Shows date, price (line) or O/H/L/C (candlestick), and % change from first candle
- Auto-repositions to stay within container bounds
- Adaptive price format: `$1,234.56` for >= $1, `0.0042` for < $0.01

**Polling:**
- `setInterval(pollLatestCandle, 60_000)` — every 60 seconds
- Fetches `range='1d'`, takes last candle, calls `series.update(candle)` — incremental update, no full re-render
- Stops on symbol/range change or unmount

**Watchers:**
- `watch(symbol)` → stopPolling + fetchChart + startPolling
- `watch(selectedRange)` → same + update `timeScale.timeVisible`
- `watch(chartMode)` → `applySeries()` only (no refetch)

**Lifecycle:**
- `onMounted` → `initChart()` → `fetchChart()` → `startPolling()`
- `onBeforeUnmount` → `stopPolling()` → `chart.remove()`

---

## Portfolio Page Layout (`pages/portfolio.vue`)

3-column layout on desktop (`lg:grid-cols-[260px_1fr_400px]`):

| Column | Content | Height |
|---|---|---|
| LEFT (260px) | Total USD value + scrollable token list | Full height |
| CENTER (flex) | MarketChart (55%) + TransactionHistory (45%) | Full height, split vertically |
| RIGHT (400px) | AiChat | Full height |

- Token click sets `selectedToken` → passed as `:symbol` to `<MarketChart>`
- Chart wrapped in `<ClientOnly>` (SSR-safe, lightweight-charts is browser-only)
- First token auto-selected via watcher on `portfolioTokens`

---

## Wallet System (`composables/useWallet.ts`)

- State: `useState<WalletState>` (SSR-safe) + `useCookie` for persistence
- Supports: EVM (MetaMask `eth_requestAccounts`), BTC (manual address), TON (manual address)
- `fetchPortfolio()` → `POST /api/portfolio` with `{ address, type, chain }`
- `portfolioTokens` → `PortfolioToken[]` with `{ symbol, name, balance, usd, native, logo }`

---

## API Endpoints Summary

| Endpoint | Method | Purpose | Data source |
|---|---|---|---|
| `/api/market/:symbol` | GET | OHLC chart data | CoinGecko OHLC (cached) |
| `/api/portfolio` | POST | Token balances + USD values | Moralis (EVM), Blockstream (BTC), TonAPI (TON) |
| `/api/transactions` | POST | Transaction history | Moralis / Blockstream / TonAPI |
| `/api/chat` | POST | AI chat | GigaChat API |
| `/api/news` | GET | Crypto news | External news API |

---

## Environment Variables

| Variable | Scope | Purpose |
|---|---|---|
| `NUXT_MORALIS_API_KEY` | Server | Moralis API for EVM portfolio/transactions |
| `GIGACHAT_CLIENT_ID` | Server | GigaChat OAuth client ID |
| `GIGACHAT_CLIENT_SECRET` | Server | GigaChat OAuth client secret |
| `GIGACHAT_MODEL` | Server | GigaChat model name (default: GigaChat-2) |

---

## Commands

```bash
npm install         # Install dependencies
npm run dev         # Dev server at http://localhost:3000
npm run build       # Production build (npx nuxi build)
npm run preview     # Preview production build
```

---

## Key Implementation Notes

1. **CoinGecko free tier has rate limits** — the SWR cache + stale-while-revalidate pattern minimizes API calls. Background refreshes are deduplicated via `markRefreshing()`.

2. **Lightweight Charts v4.2 specifics:**
   - `background` requires `{ type: ColorType.Solid, color: '...' }` — omitting `type` breaks chart creation silently
   - Chart container must never have `display: none` when `autoSize: true` — canvas resizes to 0x0 and won't recover properly
   - `time` values must be Unix seconds (not milliseconds)

3. **Nuxt auto-imports:** Server utils in `server/utils/` are auto-imported in API handlers. `getCachedSpotPrice`, `resolveCoinId`, cache singletons — no explicit imports needed in API files.

4. **SSR safety:** All chart/browser-only components wrapped in `<ClientOnly>`. Wallet state uses `useState` (SSR-safe) + HTTP-only cookies.
