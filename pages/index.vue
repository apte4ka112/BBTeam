<template>
  <div
    class="min-h-screen relative overflow-hidden bg-slate-950"
    @mousemove="handleMouseMove"
    @touchmove="handleTouchMove"
  >
    <!-- Animated gradient background from cursor -->
    <div
      class="gradient-blob"
      :style="{ transform: `translate(${blobPosition.x}px, ${blobPosition.y}px)` }"
    ></div>

    <!-- Secondary gradient blobs -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div class="absolute top-1/3 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
    </div>

    <div class="relative z-10">
      <!-- Header -->
      <header class="border-b border-white/10 backdrop-blur-sm">
        <div class="container mx-auto px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <span class="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">BBTeam</span>
          </div>

          <div class="flex items-center gap-4">
            <NuxtLink
              to="/news"
              class="px-4 py-2 text-white/60 hover:text-white hover:bg-white/5 rounded-xl transition-all text-sm flex items-center gap-2"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
              </svg>
              <span class="hidden sm:inline">Новости</span>
            </NuxtLink>
            <WalletModal />
          </div>
        </div>
      </header>

      <!-- Hero Section -->
      <section class="container mx-auto px-6 py-20 text-center">
        <div class="max-w-4xl mx-auto">
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 mb-6">
            <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span class="text-white/70 text-sm">Powered by Web3</span>
          </div>

          <h1 class="text-5xl md:text-7xl font-bold text-white mb-6">
            Будущее
            <span class="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-text"> цифровых активов</span>
          </h1>

          <p class="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
            Подключите кошелёк, отслеживайте портфель и получайте AI-аналитику по вашим криптоактивам
          </p>
        </div>
      </section>

      <!-- Features Grid -->
      <section class="container mx-auto px-6 py-20">
        <div class="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <FeatureCard
            icon="🤖"
            title="AI Аналитика"
            description="AI-чат анализирует ваш портфель и отвечает на вопросы о ваших активах"
          />
          <FeatureCard
            icon="🔗"
            title="Мультисеть"
            description="Поддержка EVM (Ethereum, Polygon, BSC), Bitcoin и TON в одном интерфейсе"
          />
          <FeatureCard
            icon="📊"
            title="Графики в реальном времени"
            description="Интерактивные графики цен для каждого токена из вашего портфеля"
          />
        </div>
      </section>

      <!-- News Widget Section -->
      <section class="container mx-auto px-6 py-20">
        <div class="max-w-5xl mx-auto">
          <div class="flex items-center justify-between mb-8">
            <div>
              <h2 class="text-3xl font-bold text-white mb-2">Крипто Новости</h2>
              <p class="text-white/50">Последние события из мира криптовалют</p>
            </div>
            <NuxtLink
              to="/news"
              class="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 hover:text-white transition-all text-sm"
            >
              Все новости
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </NuxtLink>
          </div>

          <!-- News Grid / Loading / Empty -->
          <div v-if="newsLoading" class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <!-- Skeleton cards -->
            <div
              v-for="i in 6"
              :key="`skeleton-${i}`"
              class="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
            >
              <div class="aspect-video bg-white/5 animate-pulse"></div>
              <div class="p-4 space-y-2">
                <div class="h-4 bg-white/10 rounded animate-pulse"></div>
                <div class="h-3 bg-white/5 rounded w-2/3 animate-pulse"></div>
              </div>
            </div>
          </div>

          <div v-else-if="!homeNews.length" class="text-center py-12">
            <div class="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
              </svg>
            </div>
            <p class="text-white/30 text-sm">Новости временно недоступны</p>
          </div>

          <div v-else class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <a
              v-for="item in homeNews"
              :key="item.id"
              :href="item.url"
              target="_blank"
              rel="noopener"
              class="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl overflow-hidden transition-all flex flex-col"
            >
              <div class="relative aspect-video bg-white/5">
                <img
                  v-if="item.image"
                  :src="item.image"
                  :alt="item.title"
                  class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  @error="($event.target as HTMLImageElement).style.display = 'none'"
                />
                <div v-else class="w-full h-full flex items-center justify-center">
                  <svg class="w-12 h-12 text-white/10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
                  </svg>
                </div>
              </div>
              <div class="p-4 flex-1 flex flex-col">
                <h3 class="text-white/90 text-sm font-medium line-clamp-2 leading-snug group-hover:text-white transition-colors mb-2">
                  {{ item.title }}
                </h3>
                <div class="mt-auto flex items-center justify-between">
                  <span class="text-white/30 text-xs">{{ item.source }}</span>
                  <span class="text-white/30 text-xs">{{ timeAgo(item.timestamp) }}</span>
                </div>
              </div>
            </a>
          </div>

          <div class="mt-6 text-center sm:hidden">
            <NuxtLink
              to="/news"
              class="inline-flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 hover:text-white transition-all text-sm"
            >
              Все новости
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </NuxtLink>
          </div>
        </div>
      </section>

      <!-- Stats Section -->
      <section class="container mx-auto px-6 py-20">
        <div class="max-w-4xl mx-auto">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div class="text-center">
              <div class="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">50K+</div>
              <div class="text-white/50 text-sm">Пользователей</div>
            </div>
            <div class="text-center">
              <div class="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">$100M+</div>
              <div class="text-white/50 text-sm">Объем торгов</div>
            </div>
            <div class="text-center">
              <div class="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">99.9%</div>
              <div class="text-white/50 text-sm">Uptime</div>
            </div>
            <div class="text-center">
              <div class="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent mb-2">24/7</div>
              <div class="text-white/50 text-sm">Поддержка</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="border-t border-white/10">
        <div class="container mx-auto px-6 py-8">
          <div class="flex flex-col md:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <span class="text-white/50 text-sm">&copy; 2025 BBTeam</span>
            </div>
            <div class="flex items-center gap-4 text-sm">
              <NuxtLink to="/privacy" class="text-white/40 hover:text-white/70 transition-colors">Политика конфиденциальности</NuxtLink>
              <NuxtLink to="/terms" class="text-white/40 hover:text-white/70 transition-colors">Пользовательское соглашение</NuxtLink>
            </div>
            <a
              href="https://t.me/extTeam_hub"
              target="_blank"
              rel="noopener"
              class="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 hover:text-white transition-all text-sm"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-4.997 3.905.823 1.21 1.498 3.273 2.816 6.242 3.595 1.111.269 1.616.203 2.296-.066.738-.293 4.243-2.224 5.137-2.816 1.005-.665 1.462-.321 1.535.625.068.878-.424 4.882-.895 6.832-.31 1.287-.935 1.438-1.555 1.438z"/>
              </svg>
              <span>@extTeam_hub</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
// SEO metadata
useHead({
  title: 'BBTeam - Крипто Портфель и AI Аналитика | Управление активами',
  meta: [
    { name: 'description', content: 'Подключите кошелёк и управляйте криптопортфелем с AI-аналитикой от GigaChat. Поддержка Ethereum, Bitcoin, TON. Графики, транзакции и умные рекомендации.' },
    { name: 'keywords', content: 'крипто кошелек, портфель, ethereum, bitcoin, ton, web3, defi, ai аналитика, gigaChat' },
    { property: 'og:title', content: 'BBTeam - Крипто Портфель и AI Аналитика' },
    { property: 'og:description', content: 'Подключите кошелёк и управляйте криптопортфелем с AI-аналитикой от GigaChat' },
    { property: 'og:type', content: 'website' },
    { name: 'twitter:title', content: 'BBTeam - Крипто Портфель и AI Аналитика' },
    { name: 'twitter:description', content: 'Подключите кошелёк и управляйте криптопортфелем с AI-аналитикой от GigaChat' },
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'BBTeam',
        description: 'Управляйте криптопортфелем с AI-аналитикой от GigaChat',
        url: 'https://bbteam.ru',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD'
        },
        featureList: [
          'AI-аналитика портфеля',
          'Поддержка Ethereum, Bitcoin, TON',
          'Интерактивные графики',
          'История транзакций',
          'Крипто новости'
        ]
      })
    }
  ]
})

const { isConnected } = useWallet()

// Redirect to portfolio if already connected
if (isConnected.value) {
  navigateTo('/portfolio')
}

// News for homepage widget
interface NewsItem {
  id: string
  title: string
  url: string
  source: string
  image: string
  timestamp: number
  excerpt: string
}

const homeNews = ref<NewsItem[]>([])
const newsLoading = ref(true)

const timeAgo = (ts: number) => {
  if (!ts) return ''
  const seconds = Math.floor((Date.now() - ts) / 1000)
  if (seconds < 60) return 'только что'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}м назад`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}ч назад`
  const days = Math.floor(hours / 24)
  return `${days}д назад`
}

const fetchHomeNews = async () => {
  newsLoading.value = true
  try {
    const data = await $fetch<{ news: NewsItem[] }>('/api/news')
    // Show only first 6 news on homepage
    homeNews.value = data.news.slice(0, 6)
  } catch {
    homeNews.value = []
  } finally {
    newsLoading.value = false
  }
}

// Animated gradient blob
const blobPosition = ref({ x: 0, y: 0 })
const centerX = ref(0)
const centerY = ref(0)

const updateCenter = () => {
  centerX.value = window.innerWidth / 2
  centerY.value = window.innerHeight / 2
}

let rafId: number | null = null
const handleMouseMove = (e: MouseEvent) => {
  if (rafId !== null) cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(() => {
    blobPosition.value = { x: e.clientX - centerX.value, y: e.clientY - centerY.value }
    rafId = null
  })
}

const handleTouchMove = (e: TouchEvent) => {
  if (e.touches.length > 0) {
    const touch = e.touches[0]
    if (rafId !== null) cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(() => {
      blobPosition.value = { x: touch.clientX - centerX.value, y: touch.clientY - centerY.value }
      rafId = null
    })
  }
}

onMounted(() => {
  updateCenter()
  window.addEventListener('resize', updateCenter)
  fetchHomeNews()
})

onUnmounted(() => {
  window.removeEventListener('resize', updateCenter)
  if (rafId !== null) cancelAnimationFrame(rafId)
})
</script>
