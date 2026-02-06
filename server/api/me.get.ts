import { getAuthenticatedUser } from '~/server/utils/auth'

export default defineEventHandler((event) => {
  const user = getAuthenticatedUser(event)

  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  return {
    success: true,
    user
  }
})
