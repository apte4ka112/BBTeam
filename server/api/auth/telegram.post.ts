import type { TelegramUser } from '~/composables/useAuth'
import { H3Event, getRouterParam, readBody } from 'h3'
import CryptoJS from 'crypto-js'

interface AuthResponse {
  success: boolean
  user?: TelegramUser
  token?: string
  error?: string
}

// Telegram Bot API token for checking hash
const config = useRuntimeConfig()

/**
 * Validate Telegram auth data using official algorithm
 * https://core.telegram.org/widgets/login#checking-authorization
 */
function validateTelegramAuth(userData: TelegramUser): boolean {
  const botToken = config.telegramBotToken

  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN not configured')
    return false
  }

  // Create the bot token secret key
  // bot_token = 123456:ABC-DEF1234...
  // secret = SHA256(bot_token)
  const secretKey = CryptoJS.SHA256(botToken).toString(CryptoJS.enc.Hex)

  // Build data check string: sort all fields except hash, key=value, joined with \n
  const dataCheckString = Object.keys(userData)
    .filter((key) => key !== 'hash')
    .sort()
    .map((key) => `${key}=${userData[key as keyof TelegramUser]}`)
    .join('\n')

  // Calculate HMAC-SHA256 of dataCheckString with secretKey
  const hmac = CryptoJS.HmacSHA256(dataCheckString, secretKey)
  const calculatedHash = hmac.toString(CryptoJS.enc.Hex)

  // Compare with received hash
  return calculatedHash === userData.hash
}

/**
 * Generate JWT token
 */
function generateToken(userId: number, username?: string): string {
  const jwtSecret = config.jwtSecret
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  }

  const payload = {
    sub: userId.toString(),
    username: username || '',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
  }

  // Encode to Base64URL
  const base64UrlEncode = (str: string) => {
    return Buffer.from(str)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
  }

  const encodedHeader = base64UrlEncode(JSON.stringify(header))
  const encodedPayload = base64UrlEncode(JSON.stringify(payload))

  // Create signature
  const signatureInput = `${encodedHeader}.${encodedPayload}`
  const signature = CryptoJS.HmacSHA256(signatureInput, jwtSecret)
  const encodedSignature = signature.toString(CryptoJS.enc.Base64)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`
}

export default defineEventHandler(async (event: H3Event): Promise<AuthResponse> => {
  try {
    const body = await readBody(event) as TelegramUser

    // Validate required fields
    if (!body.id || !body.auth_date || !body.hash) {
      return {
        success: false,
        error: 'Missing required fields'
      }
    }

    // Check auth_date - reject if too old (24 hours)
    const now = Math.floor(Date.now() / 1000)
    const authAge = now - body.auth_date
    const MAX_AUTH_AGE = 24 * 60 * 60 // 24 hours

    if (authAge > MAX_AUTH_AGE) {
      return {
        success: false,
        error: 'Auth data is too old'
      }
    }

    // Validate Telegram signature
    if (!validateTelegramAuth(body)) {
      return {
        success: false,
        error: 'Invalid Telegram signature'
      }
    }

    // Generate JWT token
    const token = generateToken(body.id, body.username)

    // Set HTTP-only cookie with token
    setCookie(event, 'auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return {
      success: true,
      user: body,
      token
    }

  } catch (err) {
    console.error('Telegram auth error:', err)
    return {
      success: false,
      error: 'Internal server error'
    }
  }
})
