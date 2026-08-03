/**
 * Engine: player factory（初始状态 / 重置）
 * flags 与 activeEffects 同步维护，方便后续迁移到 event graph
 */

export function createInitialPlayer(overrides = {}) {
  return {
    money: 5000,
    sanity: 100,
    battery: 100,
    locality: 0,
    timeRemaining: 0,
    isTutorialComplete: false,
    isVisaVerified: false,
    currentTutorialStage: 0,
    activeEffects: [],
    flags: [],
    inventory: [],
    currentCity: null,
    currentNode: null,
    visa: null,
    lodging: null,
    characterId: null,
    ...overrides,
  }
}

/**
 * 选签时的初始写入（与原版玩法对齐）：
 * 只改 visa / 时限 / 起始城市，不重置已消耗的 money/sanity。
 */
export function applyVisaInitial(player, visaConfig) {
  const initial = visaConfig?.initial ?? {}
  player.visa = visaConfig?.id ?? null
  player.isVisaVerified = true
  player.timeRemaining = initial.timeRemaining ?? player.timeRemaining
  if (initial.money != null) player.money = initial.money
  if (initial.sanity != null) player.sanity = initial.sanity
  if (initial.battery != null) player.battery = initial.battery
  if (initial.locality != null) player.locality = initial.locality
  player.currentCity = 'beijing'
  return player
}
