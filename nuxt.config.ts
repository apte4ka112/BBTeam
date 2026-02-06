// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss'],

  ssr: true,

  runtimeConfig: {
    // Private keys (only available server-side)
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    jwtSecret: process.env.JWT_SECRET || 'change-me-in-production',

    // Public keys (exposed to client)
    public: {
      telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME || '',
    }
  },

  typescript: {
    strict: true,
    typeCheck: false
  },

  vite: {
    optimizeDeps: {
      include: ['crypto-js']
    }
  }
})
