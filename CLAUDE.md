# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands

```bash
npm install         # Install dependencies
npm run dev         # Start development server (http://localhost:3000)
npm run build       # Build for production
npm run preview     # Preview production build
```

## Project Structure

Nuxt 3 project with Telegram Login Widget authorization.

```
├── app.vue                    # Root component with auth UI
├── components/
│   └── TelegramLogin.vue      # Telegram widget (client-side only)
├── composables/
│   └── useAuth.ts             # Auth state management (Pinia-like)
├── server/
│   ├── api/
│   │   ├── auth/
│   │   │   └── telegram.post.ts  # Telegram signature validation
│   │   └── me.get.ts          # Get current authenticated user
│   └── utils/
│       └── auth.ts            # JWT verification utilities
├── nuxt.config.ts             # Nuxt configuration
└── .env.example               # Environment variables template
```

## Architecture

### Auth Flow
1. User clicks "Войти через Telegram" button
2. Telegram widget calls `onTelegramAuth(user)` with signed data
3. Client sends data to `/api/auth/telegram`
4. Server validates Telegram signature using HMAC-SHA256
5. Server generates JWT token and sets HTTP-only cookie
6. Client stores auth state in `useState` + cookie

### SSR Considerations
- Telegram widget loads only on client-side (`<ClientOnly>`)
- JWT stored in HTTP-only cookie (accessible server-side)
- Auth state synced via `useState` (SSR-safe)

### Environment Variables
- `TELEGRAM_BOT_TOKEN` - Bot token from @BotFather (server-side only)
- `TELEGRAM_BOT_USERNAME` - Bot username without @ (public, for widget)
- `JWT_SECRET` - Secret for JWT signing (server-side only)
