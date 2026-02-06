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
const { isConnected } = useWallet()

// Redirect to portfolio if already connected
if (isConnected.value) {
  navigateTo('/portfolio')
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
})

onUnmounted(() => {
  window.removeEventListener('resize', updateCenter)
  if (rafId !== null) cancelAnimationFrame(rafId)
})
</script>
