/**
 * Engine: EndingEvaluator
 * - 坏结局：sanity / time / battery ≤ 0（未成功离境时）
 * - 香港离境：按 locality / money / sanity 分档好结局（离境优先于时间归零）
 */
import endings from '../content/endings.json'

function getEndingById(id) {
  return endings[id] || null
}

function matchWhen(player, when = {}) {
  if (when.localityGte != null && (player.locality ?? 0) < when.localityGte) return false
  if (when.moneyGte != null && (player.money ?? 0) < when.moneyGte) return false
  if (when.sanityGte != null && (player.sanity ?? 0) < when.sanityGte) return false
  if (when.localityLte != null && (player.locality ?? 0) > when.localityLte) return false
  if (when.moneyLte != null && (player.money ?? 0) > when.moneyLte) return false
  if (when.sanityLte != null && (player.sanity ?? 0) > when.sanityLte) return false
  return true
}

/** 数值触发表（sanity / time / battery）——仅用于非离境路径 */
export function evaluateStatEnding(player) {
  for (const rule of endings.rules || []) {
    const when = rule.when || {}
    if (when.stat == null) continue
    if (when.exit) continue
    const value = player[when.stat]
    if (value == null) continue
    if (when.lte != null && value <= when.lte) {
      return getEndingById(rule.id)
    }
  }
  return null
}

/**
 * 成功走完离境口岸后的结局（忽略 time≤0）。
 * rules 里带 exit:true 的按顺序取第一条匹配（越前优先级越高）。
 */
export function evaluateExitEnding(player) {
  for (const rule of endings.rules || []) {
    const when = rule.when || {}
    if (!when.exit) continue
    if (!matchWhen(player, when)) continue
    return getEndingById(rule.id)
  }
  return getEndingById('hongkong_departure')
}

/** @deprecated 兼容旧调用：抵达香港城不等于离境成功 */
export function evaluateArrivalEnding(player, cityId, restricted = false) {
  if (restricted || cityId !== 'hongkong') return null
  return evaluateExitEnding(player)
}

export function evaluateEnding({ player, cityId, restricted, exited = false }) {
  if (exited) return evaluateExitEnding(player)
  return evaluateStatEnding(player) || evaluateArrivalEnding(player, cityId, restricted)
}

export function isHongKongExit(cityId, restricted) {
  return !restricted && cityId === 'hongkong'
}
