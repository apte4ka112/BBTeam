<template>
  <NuxtPage />
</template>

<style>
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

@keyframes gradientText {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.gradient-blob {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 800px;
  height: 800px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(6, 182, 212, 0.1) 30%, rgba(139, 92, 246, 0.05) 50%, transparent 70%);
  border-radius: 50%;
  margin-left: -400px;
  margin-top: -400px;
  pointer-events: none;
  filter: blur(60px);
  z-index: 0;
  will-change: transform;
}

.animated-border {
  position: absolute;
  inset: 0;
  background: linear-gradient(60deg, #a855f7, #ec4899, #06b6d4, #a855f7);
  background-size: 300% 300%;
  animation: gradientShift 4s ease infinite;
  border-radius: 1.5rem;
}

.animate-gradient-text {
  background-size: 200% 200%;
  animation: gradientText 5s ease infinite;
}

.animate-pulse {
  animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.delay-1000 {
  animation-delay: 1s;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(15, 23, 42, 0.5);
}

::-webkit-scrollbar-thumb {
  background: rgba(139, 92, 246, 0.5);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(139, 92, 246, 0.7);
}
</style>
