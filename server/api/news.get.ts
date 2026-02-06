interface CryptoCompareNews {
  Data: {
    id: string
    title: string
    url: string
    source: string
    body: string
    imageurl: string
    published_on: number
    categories: string
    tags: string
  }[]
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(50, Math.max(1, Number(query.limit) || 20))

  try {
    // CryptoCompare returns up to 50 news items, use lTs for pagination
    const params: Record<string, string | number> = { lang: 'EN' }

    // For page > 1 we need to use the timestamp-based pagination
    // Fetch enough items to cover the requested page
    if (page > 1 && query.before) {
      params.lTs = Number(query.before)
    }

    const data = await $fetch<CryptoCompareNews>(
      'https://min-api.cryptocompare.com/data/v2/news/',
      { query: params }
    )

    const allItems = data.Data || []

    const news = allItems.slice(0, limit).map(item => ({
      id: item.id,
      title: item.title,
      url: item.url,
      source: item.source,
      image: item.imageurl,
      timestamp: item.published_on * 1000,
      excerpt: item.body.length > 200 ? item.body.slice(0, 200) + '...' : item.body,
      categories: item.categories ? item.categories.split('|').slice(0, 3) : [],
    }))

    // Last item timestamp for next page cursor
    const lastTs = allItems.length > 0
      ? allItems[Math.min(limit, allItems.length) - 1].published_on
      : null

    return {
      news,
      nextCursor: lastTs,
      hasMore: allItems.length > limit,
    }
  } catch {
    throw createError({ statusCode: 502, statusMessage: 'Failed to fetch news' })
  }
})
