<script setup>
import { useGameStore } from '../stores/useGameStore'

const {
  language,
  pendingDestination,
  travelModes,
  selectedTravelMode,
  travelEstimate,
  selectTravelMode,
  confirmTravel,
  cancelTravel,
  t,
} = useGameStore()

const formatEffect = (effect) => {
  if (!effect) return []
  const parts = []
  if (effect.money) parts.push(`💰 ${effect.money}`)
  if (effect.time) parts.push(`⏳ ${effect.time}h`)
  if (effect.sanity) parts.push(`🧠 ${effect.sanity}`)
  if (effect.battery) parts.push(`🔋 ${effect.battery}`)
  return parts
}
</script>

<template>
  <section class="flex flex-col gap-4 fade-in my-auto">
    <div class="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-2 text-center">
      <h3 class="font-black text-lg text-stone-950">
        {{ language === 'en' ? 'Choose Transport' : '選擇出行方式' }}
      </h3>
      <p class="text-xs text-stone-500">
        → {{ pendingDestination?.name?.[language] }}
      </p>
      <p class="text-[10px] text-stone-400 leading-relaxed">
        {{ language === 'en'
          ? 'Intercity travel costs money, time, sanity and battery. First departure from Beijing triggers a one-time transit event.'
          : '城際移動會消耗金錢、時間、精神與電量。首次離開北京會觸發一次性交通事件。' }}
      </p>
    </div>

    <div class="flex flex-col gap-2">
      <button
        v-for="mode in travelModes"
        :key="mode.id"
        @click="selectTravelMode(mode.id)"
        :class="[
          'text-left bg-white border-2 rounded-2xl p-4 transition shadow-sm space-y-1',
          selectedTravelMode === mode.id ? 'border-amber-500' : 'border-stone-200 hover:border-amber-300'
        ]"
      >
        <div class="flex justify-between items-center">
          <span class="text-sm font-bold text-stone-900">{{ t(mode.label) }}</span>
          <span class="text-[10px] font-mono text-stone-400 uppercase">{{ mode.id }}</span>
        </div>
        <p class="text-[11px] text-stone-500 leading-relaxed">{{ t(mode.desc) }}</p>
      </button>
    </div>

    <div
      v-if="travelEstimate"
      class="bg-stone-900 text-amber-400 rounded-xl p-3 font-mono text-[10px] flex flex-wrap gap-3 justify-center"
    >
      <span v-for="(p, i) in formatEffect(travelEstimate.effect)" :key="i">{{ p }}</span>
    </div>

    <div class="flex gap-2">
      <button
        @click="cancelTravel"
        class="flex-1 border border-stone-300 text-stone-600 py-3 rounded-xl text-xs font-bold hover:bg-stone-50"
      >
        {{ language === 'en' ? 'Cancel' : '取消' }}
      </button>
      <button
        @click="confirmTravel"
        class="flex-[2] bg-amber-500 text-stone-950 py-3 rounded-xl text-xs font-bold hover:bg-amber-400 active:scale-[0.98] transition"
      >
        {{ language === 'en' ? 'Depart' : '確認出發' }}
      </button>
    </div>
  </section>
</template>
