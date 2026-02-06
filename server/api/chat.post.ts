import { gigaChatCompletion, type GigaChatMessage } from '~/server/utils/gigachat'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface ChatRequest {
  messages: ChatMessage[]
  context: {
    tokens: { symbol: string; balance: string; usd: number }[]
    totalUsd: number
  }
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ChatRequest>(event)

  if (!body?.messages?.length) {
    throw createError({ statusCode: 400, statusMessage: 'Missing messages' })
  }

  const config = useRuntimeConfig()

  const tokensList = (body.context?.tokens || [])
    .map(t => `- ${t.symbol}: ${t.balance} (~$${t.usd})`)
    .join('\n')

  const systemPrompt = `Ты — AI-помощник по криптопортфелю пользователя от Сбера (GigaChat). Отвечай на русском языке. Будь кратким и полезным.

Текущий портфель пользователя:
${tokensList || 'Нет данных'}

Общая стоимость портфеля: $${body.context?.totalUsd ?? 0}

Ты можешь:
- Отвечать на вопросы о балансах и стоимости токенов
- Анализировать состав портфеля
- Давать общие рекомендации (не финансовые советы)
- Объяснять криптовалютные термины`

  const messages: GigaChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...body.messages,
  ]

  console.log('[GigaChat] Processing chat request with', messages.length, 'messages')

  try {
    const model = config.gigaChatModel || 'GigaChat-2'
    const content = await gigaChatCompletion(messages, model)

    return { message: content }
  } catch (err: any) {
    const detail = err?.message || err?.toString?.() || 'Unknown error'
    console.error('[GigaChat] Error:', detail)
    throw createError({
      statusCode: 502,
      statusMessage: `GigaChat error: ${detail}`,
    })
  }
})
