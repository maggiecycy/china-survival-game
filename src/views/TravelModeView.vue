<script setup>
import { useGameStore } from '../stores/useGameStore'

const {
  language,
  pendingDestination,
  selectedTravelMode,
  travelEstimate,
  travelModeOptions,
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
          ? 'Fares use city-pair averages. Greyed modes are not available on this route.'
          : '票價按城際對的公開均價。置灰表示此路線無該交通方式。' }}
      </p>
    </div>

    <div class="flex flex-col gap-2">
      <button
        v-for="opt in travelModeOptions"
        :key="opt.mode.id"
        type="button"
        :disabled="!opt.available"
        @click="selectTravelMode(opt.mode.id)"
        :class="[
          'text-left border-2 rounded-2xl p-4 transition shadow-sm space-y-1',
          !opt.available
            ? 'bg-stone-100 border-stone-200 opacity-50 cursor-not-allowed'
            : selectedTravelMode === opt.mode.id
              ? 'bg-white border-amber-500'
              : 'bg-white border-stone-200 hover:border-amber-300'
        ]"
      >
        <div class="flex justify-between items-center gap-2">
          <span class="text-sm font-bold" :class="opt.available ? 'text-stone-900' : 'text-stone-400'">
            {{ t(opt.mode.label) }}
          </span>
          <span v-if="opt.available" class="text-[10px] font-mono text-amber-700 shrink-0">
            ￥{{ Math.abs(opt.effect.money) }} · {{ Math.abs(opt.effect.time) }}h
          </span>
          <span v-else class="text-[10px] font-mono text-stone-400 shrink-0">
            {{ language === 'en' ? 'N/A' : '不可用' }}
          </span>
        </div>
        <p class="text-[11px] leading-relaxed" :class="opt.available ? 'text-stone-500' : 'text-stone-400'">
          {{ opt.available ? t(opt.mode.desc) : t(opt.unavailableReason) }}
        </p>
      </button>
    </div>

    <div
      v-if="travelEstimate?.available"
      class="bg-stone-900 text-amber-400 rounded-xl p-3 font-mono text-[10px] flex flex-wrap gap-3 justify-center"
    >
      <span v-for="(p, i) in formatEffect(travelEstimate.effect)" :key="i">{{ p }}</span>
      <span v-if="travelEstimate.estimated" class="text-stone-500">
        {{ language === 'en' ? '(est.)' : '(估算)' }}
      </span>
    </div>

    <div class="flex gap-2">
      <button
        type="button"
        @click="cancelTravel"
        class="flex-1 border border-stone-300 text-stone-600 py-3 rounded-xl text-xs font-bold hover:bg-stone-50"
      >
        {{ language === 'en' ? 'Cancel' : '取消' }}
      </button>
      <button
        type="button"
        @click="confirmTravel"
        :disabled="!travelEstimate?.available"
        class="flex-[2] bg-amber-500 disabled:bg-stone-300 text-stone-950 py-3 rounded-xl text-xs font-bold hover:bg-amber-400 active:scale-[0.98] transition"
      >
        {{ language === 'en' ? 'Depart' : '確認出發' }}
      </button>
    </div>
  </section>
</template>
