/**
 * Engine: Attractions（城市內景點）
 */
import { attractionsByCity } from '../content/attractions'

export function getCityAttractions(city) {
  const cityId = typeof city === 'string' ? city : city?.id
  if (!cityId) return []
  if (attractionsByCity[cityId]?.attractions?.length) {
    return attractionsByCity[cityId].attractions
  }
  // fallback：沿用舊城市整圖作為單一「市區」景點
  const name = typeof city === 'object' ? city.name : { cn: cityId, en: cityId }
  const desc = typeof city === 'object' ? city.desc : { cn: '市區事件', en: 'City event' }
  return [
    {
      id: 'downtown',
      name: name || { cn: cityId, en: cityId },
      coords: { x: 50, y: 52 },
      desc: desc || { cn: '探索市區', en: 'Explore downtown' },
      graphId: cityId,
    },
  ]
}

export function getAttraction(cityId, attractionId) {
  return getCityAttractions(cityId).find((a) => a.id === attractionId) || null
}

export function getVisitedKey(cityId, attractionId) {
  return `${cityId}:${attractionId}`
}

export function tutorialFlagToAttraction(flag) {
  const map = {
    booked_ticket_official: { cityId: 'beijing', attractionId: 'forbidden_city' },
    booked_ticket_scalper: { cityId: 'beijing', attractionId: 'forbidden_city' },
    climbed_great_wall: { cityId: 'beijing', attractionId: 'great_wall' },
    hutong_wandered: { cityId: 'beijing', attractionId: 'hutong' },
    visited_temple_heaven: { cityId: 'beijing', attractionId: 'temple_heaven' },
  }
  return map[flag] || null
}

export function collectTutorialVisitedAttractions(player) {
  const flags = [...(player.activeEffects || []), ...(player.flags || [])]
  const keys = []
  for (const f of flags) {
    const hit = tutorialFlagToAttraction(f)
    if (hit) keys.push(getVisitedKey(hit.cityId, hit.attractionId))
  }
  return [...new Set(keys)]
}
