<script setup>
import ChinaMap from '../components/ChinaMap.vue'
import { useGameStore } from '../stores/useGameStore'

const {
  language,
  cities,
  selectedVisa,
  unlockedCityIds,
  visitedCities,
  activeCity,
  playerState,
  handleSelectCity,
  travelToCity,
  cityUnlocked,
  cityRestricted,
  getUnlocksFrom,
  goToVisaSelection,
} = useGameStore()
</script>

<template>
  <section class="flex flex-col gap-4 fade-in">
    <div class="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm">
      <h3 class="font-bold text-sm mb-1 text-stone-900">
        {{ language === 'en' ? '🗺️ Select Destination' : '🗺️ 選擇你的目的地' }}
      </h3>
      <p class="text-xs text-stone-500 leading-relaxed">
        {{ language === 'en'
          ? 'Pick a city. Leaving costs money/time — first exit from Beijing triggers a one-time transit event.'
          : '點選城市。離城會花時間與錢；首次離開北京會觸發一次性交通事件。' }}
      </p>
      <p class="text-[10px] font-mono text-stone-400 mt-2">
        {{ language === 'en' ? `Visited: ${visitedCities.length} / ${cities.length}` : `已抵達城市：${visitedCities.length} / ${cities.length}` }}
      </p>
    </div>

    <ChinaMap
      :cities="cities"
      :language="language"
      :currentVisa="selectedVisa"
      :unlockedCities="unlockedCityIds"
      @select-city="handleSelectCity"
    />

    <div v-if="activeCity" class="bg-white rounded-2xl p-4 border-2 border-amber-400 shadow-md fade-in space-y-3">
      <div class="flex justify-between items-start gap-3">
        <div>
          <h4 class="font-black text-lg text-stone-950">📍 {{ activeCity.name[language] }}</h4>
          <span class="text-[10px] uppercase font-mono text-stone-400 tracking-wider">
            {{ activeCity.tier }} tier · ￥{{ activeCity.baseCost }}
          </span>
        </div>
        <button
          @click="travelToCity(activeCity)"
          :disabled="!cityUnlocked(activeCity)"
          class="bg-amber-500 disabled:bg-stone-300 disabled:cursor-not-allowed text-stone-950 font-bold text-xs px-4 py-2 rounded-xl shadow-md hover:bg-amber-400 active:scale-95 transition shrink-0"
        >
          {{
            playerState.currentCity === activeCity.id
              ? (language === 'en' ? 'Open City Map' : '打開城市景點地圖')
              : (language === 'en' ? 'Travel Here' : '出發前往')
          }}
        </button>
      </div>

      <p class="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-100">
        {{ activeCity.desc[language] }}
      </p>

      <div
        v-if="cityRestricted(activeCity)"
        class="bg-red-50 border border-red-200 rounded-lg p-2 text-[10px] text-red-600 font-semibold leading-relaxed"
      >
        ⚠️ {{ language === 'en' ? 'Your current visa does not permit entry here! Entering will trigger deportation.' : '你目前的簽證類型不允許進入此地！強行前往將被直接遣返。' }}
      </div>

      <div v-if="getUnlocksFrom(activeCity).length" class="text-[10px] text-stone-400">
        🔓 {{ language === 'en' ? 'Unlocks after visiting:' : '抵達後將解鎖：' }}
        {{ getUnlocksFrom(activeCity).map(c => c.name[language]).join('、') }}
      </div>
    </div>

    <button
      @click="goToVisaSelection"
      class="text-xs text-stone-400 hover:text-stone-600 transition text-center underline py-2"
    >
      {{ language === 'en' ? '← Change Visa Type' : '← 重新選擇簽證類型' }}
    </button>
  </section>
</template>
