<script setup>
/**
 * App.vue
 * welcome → visa → character → arrival → tutorial → city-map ↔ attraction/lodging
 *                              → map-planning → travel → city-map → ending
 */
import { provide, ref, watch, onMounted } from 'vue'
import { useGameStore } from './stores/useGameStore'
import GameHeader from './components/GameHeader.vue'
import StatusBar from './components/StatusBar.vue'
import DebugPanel from './components/DebugPanel.vue'
import CompanionAvatar from './components/CompanionAvatar.vue'
import HowToPlayView from './views/HowToPlayView.vue'
import VisaSelectionView from './views/VisaSelectionView.vue'
import CharacterSelectView from './views/CharacterSelectView.vue'
import ArrivalLoadingView from './views/ArrivalLoadingView.vue'
import TutorialView from './views/TutorialView.vue'
import MapPlanningView from './views/MapPlanningView.vue'
import CityMapView from './views/CityMapView.vue'
import TravelModeView from './views/TravelModeView.vue'
import CityEventView from './views/CityEventView.vue'
import EndingView from './views/EndingView.vue'

const DEBUG_SIDEBAR_KEY = 'china-survival-debug-open'

const store = useGameStore()
const { currentStep, playerState, cities, tutorial, language } = store

provide('playerState', playerState)
provide('citiesData', cities)
provide('tutorialData', tutorial)

/** Debug 侧栏：默认收起 */
const debugOpen = ref(false)

onMounted(() => {
  try {
    const saved = localStorage.getItem(DEBUG_SIDEBAR_KEY)
    if (saved === '1') debugOpen.value = true
    if (saved === '0') debugOpen.value = false
  } catch {
    /* ignore */
  }
})

watch(debugOpen, (v) => {
  try {
    localStorage.setItem(DEBUG_SIDEBAR_KEY, v ? '1' : '0')
  } catch {
    /* ignore */
  }
})
</script>

<template>
  <div class="min-h-screen bg-stone-800 text-stone-800">
    <div
      class="mx-auto w-full min-h-screen flex flex-col lg:flex-row lg:items-stretch lg:gap-3 lg:p-4 lg:max-w-[1400px]"
    >
      <div
        class="relative flex-1 flex flex-col min-h-screen lg:min-h-[calc(100vh-2rem)] bg-stone-100 shadow-2xl lg:rounded-2xl overflow-hidden font-sans min-w-0"
      >
        <GameHeader />
        <StatusBar />

        <main
          class="flex-grow p-4 lg:p-6 xl:p-8 pb-36 sm:pb-40 pr-28 sm:pr-36 flex flex-col gap-4 justify-center lg:justify-start overflow-y-auto"
        >
          <HowToPlayView v-if="currentStep === 'welcome'" />
          <VisaSelectionView v-else-if="currentStep === 'visa-selection'" />
          <CharacterSelectView v-else-if="currentStep === 'character-selection'" />
          <ArrivalLoadingView v-else-if="currentStep === 'arrival-loading'" />
          <TutorialView v-else-if="currentStep === 'tutorial'" />
          <CityMapView v-else-if="currentStep === 'city-map'" />
          <MapPlanningView v-else-if="currentStep === 'map-planning'" />
          <TravelModeView v-else-if="currentStep === 'travel-mode'" />
          <CityEventView v-else-if="currentStep === 'city-event'" />
          <EndingView v-else-if="currentStep === 'ending'" />
        </main>

        <CompanionAvatar />

        <footer class="p-3 lg:p-4 text-center text-[10px] text-stone-400 border-t border-stone-200 bg-white">
          Made by Maggie & AI Collaborator
        </footer>
      </div>

      <aside
        class="w-full shrink-0 flex flex-col lg:max-h-[calc(100vh-2rem)]"
        :class="debugOpen ? 'lg:w-80 xl:w-96' : 'lg:w-10'"
      >
        <button
          type="button"
          class="bg-stone-900 text-amber-500 font-mono text-[10px] font-bold border border-stone-700 hover:border-amber-600/60 transition flex items-center"
          :class="debugOpen
            ? 'justify-between px-3 py-2.5 lg:rounded-t-2xl'
            : 'justify-between px-3 py-2.5 lg:flex-1 lg:flex-col lg:justify-center lg:gap-3 lg:rounded-2xl lg:px-1.5 lg:py-4'"
          :aria-expanded="debugOpen"
          :title="debugOpen ? (language === 'en' ? 'Collapse debug' : '收起 Debug') : (language === 'en' ? 'Expand debug' : '展开 Debug')"
          @click="debugOpen = !debugOpen"
        >
          <span class="lg:hidden">
            DEBUG {{ debugOpen ? '▴' : '▾' }}
          </span>
          <span
            class="hidden lg:block"
            :class="debugOpen ? '' : '[writing-mode:vertical-rl] rotate-180 tracking-[0.35em]'"
          >
            DEBUG {{ debugOpen ? '▸' : '' }}
          </span>
          <span class="text-stone-500 font-normal lg:hidden">
            {{ debugOpen
              ? (language === 'en' ? 'Collapse' : '收起')
              : (language === 'en' ? 'Expand' : '展开') }}
          </span>
        </button>

        <div
          v-show="debugOpen"
          class="overflow-y-auto flex-1 border border-t-0 border-stone-700 lg:rounded-b-2xl"
        >
          <DebugPanel />
        </div>
      </aside>
    </div>
  </div>
</template>
