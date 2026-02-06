<template>
  <div>
    <!-- Trigger button -->
    <button
      @click="showModal = true"
      class="px-6 py-3 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 transition-all duration-300 flex items-center gap-2"
    >
      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
      </svg>
      <span>Connect Wallet</span>
    </button>

    <!-- Modal -->
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="showModal"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="closeModal"></div>

          <div class="relative w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-lg font-semibold text-white">Connect Wallet</h2>
              <button @click="closeModal" class="text-white/40 hover:text-white transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Network selector -->
            <label class="block text-white/50 text-xs uppercase tracking-wider mb-2">Сеть</label>
            <select
              v-model="selectedType"
              class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-orange-500/50 transition-colors text-sm appearance-none cursor-pointer mb-5"
            >
              <option value="EVM">Moralis (EVM)</option>
              <option value="BTC">Bitcoin (BTC)</option>
              <option value="TON">TON / Telegram Wallet</option>
            </select>

            <!-- EVM: connect via browser wallet -->
            <div v-if="selectedType === 'EVM'">
              <p class="text-white/40 text-xs mb-4">Подключитесь через MetaMask или другой браузерный кошелёк</p>
              <button
                @click="handleConnectEVM"
                :disabled="isConnecting || loading"
                class="w-full flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-500/50 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div class="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl flex items-center justify-center shrink-0">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9"/>
                  </svg>
                </div>
                <div class="text-left">
                  <div class="text-white font-medium">
                    {{ isConnecting ? 'Подключение...' : loading ? 'Загрузка портфеля...' : 'Browser Wallet' }}
                  </div>
                  <div class="text-white/40 text-xs">MetaMask, Coinbase, Brave...</div>
                </div>
                <svg v-if="isConnecting || loading" class="w-5 h-5 text-white/50 animate-spin ml-auto" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </button>
            </div>

            <!-- BTC / TON: manual address input -->
            <div v-else>
              <p class="text-white/40 text-xs mb-4">
                {{ selectedType === 'BTC' ? 'Введите Bitcoin-адрес' : 'Введите TON-адрес' }}
              </p>
              <form @submit.prevent="handleManualConnect">
                <input
                  v-model="inputAddress"
                  type="text"
                  :placeholder="selectedType === 'BTC' ? 'bc1q... / 1... / 3...' : 'UQ... / EQ... / 0:...'"
                  class="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50 transition-colors text-sm font-mono"
                />
                <button
                  type="submit"
                  :disabled="loading"
                  class="w-full mt-4 px-4 py-3 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:via-amber-600 hover:to-yellow-600 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <svg v-if="loading" class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{{ loading ? 'Загрузка...' : 'Показать портфель' }}</span>
                </button>
              </form>
            </div>

            <!-- Error -->
            <div v-if="errorMsg" class="mt-4 flex items-center gap-2 text-red-400 text-sm">
              <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
              <span>{{ errorMsg }}</span>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import type { WalletType } from '~/composables/useWallet'

const {
  isConnecting, error, address,
  connectMoralis, setManualAddress, disconnectWallet, fetchPortfolio,
} = useWallet()

const showModal = ref(false)
const selectedType = ref<WalletType>('EVM')
const inputAddress = ref('')
const loading = ref(false)
const errorMsg = ref('')

const closeModal = () => {
  showModal.value = false
  errorMsg.value = ''
}

const handleConnectEVM = async () => {
  errorMsg.value = ''
  await connectMoralis()

  if (error.value) {
    errorMsg.value = error.value
    return
  }
  if (!address.value) return

  loading.value = true
  try {
    await fetchPortfolio()
    showModal.value = false
    navigateTo('/portfolio')
  } catch {
    errorMsg.value = 'Не удалось загрузить портфель'
    disconnectWallet()
  } finally {
    loading.value = false
  }
}

const handleManualConnect = async () => {
  const addr = inputAddress.value.trim()
  errorMsg.value = ''

  if (!addr) {
    errorMsg.value = 'Введите адрес кошелька'
    return
  }

  if (selectedType.value === 'BTC' && !/^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(addr)) {
    errorMsg.value = 'Некорректный Bitcoin-адрес'
    return
  }

  loading.value = true
  try {
    setManualAddress(addr, selectedType.value as 'BTC' | 'TON')
    await fetchPortfolio()
    showModal.value = false
    navigateTo('/portfolio')
  } catch {
    errorMsg.value = 'Не удалось загрузить портфель. Проверьте адрес.'
    disconnectWallet()
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
select option {
  background: #0f172a;
  color: white;
}
</style>
