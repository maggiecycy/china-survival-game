/**
 * Engine: Condition — 解锁 / 签证限制 / 国籍资格 / 事件条件
 */

const STAT_KEYS = {
  sanity: 'sanity',
  locality: 'locality',
  battery: 'battery',
  money: 'money',
  time: 'timeRemaining',
  timeRemaining: 'timeRemaining',
}

const OP_SUFFIXES = [
  ['Gte', (a, b) => a >= b],
  ['Lte', (a, b) => a <= b],
  ['Gt', (a, b) => a > b],
  ['Lt', (a, b) => a < b],
  ['Eq', (a, b) => a === b],
]

function playerStatValue(player, statName) {
  const key = STAT_KEYS[statName]
  if (!key) return null
  const raw = player?.[key]
  if (raw == null) {
    if (key === 'battery') return 100
    if (key === 'locality') return 0
    return 0
  }
  return Number(raw)
}

/** 解析 requiresStats / blocksIfStats 的单个键，如 sanityGte → { stat, op, threshold } */
export function parseStatRule(ruleKey) {
  for (const [suffix, op] of OP_SUFFIXES) {
    if (!ruleKey.endsWith(suffix)) continue
    const statName = ruleKey.slice(0, -suffix.length)
    if (!STAT_KEYS[statName]) continue
    return { statName, suffix, op }
  }
  return null
}

/** requiresStats：全部通过才算满足；blocksIfStats：任一成立则失败 */
export function matchesStatRules(player, requiresStats, blocksIfStats) {
  if (requiresStats && typeof requiresStats === 'object') {
    for (const [key, threshold] of Object.entries(requiresStats)) {
      const parsed = parseStatRule(key)
      if (!parsed) continue
      const value = playerStatValue(player, parsed.statName)
      if (!parsed.op(value, Number(threshold))) return false
    }
  }
  if (blocksIfStats && typeof blocksIfStats === 'object') {
    for (const [key, threshold] of Object.entries(blocksIfStats)) {
      const parsed = parseStatRule(key)
      if (!parsed) continue
      const value = playerStatValue(player, parsed.statName)
      if (parsed.op(value, Number(threshold))) return false
    }
  }
  return true
}

/** flags + 数值门槛：requires / blocks_if / requiresStats / blocksIfStats */
export function matchesEventConditions(event, player) {
  const flags = new Set([...(player.flags || []), ...(player.activeEffects || [])])
  if (event.requires?.length && !event.requires.every((f) => flags.has(f))) return false
  if (event.blocks_if?.length && event.blocks_if.some((f) => flags.has(f))) return false
  if (!matchesStatRules(player, event.requiresStats, event.blocksIfStats)) return false
  return true
}

const STAT_LABEL = {
  cn: {
    sanity: 'Sanity',
    locality: 'Locality',
    battery: 'Battery',
    money: 'Money',
    time: 'Time',
    timeRemaining: 'Time',
  },
  en: {
    sanity: 'Sanity',
    locality: 'Locality',
    battery: 'Battery',
    money: 'Money',
    time: 'Time',
    timeRemaining: 'Time',
  },
}

const SUFFIX_SYMBOL = {
  Gte: '≥',
  Lte: '≤',
  Gt: '>',
  Lt: '<',
  Eq: '=',
}

/** 生成数值门槛失败时的可读文案（供 describeChoiceLock 使用） */
export function describeStatLock(choice, player, language = 'cn') {
  const failed = []
  const req = choice.requiresStats || {}
  for (const [key, threshold] of Object.entries(req)) {
    const parsed = parseStatRule(key)
    if (!parsed) continue
    const value = playerStatValue(player, parsed.statName)
    if (!parsed.op(value, Number(threshold))) {
      const label = STAT_LABEL[language]?.[parsed.statName] || parsed.statName
      const sym = SUFFIX_SYMBOL[parsed.suffix] || parsed.suffix
      failed.push(`${label} ${sym} ${threshold}`)
    }
  }
  const blocks = choice.blocksIfStats || {}
  for (const [key, threshold] of Object.entries(blocks)) {
    const parsed = parseStatRule(key)
    if (!parsed) continue
    const value = playerStatValue(player, parsed.statName)
    if (parsed.op(value, Number(threshold))) {
      const label = STAT_LABEL[language]?.[parsed.statName] || parsed.statName
      const sym = SUFFIX_SYMBOL[parsed.suffix] || parsed.suffix
      failed.push(
        language === 'en'
          ? `Blocked when ${label} ${sym} ${threshold}`
          : `當 ${label} ${sym} ${threshold} 時不可用`,
      )
    }
  }
  if (!failed.length) return null
  return language === 'en'
    ? `Requires: ${failed.join(', ')}`
    : `需要：${failed.join('，')}`
}

export function isCityRestricted(city, visaType) {
  return !!(city?.visaRestriction && city.visaRestriction.includes(visaType))
}

/**
 * 探索解锁：仅看 unlockedCityIds（开局仅起点城；探索完某城后加入其地图上最近 2 城）。
 * unlockRequired 字段保留兼容，但不再作为主逻辑。
 */
export function isCityUnlocked(city, unlockedCityIds = []) {
  if (!city?.id) return false
  return unlockedCityIds.includes(city.id)
}

export function getUnlockedCityIds(cities, unlockedCityIds = []) {
  const set = new Set(unlockedCityIds)
  return cities.filter((c) => set.has(c.id)).map((c) => c.id)
}

export function distanceOnMap(a, b) {
  if (!a?.coords || !b?.coords) return Infinity
  const dx = a.coords.x - b.coords.x
  const dy = a.coords.y - b.coords.y
  return Math.hypot(dx, dy)
}

/** 地图坐标上最近的 n 座其他城市 */
export function getNearestCities(fromCity, cities, n = 2) {
  if (!fromCity) return []
  return [...cities]
    .filter((c) => c.id !== fromCity.id)
    .sort((a, b) => distanceOnMap(fromCity, a) - distanceOnMap(fromCity, b))
    .slice(0, n)
}

export function getNearestCityIds(fromCity, cities, n = 2) {
  return getNearestCities(fromCity, cities, n).map((c) => c.id)
}

/** 探索某城后将解锁谁（预览用） */
export function getUnlocksFrom(city, cities) {
  return getNearestCities(city, cities, 2)
}

/**
 * 护照国籍是否在名单内。
 * - 大小写不敏感
 * - 精确匹配国名（避免输入 "f" 误中 France）
 * - 名单含 "All Countries..." 时一律 eligible
 */
export function checkCountryStatus(countryList, query) {
  if (!query) return null
  const q = query.toLowerCase().trim()
  if (!q) return null
  if (!Array.isArray(countryList) || countryList.length === 0) return 'not-eligible'
  if (countryList.some((c) => String(c).toLowerCase().includes('all countries'))) {
    return 'eligible'
  }
  const found = countryList.some((c) => String(c).toLowerCase().trim() === q)
  return found ? 'eligible' : 'not-eligible'
}

export function pickArrivalEvent(city, player) {
  const events = city?.events?.filter((e) => e.trigger === 'arrival') ?? []
  return events.find((e) => matchesEventConditions(e, player)) || events[0] || null
}
