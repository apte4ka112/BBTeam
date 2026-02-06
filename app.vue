<template>
  <div class="min-h-screen flex flex-col items-center justify-center bg-gray-50">
    <div class="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
      <h1 class="text-2xl font-bold text-center mb-6">Telegram Auth Demo</h1>

      <div v-if="isAuthenticated" class="text-center">
        <p class="text-green-600 mb-4">✓ Авторизованы</p>

        <div class="bg-gray-100 p-4 rounded mb-4">
          <p class="font-semibold">{{ user?.first_name }} {{ user?.last_name || '' }}</p>
          <p class="text-gray-600 text-sm">@{{ user?.username || 'без username' }}</p>
          <p class="text-gray-500 text-xs mt-2">ID: {{ user?.id }}</p>
          <p v-if="user?.photo_url" class="mt-2">
            <img :src="user.photo_url" alt="avatar" class="w-16 h-16 rounded-full mx-auto" />
          </p>
        </div>

        <button
          @click="logout"
          class="w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded transition"
        >
          Выйти
        </button>
      </div>

      <div v-else class="text-center">
        <p class="text-gray-600 mb-4">Войдите через Telegram</p>
        <ClientOnly>
          <TelegramLogin @auth="handleTelegramAuth" />
        </ClientOnly>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TelegramUser } from './composables/useAuth'

const { login, logout, isAuthenticated, user } = useAuth()

const handleTelegramAuth = async (userData: TelegramUser) => {
  await login(userData)
}
</script>
