<script setup>
import { useGameStore } from '../stores/useGameStore'

const {
  language,
  visas,
  expandedVisa,
  countrySearchQuery,
  toggleExpand,
  countryStatus,
  selectVisa,
  t,
} = useGameStore()

const badgeClass = {
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  amber: 'bg-amber-100 text-amber-800',
}

const visaOrder = ['144', 'Visa-Free', 'L']
</script>

<template>
  <section class="flex flex-col gap-4 my-auto fade-in">
    <div class="text-center space-y-2 py-4">
      <h2 class="text-2xl font-black text-stone-900 tracking-tight">
        {{ language === 'en' ? 'Choose Your Visa' : '選擇你的中國簽證' }}
      </h2>
      <p class="text-xs text-stone-500 max-w-xs mx-auto">
        {{ language === 'en' ? 'Your survival difficulty and routing depend entirely on this document.' : '入境文件將直接決定你的生存難度與活動範圍。' }}
      </p>
    </div>

    <div class="flex flex-col gap-3">
      <div
        v-for="visaId in visaOrder"
        :key="visaId"
        :class="[
          'bg-white border-2 rounded-2xl transition-all shadow-sm overflow-hidden',
          expandedVisa === visaId ? 'border-amber-500 shadow-md' : 'border-stone-200'
        ]"
      >
        <div class="p-4 cursor-pointer hover:bg-stone-50/50 flex flex-col gap-1" @click="toggleExpand(visaId)">
          <div class="flex justify-between items-center">
            <span class="font-bold text-sm text-stone-900">{{ visas[visaId].label.en }}</span>
            <span :class="['text-[10px] font-bold px-2 py-0.5 rounded', badgeClass[visas[visaId].badgeTone] || badgeClass.amber]">
              {{ visas[visaId].badge.en }}
            </span>
          </div>
          <p class="text-xs text-stone-500 leading-normal">{{ t(visas[visaId].summary) }}</p>
          <div class="flex justify-between items-center mt-2 text-[10px] text-amber-600 font-medium">
            <span>{{ expandedVisa === visaId ? '▲ 收起詳情 (Close)' : '▼ 展開查看適用國家 (Check Countries)' }}</span>
            <span class="text-stone-400 font-mono">{{ visas[visaId].durationLabel }}</span>
          </div>
        </div>

        <div v-if="expandedVisa === visaId" class="bg-stone-50 p-4 border-t border-stone-100 space-y-3 text-xs">
          <div>
            <p class="font-bold text-stone-800">📍 {{ language === 'en' ? 'Allowed Regions' : '允許活動區域' }}:</p>
            <p class="text-stone-600 text-[11px] mt-0.5">{{ visas[visaId].regions[language] }}</p>
          </div>

          <div class="space-y-2">
            <label class="font-bold text-stone-800 block">{{ language === 'en' ? 'Check Your Passport:' : '驗證你的護照國籍:' }}</label>
            <input
              v-model="countrySearchQuery"
              type="text"
              :placeholder="language === 'en' ? 'e.g. United States, France...' : '例如：United States, France...'"
              class="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 shadow-inner"
              @click.stop
            />
            <div v-if="countrySearchQuery" class="text-[11px] font-semibold mt-1">
              <template v-if="visas[visaId].allCountries">
                <span class="text-green-600">
                  ✅ {{ language === 'en' ? 'Eligible! All nationalities can apply for a Tourist L-Visa.' : '完全符合！所有國籍均可自費申請 L 簽證。' }}
                </span>
              </template>
              <template v-else>
                <span v-if="countryStatus(visas[visaId].list) === 'eligible'" class="text-green-600">
                  ✅ {{ language === 'en' ? 'Eligible for this entry type.' : '符合資格！' }}
                </span>
                <span v-else class="text-red-500">
                  ❌ {{ language === 'en' ? 'Not found/Not eligible. (Double check spelling)' : '未找到或不符合此免簽資格。（請檢查英文拼寫）' }}
                </span>
              </template>
            </div>
          </div>

          <div>
            <p class="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-1">
              {{ language === 'en' ? 'Eligible Countries' : '適用國家' }}:
            </p>
            <div v-if="visas[visaId].allCountries">
              <span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                {{ language === 'en' ? 'Global / All Passports' : '全球所有護照通用' }}
              </span>
            </div>
            <div v-else class="flex flex-wrap gap-1">
              <span
                v-for="c in visas[visaId].list.slice(0, visas[visaId].eligibleCountHint ? 10 : undefined)"
                :key="c"
                class="bg-stone-200/60 text-stone-600 text-[10px] px-2 py-0.5 rounded-md"
              >
                {{ c }}
              </span>
              <span
                v-if="visas[visaId].eligibleCountHint"
                class="text-stone-400 text-[10px] px-1 py-0.5"
              >
                ...and {{ visas[visaId].eligibleCountHint - 10 }} more
              </span>
            </div>
          </div>

          <button
            @click.stop="selectVisa(visaId)"
            class="w-full bg-stone-900 text-stone-100 font-bold py-2.5 rounded-xl hover:bg-stone-800 transition active:scale-[0.98] mt-2 shadow-sm"
          >
            {{ language === 'en' ? `Confirm ${visas[visaId].durationLabel}` : `確認持 ${visas[visaId].durationLabel} 入境` }}
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
