import CryptoJS from 'crypto-js'
import type { H3Event } from 'h3'

interface JwtPayload {
  sub: string
  username: string
  iat: number
  exp: number
}

export interface AuthUser {
  id: number
  username: string
}

// Base64URL decode
function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) {
    str += '='
  }
  return Buffer.from(str, 'base64').toString('utf-8')
}

// Verify JWT token and return payload
function verifyToken(token: string): JwtPayload | null {
  try {
    const config = useRuntimeConfig()
    const jwtSecret = config.jwtSecret

    const [encodedHeader, encodedPayload, signature] = token.split('.')

    if (!encodedHeader || !encodedPayload || !signature) {
      return null
    }

    // Verify signature
    const signatureInput = `${encodedHeader}.${encodedPayload}`
    const expectedSignature = CryptoJS.HmacSHA256(signatureInput, jwtSecret)
    const expectedSignatureB64 = expectedSignature.toString(CryptoJS.enc.Base64)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')

    if (signature !== expectedSignatureB64) {
      return null
    }

    // Decode payload
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as JwtPayload

    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

// Get authenticated user from request
export function getAuthenticatedUser(event: H3Event): AuthUser | null {
  // Try to get from cookie first
  const token = getCookie(event, 'auth_token')

  if (!token) {
    // Try Authorization header
    const authHeader = getHeader(event, 'authorization')
    if (authHeader?.startsWith('Bearer ')) {
      const payload = verifyToken(authHeader.substring(7))
      if (!payload) return null
      return {
        id: parseInt(payload.sub),
        username: payload.username
      }
    }
    return null
  }

  const payload = verifyToken(token)
  if (!payload) {
    return null
  }

  return {
    id: parseInt(payload.sub),
    username: payload.username
  }
}

// Middleware to protect routes
export function requireAuth(event: H3Event): AuthUser {
  const user = getAuthenticatedUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  return user
}
