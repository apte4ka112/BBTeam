import type { OhlcCandle } from '~/types/market'

interface CacheEntry<T> {
  data: T
  cachedAt: number
  ttl: number
  refreshing: boolean
}

export class SWRCache<T> {
  private store = new Map<string, CacheEntry<T>>()
  private maxEntries: number

  constructor(maxEntries: number = 500) {
    this.maxEntries = maxEntries
  }

  get(key: string): { data: T; stale: boolean } | null {
    const entry = this.store.get(key)
    if (!entry) return null

    const age = Date.now() - entry.cachedAt
    const stale = age > entry.ttl

    return { data: entry.data, stale }
  }

  set(key: string, data: T, ttl: number): void {
    // LRU-like eviction: remove oldest entries when exceeding maxEntries
    if (this.store.size >= this.maxEntries && !this.store.has(key)) {
      const firstKey = this.store.keys().next().value
      if (firstKey !== undefined) {
        this.store.delete(firstKey)
      }
    }

    this.store.set(key, {
      data,
      cachedAt: Date.now(),
      ttl,
      refreshing: false,
    })
  }

  markRefreshing(key: string): boolean {
    const entry = this.store.get(key)
    if (!entry) return false
    if (entry.refreshing) return false // already refreshing
    entry.refreshing = true
    return true
  }

  clearRefreshing(key: string): void {
    const entry = this.store.get(key)
    if (entry) {
      entry.refreshing = false
    }
  }

  cleanup(): void {
    const maxAge = 2 * 60 * 60 * 1000 // 2 hours
    const now = Date.now()
    for (const [key, entry] of this.store) {
      if (now - entry.cachedAt > maxAge) {
        this.store.delete(key)
      }
    }
  }
}

// Singletons
export const ohlcCache = new SWRCache<OhlcCandle[]>(200)
export const spotPriceCache = new SWRCache<Record<string, number>>(100)
export const coinIdCache = new Map<string, string | null>()

// TTL constants (milliseconds)
export const CACHE_TTL = {
  SPOT_PRICE: 45_000,     // 45 seconds
  OHLC_1H: 5 * 60_000,   // 5 minutes
  OHLC_1D: 30 * 60_000,  // 30 minutes
} as const

// Periodic cleanup every 10 minutes
setInterval(() => {
  ohlcCache.cleanup()
  spotPriceCache.cleanup()
}, 10 * 60_000)
