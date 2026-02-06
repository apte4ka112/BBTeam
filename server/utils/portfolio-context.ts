import type { OhlcCandle } from '~/types/market'
import { resolveCoinId } from './coingecko'
import { ohlcCache, CACHE_TTL } from './market-cache'

interface Token {
  symbol: string
  name?: string
  balance: string
  usd: number
  percentage?: string
}

interface Transaction {
  value: string
  direction: 'send' | 'receive'
  status: string
  timestamp: number
  hash?: string
  from?: string
  to?: string
}

interface PortfolioContextParams {
  tokens: Token[]
  totalUsd: number
  transactions?: Transaction[]
  address?: string
  type?: string
}

interface MarketData {
  price: number
  change7d: number | null
  high7d: number | null
  low7d: number | null
  change30d: number | null
  high30d: number | null
  low30d: number | null
}

const STABLECOINS = new Set(['USDT', 'USDC', 'DAI', 'BUSD'])

function compactNumber(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `$${(n / 1_000).toFixed(0)}k`
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}k`
  return `$${n.toFixed(2)}`
}

function compactPrice(n: number): string {
  if (n >= 10_000) return `$${(n / 1_000).toFixed(0)}k`
  if (n >= 100) return `$${n.toFixed(0)}`
  if (n >= 1) return `$${n.toFixed(2)}`
  return `$${n.toFixed(4)}`
}

function formatDate(ts: number): string {
  const d = new Date(ts)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${day}.${month} ${hours}:${minutes}`
}

function pctChange(oldVal: number, newVal: number): number | null {
  if (!oldVal || oldVal === 0) return null
  return ((newVal - oldVal) / oldVal) * 100
}

function formatPct(val: number | null): string {
  if (val === null) return 'n/a'
  const sign = val >= 0 ? '+' : ''
  return `${sign}${val.toFixed(1)}%`
}

async function fetchOhlc(coinId: string, days: number): Promise<OhlcCandle[]> {
  const range = days <= 7 ? '7d' : '30d'
  const interval = '1d'
  const cacheKey = `${coinId}:${range}:${interval}`

  const cached = ohlcCache.get(cacheKey)
  if (cached && !cached.stale) {
    return cached.data
  }

  const data = await $fetch<[number, number, number, number, number][]>(
    `https://api.coingecko.com/api/v3/coins/${coinId}/ohlc`,
    { query: { vs_currency: 'usd', days } }
  )

  if (!Array.isArray(data)) return []

  const candles = data.map(([timestamp, open, high, low, close]) => ({
    time: Math.floor(timestamp / 1000),
    open,
    high,
    low,
    close,
  }))

  ohlcCache.set(cacheKey, candles, CACHE_TTL.OHLC_1D)
  return candles
}

function analyzeCandles(candles: OhlcCandle[]): { change: number | null; high: number | null; low: number | null; currentPrice: number | null } {
  if (!candles.length) return { change: null, high: null, low: null, currentPrice: null }

  const first = candles[0]
  const last = candles[candles.length - 1]
  const high = Math.max(...candles.map(c => c.high))
  const low = Math.min(...candles.map(c => c.low))
  const change = pctChange(first.open, last.close)

  return { change, high, low, currentPrice: last.close }
}

async function fetchMarketData(symbol: string): Promise<MarketData | null> {
  const coinId = await resolveCoinId(symbol)
  if (!coinId) return null

  const [ohlc7d, ohlc30d] = await Promise.all([
    fetchOhlc(coinId, 7),
    fetchOhlc(coinId, 30),
  ])

  const analysis7d = analyzeCandles(ohlc7d)
  const analysis30d = analyzeCandles(ohlc30d)

  return {
    price: analysis7d.currentPrice ?? analysis30d.currentPrice ?? 0,
    change7d: analysis7d.change,
    high7d: analysis7d.high,
    low7d: analysis7d.low,
    change30d: analysis30d.change,
    high30d: analysis30d.high,
    low30d: analysis30d.low,
  }
}

function getDiversificationLevel(count: number): string {
  if (count >= 10) return 'хорошая'
  if (count >= 5) return 'умеренная'
  return 'низкая'
}

function getStablecoinAssessment(pct: number): string {
  if (pct >= 70) return 'очень высокая доля, низкий доходный потенциал'
  if (pct >= 50) return 'высокая доля'
  if (pct >= 20) return 'сбалансированно'
  if (pct >= 5) return 'небольшая доля'
  return 'минимальная или отсутствует'
}

export async function buildPortfolioContext(params: PortfolioContextParams): Promise<string> {
  const { tokens, totalUsd, transactions = [], address, type } = params

  const tokensByValue = [...tokens].sort((a, b) => b.usd - a.usd)
  const stableTokens = tokens.filter(t => STABLECOINS.has(t.symbol.toUpperCase()))
  const stableValue = stableTokens.reduce((sum, t) => sum + t.usd, 0)
  const stablePct = totalUsd > 0 ? (stableValue / totalUsd) * 100 : 0

  // Fetch market data for top-10 non-stablecoin tokens with 3s timeout
  const top10 = tokensByValue.slice(0, 10)
  const marketDataMap = new Map<string, MarketData>()

  try {
    const marketPromises = top10.map(async (t) => {
      const upper = t.symbol.toUpperCase()
      if (STABLECOINS.has(upper)) return { symbol: upper, data: null }
      const data = await fetchMarketData(upper)
      return { symbol: upper, data }
    })

    const results = await Promise.race([
      Promise.allSettled(marketPromises),
      new Promise<PromiseSettledResult<{ symbol: string; data: MarketData | null }>[]>((resolve) =>
        setTimeout(() => resolve([]), 3000)
      ),
    ])

    for (const result of results) {
      if (result.status === 'fulfilled' && result.value.data) {
        marketDataMap.set(result.value.symbol, result.value.data)
      }
    }
  } catch {
    // Market data unavailable — continue without it
  }

  // === Build output ===
  const lines: string[] = []

  // Portfolio summary
  lines.push(`[ПОРТФЕЛЬ] ${compactNumber(totalUsd)} | ${tokens.length} токенов | Стейблы: ${compactNumber(stableValue)} (${stablePct.toFixed(0)}%)`)

  // Wallet info
  if (address) {
    const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`
    lines.push(`[КОШЕЛЁК] ${shortAddr}${type ? ` | ${type}` : ''}`)
  }

  // Assets
  lines.push('[АКТИВЫ]')
  for (let i = 0; i < tokensByValue.length; i++) {
    const t = tokensByValue[i]
    const upper = t.symbol.toUpperCase()
    const pct = totalUsd > 0 ? ((t.usd / totalUsd) * 100).toFixed(1) : '0'
    const nameStr = t.name ? ` (${t.name})` : ''

    if (STABLECOINS.has(upper)) {
      lines.push(`#${i + 1} ${t.symbol}${nameStr}: ${t.balance} = $${t.usd.toFixed(2)} (${pct}%) | стейблкоин`)
      continue
    }

    let marketStr = ''
    const md = marketDataMap.get(upper)
    if (md) {
      marketStr = ` | Цена: ${compactPrice(md.price)}`
      if (md.change7d !== null) {
        marketStr += ` | 7д: ${formatPct(md.change7d)}`
        if (md.high7d !== null && md.low7d !== null) {
          marketStr += ` H:${compactPrice(md.high7d)} L:${compactPrice(md.low7d)}`
        }
      }
      if (md.change30d !== null) {
        marketStr += ` | 30д: ${formatPct(md.change30d)}`
        if (md.high30d !== null && md.low30d !== null) {
          marketStr += ` H:${compactPrice(md.high30d)} L:${compactPrice(md.low30d)}`
        }
      }
    }

    lines.push(`#${i + 1} ${t.symbol}${nameStr}: ${t.balance} = $${t.usd.toFixed(2)} (${pct}%)${marketStr}`)
  }

  // Transactions
  if (transactions.length > 0) {
    const sends = transactions.filter(t => t.direction === 'send').length
    const receives = transactions.filter(t => t.direction === 'receive').length
    lines.push(`[ТРАНЗАКЦИИ] ${transactions.length} всего (${receives} получено, ${sends} отправлено)`)

    const recentTxs = transactions.slice(0, 15)
    for (const t of recentTxs) {
      const arrow = t.direction === 'receive' ? '←' : '→'
      const dirLabel = t.direction === 'receive' ? 'получено' : 'отправлено'
      const statusIcon = t.status === 'failed' ? '✗' : '✓'
      const dateStr = t.timestamp ? formatDate(t.timestamp) : '??'
      lines.push(`${dateStr} ${arrow} ${t.value} (${dirLabel}) ${statusIcon}`)
    }
    if (transactions.length > 15) {
      lines.push(`... и ещё ${transactions.length - 15}`)
    }
  } else {
    lines.push('[ТРАНЗАКЦИИ] нет данных')
  }

  // Analytics
  const largestToken = tokensByValue[0]
  const largestPct = largestToken && totalUsd > 0
    ? ((largestToken.usd / totalUsd) * 100).toFixed(1)
    : '0'

  lines.push('[АНАЛИТИКА]')
  if (largestToken) {
    lines.push(`Крупнейшая позиция: ${largestToken.symbol} (${largestPct}%)`)
  }
  lines.push(`Диверсификация: ${getDiversificationLevel(tokens.length)} (${tokens.length} активов)`)
  lines.push(`Доля стейблкоинов: ${stablePct.toFixed(0)}% — ${getStablecoinAssessment(stablePct)}`)

  const result = lines.join('\n')
  return result
}
