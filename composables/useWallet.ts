export type WalletType = 'EVM' | 'BTC' | 'TON'

const EVM_CHAINS: Record<number, string> = {
  1: 'eth',
  137: 'polygon',
  56: 'bsc',
  42161: 'arbitrum',
  10: 'optimism',
  43114: 'avalanche',
  8453: 'base',
}

export interface PortfolioToken {
  symbol: string
  name: string
  balance: string
  usd: number
  native: boolean
  logo: string | null
}

interface WalletState {
  address: string | null
  type: WalletType | null
  evmChainId: number | null
  isConnecting: boolean
  error: string | null
}

interface SavedWallet {
  address: string
  type: WalletType
  evmChainId: number | null
}

export const useWallet = () => {
  const saved = useCookie<SavedWallet | null>('wallet', {
    maxAge: 60 * 60 * 24 * 365,
    default: () => null,
  })

  const state = useState<WalletState>('wallet', () => ({
    address: saved.value?.address ?? null,
    type: saved.value?.type ?? null,
    evmChainId: saved.value?.evmChainId ?? null,
    isConnecting: false,
    error: null,
  }))

  const portfolioTokens = useState<PortfolioToken[]>('portfolioTokens', () => [])
  const totalUsdValue = useState<number>('totalUsdValue', () => 0)
  const portfolioLoading = useState<boolean>('portfolioLoading', () => false)

  const isConnected = computed(() => !!state.value.address)

  const moralisChain = computed(() => {
    const id = state.value.evmChainId
    return id ? (EVM_CHAINS[id] || 'eth') : 'eth'
  })

  const persist = () => {
    if (state.value.address && state.value.type) {
      saved.value = {
        address: state.value.address,
        type: state.value.type,
        evmChainId: state.value.evmChainId,
      }
    } else {
      saved.value = null
    }
  }

  const fetchPortfolio = async () => {
    if (!state.value.address || !state.value.type) return

    portfolioLoading.value = true
    try {
      const body: Record<string, string> = {
        address: state.value.address,
        type: state.value.type,
      }
      if (state.value.type === 'EVM') body.chain = moralisChain.value

      const data = await $fetch<{ tokens: PortfolioToken[]; total_usd_value: number }>(
        '/api/portfolio',
        { method: 'POST', body },
      )

      portfolioTokens.value = data.tokens
      totalUsdValue.value = data.total_usd_value
    } catch (err) {
      // Silently handle portfolio fetch errors
    } finally {
      portfolioLoading.value = false
    }
  }

  const connectMoralis = async () => {
    if (state.value.isConnecting) return

    state.value.isConnecting = true
    state.value.error = null

    try {
      if (!window.ethereum) {
        state.value.error = 'Установите MetaMask или другой Web3-кошелёк'
        return
      }

      const accounts: string[] = await window.ethereum.request({ method: 'eth_requestAccounts' })
      if (!accounts.length) {
        state.value.error = 'Нет доступных аккаунтов'
        return
      }

      const chainIdHex: string = await window.ethereum.request({ method: 'eth_chainId' })

      state.value.address = accounts[0]
      state.value.type = 'EVM'
      state.value.evmChainId = parseInt(chainIdHex, 16)
      persist()
    } catch (err: any) {
      state.value.error = err?.code === 4001
        ? 'Подключение отклонено пользователем'
        : 'Ошибка подключения к кошельку'
    } finally {
      state.value.isConnecting = false
    }
  }

  const setManualAddress = (address: string, type: 'BTC' | 'TON') => {
    // Validate address format before saving
    const trimmedAddress = address.trim()

    if (type === 'TON') {
      // TON address validation: UQ:..., EQ:..., 0:..., or raw base64
      const isValidTON = /^(UQ|EQ|0:[a-zA-Z0-9\/+_=-]+|[a-zA-Z0-9\/+_]{48})$/.test(trimmedAddress)
      if (!isValidTON) {
        state.value.error = 'Неверный формат TON адреса. Ожидается: UQ:..., EQ:..., 0:... или base64'
        return
      }
    } else if (type === 'BTC') {
      // BTC address validation
      const isValidBTC = /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(trimmedAddress)
      if (!isValidBTC) {
        state.value.error = 'Неверный формат Bitcoin адреса. Ожидается: 1..., 3... или bc1...'
        return
      }
    }

    state.value.address = trimmedAddress
    state.value.type = type
    state.value.evmChainId = null
    state.value.error = null
    persist()
  }

  const disconnectWallet = () => {
    state.value.address = null
    state.value.type = null
    state.value.evmChainId = null
    state.value.error = null
    portfolioTokens.value = []
    totalUsdValue.value = 0
    persist()
  }

  return {
    isConnected,
    address: computed(() => state.value.address),
    type: computed(() => state.value.type),
    evmChainId: computed(() => state.value.evmChainId),
    moralisChain,
    isConnecting: computed(() => state.value.isConnecting),
    error: computed(() => state.value.error),
    portfolioTokens: computed(() => portfolioTokens.value),
    totalUsdValue: computed(() => totalUsdValue.value),
    portfolioLoading: computed(() => portfolioLoading.value),
    connectMoralis,
    setManualAddress,
    disconnectWallet,
    fetchPortfolio,
  }
}
