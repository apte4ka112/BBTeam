// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss'],

  ssr: true,
  debug: true,
  features: {
    devLogs: true
  },
  runtimeConfig: {
    moralisApiKey: '',
    gigaChatClientId: process.env.GIGACHAT_CLIENT_ID || '',
    gigaChatClientSecret: process.env.GIGACHAT_CLIENT_SECRET || '',
    gigaChatModel: process.env.GIGACHAT_MODEL || 'GigaChat-2',
  },

  typescript: {
    strict: true,
    typeCheck: false
  },
})
