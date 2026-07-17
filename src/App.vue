<script setup>
import { ref, reactive, computed, provide } from 'vue'
import citiesData from './data/cities.json'
import tutorialData from './data/tutorial.json'
import ChinaMap from './components/ChinaMap.vue'

/* =========================================================================================
 * Part 1：全域狀態（State）
 * =========================================================================================
 * 流程：
 *   visa-selection → arrival-loading → tutorial（三關） → map-planning
 *   → city-event（點城市 → 城市事件 → 解鎖下一座城市） → ... → ending（香港離境）
 * ========================================================================================= */

// ---------- 介面語言 / 流程控制 ----------
const language = ref('cn')
const currentStep = ref('visa-selection') // visa-selection | arrival-loading | tutorial | map-planning | city-event | ending
const progress = ref(0)          // 飛行動畫進度 0~100
const flightTarget = ref(null)   // 飛行動畫目的地名稱 { cn, en }
let flightTimer = null           // 飛行動畫計時器控制代碼

// ---------- 玩家狀態（provide 給所有子組件） ----------
const playerState = reactive({
  money: 1200,              // 初始資金
  sanity: 100,               // 精神值 0~100
  timeRemaining: 0,          // 剩餘時間（依簽證類型決定）
  isTutorialComplete: false, // 是否完成北京 Tutorial
  isVisaVerified: false,     // 是否已確認簽證
  currentTutorialStage: 0,   // 目前 Tutorial 關卡索引
  activeEffects: [],         // 標記陣列，如 'has_local_number' / 'cash_only' 等
  currentCity: null,         // 玩家目前所在城市 id
})

// ---------- 簽證資料 ----------
const selectedVisa = ref('L')        // 預設旅遊簽
const expandedVisa = ref(null)       // 目前展開的簽證卡片
const countrySearchQuery = ref('')   // 護照國籍搜尋關鍵字

const visaCountries = {
  '144': {
    regions: {
      cn: '京津冀、長三角、粵港澳大灣區、成渝、遼寧、山東、陝西、武漢、昆明、廈門等區域指定口岸（共54個國家適用）',
      en: 'Beijing-Tianjin-Hebei, Yangtze River Delta, Greater Bay Area, Chengdu-Chongqing, etc. via designated ports (54 countries eligible)'
    },
    list: [
      'Austria', 'Belgium', 'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany',
      'Greece', 'Hungary', 'Iceland', 'Italy', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta',
      'Netherlands', 'Poland', 'Portugal', 'Slovakia', 'Slovenia', 'Spain', 'Sweden', 'Switzerland',
      'Russia', 'United Kingdom', 'Ireland', 'Cyprus', 'Bulgaria', 'Romania', 'Ukraine', 'Serbia',
      'Croatia', 'Bosnia and Herzegovina', 'Montenegro', 'North Macedonia', 'Albania', 'Monaco', 'Belarus',
      'United States', 'Canada', 'Brazil', 'Mexico', 'Argentina', 'Chile',
      'Australia', 'New Zealand',
      'South Korea', 'Japan', 'Singapore', 'Brunei', 'United Arab Emirates', 'Qatar'
    ]
  },
  'Visa-Free': {
    regions: {
      cn: '全中國境內（特定管制區域如西藏除外，普通護照持有人免簽停留不超過30天）',
      en: 'All of Mainland China (except restricted areas like Tibet, ordinary passport holders up to 30 days)'
    },
    list: [
      'France', 'Germany', 'Italy', 'Netherlands', 'Spain', 'Switzerland', 'Ireland', 'Hungary',
      'Austria', 'Belgium', 'Luxembourg', 'Poland', 'Portugal', 'Greece', 'Cyprus', 'Slovenia',
      'Slovakia', 'Norway', 'Finland', 'Denmark', 'Iceland', 'Monaco', 'Liechtenstein', 'Andorra',
      'Sweden', 'Bulgaria', 'Romania', 'Croatia', 'Montenegro', 'North Macedonia', 'Estonia', 'Latvia',
      'Singapore', 'Thailand', 'Malaysia', 'Brunei', 'Japan', 'South Korea', 'Australia', 'New Zealand',
      'Argentina', 'Brazil', 'Chile', 'Peru', 'Uruguay'
    ]
  },
  'L': {
    regions: {
      cn: '全中國境內（自由度最高，但西藏仍需額外申請入藏函）',
      en: 'All of Mainland China (Highest freedom, Tibet still requires Tibet Travel Permit)'
    },
    list: ['All Countries / 所有國家']
  }
}

// ---------- Tutorial（北京三關） ----------
const tutorialStageIndex = ref(0)          // 目前關卡索引 0~2
const tutorialFeedback = ref(null)         // 選擇後顯示的 Feedback 內容 { cn, en }
const tutorialSelectedOptionId = ref(null) // 目前選中的選項 id（用於樣式高亮）
const currentTutorialStage = computed(() => tutorialData.stages[tutorialStageIndex.value])

// ---------- 世界地圖 / 城市 ----------
const visitedCities = ref([])       // 已完成事件的城市 id（用於 Unlock 判斷）
const activeCity = ref(null)        // 地圖上目前選中的城市卡片資料
const currentCityEvent = ref(null)  // 城市事件內容 { restricted, city, event }

// ---------- Game Log ----------
const gameLogs = ref([]) // { icon, text, time }

// ---------- 共享給子組件 ----------
provide('playerState', playerState)
provide('citiesData', citiesData)
provide('tutorialData', tutorialData)


/* =========================================================================================
 * Part 2：Methods
 * ========================================================================================= */

// ---------- 共用小工具 ----------
const t = (bilingualObj) => (bilingualObj ? bilingualObj[language.value] : '')

const clampStats = () => {
  if (playerState.sanity < 0) playerState.sanity = 0
  if (playerState.sanity > 100) playerState.sanity = 100
  if (playerState.money < 0) playerState.money = 0
  if (playerState.timeRemaining < 0) playerState.timeRemaining = 0
}

const addLog = (icon, text) => {
  gameLogs.value.unshift({
    icon,
    text,
    time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
  })
}

// ---------- 語言切換 / 簽證卡片互動 ----------
const toggleLanguage = () => {
  language.value = language.value === 'en' ? 'cn' : 'en'
}

const toggleExpand = (visaType) => {
  if (expandedVisa.value === visaType) {
    expandedVisa.value = null
  } else {
    expandedVisa.value = visaType
    countrySearchQuery.value = ''
  }
}

const checkCountryStatus = (countryList) => {
  if (!countrySearchQuery.value) return null
  const query = countrySearchQuery.value.toLowerCase().trim()
  if (countryList.includes('All Countries / 所有國家')) return 'eligible'
  const found = countryList.some(c => c.toLowerCase().includes(query))
  return found ? 'eligible' : 'not-eligible'
}

// ---------- 飛行動畫（可重複使用：入境北京 / 城市間移動） ----------
const flyTo = (targetName, durationMs, onComplete) => {
  flightTarget.value = targetName
  currentStep.value = 'arrival-loading'
  progress.value = 0
  if (flightTimer) clearInterval(flightTimer)

  const stepMs = 30
  const stepValue = 100 / (durationMs / stepMs)

  flightTimer = setInterval(() => {
    if (progress.value < 100) {
      progress.value = Math.min(100, progress.value + stepValue)
    } else {
      clearInterval(flightTimer)
      flightTimer = null
      onComplete()
    }
  }, stepMs)
}

// ---------- Visa Selection ----------
const selectVisa = (visaType) => {
  selectedVisa.value = visaType
  playerState.isVisaVerified = true
  playerState.timeRemaining = visaType === '144' ? 144 : 720
  playerState.currentCity = 'beijing'

  addLog('🛂', language.value === 'en' ? `Visa confirmed: ${visaType}` : `簽證確認：${visaType}`)

  flyTo({ cn: '北京', en: 'Beijing' }, 3000, () => {
    currentStep.value = 'tutorial'
  })
}

// ---------- Tutorial（三關） ----------
const applyTutorialCost = (cost) => {
  playerState.money -= cost.money || 0
  playerState.sanity += cost.sanity || 0          // json 內已為負值
  playerState.timeRemaining -= cost.time || 0
}

const chooseTutorialOption = (option) => {
  applyTutorialCost(option.cost)
  clampStats()

  if (!playerState.activeEffects.includes(option.effectFlag)) {
    playerState.activeEffects.push(option.effectFlag)
  }

  addLog('📋', t(option.feedback))
  tutorialSelectedOptionId.value = option.id
  tutorialFeedback.value = option.feedback // 觸發 Tutorial Feedback 彈窗
}

const confirmTutorialFeedback = () => {
  tutorialFeedback.value = null
  tutorialSelectedOptionId.value = null

  if (tutorialStageIndex.value < tutorialData.stages.length - 1) {
    tutorialStageIndex.value++
    playerState.currentTutorialStage = tutorialStageIndex.value
  } else {
    completeTutorial()
  }
}

const completeTutorial = () => {
  playerState.isTutorialComplete = true
  playerState.sanity += tutorialData.completionReward.sanityBonus || 0
  clampStats()

  addLog('🎉', tutorialData.completionReward.logMessage)

  if (!visitedCities.value.includes(tutorialData.tutorialCityId)) {
    visitedCities.value.push(tutorialData.tutorialCityId)
  }

  currentStep.value = 'map-planning'
}

// ---------- 城市 / Unlock 機制 ----------
const isCityRestricted = (city) => {
  return !!(city.visaRestriction && city.visaRestriction.includes(selectedVisa.value))
}

const isCityUnlocked = (city) => {
  if (!city.unlockRequired || city.unlockRequired.length === 0) return true
  return city.unlockRequired.every(req => visitedCities.value.includes(req))
}

const unlockedCityIds = computed(() => citiesData.filter(isCityUnlocked).map(c => c.id))

const getUnlocksFrom = (city) =>
  citiesData.filter(c => c.unlockRequired?.includes(city.id))

const handleSelectCity = (city) => {
  activeCity.value = city
}

const applyCityEffect = (effect) => {
  playerState.money += effect.money || 0
  playerState.sanity += effect.sanity || 0
  playerState.timeRemaining += effect.time || 0
}

// 出發前往城市：先播放飛行動畫，再觸發城市事件
const travelToCity = (city) => {
  if (!city || !isCityUnlocked(city)) return

  flyTo(city.name, 1500, () => {
    if (isCityRestricted(city)) {
      currentCityEvent.value = { restricted: true, city, event: null }
    } else {
      const arrivalEvent = city.events?.find(e => e.trigger === 'arrival') || null
      currentCityEvent.value = { restricted: false, city, event: arrivalEvent }
    }
    currentStep.value = 'city-event'
  })
}

// 結算城市事件：套用效果 → 標記已抵達 → 解鎖下一批城市 → 判斷是否香港離境
const resolveCityEvent = () => {
  const ctx = currentCityEvent.value
  if (!ctx) return
  const { restricted, city, event } = ctx

  if (restricted) {
    playerState.money -= 300
    playerState.sanity -= 30
    addLog('🚨', language.value === 'en'
      ? `Deported from ${city.name.en}! Your current visa does not permit entry here.`
      : `在${city.name.cn}被直接遣返！你的簽證類型不允許進入此地。`)
  } else if (event) {
    applyCityEffect(event.effect)
    addLog('📍', t(event.text))
  } else {
    addLog('📍', language.value === 'en' ? `Arrived at ${city.name.en}. Nothing special happened.` : `抵達${city.name.cn}，一切風平浪靜。`)
  }

  clampStats()
  playerState.currentCity = city.id

  if (!restricted && !visitedCities.value.includes(city.id)) {
    visitedCities.value.push(city.id)
  }

  currentCityEvent.value = null
  activeCity.value = null

  if (!restricted && city.id === 'hongkong') {
    currentStep.value = 'ending'
  } else {
    currentStep.value = 'map-planning'
  }
}

// ---------- Debug / Reset ----------
const resetGame = () => {
  language.value = 'cn'
  currentStep.value = 'visa-selection'
  progress.value = 0
  flightTarget.value = null
  if (flightTimer) { clearInterval(flightTimer); flightTimer = null }

  playerState.money = 1200
  playerState.sanity = 100
  playerState.timeRemaining = 0
  playerState.isTutorialComplete = false
  playerState.isVisaVerified = false
  playerState.currentTutorialStage = 0
  playerState.activeEffects = []
  playerState.currentCity = null

  selectedVisa.value = 'L'
  expandedVisa.value = null
  countrySearchQuery.value = ''

  tutorialStageIndex.value = 0
  tutorialFeedback.value = null
  tutorialSelectedOptionId.value = null

  visitedCities.value = []
  activeCity.value = null
  currentCityEvent.value = null

  gameLogs.value = []
}
</script>

<template>
  <div class="max-w-md w-full mx-auto bg-stone-100 min-h-screen flex flex-col justify-between shadow-xl font-sans text-stone-800">

    <!-- 頂部導航欄 -->
    <header class="bg-stone-900 text-stone-100 p-4 flex justify-between items-center shadow-md border-b border-stone-800">
      <div class="flex flex-col">
        <h1 class="font-black text-sm tracking-widest text-amber-500">CHINA SURVIVAL</h1>
        <span class="text-[9px] text-stone-400 uppercase tracking-wider">v0.2.0 Alpha</span>
      </div>
      <button @click="toggleLanguage" class="bg-stone-800 border border-stone-700 px-3 py-1 rounded-lg text-xs font-medium hover:bg-stone-700 transition">
        {{ language === 'en' ? '繁體中文' : 'English' }}
      </button>
    </header>

    <!-- 頂部狀態欄 -->
    <header class="flex justify-between items-center bg-stone-800 text-stone-200 px-4 py-2 text-xs border-b border-stone-700 font-mono">
      <span>💰 預算: ￥{{ playerState.money }}</span>
      <span>🧠 精神值: {{ playerState.sanity }}</span>
      <span>⏳ 剩餘時間: {{ playerState.timeRemaining }}h</span>
    </header>

    <!-- 主體內容區 -->
    <main class="flex-grow p-4 flex flex-col gap-4 justify-center">

      <!-- ============================================================
           Part 3：步驟 1 — 選擇簽證 (Visa Selection)
      ============================================================= -->
      <section v-if="currentStep === 'visa-selection'" class="flex flex-col gap-4 my-auto fade-in">
        <div class="text-center space-y-2 py-4">
          <h2 class="text-2xl font-black text-stone-900 tracking-tight">
            {{ language === 'en' ? 'Choose Your Visa' : '選擇你的中國簽證' }}
          </h2>
          <p class="text-xs text-stone-500 max-w-xs mx-auto">
            {{ language === 'en' ? 'Your survival difficulty and routing depend entirely on this document.' : '入境文件將直接決定你的生存難度與活動範圍。' }}
          </p>
        </div>

        <div class="flex flex-col gap-3">

          <!-- 1. 144小时过境免签 -->
          <div :class="['bg-white border-2 rounded-2xl transition-all shadow-sm overflow-hidden', expandedVisa === '144' ? 'border-amber-500 shadow-md' : 'border-stone-200']">
            <div class="p-4 cursor-pointer hover:bg-stone-50/50 flex flex-col gap-1" @click="toggleExpand('144')">
              <div class="flex justify-between items-center">
                <span class="font-bold text-sm text-stone-900">144-Hour Transit Visa-Free</span>
                <span class="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded">Easy Entry</span>
              </div>
              <p class="text-xs text-stone-500 leading-normal">
                {{ language === 'en' ? 'No advance application. Strictly restricted to regional zones.' : '無需提前申請。活動範圍被嚴格限制在申報區域（如京津冀）。' }}
              </p>
              <div class="flex justify-between items-center mt-2 text-[10px] text-amber-600 font-medium">
                <span>{{ expandedVisa === '144' ? '▲ 收起詳情 (Close)' : '▼ 展開查看適用國家 (Check Countries)' }}</span>
                <span class="text-stone-400 font-mono">144H</span>
              </div>
            </div>

            <div v-if="expandedVisa === '144'" class="bg-stone-50 p-4 border-t border-stone-100 space-y-3 text-xs">
              <div>
                <p class="font-bold text-stone-800">📍 {{ language === 'en' ? 'Allowed Regions' : '允許活動區域' }}:</p>
                <p class="text-stone-600 text-[11px] mt-0.5">{{ visaCountries['144'].regions[language] }}</p>
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
                  <span v-if="checkCountryStatus(visaCountries['144'].list) === 'eligible'" class="text-green-600">
                    ✅ {{ language === 'en' ? 'Eligible! You can use 144h transit visa-free.' : '符合資格！你可以免簽入境。' }}
                  </span>
                  <span v-else class="text-red-500">
                    ❌ {{ language === 'en' ? 'Not found/Not eligible. (Double check spelling)' : '未找到或不符合此免簽資格。（請檢查英文拼寫）' }}
                  </span>
                </div>
              </div>

              <div>
                <p class="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-1">
                  {{ language === 'en' ? 'Eligible Countries (Sample)' : '適用國家（部分列出）' }}:
                </p>
                <div class="flex flex-wrap gap-1">
                  <span v-for="c in visaCountries['144'].list.slice(0, 10)" :key="c" class="bg-stone-200/60 text-stone-600 text-[10px] px-2 py-0.5 rounded-md">
                    {{ c }}
                  </span>
                  <span class="text-stone-400 text-[10px] px-1 py-0.5">...and {{ 54 - 10 }} more</span>
                </div>
              </div>

              <button @click.stop="selectVisa('144')" class="w-full bg-stone-900 text-stone-100 font-bold py-2.5 rounded-xl hover:bg-stone-800 transition active:scale-[0.98] mt-2 shadow-sm">
                {{ language === 'en' ? 'Confirm and Enter with 144H Visa' : '確認持 144H 免簽入境' }}
              </button>
            </div>
          </div>

          <!-- 2. 30天免签 -->
          <div :class="['bg-white border-2 rounded-2xl transition-all shadow-sm overflow-hidden', expandedVisa === 'Visa-Free' ? 'border-amber-500 shadow-md' : 'border-stone-200']">
            <div class="p-4 cursor-pointer hover:bg-stone-50/50 flex flex-col gap-1" @click="toggleExpand('Visa-Free')">
              <div class="flex justify-between items-center">
                <span class="font-bold text-sm text-stone-900">30-Day Ordinary Visa-Free</span>
                <span class="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded">Highly Recommended</span>
              </div>
              <p class="text-xs text-stone-500 leading-normal">
                {{ language === 'en' ? 'Free entry for 30 days. Perfect for long travel, high freedom.' : '免簽入境30天。適合深度遊，地圖可暢玩區域極多。' }}
              </p>
              <div class="flex justify-between items-center mt-2 text-[10px] text-amber-600 font-medium">
                <span>{{ expandedVisa === 'Visa-Free' ? '▲ 收起詳情 (Close)' : '▼ 展開查看適用國家 (Check Countries)' }}</span>
                <span class="text-stone-400 font-mono">30D FREE</span>
              </div>
            </div>

            <div v-if="expandedVisa === 'Visa-Free'" class="bg-stone-50 p-4 border-t border-stone-100 space-y-3 text-xs">
              <div>
                <p class="font-bold text-stone-800">📍 {{ language === 'en' ? 'Allowed Regions' : '允許活動區域' }}:</p>
                <p class="text-stone-600 text-[11px] mt-0.5">{{ visaCountries['Visa-Free'].regions[language] }}</p>
              </div>

              <div class="space-y-2">
                <label class="font-bold text-stone-800 block">{{ language === 'en' ? 'Check Your Passport:' : '驗證你的護照國籍:' }}</label>
                <input
                  v-model="countrySearchQuery"
                  type="text"
                  :placeholder="language === 'en' ? 'e.g. France, Germany, Australia...' : '例如：France, Germany, Australia...'"
                  class="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 shadow-inner"
                  @click.stop
                />
                <div v-if="countrySearchQuery" class="text-[11px] font-semibold mt-1">
                  <span v-if="checkCountryStatus(visaCountries['Visa-Free'].list) === 'eligible'" class="text-green-600">
                    ✅ {{ language === 'en' ? 'Eligible! You are on the 30-day Visa-Free list.' : '符合資格！你在30天單方面免簽名單中。' }}
                  </span>
                  <span v-else class="text-red-500">
                    ❌ {{ language === 'en' ? 'Not on the list. (Requires active bilateral agreement)' : '不符合此免簽資格。（需要其他簽證）' }}
                  </span>
                </div>
              </div>

              <div>
                <p class="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-1">
                  {{ language === 'en' ? 'Eligible Countries (Sample)' : '適用國家（部分列出）' }}:
                </p>
                <div class="flex flex-wrap gap-1">
                  <span v-for="c in visaCountries['Visa-Free'].list" :key="c" class="bg-stone-200/60 text-stone-600 text-[10px] px-2 py-0.5 rounded-md">
                    {{ c }}
                  </span>
                </div>
              </div>

              <button @click.stop="selectVisa('Visa-Free')" class="w-full bg-stone-900 text-stone-100 font-bold py-2.5 rounded-xl hover:bg-stone-800 transition active:scale-[0.98] mt-2 shadow-sm">
                {{ language === 'en' ? 'Confirm and Enter Visa-Free' : '確認直接免簽入境' }}
              </button>
            </div>
          </div>

          <!-- 3. 旅游签证 L -->
          <div :class="['bg-white border-2 rounded-2xl transition-all shadow-sm overflow-hidden', expandedVisa === 'L' ? 'border-amber-500 shadow-md' : 'border-stone-200']">
            <div class="p-4 cursor-pointer hover:bg-stone-50/50 flex flex-col gap-1" @click="toggleExpand('L')">
              <div class="flex justify-between items-center">
                <span class="font-bold text-sm text-stone-900">Tourist Visa (L-Visa)</span>
                <span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">Hardcore Paperwork</span>
              </div>
              <p class="text-xs text-stone-500 leading-normal">
                {{ language === 'en' ? 'Requires tedious invitation letters, pre-bookings, but grants complete freedom.' : '需要邀請函、機票酒店訂單。辦理手續繁瑣，但入境後限制最少。' }}
              </p>
              <div class="flex justify-between items-center mt-2 text-[10px] text-amber-600 font-medium">
                <span>{{ expandedVisa === 'L' ? '▲ 收起詳情 (Close)' : '▼ 展開查看適用國家 (Check Countries)' }}</span>
                <span class="text-stone-400 font-mono">L VISA</span>
              </div>
            </div>

            <div v-if="expandedVisa === 'L'" class="bg-stone-50 p-4 border-t border-stone-100 space-y-3 text-xs">
              <div>
                <p class="font-bold text-stone-800">📍 {{ language === 'en' ? 'Allowed Regions' : '允許活動區域' }}:</p>
                <p class="text-stone-600 text-[11px] mt-0.5">{{ visaCountries['L'].regions[language] }}</p>
              </div>

              <div class="space-y-2">
                <label class="font-bold text-stone-800 block">{{ language === 'en' ? 'Check Your Passport:' : '驗證你的護照國籍:' }}</label>
                <input
                  v-model="countrySearchQuery"
                  type="text"
                  :placeholder="language === 'en' ? 'Search your country...' : '輸入你的國家...'"
                  class="w-full bg-white border border-stone-300 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 shadow-inner"
                  @click.stop
                />
                <div v-if="countrySearchQuery" class="text-[11px] font-semibold mt-1">
                  <span class="text-green-600">
                    ✅ {{ language === 'en' ? 'Eligible! All nationalities can apply for a Tourist L-Visa.' : '完全符合！所有國籍均可自費申請 L 簽證。' }}
                  </span>
                </div>
              </div>

              <div>
                <p class="text-[10px] text-stone-400 font-bold uppercase tracking-wider mb-1">
                  {{ language === 'en' ? 'Eligible Countries' : '適用國家' }}:
                </p>
                <span class="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded">
                  {{ language === 'en' ? 'Global / All Passports' : '全球所有護照通用' }}
                </span>
              </div>

              <button @click.stop="selectVisa('L')" class="w-full bg-stone-900 text-stone-100 font-bold py-2.5 rounded-xl hover:bg-stone-800 transition active:scale-[0.98] mt-2 shadow-sm">
                {{ language === 'en' ? 'Confirm and Start Tedious L-Visa Process' : '確認並開始繁雜的 L 簽申請流程' }}
              </button>
            </div>
          </div>

        </div>
      </section>

      <!-- ============================================================
           Part 3：步驟 2 — 飛行過渡動畫 (Arrival Animation)
           共用元件：入境北京 / 之後每次城市間移動皆重用此畫面
      ============================================================= -->
      <section v-if="currentStep === 'arrival-loading'" class="my-auto text-center space-y-8 px-6 fade-in">
        <div class="text-7xl animate-bounce-slow select-none">✈️</div>
        <div class="space-y-2">
          <h2 class="text-xl font-bold text-stone-900 tracking-tight">
            {{ language === 'en' ? `Flying to ${flightTarget?.en}...` : `正在飛往 ${flightTarget?.cn}...` }}
          </h2>
          <p class="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
            {{ language === 'en' ? 'Bracing for landing. Ready your passport and survival mind!' : '即將降落。請準備好你的護照與生存意志！' }}
          </p>
        </div>

        <div class="space-y-2 max-w-xs mx-auto pt-4">
          <div class="w-full bg-stone-200 h-2.5 rounded-full overflow-hidden shadow-inner">
            <div
              class="bg-amber-500 h-full transition-all duration-75 ease-out rounded-full"
              :style="{ width: `${progress}%` }"
            ></div>
          </div>
          <div class="flex justify-between text-[10px] font-mono text-stone-400 font-bold px-1">
            <span>DESCENT IN PROGRESS</span>
            <span>{{ Math.round(progress) }}%</span>
          </div>
        </div>
      </section>

      <!-- ============================================================
           Part 4：北京 Tutorial（三關）+ Tutorial Dialog + Tutorial Feedback
      ============================================================= -->
      <section v-if="currentStep === 'tutorial'" class="flex flex-col gap-4 fade-in my-auto">

        <!-- 關卡進度指示 -->
        <div class="flex justify-center gap-2">
          <span
            v-for="(stage, idx) in tutorialData.stages"
            :key="stage.id"
            :class="[
              'w-2.5 h-2.5 rounded-full transition-all',
              idx === tutorialStageIndex ? 'bg-amber-500 scale-125' : idx < tutorialStageIndex ? 'bg-stone-400' : 'bg-stone-200'
            ]"
          ></span>
        </div>

        <!-- Tutorial Dialog：關卡情境敘述 -->
        <div class="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-3">
          <span class="bg-red-100 text-red-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider inline-block">
            {{ language === 'en' ? 'Beijing Tutorial' : '北京生存教學' }} · {{ tutorialStageIndex + 1 }} / {{ tutorialData.stages.length }}
          </span>
          <h3 class="font-black text-lg text-stone-950">{{ t(currentTutorialStage.title) }}</h3>
          <p class="text-xs text-stone-600 leading-relaxed">{{ t(currentTutorialStage.desc) }}</p>
        </div>

        <!-- 選項卡片 -->
        <div class="flex flex-col gap-3">
          <button
            v-for="option in currentTutorialStage.options"
            :key="option.id"
            @click="chooseTutorialOption(option)"
            class="text-left bg-white border-2 border-stone-200 rounded-2xl p-4 hover:border-amber-400 active:scale-[0.98] transition shadow-sm space-y-2"
          >
            <p class="text-xs font-bold text-stone-900 leading-relaxed">{{ t(option.text) }}</p>
            <div class="flex gap-3 text-[10px] font-mono text-stone-400">
              <span v-if="option.cost.money">💰 -{{ option.cost.money }}</span>
              <span>🧠 {{ option.cost.sanity >= 0 ? '+' : '' }}{{ option.cost.sanity }}</span>
              <span>⏳ -{{ option.cost.time }}h</span>
            </div>
          </button>
        </div>

        <!-- Tutorial Feedback：選擇後的結果彈窗 -->
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

      <!-- ============================================================
           Part 5：世界地圖 (ChinaMap) + 城市介紹卡片 (City Card)
      ============================================================= -->
      <section v-if="currentStep === 'map-planning'" class="flex flex-col gap-4 fade-in">
        <div class="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm">
          <h3 class="font-bold text-sm mb-1 text-stone-900">
            {{ language === 'en' ? '🗺️ Select Destination' : '🗺️ 選擇你的目的地' }}
          </h3>
          <p class="text-xs text-stone-500 leading-relaxed">
            {{ language === 'en' ? 'Click on active pins to inspect the city card below and start your adventure.' : '在地圖上點擊亮起的圖標，查看城市介紹並開啟旅程。' }}
          </p>
          <p class="text-[10px] font-mono text-stone-400 mt-2">
            {{ language === 'en' ? `Visited: ${visitedCities.length} / ${citiesData.length}` : `已抵達城市：${visitedCities.length} / ${citiesData.length}` }}
          </p>
        </div>

        <!-- 互動地圖組件 -->
        <ChinaMap
          :cities="citiesData"
          :language="language"
          :currentVisa="selectedVisa"
          :unlockedCities="unlockedCityIds"
          @select-city="handleSelectCity"
        />

        <!-- 選中城市詳情面板（City Card） -->
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
              :disabled="!isCityUnlocked(activeCity)"
              class="bg-amber-500 disabled:bg-stone-300 disabled:cursor-not-allowed text-stone-950 font-bold text-xs px-4 py-2 rounded-xl shadow-md hover:bg-amber-400 active:scale-95 transition shrink-0"
            >
              {{ language === 'en' ? 'Travel Here' : '出發前往' }}
            </button>
          </div>

          <p class="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-100">
            {{ activeCity.desc[language] }}
          </p>

          <!-- 簽證限制警告 -->
          <div v-if="isCityRestricted(activeCity)" class="bg-red-50 border border-red-200 rounded-lg p-2 text-[10px] text-red-600 font-semibold leading-relaxed">
            ⚠️ {{ language === 'en' ? 'Your current visa does not permit entry here! Entering will trigger deportation.' : '你目前的簽證類型不允許進入此地！強行前往將被直接遣返。' }}
          </div>

          <!-- Unlock 機制提示：抵達此城市後將解鎖哪些城市 -->
          <div v-if="getUnlocksFrom(activeCity).length" class="text-[10px] text-stone-400">
            🔓 {{ language === 'en' ? 'Unlocks after visiting:' : '抵達後將解鎖：' }}
            {{ getUnlocksFrom(activeCity).map(c => c.name[language]).join('、') }}
          </div>
        </div>

        <button
          @click="currentStep = 'visa-selection'"
          class="text-xs text-stone-400 hover:text-stone-600 transition text-center underline py-2"
        >
          {{ language === 'en' ? '← Change Visa Type' : '← 重新選擇簽證類型' }}
        </button>
      </section>

      <!-- ============================================================
           Part 6：城市事件 (City Event)
      ============================================================= -->
      <section v-if="currentStep === 'city-event'" class="flex flex-col gap-4 fade-in my-auto">
        <div class="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm text-center space-y-4">
          <div class="text-5xl">{{ currentCityEvent?.restricted ? '🚨' : '📍' }}</div>

          <div>
            <h3 class="font-black text-lg text-stone-950">{{ currentCityEvent?.city.name[language] }}</h3>
            <span
              :class="[
                'text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider mt-1 inline-block',
                currentCityEvent?.restricted ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
              ]"
            >
              {{ currentCityEvent?.restricted ? (language === 'en' ? 'Entry Denied' : '入境受阻') : (language === 'en' ? 'City Event' : '城市事件') }}
            </span>
          </div>

          <p class="text-xs text-stone-500 leading-relaxed max-w-xs mx-auto">
            <template v-if="currentCityEvent?.restricted">
              {{ language === 'en'
                ? `Your visa does not cover ${currentCityEvent.city.name.en}. You are stopped at the checkpoint and sent back.`
                : `你的簽證無法覆蓋${currentCityEvent.city.name.cn}，在檢查哨被攔下並遣返。` }}
            </template>
            <template v-else-if="currentCityEvent?.event">
              {{ t(currentCityEvent.event.text) }}
            </template>
            <template v-else>
              {{ language === 'en' ? 'Nothing special happened here.' : '這裡似乎風平浪靜。' }}
            </template>
          </p>

          <div class="flex justify-center gap-4 text-[10px] font-mono text-stone-400">
            <template v-if="currentCityEvent?.restricted">
              <span>💰 -300</span>
              <span>🧠 -30</span>
            </template>
            <template v-else-if="currentCityEvent?.event">
              <span v-if="currentCityEvent.event.effect.money">💰 {{ currentCityEvent.event.effect.money }}</span>
              <span v-if="currentCityEvent.event.effect.sanity">🧠 {{ currentCityEvent.event.effect.sanity }}</span>
              <span v-if="currentCityEvent.event.effect.time">⏳ {{ currentCityEvent.event.effect.time }}h</span>
            </template>
          </div>
        </div>

        <button
          @click="resolveCityEvent"
          class="bg-stone-900 text-stone-100 py-3.5 rounded-xl text-xs font-bold hover:bg-stone-800 active:scale-[0.98] transition shadow-md"
        >
          {{ language === 'en' ? 'Continue Journey' : '繼續旅程' }}
        </button>
      </section>

      <!-- ============================================================
           結局畫面：香港離境 (Ending)
      ============================================================= -->
      <section v-if="currentStep === 'ending'" class="flex flex-col gap-4 fade-in my-auto text-center">
        <div class="text-6xl">🛫</div>
        <h2 class="text-xl font-black text-stone-900">
          {{ language === 'en' ? 'Departed via Hong Kong!' : '成功自香港離境！' }}
        </h2>
        <p class="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
          {{ language === 'en'
            ? `You survived China with ￥${playerState.money} and ${playerState.sanity} sanity remaining, having visited ${visitedCities.length} cities.`
            : `你以剩餘 ￥${playerState.money} 資金與 ${playerState.sanity} 精神值，走訪了 ${visitedCities.length} 座城市，順利完成了這趟旅程。` }}
        </p>
        <button
          @click="resetGame"
          class="bg-stone-900 text-stone-100 py-3 rounded-xl text-xs font-bold hover:bg-stone-800 active:scale-[0.98] transition shadow-md"
        >
          {{ language === 'en' ? 'Play Again' : '重新開始' }}
        </button>
      </section>

    </main>

    <!-- 頁腳 -->
    <footer class="p-4 text-center text-[10px] text-stone-400 border-t border-stone-200 bg-white">
      Made by Maggie & AI Collaborator
    </footer>
  </div>

  <!-- Debug Panel：狀態監控面板 -->
  <div class="max-w-md w-full mx-auto mt-4 mb-8 p-4 bg-stone-900 text-amber-500 rounded-xl font-mono text-[10px] space-y-2">
    <div class="flex justify-between items-center border-b border-stone-700 pb-1">
      <p class="font-bold">DEBUG / STATUS MONITOR</p>
      <button @click="resetGame" class="text-red-400 hover:text-red-300 underline">RESET</button>
    </div>

    <ul class="space-y-0.5">
      <li>🧭 階段: {{ currentStep }}</li>
      <li>🎫 簽證: {{ selectedVisa }}</li>
      <li>💰 餘額: {{ playerState.money }}</li>
      <li>🧠 精神: {{ playerState.sanity }}</li>
      <li>⏳ 時間: {{ playerState.timeRemaining }}h</li>
      <li>🎓 教學完成: {{ playerState.isTutorialComplete }}</li>
      <li>📍 目前城市: {{ playerState.currentCity || '-' }}</li>
      <li>✅ 已抵達: {{ visitedCities.join(', ') || '-' }}</li>
      <li>🔓 已解鎖: {{ unlockedCityIds.join(', ') }}</li>
    </ul>

    <!-- ActiveEffects -->
    <div v-if="playerState.activeEffects.length" class="flex flex-wrap gap-1 pt-1">
      <span
        v-for="flag in playerState.activeEffects"
        :key="flag"
        class="bg-stone-800 border border-stone-700 px-1.5 py-0.5 rounded text-[9px]"
      >
        🏷️ {{ flag }}
      </span>
    </div>

    <!-- Game Log -->
    <div class="pt-2 border-t border-stone-800 max-h-32 overflow-y-auto space-y-1">
      <p v-for="(logItem, index) in gameLogs" :key="index" class="text-stone-400">
        <span class="text-stone-600">[{{ logItem.time }}]</span> {{ logItem.icon }} {{ logItem.text }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.scale-in {
  animation: scaleIn 0.25s ease-out forwards;
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.92); }
  to { opacity: 1; transform: scale(1); }
}

.animate-bounce-slow {
  animation: bounceSlow 1.6s ease-in-out infinite;
}
@keyframes bounceSlow {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
</style>