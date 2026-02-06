export type OhlcInterval = '1h' | '1d'
export type OhlcRange = '1d' | '7d' | '30d' | '90d' | '365d'
export type ChartMode = 'line' | 'candlestick'

export interface OhlcCandle {
  time: number    // Unix seconds (Lightweight Charts format)
  open: number
  high: number
  low: number
  close: number
}

export interface MarketChartResponse {
  symbol: string
  interval: OhlcInterval
  range: OhlcRange
  candles: OhlcCandle[]
  cachedAt: number
}
