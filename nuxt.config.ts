// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss'],

  ssr: true,
  debug: false,
  features: {
    devLogs: false
  },
  runtimeConfig: {
    moralisApiKey: process.env.NUXT_MORALIS_API_KEY || '',
    gigaChatClientId: process.env.GIGACHAT_CLIENT_ID || '',
    gigaChatClientSecret: process.env.GIGACHAT_CLIENT_SECRET || '',
    gigaChatModel: process.env.GIGACHAT_MODEL || 'GigaChat-2',
    public: {
      yandexMetrikaId: process.env.NUXT_PUBLIC_YANDEX_METRIKA_ID || '',
    },
  },

  typescript: {
    strict: true,
    typeCheck: false
  },

  // App configuration
  app: {
    head: {
      title: 'BBTeam - Крипто Портфель и Аналитика',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          'http-equiv': 'Content-Security-Policy',
          content: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://mc.yandex.ru; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://api.coingecko.com https://gigachat.devices.sberbank.ru https://ngw.devices.sberbank.ru https://deep-index.moralis.io; frame-src 'self' https://oauth.telegram.org;"
        },
        {
          name: 'description',
          content: 'Управляйте криптопортфелем с AI-аналитикой от GigaChat. Поддержка Ethereum, Bitcoin, TON. Графики, транзакции, новости и умные рекомендации.'
        },
        {
          name: 'keywords',
          content: 'криптопортфель, крипто аналитика, ethereum, bitcoin, ton, defi, web3, кошелек, gigaChat'
        },
        { name: 'author', content: 'BBTeam' },
        { name: 'robots', content: 'index, follow' },

        // Open Graph / Facebook
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'BBTeam' },
        {
          property: 'og:title',
          content: 'BBTeam - Крипто Портфель и AI Аналитика'
        },
        {
          property: 'og:description',
          content: 'Управляйте криптопортфелем с AI-аналитикой от GigaChat. Поддержка Ethereum, Bitcoin, TON.'
        },
        { property: 'og:image', content: '/og-image.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },

        // Twitter
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@bbteam' },
        {
          name: 'twitter:title',
          content: 'BBTeam - Крипто Портфель и AI Аналитика'
        },
        {
          name: 'twitter:description',
          content: 'Управляйте криптопортфелем с AI-аналитикой от GigaChat. Поддержка Ethereum, Bitcoin, TON.'
        },
        { name: 'twitter:image', content: '/og-image.png' },

        // Additional SEO
        { name: 'theme-color', content: '#020617' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
      ],
    },
  },

  // Sitemap & Robots (will be generated)
  nitro: {
    prerender: {
      failOnError: false,
    },
    // Security headers for API routes
    routeRules: {
      '/api/**': {
        headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
          'Referrer-Policy': 'strict-origin-when-cross-origin',
        },
      },
    },
  },
})
