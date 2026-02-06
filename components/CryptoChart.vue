<template>
  <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 flex flex-col h-full">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-white font-semibold text-sm">{{ symbol }} Price</h3>
      <div class="flex gap-1">
        <button
          v-for="p in periods"
          :key="p.days"
          @click="selectedDays = p.days"
          :class="selectedDays === p.days
            ? 'bg-purple-500/30 text-purple-300 border-purple-500/50'
            : 'text-white/40 hover:text-white/70 border-transparent'"
          class="px-3 py-1 rounded-lg text-xs transition-colors border"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <svg class="w-6 h-6 text-white/30 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <!-- Error -->
    <div v-else-if="errorMsg" class="flex-1 flex items-center justify-center">
      <span class="text-white/30 text-sm">{{ errorMsg }}</span>
    </div>

    <!-- Chart -->
    <div v-else class="flex-1 min-h-0">
      <Line :data="chartData" :options="chartOptions" />
    </div>

    <!-- Price info -->
    <div v-if="prices.length" class="mt-3 flex items-center gap-4 text-xs">
      <span class="text-white/70">
        Текущая: <span class="text-white font-medium">${{ currentPrice }}</span>
      </span>
      <span :class="priceChange >= 0 ? 'text-green-400' : 'text-red-400'">
        {{ priceChange >= 0 ? '+' : '' }}{{ priceChange.toFixed(2) }}%
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler)

const props = defineProps<{ symbol: string }>()

const periods = [
  { label: '24h', days: 1 },
  { label: '7D', days: 7 },
  { label: '30D', days: 30 },
  { label: '1Y', days: 365 },
]

const selectedDays = ref(7)
const prices = ref<{ time: number; price: number }[]>([])
const loading = ref(false)
const errorMsg = ref('')

const currentPrice = computed(() => {
  if (!prices.value.length) return '0'
  return prices.value[prices.value.length - 1].price.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
})

const priceChange = computed(() => {
  if (prices.value.length < 2) return 0
  const first = prices.value[0].price
  const last = prices.value[prices.value.length - 1].price
  return ((last - first) / first) * 100
})

const chartData = computed(() => {
  const isUp = priceChange.value >= 0
  return {
    labels: prices.value.map(p => {
      const d = new Date(p.time)
      return selectedDays.value <= 1
        ? d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })
        : d.toLocaleDateString('ru', { day: 'numeric', month: 'short' })
    }),
    datasets: [{
      data: prices.value.map(p => p.price),
      borderColor: isUp ? '#4ade80' : '#f87171',
      backgroundColor: isUp ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
      tension: 0.3,
      fill: true,
    }],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: { intersect: false, mode: 'index' as const },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      titleColor: 'rgba(255,255,255,0.5)',
      bodyColor: '#fff',
      padding: 10,
      displayColors: false,
      callbacks: {
        label: (ctx: any) => `$${ctx.parsed.y.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      },
    },
  },
  scales: {
    x: {
      display: true,
      grid: { color: 'rgba(255,255,255,0.03)' },
      ticks: { color: 'rgba(255,255,255,0.25)', maxTicksLimit: 6, font: { size: 10 } },
    },
    y: {
      display: true,
      grid: { color: 'rgba(255,255,255,0.03)' },
      ticks: {
        color: 'rgba(255,255,255,0.25)',
        font: { size: 10 },
        callback: (v: any) => `$${Number(v).toLocaleString()}`,
      },
    },
  },
}

const fetchChart = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await $fetch<{ prices: { time: number; price: number }[] }>('/api/chart', {
      method: 'POST',
      body: { symbol: props.symbol, days: selectedDays.value },
    })
    prices.value = data.prices
  } catch {
    errorMsg.value = `Нет данных для ${props.symbol}`
    prices.value = []
  } finally {
    loading.value = false
  }
}

watch(() => props.symbol, () => fetchChart())
watch(selectedDays, () => fetchChart())

onMounted(() => fetchChart())
</script>
