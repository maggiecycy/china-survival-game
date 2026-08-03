<script setup>
import { ref } from 'vue'
import { useGameStore } from '../stores/useGameStore'
import gameIntro from '../content/gameIntro.json'

const { language, startVisaSelection, t } = useGameStore()

const open = ref({
  howto: false,
  resources: false,
  tips: false,
})

const toggle = (key) => {
  open.value[key] = !open.value[key]
}

const panels = [
  { key: 'howto', data: gameIntro.howto },
  { key: 'resources', data: gameIntro.resources },
  { key: 'tips', data: gameIntro.tips },
]
</script>

<template>
  <section class="flex flex-col gap-4 fade-in w-full max-w-xl mx-auto lg:max-w-none">
    <div class="text-center space-y-2">
      <h2 class="text-2xl lg:text-3xl font-black text-stone-900 tracking-tight">
        {{ t(gameIntro.title) }}
      </h2>
      <p class="text-sm text-stone-500 max-w-lg mx-auto leading-relaxed">
        {{ t(gameIntro.tagline) }}
      </p>
    </div>

    <button
      type="button"
      class="w-full lg:max-w-md lg:mx-auto bg-stone-900 text-stone-100 font-bold py-3.5 rounded-xl hover:bg-stone-800 transition active:scale-[0.98] shadow-sm text-sm tracking-wide"
      @click="startVisaSelection"
    >
      {{ t(gameIntro.cta) }}
    </button>

    <p class="text-center text-[11px] text-stone-400">
      {{ language === 'en' ? 'Optional notes — expand if you must.' : '说明可选：非必要可不看。' }}
    </p>

    <div class="flex flex-col gap-2 lg:grid lg:grid-cols-3 lg:gap-3 lg:items-start">
      <div
        v-for="panel in panels"
        :key="panel.key"
        class="bg-white border border-stone-200 rounded-xl overflow-hidden self-start w-full"
      >
        <button
          type="button"
          class="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-stone-50 transition"
          @click="toggle(panel.key)"
        >
          <span class="text-xs font-bold text-stone-800">{{ t(panel.data.title) }}</span>
          <span class="text-[10px] font-mono text-stone-400 shrink-0">
            {{ open[panel.key] ? t(gameIntro.collapse) : t(gameIntro.expand) }}
            {{ open[panel.key] ? '▴' : '▾' }}
          </span>
        </button>
        <div
          v-show="open[panel.key]"
          class="px-4 pb-3 text-[11px] text-stone-600 leading-relaxed border-t border-stone-100 pt-2"
        >
          {{ t(panel.data.body) }}
        </div>
      </div>
    </div>
  </section>
</template>
