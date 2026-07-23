/**
 * Game Store
 * visa → arrival → tutorial → city-map → attraction/lodging events
 *          ↘ map-planning → travel-mode → (transit once) → city-map
 */
import { ref, reactive, computed } from 'vue'
import { cities, tutorial, visas, gameConfig, eventGraphs } from '../content'
import {
  t as translate,
  pickLang,
  createInitialPlayer,
  applyVisaInitial,
  clampStats,
  applyTutorialCost,
  applyEffect,
  addFlag,
  hasFlag,
  isCityRestricted,
  isCityUnlocked,
  getUnlockedCityIds,
  getUnlocksFrom as unlocksFromCity,
  checkCountryStatus,
  evaluateStatEnding,
  evaluateArrivalEnding,
  getNode,
  getEntryNodeId,
  getAvailableChoices,
  getLockedChoices,
  describeChoiceLock,
  applyChoiceToPlayer,
  applyNodeEffect,
  listTravelModes,
  estimateTravelCost,
  shouldPlayFirstBeijingDeparture,
  getFirstDepartureGraphId,
  syncLodgingFromTutorialFlags,
  needsLodging,
  settleAttractionDay,
  canRentPowerBank,
  rentPowerBank,
  getPowerBankConfig,
  getCityAttractions,
  getVisitedKey,
  collectTutorialVisitedAttractions,
} from '../engine'

let flightTimer = null

const language = ref(gameConfig.defaultLanguage || 'cn')
const currentStep = ref('visa-selection')
const progress = ref(0)
const flightTarget = ref(null)

const playerState = reactive(createInitialPlayer())

const selectedVisa = ref(gameConfig.defaultVisa || 'L')
const expandedVisa = ref(null)
const countrySearchQuery = ref('')

const tutorialStageIndex = ref(0)
const tutorialFeedback = ref(null)
const tutorialSelectedOptionId = ref(null)
const currentTutorialStage = computed(() => tutorial.stages[tutorialStageIndex.value])

const visitedCities = ref([])
const visitedAttractionKeys = ref([])
const activeCity = ref(null)
const activeAttraction = ref(null)
const currentCityEvent = ref(null)

const pendingDestination = ref(null)
const selectedTravelMode = ref('hsr')
const travelModes = listTravelModes()

const activeEnding = ref(null)
const gameLogs = ref([])

const unlockedCityIds = computed(() => getUnlockedCityIds(cities, visitedCities.value))

const currentCity = computed(() =>
  cities.find((c) => c.id === playerState.currentCity) || null
)

const currentAttractions = computed(() =>
  currentCity.value ? getCityAttractions(currentCity.value) : []
)

const needsLodgingNow = computed(() => needsLodging(playerState))

const powerBankStatus = computed(() => canRentPowerBank(playerState))
const powerBankConfig = getPowerBankConfig()

const travelEstimate = computed(() => {
  if (!pendingDestination.value) return null
  return estimateTravelCost(currentCity.value, pendingDestination.value, selectedTravelMode.value)
})

const currentEventNode = computed(() => {
  const ctx = currentCityEvent.value
  if (!ctx?.graph || !ctx.nodeId) return null
  return getNode(ctx.graph, ctx.nodeId)
})

const availableChoices = computed(() => {
  const node = currentEventNode.value
  if (!node) return []
  return getAvailableChoices(node, playerState)
})

const lockedChoices = computed(() => {
  const node = currentEventNode.value
  if (!node) return []
  return getLockedChoices(node, playerState)
})

const t = (obj) => translate(obj, language.value)

const addLog = (icon, text) => {
  gameLogs.value.unshift({
    icon,
    text,
    time: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
  })
}

const triggerEnding = (ending) => {
  if (!ending) return false
  activeEnding.value = ending
  currentStep.value = 'ending'
  currentCityEvent.value = null
  pendingDestination.value = null
  activeAttraction.value = null
  addLog(ending.icon || '🏁', t(ending.title))
  return true
}

const checkStatEnding = () => triggerEnding(evaluateStatEnding(playerState))

const toggleLanguage = () => {
  language.value = language.value === 'en' ? 'cn' : 'en'
}

const toggleExpand = (visaType) => {
  if (expandedVisa.value === visaType) expandedVisa.value = null
  else {
    expandedVisa.value = visaType
    countrySearchQuery.value = ''
  }
}

const countryStatus = (countryList) =>
  checkCountryStatus(countryList, countrySearchQuery.value)

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

const selectVisa = (visaType) => {
  selectedVisa.value = visaType
  applyVisaInitial(playerState, visas[visaType])
  addLog('🛂', pickLang(`簽證確認：${visaType}`, `Visa confirmed: ${visaType}`, language.value))
  flyTo({ cn: '北京', en: 'Beijing' }, gameConfig.flight.arrivalDurationMs, () => {
    currentStep.value = 'tutorial'
  })
}

const chooseTutorialOption = (option) => {
  applyTutorialCost(playerState, option.cost)
  addFlag(playerState, option.effectFlag)
  addLog('📋', t(option.feedback))
  tutorialSelectedOptionId.value = option.id
  tutorialFeedback.value = option.feedback
  if (checkStatEnding()) return
}

const enterCityMap = (city) => {
  if (!city) return
  playerState.currentCity = city.id
  if (!visitedCities.value.includes(city.id)) visitedCities.value.push(city.id)
  activeAttraction.value = null
  currentCityEvent.value = null

  if (needsLodging(playerState)) {
    startLodgingEvent(city)
    return
  }
  currentStep.value = 'city-map'
}

const completeTutorial = () => {
  playerState.isTutorialComplete = true
  playerState.sanity += tutorial.completionReward.sanityBonus || 0
  if (tutorial.completionReward.localityBonus) {
    playerState.locality = (playerState.locality || 0) + tutorial.completionReward.localityBonus
  }
  clampStats(playerState)
  syncLodgingFromTutorialFlags(playerState)
  visitedAttractionKeys.value = [
    ...new Set([
      ...visitedAttractionKeys.value,
      ...collectTutorialVisitedAttractions(playerState),
    ]),
  ]
  addLog('🎉', tutorial.completionReward.logMessage)

  const bj = cities.find((c) => c.id === tutorial.tutorialCityId)
  enterCityMap(bj)
}

const confirmTutorialFeedback = () => {
  tutorialFeedback.value = null
  tutorialSelectedOptionId.value = null
  if (checkStatEnding()) return
  if (tutorialStageIndex.value < tutorial.stages.length - 1) {
    tutorialStageIndex.value++
    playerState.currentTutorialStage = tutorialStageIndex.value
  } else {
    completeTutorial()
  }
}

const cityRestricted = (city) => isCityRestricted(city, selectedVisa.value)
const cityUnlocked = (city) => isCityUnlocked(city, visitedCities.value)
const getUnlocksFrom = (city) => unlocksFromCity(city, cities)

const handleSelectCity = (city) => {
  activeCity.value = city
}

const handleSelectAttraction = (attraction) => {
  activeAttraction.value = attraction
}

const startGraphEvent = ({ type, city, graph, attraction = null }) => {
  const nodeId = getEntryNodeId(graph, playerState)
  playerState.currentNode = nodeId
  currentCityEvent.value = {
    type,
    restricted: false,
    city,
    graph,
    attraction,
    nodeId,
    feedback: null,
    pendingNext: null,
    lastChoice: null,
  }
  currentStep.value = 'city-event'
}

const startLodgingEvent = (city = currentCity.value) => {
  const graph = eventGraphs.lodging_resolve
  startGraphEvent({ type: 'lodging', city, graph })
}

const startLodgingIfNeeded = () => {
  if (needsLodging(playerState)) startLodgingEvent()
}

const usePowerBank = () => {
  const result = rentPowerBank(playerState)
  if (!result.ok) {
    const msg = {
      needs_pay: pickLang('需要已綁定支付寶/微信（境外卡）', 'Need linked Alipay/WeChat (foreign card)', language.value),
      cash_only: pickLang('現金路線無法掃共享充電寶', 'Cash-only cannot scan power banks', language.value),
      broke: pickLang('餘額不足', 'Not enough money', language.value),
      full: pickLang('電量已滿', 'Battery already full', language.value),
    }[result.reason] || pickLang('暫時無法租借', 'Cannot rent now', language.value)
    addLog('🔋', msg)
    return false
  }
  addLog(
    '🔋',
    pickLang(
      `掃碼租借共享充電寶：-￥${result.cost}，電量 +${result.restored}`,
      `Rented power bank: -￥${result.cost}, battery +${result.restored}`,
      language.value
    )
  )
  if (checkStatEnding()) return true
  return true
}

const startAttraction = (attraction) => {
  const city = currentCity.value
  if (!city || !attraction) return
  if (needsLodging(playerState)) {
    startLodgingEvent(city)
    return
  }
  const graph = eventGraphs[attraction.graphId]
  if (!graph) {
    addLog('⚠️', `Missing graph: ${attraction.graphId}`)
    return
  }
  startGraphEvent({ type: 'attraction', city, graph, attraction })
}

const startTransitGraph = (destinationCity) => {
  const graph = eventGraphs[getFirstDepartureGraphId()]
  startGraphEvent({ type: 'transit', city: destinationCity, graph })
}

const arriveAtCity = (city) => {
  if (cityRestricted(city)) {
    currentCityEvent.value = {
      type: 'city',
      restricted: true,
      city,
      graph: null,
      attraction: null,
      nodeId: null,
      feedback: null,
      pendingNext: null,
      lastChoice: null,
    }
    currentStep.value = 'city-event'
    return
  }
  // 換城：若無住宿，進地圖前先解決；沙發不跨城帶著
  if (playerState.lodging?.type === 'couch') {
    playerState.lodging = null
  }
  enterCityMap(city)
}

const leaveCityToWorldMap = () => {
  activeAttraction.value = null
  currentStep.value = 'map-planning'
}

const finishEvent = (city, restricted = false) => {
  const ctx = currentCityEvent.value

  if (ctx?.type === 'transit') {
    const dest = pendingDestination.value || city
    currentCityEvent.value = null
    playerState.currentNode = null
    if (checkStatEnding()) return
    flyTo(dest.name, gameConfig.flight.cityHopDurationMs, () => {
      pendingDestination.value = null
      arriveAtCity(dest)
    })
    return
  }

  if (ctx?.type === 'lodging') {
    currentCityEvent.value = null
    playerState.currentNode = null
    activeAttraction.value = null
    if (checkStatEnding()) return
    currentStep.value = 'city-map'
    addLog('🏨', pickLang('住宿已安排', 'Lodging arranged', language.value))
    return
  }

  if (ctx?.type === 'attraction') {
    const attraction = ctx.attraction
    const key = getVisitedKey(city.id, attraction.id)
    if (!visitedAttractionKeys.value.includes(key)) {
      visitedAttractionKeys.value.push(key)
    }

    const settled = settleAttractionDay(playerState)
    addLog(
      '📅',
      pickLang(
        `度過一天：時間 -${settled.hours}h，住宿 -￥${settled.nightly}` +
          (settled.batteryRestored
            ? `，過夜充電 +${settled.batteryRestored}`
            : settled.survivedDay
              ? ''
              : '（電量已耗盡，無法過夜回血）'),
        `Day settled: -${settled.hours}h, lodging -￥${settled.nightly}` +
          (settled.batteryRestored
            ? `, overnight charge +${settled.batteryRestored}`
            : settled.survivedDay
              ? ''
              : ' (battery dead — no overnight restore)'),
        language.value
      )
    )

    currentCityEvent.value = null
    playerState.currentNode = null
    activeAttraction.value = null

    if (checkStatEnding()) return

    // 香港離境景點 → 結局
    if (attraction.isExit || hasFlag(playerState, 'departed_hongkong')) {
      const ending = evaluateArrivalEnding(playerState, city.id, false)
      if (ending) {
        triggerEnding(ending)
        return
      }
    }

    if (needsLodging(playerState)) {
      addLog('⚠️', pickLang('住宿已到期，需重新安排', 'Lodging expired — rebook needed', language.value))
      startLodgingEvent(city)
      return
    }

    currentStep.value = 'city-map'
    return
  }

  // restricted / legacy
  playerState.currentCity = city.id
  playerState.currentNode = null
  if (!restricted && !visitedCities.value.includes(city.id)) {
    visitedCities.value.push(city.id)
  }
  currentCityEvent.value = null
  activeCity.value = null
  if (checkStatEnding()) return
  if (!restricted) enterCityMap(city)
  else currentStep.value = 'map-planning'
}

const travelToCity = (city) => {
  if (!city || !cityUnlocked(city)) return
  if (playerState.currentCity === city.id) {
    enterCityMap(city)
    return
  }
  pendingDestination.value = city
  selectedTravelMode.value = 'hsr'
  currentStep.value = 'travel-mode'
}

const selectTravelMode = (modeId) => {
  selectedTravelMode.value = modeId
}

const confirmTravel = () => {
  const dest = pendingDestination.value
  if (!dest) return
  const estimate = estimateTravelCost(currentCity.value, dest, selectedTravelMode.value)
  applyEffect(playerState, estimate.effect)
  addLog(
    '🚆',
    pickLang(
      `選擇${estimate.mode.label.cn}前往${dest.name.cn}`,
      `${estimate.mode.label.en} to ${dest.name.en}`,
      language.value
    )
  )
  if (checkStatEnding()) return

  const fromId = playerState.currentCity
  if (shouldPlayFirstBeijingDeparture(playerState, fromId, dest.id)) {
    startTransitGraph(dest)
    return
  }
  flyTo(dest.name, gameConfig.flight.cityHopDurationMs, () => {
    pendingDestination.value = null
    arriveAtCity(dest)
  })
}

const cancelTravel = () => {
  pendingDestination.value = null
  currentStep.value = 'map-planning'
}

const resolveRestrictedEvent = () => {
  const ctx = currentCityEvent.value
  if (!ctx?.restricted) return
  applyEffect(playerState, gameConfig.deportationPenalty)
  addLog('🚨', pickLang(`在${ctx.city.name.cn}被遣返`, `Deported from ${ctx.city.name.en}`, language.value))
  if (checkStatEnding()) return
  finishEvent(ctx.city, true)
}

const resolveTerminalNode = () => {
  const ctx = currentCityEvent.value
  if (!ctx || ctx.restricted) return
  const node = getNode(ctx.graph, ctx.nodeId)
  if (node) {
    applyNodeEffect(playerState, node)
    addLog(ctx.type === 'transit' ? '🛤️' : '📍', t(node.text))
  }
  if (checkStatEnding()) return
  finishEvent(ctx.city, false)
}

const chooseCityOption = (choice) => {
  const ctx = currentCityEvent.value
  if (!ctx || ctx.restricted || ctx.feedback) return
  applyChoiceToPlayer(playerState, choice)
  addLog('🔀', t(choice.feedback) || t(choice.text))
  if (checkStatEnding()) return
  const next = choice.next ?? null
  if (choice.feedback) {
    currentCityEvent.value = { ...ctx, feedback: choice.feedback, pendingNext: next, lastChoice: choice }
    return
  }
  advanceToNode(next)
}

const confirmCityFeedback = () => {
  const ctx = currentCityEvent.value
  if (!ctx) return
  if (checkStatEnding()) return
  const next = ctx.pendingNext
  currentCityEvent.value = { ...ctx, feedback: null, pendingNext: null, lastChoice: null }
  advanceToNode(next)
}

const advanceToNode = (nextId) => {
  const ctx = currentCityEvent.value
  if (!ctx) return
  if (!nextId) {
    finishEvent(ctx.city, false)
    return
  }
  const node = getNode(ctx.graph, nextId)
  if (!node) {
    finishEvent(ctx.city, false)
    return
  }
  playerState.currentNode = nextId
  currentCityEvent.value = {
    ...ctx,
    nodeId: nextId,
    feedback: null,
    pendingNext: null,
    lastChoice: null,
  }
}

const choiceLockReason = (choice) => describeChoiceLock(choice, playerState, language.value)

const goToVisaSelection = () => {
  currentStep.value = 'visa-selection'
}

const resetGame = () => {
  language.value = gameConfig.defaultLanguage || 'cn'
  currentStep.value = 'visa-selection'
  progress.value = 0
  flightTarget.value = null
  if (flightTimer) {
    clearInterval(flightTimer)
    flightTimer = null
  }
  Object.assign(playerState, createInitialPlayer())
  selectedVisa.value = gameConfig.defaultVisa || 'L'
  expandedVisa.value = null
  countrySearchQuery.value = ''
  tutorialStageIndex.value = 0
  tutorialFeedback.value = null
  tutorialSelectedOptionId.value = null
  visitedCities.value = []
  visitedAttractionKeys.value = []
  activeCity.value = null
  activeAttraction.value = null
  currentCityEvent.value = null
  pendingDestination.value = null
  selectedTravelMode.value = 'hsr'
  activeEnding.value = null
  gameLogs.value = []
}

export function useGameStore() {
  return {
    cities,
    tutorial,
    visas,
    gameConfig,
    eventGraphs,
    travelModes,

    language,
    currentStep,
    progress,
    flightTarget,
    playerState,
    selectedVisa,
    expandedVisa,
    countrySearchQuery,
    tutorialStageIndex,
    tutorialFeedback,
    tutorialSelectedOptionId,
    currentTutorialStage,
    visitedCities,
    visitedAttractionKeys,
    activeCity,
    activeAttraction,
    currentCity,
    currentAttractions,
    needsLodgingNow,
    powerBankStatus,
    powerBankConfig,
    currentCityEvent,
    currentEventNode,
    availableChoices,
    lockedChoices,
    pendingDestination,
    selectedTravelMode,
    travelEstimate,
    activeEnding,
    gameLogs,
    unlockedCityIds,

    t,
    addLog,
    toggleLanguage,
    toggleExpand,
    countryStatus,
    selectVisa,
    chooseTutorialOption,
    confirmTutorialFeedback,
    cityRestricted,
    cityUnlocked,
    getUnlocksFrom,
    handleSelectCity,
    handleSelectAttraction,
    startAttraction,
    startLodgingIfNeeded,
    usePowerBank,
    leaveCityToWorldMap,
    travelToCity,
    selectTravelMode,
    confirmTravel,
    cancelTravel,
    resolveRestrictedEvent,
    resolveTerminalNode,
    chooseCityOption,
    confirmCityFeedback,
    choiceLockReason,
    goToVisaSelection,
    resetGame,
  }
}
