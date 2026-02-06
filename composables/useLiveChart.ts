import type { OhlcCandle, ChartMode, MarketChartResponse } from '~/types/market'

const LIVE_ENABLED = true

const MIN_POLL_MS = 10_000
const MAX_POLL_MS = 60_000
const VOLATILITY_CAP = 0.5

const TRANSITION_MS = 800
const TICK_INTERVAL_MS = 2_000
const TICK_NOISE_RATIO = 0.02
const TICK_MEAN_REVERSION = 0.3

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function useLiveChart() {
  // --- Internal state (plain JS, no Vue reactivity) ---
  let symbol = ''
  let getSeries: (() => any) | null = null
  let getChartMode: (() => ChartMode) | null = null

  let lastCandle: OhlcCandle | null = null
  let prevClose = 0
  let currentPollMs = MAX_POLL_MS

  // Polling
  let pollTimeoutId: ReturnType<typeof setTimeout> | null = null

  // Smooth transition (rAF)
  let rafId: number | null = null
  let animStartTime = 0
  let animFromClose = 0
  let animToCandle: OhlcCandle | null = null

  // Micro-ticks
  let tickIntervalId: ReturnType<typeof setInterval> | null = null
  let tickDrift = 0

  // Visibility
  let visibilityHandler: (() => void) | null = null
  let active = false

  // --- Helpers ---

  function pushToSeries(candle: OhlcCandle) {
    const s = getSeries?.()
    if (!s) return
    const mode = getChartMode?.()
    if (mode === 'candlestick') {
      s.update(candle)
    } else {
      s.update({ time: candle.time, value: candle.close })
    }
  }

  function computeVolatility(newClose: number, oldClose: number): number {
    if (oldClose <= 0) return 0
    return Math.abs(newClose - oldClose) / oldClose * 100
  }

  function computePollInterval(volatility: number): number {
    // Linear interpolation: 0% → MAX_POLL_MS, ≥VOLATILITY_CAP% → MIN_POLL_MS
    const t = Math.min(volatility / VOLATILITY_CAP, 1)
    return Math.round(lerp(MAX_POLL_MS, MIN_POLL_MS, t))
  }

  // --- 1. Adaptive polling ---

  function schedulePoll() {
    if (!active) return
    pollTimeoutId = setTimeout(executePoll, currentPollMs)
  }

  async function executePoll() {
    pollTimeoutId = null
    if (!active || !symbol) return

    try {
      const data = await $fetch<MarketChartResponse>(`/api/market/${symbol}`, {
        query: { range: '1d' },
      })
      if (!active || !data.candles.length) {
        schedulePoll()
        return
      }

      const newCandle = data.candles[data.candles.length - 1]

      if (lastCandle) {
        const vol = computeVolatility(newCandle.close, prevClose)
        currentPollMs = computePollInterval(vol)
      }

      prevClose = newCandle.close
      beginSmoothTransition(newCandle)
    } catch {
      // On error, retry after MAX_POLL_MS
      currentPollMs = MAX_POLL_MS
    }

    schedulePoll()
  }

  // --- 2. Smooth transition (rAF) ---

  function beginSmoothTransition(newCandle: OhlcCandle) {
    cancelAnimation()

    animFromClose = lastCandle ? lastCandle.close : newCandle.close
    animToCandle = newCandle
    animStartTime = performance.now()

    rafId = requestAnimationFrame(animationStep)
  }

  function animationStep(now: number) {
    if (!animToCandle) return

    const elapsed = now - animStartTime
    const t = Math.min(elapsed / TRANSITION_MS, 1)
    const easedT = easeOutCubic(t)

    if (t < 1) {
      // Intermediate frame: real OHLC + interpolated close
      const interpolatedClose = lerp(animFromClose, animToCandle.close, easedT)
      const intermediate: OhlcCandle = {
        time: animToCandle.time,
        open: animToCandle.open,
        high: animToCandle.high,
        low: animToCandle.low,
        close: interpolatedClose,
      }
      pushToSeries(intermediate)
      rafId = requestAnimationFrame(animationStep)
    } else {
      // Final frame: snap to exact values
      lastCandle = { ...animToCandle }
      tickDrift = 0
      pushToSeries(lastCandle)
      rafId = null
      animToCandle = null
    }
  }

  function cancelAnimation() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    // If animation was in progress, snap to target
    if (animToCandle) {
      lastCandle = { ...animToCandle }
      tickDrift = 0
      pushToSeries(lastCandle)
      animToCandle = null
    }
  }

  // --- 3. Micro-ticks ("breathing") ---

  function startTicks() {
    stopTicks()
    tickIntervalId = setInterval(tick, TICK_INTERVAL_MS)
  }

  function stopTicks() {
    if (tickIntervalId !== null) {
      clearInterval(tickIntervalId)
      tickIntervalId = null
    }
  }

  function tick() {
    // Mutual exclusion: skip if rAF animation is active
    if (rafId !== null) return
    if (!lastCandle) return

    const range = lastCandle.high - lastCandle.low
    if (range <= 0) return // Flat candle — skip

    // Random noise within ±TICK_NOISE_RATIO of candle range
    const noise = (Math.random() * 2 - 1) * TICK_NOISE_RATIO * range

    // Apply mean-reversion to prevent drift
    tickDrift = tickDrift * (1 - TICK_MEAN_REVERSION) + noise

    // Compute new close, clamped to high/low
    let newClose = lastCandle.close + tickDrift
    newClose = Math.max(lastCandle.low, Math.min(lastCandle.high, newClose))

    const tickCandle: OhlcCandle = {
      time: lastCandle.time,
      open: lastCandle.open,
      high: lastCandle.high,
      low: lastCandle.low,
      close: newClose,
    }
    pushToSeries(tickCandle)
  }

  // --- 4. Visibility-aware ---

  function onVisibilityChange() {
    if (document.hidden) {
      pauseAll()
    } else {
      resumeAll()
    }
  }

  function pauseAll() {
    if (pollTimeoutId !== null) {
      clearTimeout(pollTimeoutId)
      pollTimeoutId = null
    }
    stopTicks()
    cancelAnimation()
  }

  function resumeAll() {
    if (!active) return
    // Immediate poll on tab return
    executePoll()
    startTicks()
  }

  // --- Public API ---

  function seed(candles: OhlcCandle[]) {
    cancelAnimation()
    tickDrift = 0

    if (!candles.length) {
      lastCandle = null
      prevClose = 0
      currentPollMs = MAX_POLL_MS
      return
    }

    lastCandle = { ...candles[candles.length - 1] }
    prevClose = lastCandle.close
    currentPollMs = MAX_POLL_MS
  }

  function start(
    sym: string,
    seriesGetter: () => any,
    chartModeGetter: () => ChartMode,
  ) {
    if (!LIVE_ENABLED) return

    // Always stop first to handle fast symbol switches
    stop()

    symbol = sym
    getSeries = seriesGetter
    getChartMode = chartModeGetter
    active = true

    schedulePoll()
    startTicks()

    visibilityHandler = onVisibilityChange
    document.addEventListener('visibilitychange', visibilityHandler)
  }

  function stop() {
    active = false

    if (pollTimeoutId !== null) {
      clearTimeout(pollTimeoutId)
      pollTimeoutId = null
    }

    cancelAnimation()
    stopTicks()

    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler)
      visibilityHandler = null
    }

    getSeries = null
    getChartMode = null
    symbol = ''
  }

  return { start, stop, seed }
}
