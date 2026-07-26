<script setup>
import { useGameStore } from '../stores/useGameStore'

const { playerState, language } = useGameStore()
</script>

<template>
  <header class="bg-stone-800 text-stone-200 px-3 py-2 text-[10px] border-b border-stone-700 font-mono space-y-1">
    <div class="flex justify-between items-center gap-2">
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
        {{ playerState.timeRemaining }}h
      </span>
    </div>
    <div class="flex justify-between items-center gap-2 text-stone-400">
      <span>
        🔋
        <template v-if="language === 'en'">Battery</template>
        <template v-else>電量</template>
        {{ playerState.battery ?? 100 }}%
      </span>
      <span>
        🧭
        <template v-if="language === 'en'">Locality</template>
        <template v-else>本地化</template>
        {{ playerState.locality ?? 0 }}
      </span>
    </div>
  </header>
</template>
