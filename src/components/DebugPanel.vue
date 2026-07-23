<script setup>
import { useGameStore } from '../stores/useGameStore'

const {
  currentStep,
  selectedVisa,
  playerState,
  visitedCities,
  visitedAttractionKeys,
  unlockedCityIds,
  gameLogs,
  resetGame,
} = useGameStore()
</script>

<template>
  <div class="max-w-md w-full mx-auto mt-4 mb-8 p-4 bg-stone-900 text-amber-500 rounded-xl font-mono text-[10px] space-y-2">
    <div class="flex justify-between items-center border-b border-stone-700 pb-1">
      <p class="font-bold">DEBUG / STATUS MONITOR</p>
      <button @click="resetGame" class="text-red-400 hover:text-red-300 underline">RESET</button>
    </div>

    <ul class="space-y-0.5">
      <li>🧭 階段: {{ currentStep }}</li>
      <li>🎫 簽證: {{ selectedVisa }}</li>
      <li>💰 餘額: {{ playerState.money }}</li>
      <li>🧠 精神: {{ playerState.sanity }}</li>
      <li>⏳ 時間: {{ playerState.timeRemaining }}h</li>
      <li>🔋 電量: {{ playerState.battery }}</li>
      <li>🧭 本地化: {{ playerState.locality }}</li>
      <li>🏨 住宿: {{ playerState.lodging ? `${playerState.lodging.type}${playerState.lodging.nightsLeft != null ? `(${playerState.lodging.nightsLeft})` : ''}` : '-' }}</li>
      <li>🎓 教學完成: {{ playerState.isTutorialComplete }}</li>
      <li>📍 目前城市: {{ playerState.currentCity || '-' }}</li>
      <li>📌 事件節點: {{ playerState.currentNode || '-' }}</li>
      <li>✨ 已點亮景點: {{ visitedAttractionKeys.length }}</li>
      <li>✅ 已抵達: {{ visitedCities.join(', ') || '-' }}</li>
      <li>🔓 已解鎖: {{ unlockedCityIds.join(', ') }}</li>
    </ul>

    <div v-if="playerState.activeEffects.length" class="flex flex-wrap gap-1 pt-1">
      <span
        v-for="flag in playerState.activeEffects"
        :key="flag"
        class="bg-stone-800 border border-stone-700 px-1.5 py-0.5 rounded text-[9px]"
      >
        🏷️ {{ flag }}
      </span>
    </div>

    <div class="pt-2 border-t border-stone-800 max-h-32 overflow-y-auto space-y-1">
      <p v-for="(logItem, index) in gameLogs" :key="index" class="text-stone-400">
        <span class="text-stone-600">[{{ logItem.time }}]</span> {{ logItem.icon }} {{ logItem.text }}
      </p>
    </div>
  </div>
</template>
