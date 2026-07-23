<script setup>
defineProps({
  attractions: { type: Array, required: true },
  visitedKeys: { type: Array, default: () => [] },
  language: { type: String, default: 'cn' },
  cityId: { type: String, required: true },
})

const emit = defineEmits(['select-attraction'])

const isLit = (attraction, cityId, visitedKeys) =>
  visitedKeys.includes(`${cityId}:${attraction.id}`)
</script>

<template>
  <div class="w-full bg-stone-900 border-2 border-stone-800 rounded-2xl p-4 shadow-inner relative select-none">
    <div class="flex justify-between items-center mb-3">
      <h3 class="text-xs font-bold text-stone-400 uppercase tracking-widest">
        🗺️ {{ language === 'en' ? 'City Attractions' : '城市景點地圖' }}
      </h3>
      <span class="text-[10px] text-amber-500 font-mono">
        {{ visitedKeys.filter(k => k.startsWith(cityId + ':')).length }}/{{ attractions.length }}
      </span>
    </div>

    <div class="relative w-full aspect-[4/3] bg-stone-950 rounded-xl overflow-hidden border border-stone-800">
      <div class="absolute inset-0 opacity-20 pointer-events-none"
        style="background-image: radial-gradient(circle at 30% 40%, #44403c 0.5px, transparent 0.6px); background-size: 12px 12px;"
      ></div>

      <button
        v-for="spot in attractions"
        :key="spot.id"
        @click="emit('select-attraction', spot)"
        :style="{ left: spot.coords.x + '%', top: spot.coords.y + '%' }"
        class="absolute -translate-x-1/2 -translate-y-1/2 group z-10 focus:outline-none"
      >
        <span
          v-if="isLit(spot, cityId, visitedKeys)"
          class="absolute inline-flex h-6 w-6 rounded-full bg-emerald-400 opacity-30 animate-ping"
        ></span>
        <div
          :class="[
            isLit(spot, cityId, visitedKeys)
              ? 'bg-emerald-400 border-stone-900 text-stone-950'
              : 'bg-amber-400 border-stone-900 text-stone-950 hover:scale-125',
            'w-5 h-5 rounded-full border-2 flex items-center justify-center text-[9px] font-bold transition-transform shadow-md'
          ]"
        >
          {{ isLit(spot, cityId, visitedKeys) ? '✓' : '◎' }}
        </div>
        <div class="absolute bottom-6 left-1/2 -translate-x-1/2 bg-stone-900 text-stone-100 text-[10px] px-2 py-1 rounded-md border border-stone-700 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
          {{ spot.name[language] }}
        </div>
      </button>
    </div>

    <div class="mt-3 flex gap-4 justify-center text-[10px] text-stone-400">
      <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span> {{ language === 'en' ? 'Available' : '可前往' }}</span>
      <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span> {{ language === 'en' ? 'Completed' : '已點亮' }}</span>
    </div>
  </div>
</template>
