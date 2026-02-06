<template>
  <div class="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl flex flex-col h-full min-h-0">
    <!-- Header -->
    <div class="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center">
          <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
          </svg>
        </div>
        <h3 class="text-white font-semibold text-sm">AI Ассистент</h3>
      </div>
      <button
        v-if="messages.length"
        @click="clearHistory"
        class="p-1.5 text-white/30 hover:text-white/60 hover:bg-white/5 rounded-lg transition-colors"
        title="Очистить историю"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>
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
          v-if="msg.role === 'user'"
          class="max-w-[85%] rounded-xl px-3.5 py-2.5 text-white/80 text-sm border whitespace-pre-wrap bg-purple-500/20 border-purple-500/20"
        >{{ msg.content }}</div>
        <div
          v-else
          class="max-w-[85%] overflow-hidden rounded-xl px-3.5 py-2.5 text-white/80 text-sm border bg-white/5 border-white/5 chat-markdown"
          v-html="renderMarkdown(msg.content)"
        />
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
import { marked } from 'marked'
import type { PortfolioToken } from '~/composables/useWallet'

marked.setOptions({
  breaks: true,
  gfm: true,
})

function renderMarkdown(text: string): string {
  return marked.parse(text, { async: false }) as string
}

const props = defineProps<{
  tokens: PortfolioToken[]
  totalUsd: number
  address?: string
  walletType?: string
  moralisChain?: string
}>()

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  timestamp: number
  direction: 'send' | 'receive'
  status: string
}

// LocalStorage key for chat history
const STORAGE_KEY = computed(() => `chat_history_${props.address || 'default'}`)

// Load messages from localStorage
const savedMessages = ref<ChatMessage[]>([])
if (import.meta.client) {
  const stored = localStorage.getItem(STORAGE_KEY.value)
  if (stored) {
    try {
      savedMessages.value = JSON.parse(stored)
    } catch {
      savedMessages.value = []
    }
  }
}

const messages = ref<ChatMessage[]>(savedMessages.value)
const input = ref('')
const isThinking = ref(false)
const messagesEl = ref<HTMLElement>()
const transactions = ref<Transaction[]>([])

const hints = [
  'Сколько у меня всего в USD?',
  'Какой токен самый дорогой?',
  'Проанализируй мой портфель',
  'Покажи последние транзакции',
  'Дай рекомендации по диверсификации',
  'Какие риски у моего портфеля?',
]

// Save messages to localStorage
const saveMessages = () => {
  if (import.meta.client) {
    localStorage.setItem(STORAGE_KEY.value, JSON.stringify(messages.value))
  }
}

// Fetch transactions for context
const fetchTransactions = async () => {
  if (!props.address || !props.walletType) return

  try {
    const body: Record<string, string> = {
      address: props.address,
      type: props.walletType,
    }
    if (props.moralisChain) body.chain = props.moralisChain

    const data = await $fetch<{ transactions: Transaction[] }>('/api/transactions', {
      method: 'POST',
      body,
    })
    transactions.value = data.transactions.slice(0, 50) // Last 50 transactions
  } catch {
    transactions.value = []
  }
}

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
          tokens: props.tokens.map(t => ({
            symbol: t.symbol,
            name: t.name,
            balance: t.balance,
            usd: t.usd,
            percentage: props.totalUsd > 0 ? ((t.usd / props.totalUsd) * 100).toFixed(2) : '0',
          })),
          totalUsd: props.totalUsd,
          transactions: transactions.value.map(t => ({
            value: t.value,
            direction: t.direction,
            status: t.status,
            timestamp: t.timestamp,
            hash: t.hash,
            from: t.from,
            to: t.to,
          })),
          address: props.address,
          type: props.walletType,
        },
      },
    })

    messages.value.push({ role: 'assistant', content: data.message })
    saveMessages()
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

const clearHistory = () => {
  messages.value = []
  saveMessages()
}

const handleSubmit = () => {
  sendMessage(input.value)
}

// Fetch transactions on mount
onMounted(() => {
  fetchTransactions()
  scrollToBottom()
})

// Watch for address changes to fetch new transactions and load correct history
watch(() => props.address, () => {
  fetchTransactions()
  // Reload chat history for new address
  if (import.meta.client) {
    const stored = localStorage.getItem(STORAGE_KEY.value)
    messages.value = stored ? JSON.parse(stored) : []
    scrollToBottom()
  }
})
</script>

<style scoped>
.chat-markdown {
  overflow-wrap: break-word;
  word-break: break-word;
}
.chat-markdown :deep(p) {
  margin: 0.25em 0;
}
.chat-markdown :deep(p:first-child) {
  margin-top: 0;
}
.chat-markdown :deep(p:last-child) {
  margin-bottom: 0;
}
.chat-markdown :deep(strong) {
  color: rgba(255, 255, 255, 0.95);
  font-weight: 600;
}
.chat-markdown :deep(em) {
  font-style: italic;
}
.chat-markdown :deep(ul),
.chat-markdown :deep(ol) {
  margin: 0.25em 0;
  padding-left: 1.25em;
}
.chat-markdown :deep(li) {
  margin: 0.15em 0;
}
.chat-markdown :deep(blockquote) {
  border-left: 2px solid rgba(255, 255, 255, 0.2);
  padding-left: 0.75em;
  margin: 0.25em 0;
  color: rgba(255, 255, 255, 0.6);
}
.chat-markdown :deep(code) {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.1em 0.3em;
  border-radius: 4px;
  font-size: 0.9em;
}
.chat-markdown :deep(h1),
.chat-markdown :deep(h2),
.chat-markdown :deep(h3) {
  color: rgba(255, 255, 255, 0.95);
  font-weight: 600;
  margin: 0.4em 0 0.2em;
}
.chat-markdown :deep(h1) { font-size: 1.1em; }
.chat-markdown :deep(h2) { font-size: 1.05em; }
.chat-markdown :deep(h3) { font-size: 1em; }
</style>
