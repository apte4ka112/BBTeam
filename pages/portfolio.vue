<template>
  <div class="h-screen flex flex-col bg-slate-950 overflow-hidden">
    <!-- Header -->
    <header class="border-b border-white/10 backdrop-blur-sm bg-slate-950/80 shrink-0 z-20">
      <div class="px-6 py-3 flex items-center justify-between">
        <NuxtLink to="/" class="flex items-center gap-2">
          <div class="w-9 h-9 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <span class="text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">BBTeam</span>
        </NuxtLink>

        <div class="flex items-center gap-3">
          <NuxtLink
            to="/news"
            class="px-3 py-2 text-white/50 hover:text-white hover:bg-white/5 rounded-xl transition-all text-sm flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
            </svg>
            <span class="hidden sm:inline">Новости</span>
          </NuxtLink>

          <div class="flex items-center gap-3 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
            <div class="w-2 h-2 bg-green-400 rounded-full"></div>
            <span class="text-white font-medium text-sm">{{ formattedAddress }}</span>
            <span class="text-white/50 text-xs uppercase">{{ type }}</span>
          </div>
          <button
            @click="handleDisconnect"
            class="px-4 py-2 text-white/70 hover:text-white hover:bg-white/5 rounded-xl transition-all text-sm"
          >
            Disconnect
          </button>
        </div>
      </div>
    </header>

    <!-- Loading -->
    <div v-if="portfolioLoading && !portfolioTokens.length" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <svg class="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-white/40 text-sm">Загрузка портфеля...</p>
      </div>
    </div>

    <!-- Main dashboard grid -->
    <div v-else class="flex-1 grid grid-cols-1 lg:grid-cols-[260px_1fr_400px] gap-0 min-h-0 overflow-auto lg:overflow-hidden">

      <!-- LEFT: Token list -->
      <div class="border-r border-white/10 flex flex-col min-h-0">
        <!-- Total value -->
        <div class="p-4 border-b border-white/10 shrink-0">
          <p class="text-white/40 text-[10px] uppercase tracking-wider mb-0.5">Общая стоимость</p>
          <p class="text-2xl font-bold text-white">{{ formatUsd(totalUsdValue) }}</p>
        </div>

        <!-- Token list scrollable -->
        <div class="flex-1 overflow-y-auto p-3">
          <div v-if="!portfolioTokens.length" class="text-white/30 text-sm py-4 text-center">
            Токены не найдены
          </div>

          <div
            v-for="token in portfolioTokens"
            :key="token.symbol"
            @click="selectedToken = token.symbol"
            :class="selectedToken === token.symbol
              ? 'bg-purple-500/15 border-purple-500/30'
              : 'bg-transparent border-transparent hover:bg-white/5'"
            class="flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all border mb-1"
          >
            <img
              v-if="token.logo"
              :src="token.logo"
              :alt="token.symbol"
              class="w-8 h-8 rounded-full"
            />
            <div v-else class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/50 text-xs font-bold shrink-0">
              {{ token.symbol.slice(0, 2) }}
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-1">
                <span class="text-white font-medium text-sm">{{ token.symbol }}</span>
                <span v-if="token.native" class="text-[9px] text-orange-400/70 uppercase">native</span>
              </div>
              <div class="text-white/30 text-xs truncate">{{ token.name }}</div>
            </div>
            <div class="text-right shrink-0">
              <div class="text-white/70 text-sm">{{ formatUsd(token.usd) }}</div>
              <div class="text-white/30 text-xs">{{ token.balance }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- CENTER: Chart (55%) + Transactions (45%) -->
      <div class="flex flex-col min-h-0 border-r border-white/10">
        <!-- Chart -->
        <div class="h-[55%] p-4 pb-2 min-h-0">
          <ClientOnly>
            <MarketChart v-if="selectedToken" :symbol="selectedToken" />
            <template #fallback>
              <div class="bg-white/5 border border-white/10 rounded-2xl h-full flex items-center justify-center">
                <span class="text-white/30 text-sm">Загрузка графика...</span>
              </div>
            </template>
          </ClientOnly>
        </div>

        <!-- Transactions -->
        <div class="h-[45%] p-4 pt-2 min-h-0">
          <ClientOnly>
            <TransactionHistory
              v-if="address"
              :address="address"
              :wallet-type="type || 'EVM'"
              :chain="moralisChain"
              :token-symbol="selectedToken"
            />
            <template #fallback>
              <div class="bg-white/5 border border-white/10 rounded-2xl h-full flex items-center justify-center">
                <span class="text-white/30 text-sm">Загрузка транзакций...</span>
              </div>
            </template>
          </ClientOnly>
        </div>
      </div>

      <!-- RIGHT: AI Chat (100% height) -->
      <div class="flex flex-col min-h-0 p-4">
        <ClientOnly>
          <AiChat
            :tokens="portfolioTokens"
            :total-usd="totalUsdValue"
            :address="address"
            :wallet-type="type"
            :moralis-chain="moralisChain"
          />
          <template #fallback>
            <div class="bg-white/5 border border-white/10 rounded-2xl h-full flex items-center justify-center">
              <span class="text-white/30 text-sm">Загрузка чата...</span>
            </div>
          </template>
        </ClientOnly>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// SEO metadata
useHead({
  title: 'Портфель - BBTeam',
  meta: [
    { name: 'description', content: 'Отслеживайте свой криптопортфель в реальном времени. Графики, транзакции, AI-аналитика и новости.' },
    { property: 'og:title', content: 'Портфель - BBTeam' },
    { property: 'og:description', content: 'Отслеживайте свой криптопортфель в реальном времени' },
    { name: 'robots', content: 'noindex, nofollow' }, // Private dashboard
  ]
})

const {
  isConnected, address, type, moralisChain,
  portfolioTokens, totalUsdValue, portfolioLoading,
  disconnectWallet, fetchPortfolio,
} = useWallet()

// Guard: redirect to home if not connected
if (!isConnected.value) {
  navigateTo('/')
}

const selectedToken = ref('')

const formattedAddress = computed(() => {
  const addr = address.value
  if (!addr) return ''
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
})

const formatUsd = (value: number) => {
  if (value < 0.01 && value > 0) return '<$0.01'
  return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const handleDisconnect = () => {
  disconnectWallet()
  navigateTo('/')
}

// Select first token by default
watch(portfolioTokens, (tokens) => {
  if (tokens.length && !selectedToken.value) {
    selectedToken.value = tokens[0].symbol
  }
}, { immediate: true })

// Fetch portfolio on mount if tokens are empty (page refresh)
onMounted(() => {
  if (isConnected.value && !portfolioTokens.value.length) {
    fetchPortfolio()
  }
})
</script>
