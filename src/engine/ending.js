/**
 * Engine: EndingEvaluator — 属性归零坏结局 + 香港好坏结局
 */
import endings from '../content/endings.json'

function getEndingById(id) {
  return endings[id] || null
}

/** 数值触发表（sanity / time / battery） */
export function evaluateStatEnding(player) {
  for (const rule of endings.rules || []) {
    const when = rule.when || {}
    if (when.stat == null) continue
    const value = player[when.stat]
    if (value == null) continue
    if (when.lte != null && value <= when.lte) {
      return getEndingById(rule.id)
    }
  }
  return null
}

/** 抵达城市后的结局（香港等） */
export function evaluateArrivalEnding(player, cityId, restricted = false) {
  if (restricted || !cityId) return null

  for (const rule of endings.rules || []) {
    const when = rule.when || {}
    if (!when.arrivedCity) continue
    if (when.arrivedCity !== cityId) continue
    if (when.localityGte != null && (player.locality ?? 0) < when.localityGte) continue
    return getEndingById(rule.id)
  }
  return null
}

export function evaluateEnding({ player, cityId, restricted }) {
  return evaluateStatEnding(player) || evaluateArrivalEnding(player, cityId, restricted)
}

export function isHongKongExit(cityId, restricted) {
  return !restricted && cityId === 'hongkong'
}
