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
  // authKey is already the base64 encoded Authorization Key from studio
  return `Basic ${authKey}`
}

/**
 * Get GigaChat access token
 * Tokens are cached and refreshed automatically (30min expiry)
 */
export async function getGigaChatToken(): Promise<string> {
  const config = useRuntimeConfig()

  const clientId = config.gigaChatClientId
  const authKey = config.gigaChatClientSecret

  if (!clientId || !authKey) {
    console.error('[GigaChat] ERROR: Missing credentials!')
    throw new Error('GigaChat credentials are not configured')
  }

  // Return cached token if still valid
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken
  }

  const rqUid = crypto.randomUUID()
  const authHeader = getBasicAuth(clientId, authKey)

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

    cachedToken = response.access_token
    // Use API's expiry time with 1 minute buffer
    tokenExpiresAt = (response.expires_at * 1000) - 60000

    return cachedToken
  } catch (err: any) {
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
  const token = await getGigaChatToken()

  try {
    const requestBody = {
      model,
      messages,
      stream: false,
    }

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

    return response.choices?.[0]?.message?.content || 'Нет ответа от модели'
  } catch (err: any) {
    throw err
  }
}
