import { coinIdCache } from './market-cache'

const SYMBOL_TO_COINGECKO: Record<string, string> = {
  ETH: 'ethereum',
  WETH: 'weth',
  BTC: 'bitcoin',
  TON: 'the-open-network',
  USDC: 'usd-coin',
  USDT: 'tether',
  BNB: 'binancecoin',
  MATIC: 'matic-network',
  POL: 'matic-network',
  AVAX: 'avalanche-2',
  SOL: 'solana',
  DAI: 'dai',
  LINK: 'chainlink',
  UNI: 'uniswap',
  AAVE: 'aave',
  ARB: 'arbitrum',
  OP: 'optimism',
  DOGE: 'dogecoin',
  SHIB: 'shiba-inu',
  PEPE: 'pepe',
  APE: 'apecoin',
  CRO: 'crypto-com-chain',
  LDO: 'lido-dao',
  MKR: 'maker',
  GRT: 'the-graph',
  FTM: 'fantom',
  NEAR: 'near',
  ATOM: 'cosmos',
  DOT: 'polkadot',
  ADA: 'cardano',
  XRP: 'ripple',
  TRX: 'tron',
  MANA: 'decentraland',
  SAND: 'the-sandbox',
  IMX: 'immutable-x',
  FIL: 'filecoin',
  ALGO: 'algorand',
  XLM: 'stellar',
  HBAR: 'hedera-hashgraph',
  VET: 'vechain',
  SUSHI: 'sushi',
  CRV: 'curve-dao-token',
  SNX: 'havven',
  COMP: 'compound-governance-token',
  ENS: 'ethereum-name-service',
  '1INCH': '1inch',
  WBTC: 'wrapped-bitcoin',
  STETH: 'staked-ether',
  RETH: 'rocket-pool-eth',
  CBETH: 'coinbase-wrapped-staked-eth',
}

export async function resolveCoinId(symbol: string): Promise<string | null> {
  const upper = symbol.toUpperCase()

  // Check static mapping first
  if (SYMBOL_TO_COINGECKO[upper]) {
    return SYMBOL_TO_COINGECKO[upper]
  }

  // Check permanent cache
  if (coinIdCache.has(upper)) {
    return coinIdCache.get(upper) ?? null
  }

  // CoinGecko Search API fallback
  try {
    const data = await $fetch<{ coins: { id: string; symbol: string }[] }>(
      'https://api.coingecko.com/api/v3/search',
      { query: { query: symbol } }
    )

    const match = data.coins?.find(
      c => c.symbol.toUpperCase() === upper
    )

    const id = match?.id ?? null
    coinIdCache.set(upper, id)
    return id
  } catch {
    coinIdCache.set(upper, null)
    return null
  }
}
