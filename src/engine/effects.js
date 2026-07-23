/**
 * Engine: Effect — 数值结算与 flag 写入
 */

export function clampStats(player) {
  if (player.sanity < 0) player.sanity = 0
  if (player.sanity > 100) player.sanity = 100
  if (player.money < 0) player.money = 0
  if (player.timeRemaining < 0) player.timeRemaining = 0
  if (player.battery != null) {
    if (player.battery < 0) player.battery = 0
    if (player.battery > 100) player.battery = 100
  }
  if (player.locality != null) {
    if (player.locality < 0) player.locality = 0
    if (player.locality > 100) player.locality = 100
  }
  return player
}

/** Tutorial cost：money/time 为正表示消耗；sanity/battery/locality 按符号累加 */
export function applyTutorialCost(player, cost = {}) {
  player.money -= cost.money || 0
  player.sanity += cost.sanity || 0
  player.timeRemaining -= cost.time || 0
  if (cost.battery != null) player.battery = (player.battery ?? 100) + cost.battery
  if (cost.locality != null) player.locality = (player.locality ?? 0) + cost.locality
  return clampStats(player)
}

/** City / event effect：字段已带正负号，直接累加 */
export function applyEffect(player, effect = {}) {
  player.money += effect.money || 0
  player.sanity += effect.sanity || 0
  player.timeRemaining += effect.time || 0
  if (effect.battery) player.battery = (player.battery ?? 100) + effect.battery
  if (effect.locality) player.locality = (player.locality ?? 0) + effect.locality
  return clampStats(player)
}

export function addFlag(player, flag) {
  if (!flag) return player
  if (!player.activeEffects.includes(flag)) {
    player.activeEffects.push(flag)
  }
  if (!player.flags) player.flags = []
  if (!player.flags.includes(flag)) {
    player.flags.push(flag)
  }
  return player
}

export function hasFlag(player, flag) {
  return player.activeEffects?.includes(flag) || player.flags?.includes(flag)
}
