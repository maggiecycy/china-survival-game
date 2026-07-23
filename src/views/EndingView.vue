<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/useGameStore'

const { language, playerState, visitedCities, activeEnding, t, resetGame } = useGameStore()

const isBad = computed(() => activeEnding.value?.type === 'bad')
</script>

<template>
  <section class="flex flex-col gap-4 fade-in my-auto text-center">
    <div class="text-6xl">{{ activeEnding?.icon || '🏁' }}</div>
    <h2 class="text-xl font-black text-stone-900">
      {{ activeEnding ? t(activeEnding.title) : (language === 'en' ? 'Journey Complete' : '旅程結束') }}
    </h2>
    <p class="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
      {{ activeEnding ? t(activeEnding.desc) : '' }}
    </p>
    <div class="text-[10px] font-mono text-stone-400 space-y-0.5">
      <p>💰 ￥{{ playerState.money }} · 🧠 {{ playerState.sanity }} · ⏳ {{ playerState.timeRemaining }}h</p>
      <p>🔋 {{ playerState.battery }}% · 🧭 {{ playerState.locality }} · 🏙 {{ visitedCities.length }}</p>
    </div>
    <span
      :class="[
        'text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider mx-auto',
        isBad ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
      ]"
    >
      {{ isBad ? (language === 'en' ? 'Bad End' : '壞結局') : (language === 'en' ? 'Good End' : '好結局') }}
    </span>
    <button
      @click="resetGame"
      class="bg-stone-900 text-stone-100 py-3 rounded-xl text-xs font-bold hover:bg-stone-800 active:scale-[0.98] transition shadow-md"
    >
      {{ language === 'en' ? 'Play Again' : '重新開始' }}
    </button>
  </section>
</template>
