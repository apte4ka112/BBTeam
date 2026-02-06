interface PortfolioToken {
  symbol: string
  name: string
  balance: string
  usd: number
  native: boolean
  logo: string | null
}

interface PortfolioResponse {
  address: string
  type: 'EVM' | 'BTC' | 'TON'
  tokens: PortfolioToken[]
  total_usd_value: number
}

export default defineEventHandler(async (event): Promise<PortfolioResponse> => {
  const body = await readBody<{ address: string; type: string; chain?: string }>(event)

  if (!body?.address || !body?.type) {
    throw createError({ statusCode: 400, statusMessage: 'Missing address or type' })
  }

  switch (body.type) {
    case 'EVM':
      return await fetchEVM(body.address, body.chain || 'eth')
    case 'BTC':
      return await fetchBTC(body.address)
    case 'TON':
      return await fetchTON(body.address)
    default:
      throw createError({ statusCode: 400, statusMessage: 'Invalid wallet type' })
  }
})

// ─── EVM (Moralis) ───────────────────────────────────────────────

async function fetchEVM(address: string, chain: string): Promise<PortfolioResponse> {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid EVM address' })
  }

  const config = useRuntimeConfig()
  if (!config.moralisApiKey) {
    throw createError({ statusCode: 500, statusMessage: 'Moralis API key is not configured' })
  }

  try {
    const data = await $fetch<{ result: any[] }>(
      `https://deep-index.moralis.io/api/v2.2/wallets/${address}/tokens`,
      {
        headers: { 'X-API-Key': config.moralisApiKey },
        query: { chain, exclude_spam: true, exclude_unverified_contracts: true },
      }
    )

    const tokens: PortfolioToken[] = (data.result || []).map((t) => ({
      symbol: t.symbol,
      name: t.name,
      balance: t.balance_formatted,
      usd: t.usd_value ?? 0,
      native: t.native_token,
      logo: t.logo,
    }))

    const totalUsd = tokens.reduce((sum, t) => sum + t.usd, 0)

    return {
      address,
      type: 'EVM',
      tokens,
      total_usd_value: Math.round(totalUsd * 100) / 100,
    }
  } catch (err: any) {
    if (err?.statusCode === 401) {
      throw createError({ statusCode: 500, statusMessage: 'Invalid Moralis API key' })
    }
    throw createError({ statusCode: 502, statusMessage: 'Failed to fetch EVM portfolio' })
  }
}

// ─── Bitcoin (Blockstream) ───────────────────────────────────────

async function fetchBTC(address: string): Promise<PortfolioResponse> {
  if (!/^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid Bitcoin address' })
  }

  try {
    const data = await $fetch<any>(`https://blockstream.info/api/address/${address}`)

    const funded = data.chain_stats.funded_txo_sum
    const spent = data.chain_stats.spent_txo_sum
    const balanceSats = funded - spent
    const balanceBTC = balanceSats / 1e8

    const btcPrice = await getCoinPrice('bitcoin')
    const usdValue = Math.round(balanceBTC * btcPrice * 100) / 100

    return {
      address,
      type: 'BTC',
      tokens: [{
        symbol: 'BTC',
        name: 'Bitcoin',
        balance: balanceBTC.toFixed(8),
        usd: usdValue,
        native: true,
        logo: null,
      }],
      total_usd_value: usdValue,
    }
  } catch (err: any) {
    if (err?.statusCode) throw err
    throw createError({ statusCode: 502, statusMessage: 'Failed to fetch BTC balance' })
  }
}

// ─── TON (TonAPI) ────────────────────────────────────────────────

async function fetchTON(address: string): Promise<PortfolioResponse> {
  try {
    const account = await $fetch<any>(`https://tonapi.io/v2/accounts/${address}`)

    const balanceTON = Number(account.balance) / 1e9
    const tonPrice = await getCoinPrice('the-open-network')
    const tonUsd = Math.round(balanceTON * tonPrice * 100) / 100

    const tokens: PortfolioToken[] = [{
      symbol: 'TON',
      name: 'Toncoin',
      balance: balanceTON.toFixed(4),
      usd: tonUsd,
      native: true,
      logo: null,
    }]

    let totalUsd = tonUsd

    // Fetch jettons
    try {
      const jettons = await $fetch<any>(`https://tonapi.io/v2/accounts/${address}/jettons`)

      for (const j of jettons.balances || []) {
        const decimals = j.jetton?.decimals ?? 9
        const balance = Number(j.balance) / Math.pow(10, decimals)
        const jUsd = j.price?.prices?.USD ? Math.round(balance * j.price.prices.USD * 100) / 100 : 0

        tokens.push({
          symbol: j.jetton?.symbol || '???',
          name: j.jetton?.name || 'Unknown',
          balance: balance.toFixed(4),
          usd: jUsd,
          native: false,
          logo: j.jetton?.image || null,
        })
        totalUsd += jUsd
      }
    } catch {
      // Jettons fetch failed — return TON balance only
    }

    return {
      address,
      type: 'TON',
      tokens,
      total_usd_value: Math.round(totalUsd * 100) / 100,
    }
  } catch (err: any) {
    if (err?.statusCode) throw err
    throw createError({ statusCode: 502, statusMessage: 'Failed to fetch TON balance' })
  }
}

// ─── Helpers ─────────────────────────────────────────────────────

async function getCoinPrice(coinId: string): Promise<number> {
  try {
    const data = await $fetch<any>(
      `https://api.coingecko.com/api/v3/simple/price`,
      { query: { ids: coinId, vs_currencies: 'usd' } }
    )
    return data[coinId]?.usd ?? 0
  } catch {
    return 0
  }
}
