<template>
  <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl flex flex-col h-full min-h-0">
    <!-- Header -->
    <div class="p-4 border-b border-white/10 flex items-center gap-2 shrink-0">
      <div class="w-7 h-7 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/>
        </svg>
      </div>
      <h3 class="text-white font-semibold text-sm">Крипто Новости</h3>
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

    <!-- News list -->
    <div v-else class="flex-1 overflow-y-auto p-3 space-y-2">
      <a
        v-for="item in news"
        :key="item.id"
        :href="item.url"
        target="_blank"
        rel="noopener"
        class="flex gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-colors group"
      >
        <!-- Thumbnail -->
        <img
          v-if="item.image"
          :src="item.image"
          :alt="item.title"
          class="w-16 h-16 rounded-lg object-cover shrink-0 bg-white/5"
          loading="lazy"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />
        <div v-else class="w-16 h-16 rounded-lg bg-white/5 shrink-0 flex items-center justify-center">
          <svg class="w-6 h-6 text-white/15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2"/>
          </svg>
        </div>

        <!-- Content -->
        <div class="flex-1 min-w-0">
          <h4 class="text-white/80 text-xs font-medium line-clamp-2 leading-snug group-hover:text-white transition-colors">{{ item.title }}</h4>
          <div class="flex items-center gap-2 mt-1.5">
            <span class="text-white/30 text-[10px]">{{ item.source }}</span>
            <span class="text-white/15">·</span>
            <span class="text-white/30 text-[10px]">{{ timeAgo(item.timestamp) }}</span>
          </div>
        </div>
      </a>
    </div>
  </div>
</template>

<script setup lang="ts">
interface NewsItem {
  id: string
  title: string
  url: string
  source: string
  image: string
  timestamp: number
  excerpt: string
}

const news = ref<NewsItem[]>([])
const loading = ref(false)
const errorMsg = ref('')

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

const fetchNews = async () => {
  loading.value = true
  errorMsg.value = ''
  try {
    const data = await $fetch<{ news: NewsItem[] }>('/api/news')
    news.value = data.news
  } catch {
    errorMsg.value = 'Не удалось загрузить новости'
  } finally {
    loading.value = false
  }
}

onMounted(() => fetchNews())
</script>
