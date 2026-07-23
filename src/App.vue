<script setup>
/**
 * App.vue
 * visa → arrival → tutorial → city-map ↔ attraction/lodging
 *                → map-planning → travel → city-map → ending
 */
import { provide } from 'vue'
import { useGameStore } from './stores/useGameStore'
import GameHeader from './components/GameHeader.vue'
import StatusBar from './components/StatusBar.vue'
import DebugPanel from './components/DebugPanel.vue'
import VisaSelectionView from './views/VisaSelectionView.vue'
import ArrivalLoadingView from './views/ArrivalLoadingView.vue'
import TutorialView from './views/TutorialView.vue'
import MapPlanningView from './views/MapPlanningView.vue'
import CityMapView from './views/CityMapView.vue'
import TravelModeView from './views/TravelModeView.vue'
import CityEventView from './views/CityEventView.vue'
import EndingView from './views/EndingView.vue'

const store = useGameStore()
const { currentStep, playerState, cities, tutorial } = store

provide('playerState', playerState)
provide('citiesData', cities)
provide('tutorialData', tutorial)
</script>

<template>
  <div class="max-w-md w-full mx-auto bg-stone-100 min-h-screen flex flex-col justify-between shadow-xl font-sans text-stone-800">
    <GameHeader />
    <StatusBar />

    <main class="flex-grow p-4 flex flex-col gap-4 justify-center">
      <VisaSelectionView v-if="currentStep === 'visa-selection'" />
      <ArrivalLoadingView v-else-if="currentStep === 'arrival-loading'" />
      <TutorialView v-else-if="currentStep === 'tutorial'" />
      <CityMapView v-else-if="currentStep === 'city-map'" />
      <MapPlanningView v-else-if="currentStep === 'map-planning'" />
      <TravelModeView v-else-if="currentStep === 'travel-mode'" />
      <CityEventView v-else-if="currentStep === 'city-event'" />
      <EndingView v-else-if="currentStep === 'ending'" />
    </main>

    <footer class="p-4 text-center text-[10px] text-stone-400 border-t border-stone-200 bg-white">
      Made by Maggie & AI Collaborator
    </footer>
  </div>

  <DebugPanel />
</template>
