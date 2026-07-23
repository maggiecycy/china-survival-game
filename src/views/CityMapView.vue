<script setup>
import AttractionMap from '../components/AttractionMap.vue'
import { useGameStore } from '../stores/useGameStore'

const {
  language,
  currentCity,
  currentAttractions,
  visitedAttractionKeys,
  activeAttraction,
  playerState,
  needsLodgingNow,
  powerBankStatus,
  powerBankConfig,
  handleSelectAttraction,
  startAttraction,
  startLodgingIfNeeded,
  usePowerBank,
  leaveCityToWorldMap,
  t,
} = useGameStore()

const lodgingLabel = () => {
  const L = playerState.lodging
  if (!L) return language === 'en' ? 'No lodging' : '無有效住宿'
  const name = L.label ? t(L.label) : L.type
  if (L.nightsLeft == null) return `${name} · ￥${L.nightlyCost}/夜`
  return `${name} · 剩${L.nightsLeft}晚`
}

const powerBankHint = () => {
  if (powerBankStatus.ok) {
    return language === 'en'
      ? `Scan shared power bank · ￥${powerBankConfig.cost} → +${powerBankConfig.restore}%`
      : `掃共享充電寶 · ￥${powerBankConfig.cost} → 電量+${powerBankConfig.restore}`
  }
  const map = {
    needs_pay: language === 'en' ? 'Needs Alipay/WeChat linked' : '需已綁支付寶/微信',
    cash_only: language === 'en' ? 'Blocked by cash-only' : '現金路線不可用',
    broke: language === 'en' ? 'Not enough money' : '餘額不足',
    full: language === 'en' ? 'Battery full' : '電量已滿',
  }
  return map[powerBankStatus.reason] || (language === 'en' ? 'Unavailable' : '暫不可用')
}
</script>

<template>
  <section class="flex flex-col gap-4 fade-in">
    <div class="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm space-y-2">
      <h3 class="font-bold text-sm text-stone-900">
        {{ language === 'en' ? '📍 Explore' : '📍 探索' }} {{ currentCity?.name?.[language] }}
      </h3>
      <p class="text-xs text-stone-500 leading-relaxed">
        {{ language === 'en'
          ? 'Each pin is one day. Survive the day with battery > 0 to restore +50 overnight. Spot hustles inside attractions to earn RMB.'
          : '每個景點消耗一天。當天電量撐住（>0）則過夜回 +50。景點內可接奇葩賺錢支線補餘額。' }}
      </p>
      <p class="text-[10px] font-mono text-stone-400">
        🏨 {{ lodgingLabel() }} · 🔋 {{ playerState.battery }}%
      </p>

      <button
        @click="usePowerBank"
        :disabled="!powerBankStatus.ok"
        class="w-full text-left text-[11px] px-3 py-2 rounded-xl border transition"
        :class="powerBankStatus.ok
          ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
          : 'border-stone-200 bg-stone-50 text-stone-400 cursor-not-allowed'"
      >
        🔋 {{ powerBankHint() }}
      </button>

      <div
        v-if="needsLodgingNow"
        class="bg-amber-50 border border-amber-200 rounded-lg p-2 text-[10px] text-amber-800 font-semibold"
      >
        ⚠️ {{ language === 'en'
          ? 'You need lodging before the next attraction day.'
          : '開始下一個景點前，必須先解決住宿（沙發只能湊合一晚）。' }}
        <button @click="startLodgingIfNeeded" class="underline ml-1">
          {{ language === 'en' ? 'Resolve lodging' : '去安排住宿' }}
        </button>
      </div>
    </div>

    <AttractionMap
      v-if="currentCity"
      :city-id="currentCity.id"
      :attractions="currentAttractions"
      :visited-keys="visitedAttractionKeys"
      :language="language"
      @select-attraction="handleSelectAttraction"
    />

    <div v-if="activeAttraction" class="bg-white rounded-2xl p-4 border-2 border-amber-400 shadow-md space-y-3 fade-in">
      <div class="flex justify-between items-start gap-3">
        <div>
          <h4 class="font-black text-base text-stone-950">{{ activeAttraction.name[language] }}</h4>
          <p class="text-[10px] text-stone-400 font-mono mt-0.5">
            {{ language === 'en' ? 'Costs 1 day on completion' : '完成後消耗 1 天' }}
          </p>
        </div>
        <button
          @click="startAttraction(activeAttraction)"
          :disabled="needsLodgingNow"
          class="bg-amber-500 disabled:bg-stone-300 text-stone-950 font-bold text-xs px-4 py-2 rounded-xl shrink-0"
        >
          {{ language === 'en' ? 'Go' : '前往' }}
        </button>
      </div>
      <p class="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-100">
        {{ activeAttraction.desc[language] }}
      </p>
    </div>

    <button
      @click="leaveCityToWorldMap"
      class="text-xs text-stone-400 hover:text-stone-600 underline text-center py-2"
    >
      {{ language === 'en' ? '← Back to China map' : '← 返回中國地圖（規劃下一城）' }}
    </button>
  </section>
</template>
