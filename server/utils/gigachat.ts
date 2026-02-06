/**
 * GigaChat API utility functions
 * @see https://developers.sber.ru/docs/ru/gigachat/api/reference/rest/gigachat-api
 */

interface GigaChatTokenResponse {
  access_token: string
  expires_at: number
}

let cachedToken: string | null = null
let tokenExpiresAt: number = 0

/**
 * Generate Basic Auth header from Authorization Key
 * The GIGACHAT_CLIENT_SECRET is already a base64 encoded "clientId:secret"
 * from GigaChat Studio (called Authorization Key)
 */
function getBasicAuth(clientId: string, authKey: string): string {
  console.log('[GigaChat] getBasicAuth - authKey:', authKey?.substring(0, 30) + '...')
  // authKey is already the base64 encoded Authorization Key from studio
  return `Basic ${authKey}`
}

/**
 * Get GigaChat access token
 * Tokens are cached and refreshed automatically (30min expiry)
 */
export async function getGigaChatToken(): Promise<string> {
  console.log('[GigaChat] ===== Starting token request =====')
  const config = useRuntimeConfig()

  const clientId = config.gigaChatClientId
  const authKey = config.gigaChatClientSecret

  console.log('[GigaChat] Config check:')
  console.log('[GigaChat]   clientId exists:', !!clientId, clientId?.substring(0, 20) + '...')
  console.log('[GigaChat]   authKey exists:', !!authKey, authKey?.substring(0, 30) + '...')

  if (!clientId || !authKey) {
    console.error('[GigaChat] ERROR: Missing credentials!')
    throw new Error('GigaChat credentials are not configured')
  }

  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiresAt) {
    console.log('[GigaChat] Using cached token')
    return cachedToken
  }

  const rqUid = crypto.randomUUID()
  const authHeader = getBasicAuth(clientId, authKey)

  console.log('[GigaChat] OAuth request:')
  console.log('[GigaChat]   URL: https://ngw.devices.sberbank.ru:9443/api/v2/oauth')
  console.log('[GigaChat]   RqUID:', rqUid)
  console.log('[GigaChat]   Auth header:', authHeader.substring(0, 40) + '...')

  try {
    const response = await $fetch<GigaChatTokenResponse>(
      'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
          'RqUID': rqUid,
          'Authorization': authHeader,
        },
        body: new URLSearchParams({
          scope: 'GIGACHAT_API_PERS',
        }).toString(),
      }
    )

    console.log('[GigaChat] Token received! access_token exists:', !!response.access_token)
    console.log('[GigaChat] expires_at:', response.expires_at, new Date(response.expires_at * 1000).toISOString())

    cachedToken = response.access_token
    // Use API's expiry time with 1 minute buffer
    tokenExpiresAt = (response.expires_at * 1000) - 60000

    console.log('[GigaChat] Token cached successfully')
    return cachedToken
  } catch (err: any) {
    console.error('[GigaChat] ===== TOKEN REQUEST FAILED =====')
    console.error('[GigaChat] Error name:', err?.name)
    console.error('[GigaChat] Error message:', err?.message)
    console.error('[GigaChat] Status:', err?.statusCode || err?.status || 'N/A')
    console.error('[GigaChat] Response data:', JSON.stringify(err?.data || err?.response?._data, null, 2))
    throw new Error(`Failed to get GigaChat token: ${err?.message || 'Unknown error'}`)
  }
}

/**
 * GigaChat chat completion request
 */
export interface GigaChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GigaChatResponse {
  choices: Array<{
    message: {
      role: string
      content: string
    }
    index: number
    finish_reason: string
  }>
  created: number
  model: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export async function gigaChatCompletion(
  messages: GigaChatMessage[],
  model: string = 'GigaChat-2'
): Promise<string> {
  console.log('[GigaChat] ===== Starting chat completion =====')
  console.log('[GigaChat] Model:', model)
  console.log('[GigaChat] Messages count:', messages.length)

  const token = await getGigaChatToken()

  console.log('[GigaChat] Got token, length:', token?.length)

  try {
    const requestBody = {
      model,
      messages,
      stream: false,
    }

    console.log('[GigaChat] Sending request to:', 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions')
    console.log('[GigaChat] Request body (first msg):', messages[0]?.content?.substring(0, 50) + '...')

    const response = await $fetch<GigaChatResponse>(
      'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: requestBody,
      }
    )

    console.log('[GigaChat] Response received!')
    console.log('[GigaChat] Choices count:', response.choices?.length)
    console.log('[GigaChat] Content preview:', response.choices?.[0]?.message?.content?.substring(0, 100) + '...')

    return response.choices?.[0]?.message?.content || 'Нет ответа от модели'
  } catch (err: any) {
    console.error('[GigaChat] ===== COMPLETION FAILED =====')
    console.error('[GigaChat] Error name:', err?.name)
    console.error('[GigaChat] Error message:', err?.message)
    console.error('[GigaChat] Status:', err?.statusCode || err?.status || 'N/A')
    console.error('[GigaChat] Response data:', JSON.stringify(err?.data || err?.response?._data, null, 2))
    throw err
  }
}
