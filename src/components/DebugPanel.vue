<script setup>
import { useGameStore } from '../stores/useGameStore'

const {
  language,
  currentStep,
  selectedVisa,
  playerState,
  visitedCities,
  visitedAttractionKeys,
  unlockedCityIds,
  gameLogs,
  resetGame,
} = useGameStore()

const labels = {
  en: {
    title: 'DEBUG / STATUS MONITOR',
    reset: 'RESET',
    step: 'Step',
    visa: 'Visa',
    money: 'Money',
    sanity: 'Sanity',
    time: 'Time',
    battery: 'Battery',
    locality: 'Locality',
    lodging: 'Lodging',
    tutorialDone: 'Tutorial done',
    city: 'Current city',
    node: 'Event node',
    lit: 'Lit attractions',
    visited: 'Visited',
    unlocked: 'Unlocked',
  },
  cn: {
    title: 'DEBUG / STATUS MONITOR',
    reset: '重置',
    step: '階段',
    visa: '簽證',
    money: '餘額',
    sanity: '精神',
    time: '時間',
    battery: '電量',
    locality: '本地化',
    lodging: '住宿',
    tutorialDone: '教學完成',
    city: '目前城市',
    node: '事件節點',
    lit: '已點亮景點',
    visited: '已抵達',
    unlocked: '已解鎖',
  },
}
</script>

<template>
  <div class="max-w-md w-full mx-auto mt-4 mb-8 p-4 bg-stone-900 text-amber-500 rounded-xl font-mono text-[10px] space-y-2">
    <div class="flex justify-between items-center border-b border-stone-700 pb-1">
      <p class="font-bold">{{ labels[language].title }}</p>
      <button @click="resetGame" class="text-red-400 hover:text-red-300 underline">
        {{ labels[language].reset }}
      </button>
    </div>

    <ul class="space-y-0.5">
      <li>🧭 {{ labels[language].step }}: {{ currentStep }}</li>
      <li>🎫 {{ labels[language].visa }}: {{ selectedVisa }}</li>
      <li>💰 {{ labels[language].money }}: {{ playerState.money }}</li>
      <li>🧠 {{ labels[language].sanity }}: {{ playerState.sanity }}</li>
      <li>⏳ {{ labels[language].time }}: {{ playerState.timeRemaining }}h</li>
      <li>🔋 {{ labels[language].battery }}: {{ playerState.battery }}</li>
      <li>🧭 {{ labels[language].locality }}: {{ playerState.locality }}</li>
      <li>
        🏨 {{ labels[language].lodging }}:
        {{
          playerState.lodging
            ? `${playerState.lodging.type}${playerState.lodging.nightsLeft != null ? `(${playerState.lodging.nightsLeft})` : ''}`
            : '-'
        }}
      </li>
      <li>🎓 {{ labels[language].tutorialDone }}: {{ playerState.isTutorialComplete }}</li>
      <li>📍 {{ labels[language].city }}: {{ playerState.currentCity || '-' }}</li>
      <li>📌 {{ labels[language].node }}: {{ playerState.currentNode || '-' }}</li>
      <li>✨ {{ labels[language].lit }}: {{ visitedAttractionKeys.length }}</li>
      <li>✅ {{ labels[language].visited }}: {{ visitedCities.join(', ') || '-' }}</li>
      <li>🔓 {{ labels[language].unlocked }}: {{ unlockedCityIds.join(', ') }}</li>
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
