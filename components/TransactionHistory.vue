<template>
  <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl flex flex-col h-full min-h-0">
    <!-- Header -->
    <div class="p-4 border-b border-white/10 flex items-center gap-2 shrink-0">
      <div class="w-7 h-7 bg-gradient-to-br from-orange-500 to-yellow-500 rounded-lg flex items-center justify-center">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
        </svg>
      </div>
      <h3 class="text-white font-semibold text-sm">Транзакции</h3>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex-1 flex items-center justify-center">
      <svg class="w-6 h-6 text-white/30 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>

    <!-- Error -->
    <div v-else-if="errorMsg" class="flex-1 flex items-center justify-center px-4">
      <span class="text-white/30 text-sm text-center">{{ errorMsg }}</span>
    </div>

    <!-- Empty -->
    <div v-else-if="!filteredTransactions.length" class="flex-1 flex items-center justify-center">
      <span class="text-white/30 text-sm">
        {{ transactions.length ? `Нет транзакций для ${props.tokenSymbol || 'выбранного токена'}` : 'Транзакции не найдены' }}
      </span>
    </div>

    <!-- Transactions list -->
    <div v-else class="flex-1 overflow-y-auto p-3 space-y-1">
      <a
        v-for="tx in filteredTransactions"
        :key="tx.hash"
        :href="tx.explorerUrl"
        target="_blank"
        rel="noopener"
        class="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group"
      >
        <!-- Direction icon -->
        <div
          :class="tx.direction === 'receive'
            ? 'bg-green-500/15 text-green-400'
            : 'bg-red-500/15 text-red-400'"
          class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        >
          <svg v-if="tx.direction === 'receive'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
          </svg>
          <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
          </svg>
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="text-white/80 text-sm font-medium">{{ tx.value }}</span>
            <span
              v-if="tx.status === 'failed'"
              class="text-[9px] text-red-400 uppercase bg-red-400/10 px-1.5 py-0.5 rounded"
            >failed</span>
          </div>
          <div class="text-white/30 text-xs truncate">
            {{ tx.direction === 'send' ? 'To' : 'From' }}: {{ shortAddr(tx.direction === 'send' ? tx.to : tx.from) }}
          </div>
        </div>

        <!-- Time + link icon -->
        <div class="text-right shrink-0 flex items-center gap-1.5">
          <span class="text-white/30 text-xs">{{ timeAgo(tx.timestamp) }}</span>
          <svg class="w-3 h-3 text-white/20 group-hover:text-white/50 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
        </div>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  address: string
  walletType: string
  chain?: string
  tokenSymbol?: string  // Selected token to filter by
}>()

interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  timestamp: number
  direction: 'send' | 'receive'
  status: string
  explorerUrl: string
}

const transactions = ref<Transaction[]>([])
const loading = ref(false)
const errorMsg = ref('')

// Filter transactions by selected token symbol
const filteredTransactions = computed(() => {
  if (!props.tokenSymbol) {
    return transactions.value
  }

  const symbol = props.tokenSymbol.toUpperCase()
  return transactions.value.filter(tx => {
    // Extract symbol from value string (e.g., "0.1234 ETH" -> "ETH")
    const parts = tx.value.split(' ')
    const txSymbol = parts[parts.length - 1]?.toUpperCase()
    return txSymbol === symbol
  })
})

const shortAddr = (addr: string) => {
  if (!addr || addr.length < 10) return addr || '—'
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

const timeAgo = (ts: number) => {
  if (!ts) return ''
  const seconds = Math.floor((Date.now() - ts) / 1000)
  if (seconds < 60) return 'только что'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}м`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}ч`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}д`
  const months = Math.floor(days / 30)
  return `${months}мес`
}

const fetchTransactions = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const body: Record<string, string> = {
      address: props.address,
      type: props.walletType,
    }
    if (props.chain) body.chain = props.chain

    const data = await $fetch<{ transactions: Transaction[] }>('/api/transactions', {
      method: 'POST',
      body,
    })
    transactions.value = data.transactions
  } catch {
    errorMsg.value = 'Не удалось загрузить транзакции'
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchTransactions())

watch(() => props.address, () => fetchTransactions())
</script>
