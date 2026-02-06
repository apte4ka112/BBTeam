<template>
  <div class="group p-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 hover:border-purple-500/50 transition-all duration-300 hover:bg-white/10 cursor-pointer">
    <div class="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">{{ icon }}</div>
    <h3 class="text-xl font-semibold text-white mb-2">{{ title }}</h3>
    <p class="text-white/50 text-sm leading-relaxed">{{ description }}</p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  icon: string
  title: string
  description: string
}>()
</script>
