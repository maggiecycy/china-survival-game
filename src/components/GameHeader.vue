<script setup>
import { useGameStore } from '../stores/useGameStore'

const { language, gameConfig, toggleLanguage } = useGameStore()
</script>

<template>
  <header class="bg-stone-900 text-stone-100 p-4 flex justify-between items-center shadow-md border-b border-stone-800">
    <div class="flex flex-col">
      <h1 class="font-black text-sm tracking-widest text-amber-500">CHINA SURVIVAL</h1>
      <span class="text-[9px] text-stone-400 uppercase tracking-wider">v{{ gameConfig.version }} Alpha</span>
    </div>
    <button
      @click="toggleLanguage"
      class="bg-stone-800 border border-stone-700 px-3 py-1 rounded-lg text-xs font-medium hover:bg-stone-700 transition"
    >
      {{ language === 'en' ? '繁體中文' : 'English' }}
    </button>
  </header>
</template>
