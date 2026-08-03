<script setup>
/**
 * 结果反馈：Teleport 到 body，避免被主面板 overflow/圆角裁成直角灰块。
 * 反应用角色 + 气泡，不做表情切换。
 */
defineProps({
  text: { type: String, required: true },
  effects: { type: Array, default: () => [] },
  confirmLabel: { type: String, default: 'Continue' },
  characterSrc: { type: String, default: '' },
  characterName: { type: String, default: '' },
})

defineEmits(['confirm'])
</script>

<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4 sm:p-8"
      role="dialog"
      aria-modal="true"
    >
      <!-- 全屏遮罩：盖住整个视口，不再出现「圆角盒子里的直角灰框」 -->
      <button
        type="button"
        class="absolute inset-0 bg-stone-950/45 border-0 cursor-default"
        aria-label="dismiss"
        @click="$emit('confirm')"
      />

      <div class="relative z-10 w-full max-w-lg flex items-end gap-2 sm:gap-4 scale-in">
        <div v-if="characterSrc" class="shrink-0 flex flex-col items-center pb-1">
          <img
            :src="characterSrc"
            :alt="characterName || 'traveler'"
            class="h-36 sm:h-44 w-auto object-contain drop-shadow-md [image-rendering:pixelated]"
            draggable="false"
          />
        </div>

        <div class="flex-1 min-w-0 pb-2">
          <!-- 气泡 -->
          <div class="relative bg-white border-2 border-stone-800 rounded-2xl rounded-bl-md px-4 py-3 shadow-lg">
            <p class="text-sm text-stone-800 leading-relaxed">
              {{ text }}
            </p>

            <div v-if="effects.length" class="flex flex-wrap gap-1.5 mt-3">
              <span
                v-for="p in effects"
                :key="p.key"
                class="inline-flex px-2 py-0.5 rounded-md bg-stone-100 border border-stone-200 text-[10px] font-mono text-stone-600"
              >
                {{ p.label }}
              </span>
            </div>

            <!-- 气泡小三角朝角色 -->
            <span
              v-if="characterSrc"
              class="absolute -left-2 bottom-5 w-0 h-0 border-y-8 border-y-transparent border-r-8 border-r-stone-800"
            />
            <span
              v-if="characterSrc"
              class="absolute -left-[5px] bottom-5 w-0 h-0 border-y-[7px] border-y-transparent border-r-[7px] border-r-white"
            />
          </div>

          <button
            type="button"
            class="mt-3 w-full sm:w-auto sm:min-w-[140px] bg-stone-900 hover:bg-stone-800 text-stone-100 font-bold text-sm py-2.5 px-5 rounded-xl transition active:scale-[0.98]"
            @click="$emit('confirm')"
          >
            {{ confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
