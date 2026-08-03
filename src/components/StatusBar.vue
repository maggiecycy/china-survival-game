<script setup>
import { useGameStore } from '../stores/useGameStore'

const { playerState, language } = useGameStore()
</script>

<template>
  <header
    class="bg-stone-800 text-stone-200 px-3 py-2 lg:px-6 lg:py-2.5 text-[10px] lg:text-xs border-b border-stone-700 font-mono"
  >
    <div
      class="flex flex-wrap justify-between items-center gap-x-4 gap-y-1 lg:justify-start lg:gap-x-8"
    >
      <span>
        💰
        <template v-if="language === 'en'">Money</template>
        <template v-else>餘額</template>
        ￥{{ playerState.money }}
      </span>
      <span>
        🧠
        <template v-if="language === 'en'">Sanity</template>
        <template v-else>精神</template>
        {{ playerState.sanity }}
      </span>
      <span>
        ⏳
        <template v-if="language === 'en'">Time</template>
        <template v-else>時間</template>
        {{ Math.round(Number(playerState.timeRemaining) * 10) / 10 }}h
      </span>
      <span class="text-stone-400">
        🔋
        <template v-if="language === 'en'">Battery</template>
        <template v-else>電量</template>
        {{ playerState.battery ?? 100 }}%
      </span>
      <span class="text-stone-400">
        🧭
        <template v-if="language === 'en'">Locality</template>
        <template v-else>本地化</template>
        {{ playerState.locality ?? 0 }}
      </span>
    </div>
  </header>
</template>
