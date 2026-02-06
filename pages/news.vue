<template>
  <div class="min-h-screen bg-slate-950">
    <!-- Header -->
    <header class="border-b border-white/10 backdrop-blur-sm bg-slate-950/80 sticky top-0 z-20">
      <div class="max-w-[1200px] mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <NuxtLink to="/" class="flex items-center gap-2">
            <div class="w-9 h-9 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <span class="text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">BBTeam</span>
          </NuxtLink>
          <div class="h-6 w-px bg-white/10"></div>
          <h1 class="text-white/80 font-medium text-sm">Новости</h1>
        </div>

        <NuxtLink
          to="/portfolio"
          class="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 hover:text-white transition-all text-sm flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
          </svg>
          <span class="hidden sm:inline">Портфель</span>
        </NuxtLink>
      </div>
    </header>

    <!-- Initial loading -->
    <div v-if="initialLoading" class="flex items-center justify-center py-32">
      <div class="text-center">
        <svg class="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-white/40 text-sm">Загрузка новостей...</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="errorMsg && !news.length" class="flex items-center justify-center py-32">
      <div class="text-center">
        <div class="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <p class="text-white/40 text-sm mb-4">{{ errorMsg }}</p>
        <button
          @click="loadInitial"
          class="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/70 hover:text-white transition-all text-sm"
        >
          Попробовать снова
        </button>
      </div>
    </div>

    <!-- News feed -->
    <div v-else class="max-w-[1200px] mx-auto px-4 py-6">
      <!-- Dzen-style mixed card grid -->
      <div class="space-y-4">
        <template v-for="(group, gi) in cardGroups" :key="gi">

          <!-- Hero card: full width, large image -->
          <template v-if="group.type === 'hero'">
            <a
              :href="group.items[0].url"
              target="_blank"
              rel="noopener"
              class="block group rounded-2xl overflow-hidden bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-all"
            >
              <div class="relative aspect-[2.2/1] bg-white/5 overflow-hidden">
                <img
                  v-if="group.items[0].image"
                  :src="group.items[0].image"
                  :alt="group.items[0].title"
                  class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  loading="eager"
                  @error="($event.target as HTMLImageElement).style.display = 'none'"
                />
                <!-- Gradient overlay -->
                <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent"></div>
                <!-- Content over image -->
                <div class="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                  <div v-if="group.items[0].categories?.length" class="flex gap-2 mb-3">
                    <span
                      v-for="cat in group.items[0].categories"
                      :key="cat"
                      class="px-2.5 py-1 bg-white/10 backdrop-blur-sm text-white/70 text-[11px] font-medium rounded-lg"
                    >{{ cat }}</span>
                  </div>
                  <h2 class="text-white text-xl md:text-2xl font-bold leading-tight mb-3 line-clamp-2 group-hover:text-purple-300 transition-colors">
                    {{ group.items[0].title }}
                  </h2>
                  <p class="text-white/50 text-sm line-clamp-2 mb-4 max-w-2xl">{{ group.items[0].excerpt }}</p>
                  <div class="flex items-center gap-3">
                    <div class="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white/50 font-bold">
                      {{ group.items[0].source.charAt(0) }}
                    </div>
                    <span class="text-white/50 text-sm font-medium">{{ group.items[0].source }}</span>
                    <span class="text-white/20">·</span>
                    <span class="text-white/40 text-sm">{{ timeAgo(group.items[0].timestamp) }}</span>
                  </div>
                </div>
              </div>
            </a>
          </template>

          <!-- Two-column row -->
          <template v-else-if="group.type === 'duo'">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                v-for="item in group.items"
                :key="item.id"
                :href="item.url"
                target="_blank"
                rel="noopener"
                class="group rounded-2xl overflow-hidden bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-all flex flex-col"
              >
                <div class="relative aspect-[1.8/1] bg-white/5 overflow-hidden">
                  <img
                    v-if="item.image"
                    :src="item.image"
                    :alt="item.title"
                    class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    loading="lazy"
                    @error="($event.target as HTMLImageElement).style.display = 'none'"
                  />
                </div>
                <div class="p-5 flex-1 flex flex-col">
                  <div v-if="item.categories?.length" class="flex gap-1.5 mb-2.5">
                    <span
                      v-for="cat in item.categories"
                      :key="cat"
                      class="px-2 py-0.5 bg-white/5 text-white/40 text-[10px] font-medium rounded-md"
                    >{{ cat }}</span>
                  </div>
                  <h3 class="text-white/90 text-base font-semibold leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors mb-2">
                    {{ item.title }}
                  </h3>
                  <p class="text-white/40 text-xs line-clamp-2 mb-3">{{ item.excerpt }}</p>
                  <div class="mt-auto flex items-center gap-2.5">
                    <div class="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] text-white/50 font-bold">
                      {{ item.source.charAt(0) }}
                    </div>
                    <span class="text-white/40 text-xs">{{ item.source }}</span>
                    <span class="text-white/15">·</span>
                    <span class="text-white/30 text-xs">{{ timeAgo(item.timestamp) }}</span>
                  </div>
                </div>
              </a>
            </div>
          </template>

          <!-- Three-column compact row -->
          <template v-else-if="group.type === 'trio'">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <a
                v-for="item in group.items"
                :key="item.id"
                :href="item.url"
                target="_blank"
                rel="noopener"
                class="group rounded-2xl overflow-hidden bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-all flex flex-col"
              >
                <div class="relative aspect-[1.6/1] bg-white/5 overflow-hidden">
                  <img
                    v-if="item.image"
                    :src="item.image"
                    :alt="item.title"
                    class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    loading="lazy"
                    @error="($event.target as HTMLImageElement).style.display = 'none'"
                  />
                </div>
                <div class="p-4 flex-1 flex flex-col">
                  <h3 class="text-white/90 text-sm font-semibold leading-snug line-clamp-3 group-hover:text-purple-300 transition-colors mb-2.5">
                    {{ item.title }}
                  </h3>
                  <div class="mt-auto flex items-center gap-2">
                    <div class="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] text-white/50 font-bold shrink-0">
                      {{ item.source.charAt(0) }}
                    </div>
                    <span class="text-white/40 text-xs truncate">{{ item.source }}</span>
                    <span class="text-white/15">·</span>
                    <span class="text-white/30 text-xs shrink-0">{{ timeAgo(item.timestamp) }}</span>
                  </div>
                </div>
              </a>
            </div>
          </template>

          <!-- Horizontal compact card -->
          <template v-else-if="group.type === 'horizontal'">
            <a
              v-for="item in group.items"
              :key="item.id"
              :href="item.url"
              target="_blank"
              rel="noopener"
              class="group flex gap-4 rounded-2xl overflow-hidden bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-all p-4"
            >
              <div class="w-40 h-24 md:w-52 md:h-32 rounded-xl bg-white/5 overflow-hidden shrink-0">
                <img
                  v-if="item.image"
                  :src="item.image"
                  :alt="item.title"
                  class="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                  loading="lazy"
                  @error="($event.target as HTMLImageElement).style.display = 'none'"
                />
              </div>
              <div class="flex-1 flex flex-col min-w-0 py-1">
                <div v-if="item.categories?.length" class="flex gap-1.5 mb-2">
                  <span
                    v-for="cat in item.categories"
                    :key="cat"
                    class="px-2 py-0.5 bg-white/5 text-white/40 text-[10px] font-medium rounded-md"
                  >{{ cat }}</span>
                </div>
                <h3 class="text-white/90 text-sm md:text-base font-semibold leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors mb-2">
                  {{ item.title }}
                </h3>
                <p class="text-white/40 text-xs line-clamp-2 mb-2 hidden md:block">{{ item.excerpt }}</p>
                <div class="mt-auto flex items-center gap-2.5">
                  <div class="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] text-white/50 font-bold">
                    {{ item.source.charAt(0) }}
                  </div>
                  <span class="text-white/40 text-xs">{{ item.source }}</span>
                  <span class="text-white/15">·</span>
                  <span class="text-white/30 text-xs">{{ timeAgo(item.timestamp) }}</span>
                </div>
              </div>
            </a>
          </template>
        </template>
      </div>

      <!-- Infinite scroll sentinel -->
      <div ref="sentinelEl" class="py-8 flex justify-center">
        <div v-if="loadingMore" class="flex items-center gap-3">
          <svg class="w-5 h-5 text-purple-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-white/30 text-sm">Загрузка...</span>
        </div>
        <div v-else-if="!hasMore && news.length" class="text-white/20 text-sm">
          Все новости загружены
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Крипто Новости - BBTeam',
  meta: [
    { name: 'description', content: 'Последние новости из мира криптовалют. Bitcoin, Ethereum, TON, DeFi и другие события на рынке цифровых активов.' },
    { name: 'keywords', content: 'крипто новости, bitcoin, ethereum, ton, defi, блокчейн, крипторынок' },
    { property: 'og:title', content: 'Крипто Новости - BBTeam' },
    { property: 'og:description', content: 'Последние новости из мира криптовалют' },
  ]
})

interface NewsItem {
  id: string
  title: string
  url: string
  source: string
  image: string
  timestamp: number
  excerpt: string
  categories: string[]
}

interface CardGroup {
  type: 'hero' | 'duo' | 'trio' | 'horizontal'
  items: NewsItem[]
}

const news = ref<NewsItem[]>([])
const initialLoading = ref(false)
const loadingMore = ref(false)
const errorMsg = ref('')
const hasMore = ref(true)
const nextCursor = ref<number | null>(null)
const pageNum = ref(1)
const sentinelEl = ref<HTMLElement>()

// Build Dzen-style mixed layout groups from flat news array
const cardGroups = computed<CardGroup[]>(() => {
  const groups: CardGroup[] = []
  const items = news.value
  let i = 0

  while (i < items.length) {
    const groupIndex = groups.length
    const pattern = groupIndex % 4

    if (pattern === 0 && i < items.length) {
      // Hero: 1 full-width card
      groups.push({ type: 'hero', items: [items[i]] })
      i += 1
    } else if (pattern === 1) {
      // Duo: 2 medium cards
      const chunk = items.slice(i, i + 2)
      if (chunk.length) {
        groups.push({ type: 'duo', items: chunk })
        i += chunk.length
      }
    } else if (pattern === 2) {
      // Trio: 3 compact cards
      const chunk = items.slice(i, i + 3)
      if (chunk.length) {
        groups.push({ type: 'trio', items: chunk })
        i += chunk.length
      }
    } else {
      // Horizontal: 2 list-style cards
      const chunk = items.slice(i, i + 2)
      if (chunk.length) {
        for (const item of chunk) {
          groups.push({ type: 'horizontal', items: [item] })
        }
        i += chunk.length
      }
    }
  }

  return groups
})

const timeAgo = (ts: number) => {
  if (!ts) return ''
  const seconds = Math.floor((Date.now() - ts) / 1000)
  if (seconds < 60) return 'только что'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} мин`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ч`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} д`
  const weeks = Math.floor(days / 7)
  return `${weeks} нед`
}

const loadInitial = async () => {
  initialLoading.value = true
  errorMsg.value = ''
  news.value = []
  pageNum.value = 1
  nextCursor.value = null
  hasMore.value = true

  try {
    const data = await $fetch<{ news: NewsItem[]; nextCursor: number | null; hasMore: boolean }>('/api/news', {
      query: { limit: 20 },
    })
    news.value = data.news
    nextCursor.value = data.nextCursor
    hasMore.value = data.hasMore
  } catch {
    errorMsg.value = 'Не удалось загрузить новости'
  } finally {
    initialLoading.value = false
  }
}

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value || !nextCursor.value) return

  loadingMore.value = true
  pageNum.value++

  try {
    const data = await $fetch<{ news: NewsItem[]; nextCursor: number | null; hasMore: boolean }>('/api/news', {
      query: { page: pageNum.value, before: nextCursor.value, limit: 20 },
    })

    // Deduplicate by id
    const existingIds = new Set(news.value.map(n => n.id))
    const newItems = data.news.filter(n => !existingIds.has(n.id))

    news.value.push(...newItems)
    nextCursor.value = data.nextCursor
    hasMore.value = data.hasMore && newItems.length > 0
  } catch {
    // Silently fail for pagination, user can scroll again
    hasMore.value = false
  } finally {
    loadingMore.value = false
  }
}

// IntersectionObserver for infinite scroll
let observer: IntersectionObserver | null = null

onMounted(() => {
  loadInitial()

  observer = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && !loadingMore.value && hasMore.value) {
        loadMore()
      }
    },
    { rootMargin: '400px' }
  )

  if (sentinelEl.value) {
    observer.observe(sentinelEl.value)
  }
})

// Watch for sentinel element to appear (after initial load)
watch(sentinelEl, (el) => {
  if (el && observer) {
    observer.observe(el)
  }
})

onUnmounted(() => {
  observer?.disconnect()
})
</script>
