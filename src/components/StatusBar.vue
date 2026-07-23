<script setup>
import { useGameStore } from '../stores/useGameStore'

const { playerState } = useGameStore()
</script>

<template>
  <header class="bg-stone-800 text-stone-200 px-3 py-2 text-[10px] border-b border-stone-700 font-mono space-y-1">
    <div class="flex justify-between items-center gap-2">
      <span>💰 ￥{{ playerState.money }}</span>
      <span>🧠 {{ playerState.sanity }}</span>
      <span>⏳ {{ playerState.timeRemaining }}h</span>
    </div>
    <div class="flex justify-between items-center gap-2 text-stone-400">
      <span>🔋 {{ playerState.battery ?? 100 }}%</span>
      <span>🧭 Locality {{ playerState.locality ?? 0 }}</span>
    </div>
  </header>
</template>
