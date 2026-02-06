interface CryptoCompareNews {
  Data: {
    id: string
    title: string
    url: string
    source: string
    body: string
    imageurl: string
    published_on: number
  }[]
}

export default defineEventHandler(async () => {
  try {
    const data = await $fetch<CryptoCompareNews>(
      'https://min-api.cryptocompare.com/data/v2/news/',
      { query: { lang: 'EN' } }
    )

    const news = (data.Data || []).slice(0, 15).map(item => ({
      id: item.id,
      title: item.title,
      url: item.url,
      source: item.source,
      image: item.imageurl,
      timestamp: item.published_on * 1000,
      excerpt: item.body.length > 200 ? item.body.slice(0, 200) + '...' : item.body,
    }))

    return { news }
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Failed to fetch news' })
  }
})
