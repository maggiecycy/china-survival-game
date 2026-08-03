<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useGameStore } from '../stores/useGameStore'

const { language, characters, t, selectCharacter, goToVisaSelection } = useGameStore()

const index = ref(0)
const thumbRefs = ref([])

const current = computed(() => characters[index.value] || null)

const setIndex = (i) => {
  if (!characters.length) return
  const n = characters.length
  index.value = ((i % n) + n) % n
}

const pickPrev = () => setIndex(index.value - 1)
const pickNext = () => setIndex(index.value + 1)

const confirm = () => {
  if (!current.value) return
  selectCharacter(current.value.id)
}

const onKey = (e) => {
  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    pickPrev()
  } else if (e.key === 'ArrowRight') {
    e.preventDefault()
    pickNext()
  } else if (e.key === 'Enter') {
    e.preventDefault()
    confirm()
  }
}

watch(index, async () => {
  await nextTick()
  const el = thumbRefs.value[index.value]
  el?.scrollIntoView?.({ block: 'nearest', inline: 'center', behavior: 'smooth' })
})

onMounted(() => window.addEventListener('keydown', onKey))
onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <section class="flex flex-col gap-4 fade-in w-full max-w-4xl mx-auto">
    <div class="text-center space-y-1">
      <h2 class="text-xl lg:text-2xl font-black text-stone-900 tracking-tight">
        {{ language === 'en' ? 'Choose Your Traveler' : '選擇你的旅人' }}
      </h2>
      <p class="text-xs text-stone-500">
        {{ language === 'en'
          ? '← → to switch · Enter to confirm'
          : '← → 切換角色 · Enter 確認' }}
      </p>
    </div>

    <div
      v-if="current"
      class="bg-white border border-stone-200 rounded-2xl p-4 lg:p-5 shadow-sm grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 lg:gap-6 items-center"
    >
      <!-- 预览：透明底，无灰框 -->
      <div class="flex flex-col items-center gap-3">
        <div class="flex items-center gap-2">
          <button
            type="button"
            class="w-9 h-9 rounded-xl border border-stone-300 bg-stone-50 text-stone-700 font-bold hover:bg-stone-100 active:scale-95"
            :aria-label="language === 'en' ? 'Previous' : '上一位'"
            @click="pickPrev"
          >
            ‹
          </button>
          <div class="w-36 h-44 sm:w-40 sm:h-48 flex items-end justify-center">
            <img
              :src="current.sprite"
              :alt="t(current.name)"
              class="max-h-full max-w-full object-contain [image-rendering:pixelated] drop-shadow-sm"
              draggable="false"
            />
          </div>
          <button
            type="button"
            class="w-9 h-9 rounded-xl border border-stone-300 bg-stone-50 text-stone-700 font-bold hover:bg-stone-100 active:scale-95"
            :aria-label="language === 'en' ? 'Next' : '下一位'"
            @click="pickNext"
          >
            ›
          </button>
        </div>
        <p class="text-[10px] font-mono text-stone-400">
          {{ index + 1 }} / {{ characters.length }}
        </p>
      </div>

      <!-- 角色卡：性格 / 职业 / 简介，不写国家 -->
      <div class="space-y-3 min-w-0">
        <div>
          <h3 class="text-lg font-black text-stone-900">{{ t(current.name) }}</h3>
          <p class="text-xs font-semibold text-amber-700 mt-0.5">{{ t(current.job) }}</p>
        </div>
        <div class="bg-stone-50 border border-stone-100 rounded-xl px-3 py-2">
          <p class="text-[10px] font-mono uppercase tracking-wider text-stone-400 mb-0.5">
            {{ language === 'en' ? 'Personality' : '性格' }}
          </p>
          <p class="text-xs font-bold text-stone-800">{{ t(current.trait) }}</p>
        </div>
        <p class="text-xs text-stone-600 leading-relaxed">
          {{ t(current.bio) }}
        </p>
      </div>
    </div>

    <!-- 缩略图条 -->
    <div class="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
      <button
        v-for="(c, i) in characters"
        :key="c.id"
        :ref="(el) => { if (el) thumbRefs[i] = el }"
        type="button"
        class="shrink-0 w-14 h-16 sm:w-16 sm:h-[4.5rem] rounded-lg border-2 bg-transparent p-1 transition focus:outline-none"
        :class="i === index ? 'border-amber-500 ring-2 ring-amber-300/50' : 'border-stone-200 hover:border-stone-300'"
        @click="setIndex(i)"
      >
        <img
          :src="c.sprite"
          :alt="t(c.name)"
          class="h-full w-full object-contain [image-rendering:pixelated]"
          draggable="false"
        />
      </button>
    </div>

    <div class="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between pt-1">
      <button
        type="button"
        class="text-xs text-stone-400 hover:text-stone-600 underline order-2 sm:order-1"
        @click="goToVisaSelection"
      >
        {{ language === 'en' ? '← Back to visa' : '← 返回簽證' }}
      </button>
      <button
        type="button"
        class="order-1 sm:order-2 w-full sm:w-auto bg-stone-900 text-stone-100 font-bold py-3 px-8 rounded-xl transition active:scale-[0.98] hover:bg-stone-800"
        @click="confirm"
      >
        {{ language === 'en' ? 'Fly to Beijing' : '飛往北京' }}
      </button>
    </div>
  </section>
</template>
