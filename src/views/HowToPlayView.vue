<script setup>
import { useGameStore } from '../stores/useGameStore'
import gameIntro from '../content/gameIntro.json'

const { language, startVisaSelection, t } = useGameStore()
</script>

<template>
  <section class="flex flex-col gap-4 my-auto fade-in">
    <div class="text-center space-y-2 pt-2">
      <h2 class="text-xl font-black text-stone-900 tracking-tight">
        {{ t(gameIntro.title) }}
      </h2>
      <p class="text-xs text-stone-500 max-w-sm mx-auto leading-relaxed">
        {{ t(gameIntro.tagline) }}
      </p>
    </div>

    <div class="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 space-y-3 text-xs">
      <div>
        <p class="font-bold text-amber-700 mb-1">{{ t(gameIntro.goal.title) }}</p>
        <p class="text-stone-600 leading-relaxed">{{ t(gameIntro.goal.body) }}</p>
      </div>
      <div>
        <p class="font-bold text-red-600/90 mb-1">{{ t(gameIntro.lose.title) }}</p>
        <p class="text-stone-600 leading-relaxed">{{ t(gameIntro.lose.body) }}</p>
      </div>
      <div>
        <p class="font-bold text-stone-800 mb-1">{{ t(gameIntro.loop.title) }}</p>
        <p class="text-stone-600 leading-relaxed">{{ t(gameIntro.loop.body) }}</p>
      </div>
    </div>

    <div class="bg-stone-50 rounded-2xl border border-stone-200 p-4 space-y-2 text-[11px]">
      <p class="font-bold text-stone-800 text-xs">
        {{ language === 'en' ? 'Resources' : '資源說明' }}
      </p>
      <ul class="space-y-1.5 text-stone-600 leading-relaxed">
        <li v-for="stat in gameIntro.stats" :key="stat.key">
          {{ language === 'en' ? stat.en : stat.cn }}
        </li>
      </ul>
    </div>

    <div class="bg-white rounded-2xl border border-stone-200 p-4 space-y-2 text-[11px]">
      <p class="font-bold text-stone-800 text-xs">{{ t(gameIntro.tips.title) }}</p>
      <ul class="list-disc pl-4 space-y-1.5 text-stone-600 leading-relaxed">
        <li v-for="(tip, i) in gameIntro.tips.items" :key="i">
          {{ language === 'en' ? tip.en : tip.cn }}
        </li>
      </ul>
    </div>

    <button
      type="button"
      class="w-full bg-stone-900 text-stone-100 font-bold py-3 rounded-xl hover:bg-stone-800 transition active:scale-[0.98] shadow-sm"
      @click="startVisaSelection"
    >
      {{ t(gameIntro.cta) }}
    </button>
  </section>
</template>
