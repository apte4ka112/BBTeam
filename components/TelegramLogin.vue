<template>
  <div ref="widgetContainer" class="telegram-login-widget">
    <div v-if="loading" class="text-gray-400">Загрузка...</div>
    <div v-if="error" class="text-red-500 text-sm">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, onUnmounted } from 'vue'
import type { TelegramUser } from '~/composables/useAuth'

const props = defineProps<{
  botUsername?: string
}>();

const emit = defineEmits<{
  (e: 'auth', user: TelegramUser): void
  (e: 'error', error: string): void
}>();

const widgetContainer = ref<HTMLDivElement>()
const loading = ref(true)
const error = ref('')
const scriptLoaded = ref(false)

const loadTelegramWidget = () => {
  const config = useRuntimeConfig()
  const botUsername = props.botUsername || config.public.telegramBotUsername

  if (!botUsername) {
    error.value = 'Не указан telegram_bot_username в настройках'
    loading.value = false
    return
  }

  // Create script element
  const script = document.createElement('script')
  script.async = true
  script.src = 'https://telegram.org/js/telegram-widget.js?22'
  script.setAttribute('data-telegram-login', botUsername)
  script.setAttribute('data-size', 'large')
  script.setAttribute('data-radius', '8')
  script.setAttribute('data-userpic', 'true') // Show user avatar
  script.setAttribute('data-onauth', 'onTelegramAuth(user)')
  script.setAttribute('data-request-access', 'write')

  // Global callback function
  ;(window as any).onTelegramAuth = (user: TelegramUser) => {
    emit('auth', user)
  }

  script.onload = () => {
    loading.value = false
    scriptLoaded.value = true
  }

  script.onerror = () => {
    loading.value = false
    error.value = 'Не удалось загрузить виджет Telegram'
    emit('error', error.value)
  }

  if (widgetContainer.value) {
    widgetContainer.value.appendChild(script)
  }
}

onMounted(() => {
  loadTelegramWidget()
})

onUnmounted(() => {
  // Clean up global callback
  delete (window as any).onTelegramAuth
})
</script>

<style scoped>
.telegram-login-widget {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 40px;
}

/* Hide default telegram button styles if needed */
:deep(#telegram-login-widget-BBTeamBot) {
  border-radius: 8px;
}
</style>
