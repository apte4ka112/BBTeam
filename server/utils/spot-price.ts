import { spotPriceCache, CACHE_TTL } from './market-cache'

export async function getCachedSpotPrice(coinId: string): Promise<number> {
  const cacheKey = coinId
  const cached = spotPriceCache.get(cacheKey)

  // Fresh cache
  if (cached && !cached.stale) {
    return cached.data[coinId] ?? 0
  }

  // Stale cache — return stale + background refresh
  if (cached && cached.stale) {
    if (spotPriceCache.markRefreshing(cacheKey)) {
      fetchSpotPrice(coinId).then(price => {
        spotPriceCache.set(cacheKey, { [coinId]: price }, CACHE_TTL.SPOT_PRICE)
      }).catch(() => {
        spotPriceCache.clearRefreshing(cacheKey)
      })
    }
    return cached.data[coinId] ?? 0
  }

  // No cache — synchronous fetch
  try {
    const price = await fetchSpotPrice(coinId)
    spotPriceCache.set(cacheKey, { [coinId]: price }, CACHE_TTL.SPOT_PRICE)
    return price
  } catch {
    return 0
  }
}

async function fetchSpotPrice(coinId: string): Promise<number> {
  const data = await $fetch<Record<string, { usd?: number }>>(
    'https://api.coingecko.com/api/v3/simple/price',
    { query: { ids: coinId, vs_currencies: 'usd' } }
  )
  return data[coinId]?.usd ?? 0
}
