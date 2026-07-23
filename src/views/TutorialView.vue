<script setup>
import { useGameStore } from '../stores/useGameStore'

const {
  language,
  tutorial,
  tutorialStageIndex,
  currentTutorialStage,
  tutorialFeedback,
  t,
  chooseTutorialOption,
  confirmTutorialFeedback,
} = useGameStore()
</script>

<template>
  <section class="flex flex-col gap-4 fade-in my-auto">
    <div class="flex justify-center gap-2">
      <span
        v-for="(stage, idx) in tutorial.stages"
        :key="stage.id"
        :class="[
          'w-2.5 h-2.5 rounded-full transition-all',
          idx === tutorialStageIndex ? 'bg-amber-500 scale-125' : idx < tutorialStageIndex ? 'bg-stone-400' : 'bg-stone-200'
        ]"
      ></span>
    </div>

    <div class="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-3">
      <span class="bg-red-100 text-red-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider inline-block">
        {{ language === 'en' ? 'Beijing Tutorial' : '北京生存教學' }} · {{ tutorialStageIndex + 1 }} / {{ tutorial.stages.length }}
      </span>
      <h3 class="font-black text-lg text-stone-950">{{ t(currentTutorialStage.title) }}</h3>
      <p class="text-xs text-stone-600 leading-relaxed">{{ t(currentTutorialStage.desc) }}</p>
    </div>

    <div class="flex flex-col gap-3">
      <button
        v-for="option in currentTutorialStage.options"
        :key="option.id"
        @click="chooseTutorialOption(option)"
        class="text-left bg-white border-2 border-stone-200 rounded-2xl p-4 hover:border-amber-400 active:scale-[0.98] transition shadow-sm space-y-2"
      >
        <p class="text-xs font-bold text-stone-900 leading-relaxed">{{ t(option.text) }}</p>
        <div class="flex flex-wrap gap-2 text-[10px] font-mono text-stone-400">
          <span v-if="option.cost.money">💰 -{{ option.cost.money }}</span>
          <span v-if="option.cost.sanity != null">🧠 {{ option.cost.sanity >= 0 ? '+' : '' }}{{ option.cost.sanity }}</span>
          <span v-if="option.cost.time">⏳ -{{ option.cost.time }}h</span>
          <span v-if="option.cost.battery">🔋 {{ option.cost.battery }}</span>
          <span v-if="option.cost.locality">🧭 {{ option.cost.locality >= 0 ? '+' : '' }}{{ option.cost.locality }}</span>
        </div>
      </button>
    </div>

    <div v-if="tutorialFeedback" class="fixed inset-0 bg-stone-950/60 flex items-center justify-center p-6 z-50 fade-in">
      <div class="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl scale-in">
        <div class="text-4xl text-center">📝</div>
        <p class="text-xs text-stone-700 leading-relaxed">{{ t(tutorialFeedback) }}</p>
        <button
          @click="confirmTutorialFeedback"
          class="w-full bg-stone-900 text-stone-100 font-bold py-2.5 rounded-xl hover:bg-stone-800 transition active:scale-[0.98]"
        >
          {{ language === 'en' ? 'Continue' : '繼續' }}
        </button>
      </div>
    </div>
  </section>
</template>
