# BBTeam - Крипто Портфель и AI Аналитика

z.ai неплохой аналог, он дешевле что привлекает, но не удивил проект в целом пишется как и на остальных ai, приходиться тюнить и дорабатывать
Модель изпольузется gigaChat, без коментариев) 

Nuxt 3 приложение для управления криптопортфелем с AI-аналитикой от GigaChat. Поддержка Ethereum, Bitcoin, TON с графиками, транзакциями, новостями и умными рекомендациями.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Nuxt](https://img.shields.io/badge/Nuxt-3.15-00DC82)
![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D)

## Возможности

- **Подключение кошельков**
  - MetaMask и другие Web3 кошельки (EVM)
  - Bitcoin адреса
  - TON кошельки

- **Аналитика портфеля**
  - Общая стоимость и распределение активов
  - История транзакций
  - Рыночные данные от CoinGecko
  - Интерактивные графики (Lightweight Charts)

- **AI-аналитик (GigaChat)**
  - Анализ структуры портфеля
  - Выявление рисков и неэффективности
  - Рекомендации по улучшению

- **Новости**
  - Актуальные новости крипторынка

## Технологии

| Технология | Описание |
|------------|----------|
| **Nuxt 3** | Full-stack Vue фреймворк |
| **Vue 3** | Progressive JavaScript framework |
| **Tailwind CSS** | Utility-first CSS фреймворк |
| **TypeScript** | Статическая типизация |
| **Moralis** | Web3 API для кошельков |
| **CoinGecko** | Рыночные данные и графики |
| **GigaChat** | AI от Сбера для аналитики |
| **Lightweight Charts** | Финансовые графики |
| **Yandex Metrika** | Аналитика |

## Структура проекта

```
├── app.vue                    # Root компонент
├── components/                # Vue компоненты
│   ├── WalletModal.vue        # Модальное окно кошелька
│   ├── AiChat.vue             # AI чат
│   ├── MarketChart.vue        # Графики
│   └── ...
├── composables/               # Composables (Vue logic)
│   └── useWallet.ts           # Логика кошелька
├── server/                    # Server-side код
│   ├── api/                   # API endpoints
│   │   ├── portfolio.post.ts  # Получение портфеля
│   │   ├── transactions.post.ts # Транзакции
│   │   ├── chat.post.ts       # AI чат
│   │   ├── news.get.ts        # Новости
│   │   └── market.get.ts      # Рыночные данные
│   └── utils/                 # Server utilities
│       ├── gigachat.ts        # GigaChat API
│       ├── portfolio-context.ts # Контекст для AI
│       ├── market-cache.ts    # Кеш рыночных данных
│       └── coingecko.ts       # CoinGecko API
├── pages/                     # Страницы
├── nuxt.config.ts             # Nuxt конфигурация
└── types/                     # TypeScript типы
```

## Установка

### Требования
- Node.js 18+
- npm или yarn

### Шаги

1. **Клонируйте репозиторий**
   ```bash
   git clone https://github.com/your-username/BBTeam.git
   cd BBTeam
   ```

2. **Установите зависимости**
   ```bash
   npm install
   ```

3. **Настройте переменные окружения**
   ```bash
   cp .env.example .env
   ```

4. **Отредактируйте `.env` файл**
   ```env
   # Moralis API Key (https://admin.moralis.io)
   NUXT_MORALIS_API_KEY=your_moralis_api_key

   # GigaChat API (https://developers.sber.ru/docs/ru/gigachat)
   GIGACHAT_CLIENT_ID=your_client_id
   GIGACHAT_CLIENT_SECRET=your_client_secret
   GIGACHAT_MODEL=GigaChat-2

   # Yandex Metrika ID (опционально)
   NUXT_PUBLIC_YANDEX_METRIKA_ID=your_metrika_id
   ```

## Запуск

### Режим разработки
```bash
npm run dev
```
Приложение будет доступно по адресу `http://localhost:3000`

### Продакшен сборка
```bash
npm run build
```

### Preview продакшен сборки
```bash
npm run preview
```

### Генерация статического сайта
```bash
npm run generate
```

## API Эндпоинты

### `POST /api/portfolio`
Получение данных портфеля по адресу кошелька.

**Body:**
```json
{
  "address": "0x...",
  "type": "EVM",
  "chain": "eth"
}
```

### `POST /api/transactions`
Получение транзакций кошелька.

### `POST /api/chat`
AI-аналитика портфеля через GigaChat.

**Body:**
```json
{
  "messages": [{"role": "user", "content": "Проанализируй мой портфель"}],
  "context": {
    "tokens": [...],
    "totalUsd": 1000,
    "transactions": [...]
  }
}
```

### `GET /api/news`
Получение крипто-новостей.

### `GET /api/market`
Получение рыночных данных (OHLC графики).

## Безопасность

Проект настроен для продакшена с защитой:

- Content Security Policy (CSP)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection
- Referrer-Policy

**Важно:** Никогда не коммитьте `.env` файл в репозиторий!

## Лицензия

MIT

## Поддержка

Для вопросов и предложений создавайте issues в репозитории.
