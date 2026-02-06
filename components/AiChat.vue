<template>
  <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl flex flex-col h-full min-h-0">
    <!-- Header -->
    <div class="p-4 border-b border-white/10 flex items-center gap-2">
      <div class="w-7 h-7 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
        <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
        </svg>
      </div>
      <h3 class="text-white font-semibold text-sm">AI Assistant</h3>
    </div>

    <!-- Messages -->
    <div ref="messagesEl" class="flex-1 overflow-y-auto p-4 space-y-3">
      <!-- Empty state with hints -->
      <div v-if="!messages.length" class="space-y-2">
        <p class="text-white/30 text-xs mb-3">Спросите о вашем портфеле:</p>
        <button
          v-for="hint in hints"
          :key="hint"
          @click="sendMessage(hint)"
          class="block w-full text-left px-3 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 text-xs transition-colors border border-white/5 hover:border-white/10"
        >
          {{ hint }}
        </button>
      </div>

      <!-- Messages list -->
      <div
        v-for="(msg, i) in messages"
        :key="i"
        :class="msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'"
      >
        <div
          :class="msg.role === 'user'
            ? 'bg-purple-500/20 border-purple-500/20'
            : 'bg-white/5 border-white/5'"
          class="max-w-[85%] rounded-xl px-3.5 py-2.5 text-white/80 text-sm border whitespace-pre-wrap"
        >{{ msg.content }}</div>
      </div>

      <!-- Thinking indicator -->
      <div v-if="isThinking" class="flex justify-start">
        <div class="bg-white/5 border border-white/5 rounded-xl px-3.5 py-2.5 text-white/40 text-sm flex items-center gap-2">
          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Думаю...
        </div>
      </div>
    </div>

    <!-- Input -->
    <form @submit.prevent="handleSubmit" class="p-3 border-t border-white/10">
      <div class="flex gap-2">
        <input
          v-model="input"
          placeholder="Спросите о портфеле..."
          class="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-colors"
          :disabled="isThinking"
        />
        <button
          type="submit"
          :disabled="isThinking || !input.trim()"
          class="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-600 hover:to-cyan-600 text-white rounded-xl text-sm font-medium disabled:opacity-30 transition-all"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
          </svg>
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import type { PortfolioToken } from '~/composables/useWallet'

const props = defineProps<{
  tokens: PortfolioToken[]
  totalUsd: number
}>()

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

const messages = ref<ChatMessage[]>([])
const input = ref('')
const isThinking = ref(false)
const messagesEl = ref<HTMLElement>()

const hints = [
  'Сколько у меня всего в USD?',
  'Какой токен самый дорогой?',
  'Проанализируй мой портфель',
  'Дай рекомендации по портфелю',
]

const scrollToBottom = () => {
  nextTick(() => {
    if (messagesEl.value) {
      messagesEl.value.scrollTop = messagesEl.value.scrollHeight
    }
  })
}

const sendMessage = async (text: string) => {
  const content = text.trim()
  if (!content || isThinking.value) return

  messages.value.push({ role: 'user', content })
  input.value = ''
  isThinking.value = true
  scrollToBottom()

  try {
    const chatMessages = messages.value.map(m => ({ role: m.role, content: m.content }))

    const data = await $fetch<{ message: string }>('/api/chat', {
      method: 'POST',
      body: {
        messages: chatMessages,
        context: {
          tokens: props.tokens.map(t => ({ symbol: t.symbol, balance: t.balance, usd: t.usd })),
          totalUsd: props.totalUsd,
        },
      },
    })

    messages.value.push({ role: 'assistant', content: data.message })
  } catch (err: any) {
    const detail = err?.data?.statusMessage || err?.message || 'Unknown error'
    messages.value.push({
      role: 'assistant',
      content: `Ошибка AI: ${detail}`,
    })
  } finally {
    isThinking.value = false
    scrollToBottom()
  }
}

const handleSubmit = () => {
  sendMessage(input.value)
}
</script>
