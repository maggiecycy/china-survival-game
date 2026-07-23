/**
 * Engine: Condition — 解锁 / 签证限制 / 国籍资格 / 事件条件
 */

export function isCityRestricted(city, visaType) {
  return !!(city?.visaRestriction && city.visaRestriction.includes(visaType))
}

export function isCityUnlocked(city, visitedCities = []) {
  if (!city?.unlockRequired || city.unlockRequired.length === 0) return true
  return city.unlockRequired.every((req) => visitedCities.includes(req))
}

export function getUnlockedCityIds(cities, visitedCities) {
  return cities.filter((c) => isCityUnlocked(c, visitedCities)).map((c) => c.id)
}

export function getUnlocksFrom(city, cities) {
  return cities.filter((c) => c.unlockRequired?.includes(city.id))
}

export function checkCountryStatus(countryList, query) {
  if (!query) return null
  const q = query.toLowerCase().trim()
  if (countryList.includes('All Countries / 所有國家')) return 'eligible'
  const found = countryList.some((c) => c.toLowerCase().includes(q))
  return found ? 'eligible' : 'not-eligible'
}

/** 为后续 event graph 预留：requires / blocks_if */
export function matchesEventConditions(event, player) {
  const flags = new Set([...(player.flags || []), ...(player.activeEffects || [])])
  if (event.requires?.length && !event.requires.every((f) => flags.has(f))) return false
  if (event.blocks_if?.length && event.blocks_if.some((f) => flags.has(f))) return false
  return true
}

export function pickArrivalEvent(city, player) {
  const events = city?.events?.filter((e) => e.trigger === 'arrival') ?? []
  return events.find((e) => matchesEventConditions(e, player)) || events[0] || null
}
