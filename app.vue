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

          <div v-if="isAuthenticated" class="flex items-center gap-4">
            <div class="flex items-center gap-3 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
              <div v-if="user?.photo_url" class="w-8 h-8 rounded-full overflow-hidden">
                <img :src="user.photo_url" :alt="user.first_name" class="w-full h-full object-cover" />
              </div>
              <div v-else class="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center text-white text-sm font-semibold">
                {{ user?.first_name?.[0] || '?' }}
              </div>
              <span class="text-white/90 text-sm hidden sm:block">{{ user?.first_name }}</span>
            </div>
            <button @click="logout" class="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors">
              Выйти
            </button>
          </div>
        </div>
      </header>

      <!-- Hero Section -->
      <section class="container mx-auto px-6 py-20 text-center">
        <div class="max-w-4xl mx-auto">
          <div class="inline-flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10 mb-6">
            <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <span class="text-white/70 text-sm">Powered by AI & Web3</span>
          </div>

          <h1 class="text-5xl md:text-7xl font-bold text-white mb-6">
            Будущее
            <span class="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent animate-gradient-text"> цифровых активов</span>
          </h1>

          <p class="text-xl text-white/60 mb-10 max-w-2xl mx-auto">
            Инновационная платформа следующего поколения для работы с криптоактивами на базе искусственного интеллекта
          </p>

          <div v-if="!isAuthenticated" class="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <ClientOnly>
              <TelegramLogin @auth="handleTelegramAuth" />
            </ClientOnly>
            <p class="text-white/40 text-sm mt-4 sm:mt-0">Быстрая и безопасная авторизация</p>
          </div>

          <div v-else class="flex flex-col sm:flex-row gap-4 justify-center">
            <div class="px-8 py-4 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-2xl text-white font-semibold shadow-lg shadow-purple-500/25">
              🎉 Добро пожаловать, {{ user?.first_name }}!
            </div>
          </div>
        </div>
      </section>

      <!-- Features Grid -->
      <section class="container mx-auto px-6 py-20">
        <div class="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <FeatureCard
            icon="🤖"
            title="AI Аналитика"
            description="Умные алгоритмы анализируют рынки и находят лучшие возможности"
          />
          <FeatureCard
            icon="🔗"
            title="Web3 Интеграция"
            description="Полная децентрализация и безопасность на базе blockchain технологий"
          />
          <FeatureCard
            icon="⚡"
            title="Мгновенные сделки"
            description="Высокая скорость транзакций с минимальными комиссиями"
          />
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

      <!-- CTA Section -->
      <section class="container mx-auto px-6 py-20">
        <div class="max-w-3xl mx-auto text-center">
          <div class="relative p-1 rounded-3xl overflow-hidden">
            <div class="animated-border"></div>
            <div class="bg-slate-950 rounded-3xl p-10 md:p-14 relative">
              <h2 class="text-3xl md:text-4xl font-bold text-white mb-4">
                Готовы начать?
              </h2>
              <p class="text-white/60 mb-8 max-w-xl mx-auto">
                Присоединяйтесь к тысячам пользователей, которые уже используют возможности AI и Web3
              </p>
              <div v-if="!isAuthenticated" class="flex flex-col sm:flex-row gap-4 justify-center">
                <ClientOnly>
                  <TelegramLogin @auth="handleTelegramAuth" />
                </ClientOnly>
              </div>
              <div v-else class="text-white/60">
                Вы уже вошли в систему! 🔓
              </div>
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
              <span class="text-white/50 text-sm">© 2025 BBTeam</span>
            </div>
            <div class="flex items-center gap-6">
              <a href="#" class="text-white/40 hover:text-white/70 transition-colors text-sm">Twitter</a>
              <a href="#" class="text-white/40 hover:text-white/70 transition-colors text-sm">Discord</a>
              <a href="#" class="text-white/40 hover:text-white/70 transition-colors text-sm">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TelegramUser } from './composables/useAuth'

const { login, logout, isAuthenticated, user } = useAuth()

// Используем ref для позиции blob (смещение от центра экрана)
const blobPosition = ref({ x: 0, y: 0 })

// Центр экрана
const centerX = ref(0)
const centerY = ref(0)

// Инициализация центра экрана
const updateCenter = () => {
  centerX.value = window.innerWidth / 2
  centerY.value = window.innerHeight / 2
}

// Обработка движения мыши с оптимизацией
let rafId: number | null = null
const handleMouseMove = (e: MouseEvent) => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
  }

  rafId = requestAnimationFrame(() => {
    // Вычисляем смещение от центра
    blobPosition.value = {
      x: e.clientX - centerX.value,
      y: e.clientY - centerY.value
    }
    rafId = null
  })
}

// Обработка touch событий
const handleTouchMove = (e: TouchEvent) => {
  if (e.touches.length > 0) {
    const touch = e.touches[0]
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
    }

    rafId = requestAnimationFrame(() => {
      blobPosition.value = {
        x: touch.clientX - centerX.value,
        y: touch.clientY - centerY.value
      }
      rafId = null
    })
  }
}

onMounted(() => {
  updateCenter()
  window.addEventListener('resize', updateCenter)

  // Устанавливаем начальную позицию в центре
  blobPosition.value = { x: 0, y: 0 }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateCenter)
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
  }
})

const handleTelegramAuth = async (userData: TelegramUser) => {
  await login(userData)
}
</script>

<style>
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes gradientText {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.gradient-blob {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(6, 182, 212, 0.1) 30%, rgba(139, 92, 246, 0.05) 50%, transparent 70%);
  border-radius: 50%;
  margin-left: -400px;
  margin-top: -400px;
  pointer-events: none;
  filter: blur(60px);
  z-index: 0;
  will-change: transform;
}

.animated-border {
  position: absolute;
  inset: 0;
  background: linear-gradient(60deg, #a855f7, #ec4899, #06b6d4, #a855f7);
  background-size: 300% 300%;
  animation: gradientShift 4s ease infinite;
  border-radius: 1.5rem;
}

.animate-gradient-text {
  background-size: 200% 200%;
  animation: gradientText 5s ease infinite;
}

.animate-pulse {
  animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.delay-1000 {
  animation-delay: 1s;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
}

::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.5);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.7);
}
</style>
