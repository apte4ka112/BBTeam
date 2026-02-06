<template>
  <div class="min-h-screen bg-slate-950">
    <!-- Header -->
    <header class="border-b border-white/10 backdrop-blur-sm bg-slate-950/80 sticky top-0 z-20">
      <div class="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
        <div class="flex items-center gap-4">
          <NuxtLink to="/" class="flex items-center gap-2">
            <div class="w-9 h-9 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <span class="text-lg font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">BBTeam</span>
          </NuxtLink>
          <div class="h-6 w-px bg-white/10"></div>
          <h1 class="text-white/80 font-medium text-sm">Согласие на обработку ПДн</h1>
        </div>

        <NuxtLink
          to="/"
          class="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 hover:text-white transition-all text-sm flex items-center gap-2"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          <span class="hidden sm:inline">Назад</span>
        </NuxtLink>
      </div>
    </header>

    <!-- Content -->
    <div class="max-w-4xl mx-auto px-4 py-10">
      <div class="space-y-8">

        <section>
          <h2 class="text-2xl font-bold text-white mb-4">Согласие на обработку персональных данных</h2>
          <p class="text-white/50 text-sm mb-6">Дата последнего обновления: 6 февраля 2026 г.</p>
          <div class="text-white/70 leading-relaxed space-y-3">
            <p>
              Используя сервис BBTeam (далее — «Сервис»), расположенный по адресу
              <span class="text-white">bbteam.ru</span>, Пользователь даёт своё согласие
              <span class="text-white">[НАЗВАНИЕ ОПЕРАТОРА]</span> (ИНН: <span class="text-white">[ИНН]</span>,
              адрес: <span class="text-white">[АДРЕС]</span>) на обработку персональных данных на следующих условиях.
            </p>
          </div>
        </section>

        <section>
          <h3 class="text-xl font-semibold text-white mb-3">1. Перечень персональных данных</h3>
          <div class="text-white/70 leading-relaxed">
            <p class="mb-3">Согласие даётся на обработку следующих категорий данных:</p>
            <div class="space-y-3">
              <div class="bg-white/5 border border-white/10 rounded-xl p-4">
                <p class="text-white/90 font-medium text-sm mb-1">Адрес криптовалютного кошелька</p>
                <p class="text-white/50 text-sm">EVM (Ethereum, Polygon, BSC и др.), BTC, TON — предоставляется Пользователем добровольно</p>
              </div>
              <div class="bg-white/5 border border-white/10 rounded-xl p-4">
                <p class="text-white/90 font-medium text-sm mb-1">Тексты запросов к AI-чату</p>
                <p class="text-white/50 text-sm">Сообщения, направляемые в AI-чат для получения аналитики по криптоактивам</p>
              </div>
              <div class="bg-white/5 border border-white/10 rounded-xl p-4">
                <p class="text-white/90 font-medium text-sm mb-1">Технические данные</p>
                <p class="text-white/50 text-sm">IP-адрес, тип и версия браузера (User-Agent), дата и время обращения к Сервису</p>
              </div>
            </div>
          </div>
        </section>

        <section>
          <h3 class="text-xl font-semibold text-white mb-3">2. Цели обработки</h3>
          <div class="text-white/70 leading-relaxed">
            <ul class="list-disc list-inside space-y-2 pl-2">
              <li>Предоставление функциональности Сервиса — отображение криптопортфеля по указанному адресу кошелька.</li>
              <li>Обработка запросов к AI-чату (GigaChat) для формирования аналитических ответов.</li>
              <li>Обеспечение технической работоспособности и безопасности Сервиса.</li>
              <li>Улучшение качества Сервиса на основе обезличенных данных.</li>
            </ul>
          </div>
        </section>

        <section>
          <h3 class="text-xl font-semibold text-white mb-3">3. Способы обработки</h3>
          <div class="text-white/70 leading-relaxed space-y-3">
            <p>Обработка персональных данных осуществляется с использованием средств автоматизации и включает следующие действия: сбор, запись, систематизацию, накопление, хранение, использование, передачу (предоставление), обезличивание, удаление, уничтожение.</p>
            <p>Адрес кошелька хранится в cookie-файле на устройстве Пользователя. Тексты запросов передаются стороннему сервису GigaChat (ПАО «Сбербанк») через API.</p>
          </div>
        </section>

        <section>
          <h3 class="text-xl font-semibold text-white mb-3">4. Срок действия согласия</h3>
          <div class="text-white/70 leading-relaxed space-y-3">
            <p>Настоящее согласие действует с момента начала использования Сервиса и до момента его отзыва Пользователем.</p>
          </div>
        </section>

        <section>
          <h3 class="text-xl font-semibold text-white mb-3">5. Порядок отзыва согласия</h3>
          <div class="text-white/70 leading-relaxed space-y-3">
            <div class="bg-purple-500/5 border border-purple-500/20 rounded-xl p-4">
              <p class="text-purple-200/80 text-sm font-medium mb-2">Как отозвать согласие</p>
              <ul class="text-purple-200/60 text-sm space-y-2 list-disc list-inside pl-1">
                <li>Направьте уведомление об отзыве согласия на электронную почту <span class="text-purple-200/90">[EMAIL]</span> с указанием данных, обработку которых необходимо прекратить.</li>
                <li>Для удаления адреса кошелька — очистите cookie-файлы браузера или воспользуйтесь функцией отключения кошелька в интерфейсе Сервиса.</li>
              </ul>
            </div>
            <p>
              Оператор прекращает обработку персональных данных в течение 30 дней с момента получения отзыва
              и уничтожает персональные данные, за исключением случаев, когда обработка может быть продолжена
              в соответствии с законодательством Российской Федерации.
            </p>
            <p>
              Отзыв согласия на обработку персональных данных может повлечь невозможность использования
              функциональности Сервиса, для которой обработка данных является необходимой.
            </p>
          </div>
        </section>

        <section>
          <h3 class="text-xl font-semibold text-white mb-3">6. Дополнительная информация</h3>
          <div class="text-white/70 leading-relaxed space-y-3">
            <p>
              Подробная информация о порядке обработки персональных данных содержится в
              <NuxtLink to="/privacy" class="text-purple-400 hover:text-purple-300 underline underline-offset-4 transition-colors">Политике конфиденциальности</NuxtLink>.
            </p>
            <p>По всем вопросам обращайтесь:</p>
            <ul class="list-disc list-inside space-y-2 pl-2">
              <li>Электронная почта: <span class="text-white">[EMAIL]</span></li>
              <li>Адрес: <span class="text-white">[АДРЕС]</span></li>
            </ul>
          </div>
        </section>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({
  title: 'Согласие на обработку персональных данных - BBTeam',
  meta: [
    { name: 'description', content: 'Согласие на обработку персональных данных пользователей сервиса BBTeam в соответствии с 152-ФЗ.' },
    { property: 'og:title', content: 'Согласие на обработку ПДн - BBTeam' },
    { property: 'og:description', content: 'Согласие на обработку персональных данных сервиса BBTeam' },
  ]
})
</script>
