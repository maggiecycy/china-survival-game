<script setup>
import { useGameStore } from '../stores/useGameStore'

const { language, flightTarget, progress } = useGameStore()
</script>

<template>
  <section class="my-auto text-center space-y-8 px-6 fade-in">
    <div class="text-7xl animate-bounce-slow select-none">✈️</div>
    <div class="space-y-2">
      <h2 class="text-xl font-bold text-stone-900 tracking-tight">
        {{ language === 'en' ? `Flying to ${flightTarget?.en}...` : `正在飛往 ${flightTarget?.cn}...` }}
      </h2>
      <p class="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
        {{ language === 'en' ? 'Bracing for landing. Ready your passport and survival mind!' : '即將降落。請準備好你的護照與生存意志！' }}
      </p>
    </div>

    <div class="space-y-2 max-w-xs mx-auto pt-4">
      <div class="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden shadow-inner">
        <div
          class="bg-amber-500 h-full transition-all duration-75 ease-out rounded-full"
          :style="{ width: `${progress}%` }"
        ></div>
      </div>
      <div class="flex justify-between text-[10px] font-mono text-stone-400 font-bold px-1">
        <span>DESCENT IN PROGRESS</span>
        <span>{{ Math.round(progress) }}%</span>
      </div>
    </div>
  </section>
</template>
