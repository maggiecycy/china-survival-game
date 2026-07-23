<script setup>
import { computed } from 'vue'
import { useGameStore } from '../stores/useGameStore'

const {
  language,
  currentCityEvent,
  currentEventNode,
  availableChoices,
  lockedChoices,
  t,
  resolveRestrictedEvent,
  resolveTerminalNode,
  chooseCityOption,
  confirmCityFeedback,
  choiceLockReason,
} = useGameStore()

const showChoices = computed(() => {
  const ctx = currentCityEvent.value
  const node = currentEventNode.value
  if (!ctx || ctx.restricted || ctx.feedback) return false
  if (!node) return false
  return (node.choices?.length ?? 0) > 0 && !node.end
})

const showContinue = computed(() => {
  const ctx = currentCityEvent.value
  const node = currentEventNode.value
  if (!ctx || ctx.feedback) return false
  if (ctx.restricted) return true
  if (!node) return true
  // 终端节点 / 无可用分支时显示继续
  if (node.end || !node.choices?.length) return true
  // 有 choices 但全部锁死且无可用项 → 仍给继续以免卡死（理论上应有兜底选项）
  if (availableChoices.value.length === 0 && (node.choices?.length ?? 0) > 0) return true
  return false
})

const formatEffect = (effect) => {
  if (!effect) return []
  const parts = []
  if (effect.money) parts.push({ key: 'money', label: `💰 ${effect.money}` })
  if (effect.sanity) parts.push({ key: 'sanity', label: `🧠 ${effect.sanity}` })
  if (effect.time) parts.push({ key: 'time', label: `⏳ ${effect.time}h` })
  if (effect.battery) parts.push({ key: 'battery', label: `🔋 ${effect.battery}` })
  if (effect.locality) parts.push({ key: 'locality', label: `🧭 ${effect.locality}` })
  return parts
}
</script>

<template>
  <section class="flex flex-col gap-4 fade-in my-auto">
    <!-- 情境卡 -->
    <div class="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-3">
      <div class="text-center text-4xl">{{ currentCityEvent?.restricted ? '🚨' : '📍' }}</div>

      <div class="text-center">
        <h3 class="font-black text-lg text-stone-950">{{ currentCityEvent?.city.name[language] }}</h3>
        <span
          :class="[
            'text-[10px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider mt-1 inline-block',
            currentCityEvent?.restricted ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
          ]"
        >
          <template v-if="currentCityEvent?.restricted">
            {{ language === 'en' ? 'Entry Denied' : '入境受阻' }}
          </template>
          <template v-else-if="currentCityEvent?.type === 'lodging'">
            {{ language === 'en' ? 'Lodging' : '住宿安排' }}
          </template>
          <template v-else-if="currentCityEvent?.type === 'transit'">
            {{ language === 'en' ? 'Transit Event' : '交通事件' }}
          </template>
          <template v-else-if="currentCityEvent?.type === 'attraction'">
            {{ t(currentEventNode?.title) || currentCityEvent?.attraction?.name?.[language] || (language === 'en' ? 'Attraction' : '景點') }}
          </template>
          <template v-else>
            {{ t(currentEventNode?.title) || (language === 'en' ? 'City Event' : '城市事件') }}
          </template>
        </span>
      </div>

      <p class="text-xs text-stone-600 leading-relaxed text-center max-w-sm mx-auto">
        <template v-if="currentCityEvent?.restricted">
          {{ language === 'en'
            ? `Your visa does not cover ${currentCityEvent.city.name.en}. You are stopped at the checkpoint and sent back.`
            : `你的簽證無法覆蓋${currentCityEvent.city.name.cn}，在檢查哨被攔下並遣返。` }}
        </template>
        <template v-else-if="currentEventNode">
          {{ t(currentEventNode.text) }}
        </template>
        <template v-else>
          {{ language === 'en' ? 'Nothing special happened here.' : '這裡似乎風平浪靜。' }}
        </template>
      </p>

      <!-- 终端节点预览数值 -->
      <div
        v-if="!currentCityEvent?.restricted && currentEventNode?.effect && showContinue"
        class="flex justify-center gap-3 text-[10px] font-mono text-stone-400"
      >
        <span v-for="p in formatEffect(currentEventNode.effect)" :key="p.key">{{ p.label }}</span>
      </div>

      <div
        v-if="currentCityEvent?.restricted"
        class="flex justify-center gap-4 text-[10px] font-mono text-stone-400"
      >
        <span>💰 -300</span>
        <span>🧠 -30</span>
      </div>
    </div>

    <!-- 可选分支 -->
    <div v-if="showChoices" class="flex flex-col gap-2">
      <p class="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-1">
        {{ language === 'en' ? 'Your move' : '你的選擇' }}
      </p>

      <button
        v-for="choice in availableChoices"
        :key="choice.id"
        @click="chooseCityOption(choice)"
        class="text-left bg-white border-2 border-stone-200 rounded-2xl p-4 hover:border-amber-400 active:scale-[0.98] transition shadow-sm space-y-2"
      >
        <p class="text-xs font-bold text-stone-900 leading-relaxed">{{ t(choice.text) }}</p>
        <div class="flex flex-wrap gap-2 text-[10px] font-mono text-stone-400">
          <span v-for="p in formatEffect(choice.effect || choice.costs)" :key="p.key">{{ p.label }}</span>
          <span
            v-for="flag in [...(choice.addFlags || []), ...(choice.effectFlag ? [choice.effectFlag] : [])]"
            :key="flag"
            class="text-amber-600"
          >🏷️ {{ flag }}</span>
        </div>
      </button>

      <!-- 被 activeEffects 锁住的选项：灰显，展示原因 -->
      <div
        v-for="choice in lockedChoices"
        :key="'locked-' + choice.id"
        class="text-left bg-stone-100 border-2 border-dashed border-stone-200 rounded-2xl p-4 opacity-70 space-y-1"
      >
        <p class="text-xs font-bold text-stone-500 leading-relaxed">🔒 {{ t(choice.text) }}</p>
        <p class="text-[10px] text-red-500/80 font-medium">{{ choiceLockReason(choice) }}</p>
      </div>
    </div>

    <!-- 继续 / 遣返确认 -->
    <button
      v-if="showContinue"
      @click="currentCityEvent?.restricted ? resolveRestrictedEvent() : resolveTerminalNode()"
      class="bg-stone-900 text-stone-100 py-3.5 rounded-xl text-xs font-bold hover:bg-stone-800 active:scale-[0.98] transition shadow-md"
    >
      <template v-if="currentCityEvent?.restricted">
        {{ language === 'en' ? 'Accept Deportation' : '接受遣返' }}
      </template>
      <template v-else>
        {{ language === 'en' ? 'Continue Journey' : '繼續旅程' }}
      </template>
    </button>

    <!-- Feedback 弹窗 -->
    <div
      v-if="currentCityEvent?.feedback"
      class="fixed inset-0 bg-stone-950/60 flex items-center justify-center p-6 z-50 fade-in"
    >
      <div class="bg-white rounded-2xl p-5 max-w-sm w-full space-y-4 shadow-xl scale-in">
        <div class="text-4xl text-center">📝</div>
        <p class="text-xs text-stone-700 leading-relaxed">{{ t(currentCityEvent.feedback) }}</p>
        <div
          v-if="currentCityEvent.lastChoice"
          class="flex flex-wrap justify-center gap-2 text-[10px] font-mono text-stone-400"
        >
          <span
            v-for="p in formatEffect(currentCityEvent.lastChoice.effect || currentCityEvent.lastChoice.costs)"
            :key="p.key"
          >{{ p.label }}</span>
        </div>
        <button
          @click="confirmCityFeedback"
          class="w-full bg-stone-900 text-stone-100 font-bold py-2.5 rounded-xl hover:bg-stone-800 transition active:scale-[0.98]"
        >
          {{ language === 'en' ? 'Continue' : '繼續' }}
        </button>
      </div>
    </div>
  </section>
</template>
