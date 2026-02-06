import type { OhlcCandle, OhlcInterval, OhlcRange, MarketChartResponse } from '~/types/market'
import { ohlcCache, CACHE_TTL } from '~/server/utils/market-cache'
import { resolveCoinId } from '~/server/utils/coingecko'

const VALID_INTERVALS: OhlcInterval[] = ['1h', '1d']
const VALID_RANGES: OhlcRange[] = ['1d', '7d', '30d', '90d', '365d']

const RANGE_TO_DAYS: Record<OhlcRange, number> = {
  '1d': 1,
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '365d': 365,
}

function getTtl(interval: OhlcInterval): number {
  return interval === '1h' ? CACHE_TTL.OHLC_1H : CACHE_TTL.OHLC_1D
}

function inferInterval(range: OhlcRange): OhlcInterval {
  return range === '1d' ? '1h' : '1d'
}

export default defineEventHandler(async (event): Promise<MarketChartResponse> => {
  const symbol = getRouterParam(event, 'symbol')
  if (!symbol) {
    throw createError({ statusCode: 400, statusMessage: 'Missing symbol' })
  }

  const query = getQuery(event)
  const range = (query.range as OhlcRange) || '7d'
  const interval = (query.interval as OhlcInterval) || inferInterval(range)

  if (!VALID_RANGES.includes(range)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid range: ${range}` })
  }
  if (!VALID_INTERVALS.includes(interval)) {
    throw createError({ statusCode: 400, statusMessage: `Invalid interval: ${interval}` })
  }

  const coinId = await resolveCoinId(symbol)
  if (!coinId) {
    throw createError({ statusCode: 400, statusMessage: `Unknown token: ${symbol}` })
  }

  const cacheKey = `${coinId}:${range}:${interval}`
  const cached = ohlcCache.get(cacheKey)

  // Fresh cache — return immediately
  if (cached && !cached.stale) {
    return {
      symbol: symbol.toUpperCase(),
      interval,
      range,
      candles: cached.data,
      cachedAt: Date.now(),
    }
  }

  // Stale cache — return stale data + trigger background refresh
  if (cached && cached.stale) {
    if (ohlcCache.markRefreshing(cacheKey)) {
      // Background refresh (fire-and-forget)
      fetchOhlcFromCoinGecko(coinId, range).then(candles => {
        ohlcCache.set(cacheKey, candles, getTtl(interval))
      }).catch(() => {
        ohlcCache.clearRefreshing(cacheKey)
      })
    }

    return {
      symbol: symbol.toUpperCase(),
      interval,
      range,
      candles: cached.data,
      cachedAt: Date.now(),
    }
  }

  // No cache — synchronous fetch
  try {
    const candles = await fetchOhlcFromCoinGecko(coinId, range)
    ohlcCache.set(cacheKey, candles, getTtl(interval))

    return {
      symbol: symbol.toUpperCase(),
      interval,
      range,
      candles,
      cachedAt: Date.now(),
    }
  } catch (err: any) {
    // CoinGecko 429 rate limit
    if (err?.statusCode === 429 || err?.status === 429) {
      throw createError({ statusCode: 429, statusMessage: 'Rate limited by CoinGecko. Try again later.' })
    }
    throw createError({ statusCode: 502, statusMessage: 'Failed to fetch chart data' })
  }
})

async function fetchOhlcFromCoinGecko(coinId: string, range: OhlcRange): Promise<OhlcCandle[]> {
  const days = RANGE_TO_DAYS[range]

  const data = await $fetch<[number, number, number, number, number][]>(
    `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc`,
    { query: { vs_currency: 'usd', days } }
  )

  if (!Array.isArray(data)) return []

  return data.map(([timestamp, open, high, low, close]) => ({
    time: Math.floor(timestamp / 1000), // ms → seconds
    open,
    high,
    low,
    close,
  }))
}
