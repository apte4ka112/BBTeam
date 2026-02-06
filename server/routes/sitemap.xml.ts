export default defineEventHandler((event) => {
  const baseUrl = 'https://bbteam.ru' // Замените на ваш домен

  const routes = [
    { loc: '', changefreq: 'daily', priority: '1.0' },
    { loc: '/news', changefreq: 'hourly', priority: '0.9' },
  ]

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map(route => `  <url>
    <loc>${baseUrl}${route.loc}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  setHeader(event, 'content-type', 'application/xml')
  return sitemap
})
