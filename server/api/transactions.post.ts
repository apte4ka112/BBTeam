interface Transaction {
  hash: string
  from: string
  to: string
  value: string
  timestamp: number
  direction: 'send' | 'receive'
  status: string
  explorerUrl: string
}

interface TransactionsResponse {
  transactions: Transaction[]
}

export default defineEventHandler(async (event): Promise<TransactionsResponse> => {
  const body = await readBody<{ address: string; type: string; chain?: string }>(event)

  if (!body?.address || !body?.type) {
    throw createError({ statusCode: 400, statusMessage: 'Missing address or type' })
  }

  switch (body.type) {
    case 'EVM':
      return await fetchEVMTransactions(body.address, body.chain || 'eth')
    case 'BTC':
      return await fetchBTCTransactions(body.address)
    case 'TON':
      return await fetchTONTransactions(body.address)
    default:
      throw createError({ statusCode: 400, statusMessage: 'Invalid wallet type' })
  }
})

// ─── EVM (Moralis) ───────────────────────────────────────────────

const EVM_EXPLORERS: Record<string, string> = {
  eth: 'https://etherscan.io/tx/',
  polygon: 'https://polygonscan.com/tx/',
  bsc: 'https://bscscan.com/tx/',
  arbitrum: 'https://arbiscan.io/tx/',
  optimism: 'https://optimistic.etherscan.io/tx/',
  avalanche: 'https://snowtrace.io/tx/',
  base: 'https://basescan.org/tx/',
}

const EVM_NATIVE_SYMBOL: Record<string, string> = {
  eth: 'ETH',
  polygon: 'MATIC',
  bsc: 'BNB',
  arbitrum: 'ETH',
  optimism: 'ETH',
  avalanche: 'AVAX',
  base: 'ETH',
}

async function fetchEVMTransactions(address: string, chain: string): Promise<TransactionsResponse> {
  const config = useRuntimeConfig()
  if (!config.moralisApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'Moralis API key is not configured' })
  }

  const lower = address.toLowerCase()

  try {
    const data = await $fetch<{ result: any[] }>(
      `https://deep-index.moralis.io/api/v2.2/${address}`,
      {
        headers: { 'X-API-Key': config.moralisApiKey },
        query: { chain, limit: 20, order: 'DESC' },
      }
    )

    const explorerBase = EVM_EXPLORERS[chain] || 'https://etherscan.io/tx/'
    const nativeSymbol = EVM_NATIVE_SYMBOL[chain] || 'ETH'

    const transactions: Transaction[] = (data.result || []).map((tx) => {
      const valueWei = BigInt(tx.value || '0')
      const valueEth = Number(valueWei) / 1e18
      const direction: 'send' | 'receive' = tx.from_address?.toLowerCase() === lower ? 'send' : 'receive'

      return {
        hash: tx.hash,
        from: tx.from_address || '',
        to: tx.to_address || '',
        value: valueEth > 0 ? `${valueEth.toFixed(6)} ${nativeSymbol}` : 'Contract call',
        timestamp: new Date(tx.block_timestamp).getTime(),
        direction,
        status: tx.receipt_status === '1' ? 'success' : tx.receipt_status === '0' ? 'failed' : 'pending',
        explorerUrl: `${explorerBase}${tx.hash}`,
      }
    })

    return { transactions }
  } catch (err: any) {
    if (err?.statusCode) throw err
    throw createError({ statusCode: 502, statusMessage: 'Failed to fetch EVM transactions' })
  }
}

// ─── Bitcoin (Blockstream) ───────────────────────────────────────

async function fetchBTCTransactions(address: string): Promise<TransactionsResponse> {
  try {
    const txs = await $fetch<any[]>(`https://blockstream.info/api/address/${address}/txs`)

    const transactions: Transaction[] = (txs || []).slice(0, 20).map((tx) => {
      const inputSum = tx.vin?.reduce((sum: number, inp: any) => {
        if (inp.prevout?.scriptpubkey_address === address) {
          return sum + (inp.prevout.value || 0)
        }
        return sum
      }, 0) || 0

      const outputSum = tx.vout?.reduce((sum: number, out: any) => {
        if (out.scriptpubkey_address === address) {
          return sum + (out.value || 0)
        }
        return sum
      }, 0) || 0

      const netSats = outputSum - inputSum
      const netBTC = Math.abs(netSats) / 1e8
      const direction: 'send' | 'receive' = netSats >= 0 ? 'receive' : 'send'

      const fromAddr = tx.vin?.[0]?.prevout?.scriptpubkey_address || 'coinbase'
      const toAddr = tx.vout?.[0]?.scriptpubkey_address || ''

      return {
        hash: tx.txid,
        from: fromAddr,
        to: toAddr,
        value: `${netBTC.toFixed(8)} BTC`,
        timestamp: (tx.status?.block_time || 0) * 1000,
        direction,
        status: tx.status?.confirmed ? 'confirmed' : 'unconfirmed',
        explorerUrl: `https://blockstream.info/tx/${tx.txid}`,
      }
    })

    return { transactions }
  } catch (err: any) {
    if (err?.statusCode) throw err
    throw createError({ statusCode: 502, statusMessage: 'Failed to fetch BTC transactions' })
  }
}

// ─── TON (TonAPI) ────────────────────────────────────────────────

async function fetchTONTransactions(address: string): Promise<TransactionsResponse> {
  try {
    const data = await $fetch<any>(`https://tonapi.io/v2/accounts/${address}/events`, {
      query: { limit: 20 },
    })

    const transactions: Transaction[] = (data.events || []).map((ev: any) => {
      const action = ev.actions?.[0] || {}
      const actionType = action.type || 'Unknown'

      let value = ''
      let from = ''
      let to = ''
      let direction: 'send' | 'receive' = 'receive'

      if (actionType === 'TonTransfer') {
        const t = action.TonTransfer || {}
        const amount = Number(t.amount || 0) / 1e9
        value = `${amount.toFixed(4)} TON`
        from = t.sender?.address || ''
        to = t.recipient?.address || ''
        direction = t.sender?.address === address ? 'send' : 'receive'
      } else if (actionType === 'JettonTransfer') {
        const t = action.JettonTransfer || {}
        const decimals = t.jetton?.decimals ?? 9
        const amount = Number(t.amount || 0) / Math.pow(10, decimals)
        const symbol = t.jetton?.symbol || '???'
        value = `${amount.toFixed(4)} ${symbol}`
        from = t.sender?.address || ''
        to = t.recipient?.address || ''
        direction = t.sender?.address === address ? 'send' : 'receive'
      } else {
        value = actionType
      }

      return {
        hash: ev.event_id,
        from,
        to,
        value,
        timestamp: (ev.timestamp || 0) * 1000,
        direction,
        status: ev.in_progress ? 'pending' : 'confirmed',
        explorerUrl: `https://tonviewer.com/transaction/${ev.event_id}`,
      }
    })

    return { transactions }
  } catch (err: any) {
    if (err?.statusCode) throw err
    throw createError({ statusCode: 502, statusMessage: 'Failed to fetch TON transactions' })
  }
}
