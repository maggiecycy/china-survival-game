<script setup>
/**
 * 常驻旅人：仅人物、无底框；放右下角，避免挡住左侧选项文字。
 */
import { computed } from 'vue'
import { useGameStore } from '../stores/useGameStore'

const {
  selectedCharacter,
  currentStep,
  tutorialFeedback,
  currentCityEvent,
  t,
} = useGameStore()

const hiddenSteps = new Set(['welcome', 'visa-selection', 'character-selection', 'arrival-loading', 'ending'])

const visible = computed(() => {
  if (!selectedCharacter.value) return false
  if (hiddenSteps.has(currentStep.value)) return false
  if (tutorialFeedback.value) return false
  if (currentCityEvent.value?.feedback) return false
  return true
})
</script>

<template>
  <div
    v-if="visible"
    class="pointer-events-none absolute bottom-3 right-3 z-20 sm:bottom-4 sm:right-4"
  >
    <img
      :src="selectedCharacter.sprite"
      :alt="t(selectedCharacter.name)"
      class="h-32 sm:h-40 w-auto object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.25)] [image-rendering:pixelated]"
      draggable="false"
    />
  </div>
</template>
