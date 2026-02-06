import type { Ref } from 'vue'

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

export interface AuthState {
  isAuthenticated: boolean
  user: TelegramUser | null
  token: string | null
}

export interface AuthResponse {
  success: boolean
  user?: TelegramUser
  token?: string
  error?: string
}

declare module '#app' {
  interface NuxtApp {
    $telegramAuthData: Ref<AuthState>
  }
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $telegramAuthData: Ref<AuthState>
  }
}

export const useAuth = () => {
  const authState = useState<AuthState>('auth', () => ({
    isAuthenticated: false,
    user: null,
    token: null
  }))

  const tokenCookie = useCookie<string | null>('auth_token', {
    maxAge: 60 * 60 * 24 * 7, // 7 days
    secure: process.env.NODE_ENV === 'production',
    httpOnly: false,
    sameSite: 'lax'
  })

  // Restore auth from cookie on load
  if (tokenCookie.value && !authState.value.token) {
    authState.value.token = tokenCookie.value
    authState.value.isAuthenticated = true
    // Optionally fetch user data from /api/me endpoint
  }

  const login = async (userData: TelegramUser): Promise<AuthResponse> => {
    try {
      const response = await $fetch<AuthResponse>('/api/auth/telegram', {
        method: 'POST',
        body: userData
      })

      if (response.success && response.token) {
        authState.value.isAuthenticated = true
        authState.value.user = response.user || null
        authState.value.token = response.token
        tokenCookie.value = response.token
      }

      return response
    } catch (error) {
      console.error('Auth error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  const logout = () => {
    authState.value.isAuthenticated = false
    authState.value.user = null
    authState.value.token = null
    tokenCookie.value = null
  }

  return {
    login,
    logout,
    isAuthenticated: computed({
      get: () => authState.value.isAuthenticated,
      set: (val) => { authState.value.isAuthenticated = val }
    }),
    user: computed({
      get: () => authState.value.user,
      set: (val) => { authState.value.user = val }
    }),
    token: computed({
      get: () => authState.value.token,
      set: (val) => { authState.value.token = val }
    })
  }
}
