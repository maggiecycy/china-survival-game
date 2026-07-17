<script setup>
import { computed } from 'vue'

const props = defineProps({
  cities: {
    type: Array,
    required: true
  },
  language: {
    type: String,
    default: 'cn'
  },
  currentVisa: {
    type: String,
    required: true
  },
  unlockedCities: {
    type: Array,
    default: () => ['beijing'] // 默認解鎖初始城市
  }
})

const emit = defineEmits(['select-city'])

// 判斷城市是否被簽證政策限制
const isRestrictedByVisa = (city) => {
  if (!city.visaRestriction) return false
  return city.visaRestriction.includes(props.currentVisa)
}

// 判斷城市是否被解鎖
const isUnlocked = (city) => {
  // 1. 如果被簽證限制，強制鎖死
  if (isRestrictedByVisa(city)) return false
  
  // 2. 如果無前置解鎖要求，默認解鎖
  if (!city.unlockRequired || city.unlockRequired.length === 0) return true
  
  // 3. 檢查前置解鎖城市是否都已通關/解鎖
  return city.unlockRequired.every(reqId => props.unlockedCities.includes(reqId))
}

const handleCityClick = (city) => {
  if (isRestrictedByVisa(city)) {
    alert(
      props.language === 'en'
        ? `⚠️ Your current visa (${props.currentVisa}) strictly prohibits entry to ${city.name.en}!`
        : `⚠️ 你当前的签证类型 (${props.currentVisa}) 严禁前往${city.name.cn}！`
    )
    return
  }
  if (!isUnlocked(city)) {
    alert(
      props.language === 'en'
        ? `🔒 Travel to connected cities first to unlock ${city.name.en}!`
        : `🔒 请先通关前置关联城市以解锁${city.name.cn}！`
    )
    return
  }
  emit('select-city', city)
}
</script>



<template>
  <div class="w-full bg-stone-900 border-2 border-stone-800 rounded-2xl p-4 shadow-inner relative select-none">
    <div class="flex justify-between items-center mb-3">
      <h3 class="text-xs font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1.5">
        🗺️ {{ language === 'en' ? 'Route Planner' : '路线规划图' }}
      </h3>
      <span class="text-[10px] text-amber-500 font-mono bg-amber-950/80 px-2 py-0.5 rounded border border-amber-900">
        {{ currentVisa }} Visa Active
      </span>
    </div>

    <!-- 地圖主畫布 -->
    <div class="relative w-full aspect-[4/3] bg-stone-950 rounded-xl overflow-hidden border border-stone-800">
      
      <!-- 极简中国地图轮廓背景 (SVG 示意) -->
      <svg class="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 100 100" fill="none" stroke="currentColor">
        <path d="M 10 25 Q 25 15 45 25 T 80 30 T 90 55 T 75 85 T 55 90 T 35 75 T 10 60 Z" fill="#292524" stroke="#44403c" stroke-width="0.5"/>
        <path d="M 10 60 Q 5 70 15 80 T 30 75" fill="none" stroke="#44403c" stroke-width="0.5" stroke-dasharray="1,1"/>
      </svg>

      

      <!-- 城市大头针节点 -->
      <button 
        v-for="city in cities" 
        :key="city.id"
        @click="handleCityClick(city)"
        :style="{ left: city.coords.x + '%', top: city.coords.y + '%' }"
        class="absolute -translate-x-1/2 -translate-y-1/2 group z-10 focus:outline-none transition-all duration-300"
      >
        <div class="relative flex items-center justify-center">
          <!-- 闪烁扩散波纹 -->
          <span 
            v-if="isUnlocked(city)"
            class="absolute inline-flex h-6 w-6 rounded-full bg-amber-400 opacity-20 animate-ping"
          ></span>
          
          <!-- 核心圆形大头针 -->
          <div 
            :class="[
              isRestrictedByVisa(city) 
                ? 'bg-red-950 border-red-700 text-red-400' 
                : !isUnlocked(city) 
                  ? 'bg-stone-800 border-stone-700 text-stone-500' 
                  : 'bg-amber-400 border-stone-900 text-stone-950 scale-110 hover:scale-125 shadow-lg shadow-amber-500/20'
            ]"
            class="w-5 h-5 rounded-full border-2 flex items-center justify-center font-bold text-[9px] transition-transform"
          >
            <span v-if="isRestrictedByVisa(city)">🚫</span>
            <span v-else-if="!isUnlocked(city)">🔒</span>
            <span v-else>📍</span>
          </div>

          <!-- 悬浮提示框 -->
          <div class="absolute bottom-6 left-1/2 -translate-x-1/2 bg-stone-900 text-stone-100 text-[10px] px-2 py-1 rounded-md border border-stone-700 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20">
            <p class="font-bold">{{ city.name[language] }}</p>
            <p class="text-[8px] text-stone-400" v-if="isRestrictedByVisa(city)">
              {{ language === 'en' ? 'Visa Restricted' : '签证限制区域' }}
            </p>
            <p class="text-[8px] text-amber-400" v-else-if="isUnlocked(city)">
              {{ language === 'en' ? 'Click to Travel' : '点击开启行程' }}
            </p>
            <p class="text-[8px] text-stone-400" v-else>
              {{ language === 'en' ? 'Locked' : '未解锁' }}
            </p>
          </div>
        </div>
      </button>

    </div>
    
    <!-- 狀態說明 -->
    <div class="mt-3 flex gap-4 justify-center text-[10px] text-stone-400">
      <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-amber-400 border border-stone-900 inline-block"></span> {{ language === 'en' ? 'Unlocked' : '可前往' }}</span>
      <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-stone-800 border border-stone-700 inline-block"></span> {{ language === 'en' ? 'Locked' : '前置未解锁' }}</span>
      <span class="flex items-center gap-1"><span class="w-2.5 h-2.5 rounded-full bg-red-950 border border-red-700 inline-block flex items-center justify-center text-[6px]">🚫</span> {{ language === 'en' ? 'Restricted' : '签证不可达' }}</span>
    </div>
  </div>
</template>