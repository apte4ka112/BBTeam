<template>
  <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 flex flex-col h-full">
    <div class="flex items-center justify-between mb-4">
      <div>
        <h3 class="text-white font-semibold text-sm">{{ symbol }} Price</h3>
        <div v-if="candles.length" class="flex items-center gap-2 mt-0.5">
          <span class="text-white font-medium text-xs">${{ displayPrice }}</span>
          <span class="text-xs" :class="displayChange >= 0 ? 'text-green-400' : 'text-red-400'">
            {{ displayChange >= 0 ? '+' : '' }}{{ displayChange.toFixed(2) }}%
          </span>
          <span class="text-white/30 text-xs">{{ displayDate }}</span>
        </div>
      </div>
      <div class="flex gap-1">
        <!-- Chart mode toggle -->
        <button
          @click="chartMode = chartMode === 'line' ? 'candlestick' : 'line'"
          :class="chartMode === 'candlestick'
            ? 'bg-purple-500/30 text-purple-300 border-purple-500/50'
            : 'text-white/40 hover:text-white/70 border-transparent'"
          class="px-2 py-1 rounded-lg text-xs transition-colors border mr-2"
          :title="chartMode === 'line' ? 'Switch to Candlestick' : 'Switch to Line'"
        >
          <svg v-if="chartMode === 'line'" class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="2" width="2" height="12" rx="0.5" />
            <rect x="7" y="5" width="2" height="8" rx="0.5" />
            <rect x="11" y="1" width="2" height="14" rx="0.5" />
          </svg>
          <svg v-else class="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
            <polyline points="1,12 5,6 9,9 15,3" />
          </svg>
        </button>

        <!-- Period buttons -->
        <button
          v-for="p in periods"
          :key="p.range"
          @click="selectedRange = p.range"
          :class="selectedRange === p.range
            ? 'bg-purple-500/30 text-purple-300 border-purple-500/50'
            : 'text-white/40 hover:text-white/70 border-transparent'"
          class="px-3 py-1 rounded-lg text-xs transition-colors border"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <!-- Chart container — always visible so lightweight-charts has real dimensions -->
    <div class="flex-1 min-h-0 relative">
      <div ref="chartContainer" class="absolute inset-0"></div>

      <!-- Tooltip -->
      <div
        v-show="tooltip.visible"
        ref="tooltipEl"
        class="absolute z-20 pointer-events-none px-3 py-2 rounded-lg bg-slate-800/95 border border-white/10 backdrop-blur-sm text-xs shadow-xl"
        :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
      >
        <div class="text-white/50 mb-1">{{ tooltip.date }}</div>
        <template v-if="tooltip.isCandle">
          <div class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
            <span class="text-white/40">O</span>
            <span class="text-white font-medium">${{ tooltip.open }}</span>
            <span class="text-white/40">H</span>
            <span class="text-green-400 font-medium">${{ tooltip.high }}</span>
            <span class="text-white/40">L</span>
            <span class="text-red-400 font-medium">${{ tooltip.low }}</span>
            <span class="text-white/40">C</span>
            <span class="text-white font-medium">${{ tooltip.close }}</span>
          </div>
        </template>
        <template v-else>
          <div class="text-white font-medium">${{ tooltip.close }}</div>
        </template>
        <div v-if="tooltip.change !== null" class="mt-1 border-t border-white/10 pt-1">
          <span :class="tooltip.change >= 0 ? 'text-green-400' : 'text-red-400'">
            {{ tooltip.change >= 0 ? '+' : '' }}{{ tooltip.change }}%
          </span>
        </div>
      </div>

      <!-- Loading overlay -->
      <div v-if="loading" class="absolute inset-0 flex items-center justify-center z-10">
        <svg class="w-6 h-6 text-white/30 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- Error overlay -->
      <div v-else-if="errorMsg" class="absolute inset-0 flex items-center justify-center z-10">
        <span class="text-white/30 text-sm">{{ errorMsg }}</span>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ColorType } from 'lightweight-charts'
import type { OhlcCandle, OhlcRange, ChartMode, MarketChartResponse } from '~/types/market'

const props = defineProps<{ symbol: string }>()

const periods: { label: string; range: OhlcRange }[] = [
  { label: '24h', range: '1d' },
  { label: '7D', range: '7d' },
  { label: '30D', range: '30d' },
  { label: '1Y', range: '365d' },
]

const selectedRange = ref<OhlcRange>('7d')
const chartMode = ref<ChartMode>('line')
const candles = ref<OhlcCandle[]>([])
const loading = ref(false)
const errorMsg = ref('')
const chartContainer = ref<HTMLElement | null>(null)
const tooltipEl = ref<HTMLElement | null>(null)

const tooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  date: '',
  open: '',
  high: '',
  low: '',
  close: '',
  isCandle: false,
  change: null as number | null,
})

// NOT reactive — avoid Vue proxy on chart internals
let chart: any = null
let series: any = null

const live = useLiveChart()

const hoverPrice = ref<string | null>(null)
const hoverChange = ref<number | null>(null)
const hoverDate = ref<string | null>(null)

const currentPrice = computed(() => {
  if (!candles.value.length) return '0'
  const last = candles.value[candles.value.length - 1].close
  return last.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
})

const priceChange = computed(() => {
  if (candles.value.length < 2) return 0
  const first = candles.value[0].open
  const last = candles.value[candles.value.length - 1].close
  return ((last - first) / first) * 100
})

const displayPrice = computed(() => hoverPrice.value ?? currentPrice.value)
const displayChange = computed(() => hoverChange.value ?? priceChange.value)

const rangeLabel: Record<string, string> = {
  '1d': 'сегодня',
  '7d': 'за неделю',
  '30d': 'за месяц',
  '365d': 'за год',
}
const displayDate = computed(() => hoverDate.value ?? rangeLabel[selectedRange.value] ?? '')

async function fetchChart() {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await $fetch<MarketChartResponse>(`/api/market/${props.symbol}`, {
      query: { range: selectedRange.value },
    })
    candles.value = data.candles
  } catch {
    errorMsg.value = `Нет данных для ${props.symbol}`
    candles.value = []
  } finally {
    loading.value = false
    await nextTick()
    applySeries()
    live.seed(candles.value)
  }
}

async function initChart() {
  if (!chartContainer.value) return

  const { createChart } = await import('lightweight-charts')

  if (chart) {
    chart.remove()
    chart = null
    series = null
  }

  chart = createChart(chartContainer.value, {
    autoSize: true,
    layout: {
      background: { type: ColorType.Solid, color: 'transparent' },
      textColor: 'rgba(255, 255, 255, 0.4)',
      fontSize: 10,
    },
    grid: {
      vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
      horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
    },
    crosshair: {
      vertLine: { color: 'rgba(255, 255, 255, 0.1)', labelBackgroundColor: '#1e293b' },
      horzLine: { color: 'rgba(255, 255, 255, 0.1)', labelBackgroundColor: '#1e293b' },
    },
    rightPriceScale: {
      borderColor: 'rgba(255, 255, 255, 0.06)',
    },
    timeScale: {
      borderColor: 'rgba(255, 255, 255, 0.06)',
      timeVisible: selectedRange.value === '1d',
    },
  })

  chart.subscribeCrosshairMove(onCrosshairMove)
}

function formatPrice(v: number): string {
  if (v >= 1) return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  if (v >= 0.01) return v.toFixed(4)
  return v.toFixed(6)
}

function onCrosshairMove(param: any) {
  if (!param.time || !param.point || !series || !chartContainer.value) {
    tooltip.visible = false
    hoverPrice.value = null
    hoverChange.value = null
    hoverDate.value = null
    return
  }

  const data = param.seriesData.get(series)
  if (!data) {
    tooltip.visible = false
    hoverPrice.value = null
    hoverChange.value = null
    hoverDate.value = null
    return
  }

  // Position tooltip — keep within container bounds
  const containerWidth = chartContainer.value.clientWidth
  const tooltipWidth = tooltipEl.value?.clientWidth ?? 140
  const tooltipHeight = tooltipEl.value?.clientHeight ?? 100

  let x = param.point.x + 16
  if (x + tooltipWidth > containerWidth) {
    x = param.point.x - tooltipWidth - 16
  }

  let y = param.point.y - tooltipHeight / 2
  if (y < 0) y = 0
  const containerHeight = chartContainer.value.clientHeight
  if (y + tooltipHeight > containerHeight) {
    y = containerHeight - tooltipHeight
  }

  // Format date
  const ts = typeof param.time === 'number' ? param.time * 1000 : 0
  const d = new Date(ts)
  const weekday = d.toLocaleDateString('ru', { weekday: 'short' })

  let dateStr: string
  let headerDateStr: string
  if (selectedRange.value === '1d') {
    const time = d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
    headerDateStr = `${weekday}, ${time}`
    dateStr = d.toLocaleString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  } else if (selectedRange.value === '365d') {
    const datePart = d.toLocaleDateString('ru', { day: '2-digit', month: 'long', year: 'numeric' })
    headerDateStr = `${weekday}, ${datePart}`
    dateStr = d.toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' })
  } else {
    const datePart = d.toLocaleDateString('ru', { day: '2-digit', month: 'long' })
    headerDateStr = `${weekday}, ${datePart}`
    dateStr = d.toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  hoverDate.value = headerDateStr

  const closeVal = 'close' in data ? data.close : data.value
  const lastClose = candles.value.length ? candles.value[candles.value.length - 1].close : 0
  const firstOpen = candles.value.length ? candles.value[0].open : 0

  // Current/last candle → % from start of period; older candle → % vs current price
  const isLast = candles.value.length && param.time === candles.value[candles.value.length - 1].time
  const change = isLast
    ? (firstOpen > 0 ? ((closeVal - firstOpen) / firstOpen) * 100 : null)
    : (lastClose > 0 ? ((closeVal - lastClose) / lastClose) * 100 : null)

  hoverPrice.value = formatPrice(closeVal)
  hoverChange.value = change !== null ? Math.round(change * 100) / 100 : 0

  tooltip.isCandle = 'open' in data
  tooltip.date = dateStr
  tooltip.close = formatPrice(closeVal)
  tooltip.change = change !== null ? Math.round(change * 100) / 100 : null


  if (tooltip.isCandle) {
    tooltip.open = formatPrice(data.open)
    tooltip.high = formatPrice(data.high)
    tooltip.low = formatPrice(data.low)
  }

  tooltip.x = x
  tooltip.y = y
  tooltip.visible = true
}

function applySeries() {
  if (!chart) return

  // Remove existing series
  if (series) {
    chart.removeSeries(series)
    series = null
  }

  if (!candles.value.length) return

  const isUp = priceChange.value >= 0

  if (chartMode.value === 'candlestick') {
    series = chart.addCandlestickSeries({
      upColor: '#4ade80',
      downColor: '#f87171',
      borderUpColor: '#4ade80',
      borderDownColor: '#f87171',
      wickUpColor: '#4ade80',
      wickDownColor: '#f87171',
    })
    series.setData(candles.value)
  } else {
    series = chart.addLineSeries({
      color: isUp ? '#4ade80' : '#f87171',
      lineWidth: 2,
      crosshairMarkerRadius: 4,
      crosshairMarkerBorderColor: isUp ? '#4ade80' : '#f87171',
      crosshairMarkerBackgroundColor: '#1e293b',
    })
    // Line series uses { time, value }
    series.setData(candles.value.map(c => ({ time: c.time, value: c.close })))
  }

  chart.timeScale().fitContent()
}

// Watch symbol changes
watch(() => props.symbol, async () => {
  live.stop()
  await fetchChart()
  live.start(props.symbol, () => series, () => chartMode.value)
})

// Watch range changes
watch(selectedRange, async () => {
  live.stop()
  // Update timeScale visibility for intraday
  if (chart) {
    chart.applyOptions({
      timeScale: { timeVisible: selectedRange.value === '1d' },
    })
  }
  await fetchChart()
  live.start(props.symbol, () => series, () => chartMode.value)
})

// Watch chart mode — just switch series, no refetch
watch(chartMode, () => {
  applySeries()
})

onMounted(async () => {
  await initChart()
  await fetchChart()
  live.start(props.symbol, () => series, () => chartMode.value)
})

onBeforeUnmount(() => {
  live.stop()
  if (chart) {
    chart.remove()
    chart = null
    series = null
  }
})
</script>

<style scoped>
:deep(#tv-attr-logo) {
  display: none !important;
}
</style>
