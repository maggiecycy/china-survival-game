/**
 * Engine: Lodging + 日结算（含过夜回电解）
 */
import gameConfig from '../content/gameConfig.json'
import { applyEffect, hasFlag, clampStats } from './effects.js'

export function setLodging(player, lodging) {
  if (!lodging) {
    player.lodging = null
    return player
  }
  player.lodging = {
    type: lodging.type,
    nightlyCost: lodging.nightlyCost ?? 0,
    nightsLeft: lodging.nightsLeft === undefined ? null : lodging.nightsLeft,
    label: lodging.label || null,
  }
  return player
}

export function setLodgingByType(player, typeKey) {
  const preset = gameConfig.lodgingTypes?.[typeKey]
  if (!preset) return player
  return setLodging(player, { ...preset })
}

export function syncLodgingFromTutorialFlags(player) {
  if (hasFlag(player, 'staying_international_hotel')) {
    setLodgingByType(player, 'international')
    return player
  }
  if (hasFlag(player, 'staying_foreigner_ok_hotel')) {
    setLodgingByType(player, 'foreigner_ok')
    return player
  }
  if (hasFlag(player, 'couchsurfing_beijing')) {
    setLodging(player, {
      ...gameConfig.lodgingTypes.couch,
      nightsLeft: 0,
    })
    return player
  }
  player.lodging = null
  return player
}

export function needsLodging(player) {
  if (!player.lodging) return true
  if (player.lodging.nightsLeft === 0) return true
  return false
}

/**
 * 完成景點 = 過一天
 * - 扣時間 + 房費
 * - 若當天電量尚未歸零（撐過事件），過夜回復 overnightBatteryRestore
 */
export function settleAttractionDay(player) {
  const hours = gameConfig.day?.hours ?? 24
  const nightly = player.lodging?.nightlyCost ?? 0
  const restore = gameConfig.day?.overnightBatteryRestore ?? 50
  const survivedDay = (player.battery ?? 0) > 0

  const effect = {
    time: -hours,
    money: -nightly,
  }
  applyEffect(player, effect)

  let batteryRestored = 0
  if (survivedDay && restore > 0) {
    const before = player.battery ?? 0
    player.battery = Math.min(100, before + restore)
    batteryRestored = player.battery - before
  }

  let lodgingExpired = false
  if (player.lodging && player.lodging.nightsLeft != null) {
    player.lodging.nightsLeft -= 1
    if (player.lodging.nightsLeft <= 0) {
      player.lodging.nightsLeft = 0
      lodgingExpired = true
    }
  }

  clampStats(player)
  return { effect, lodgingExpired, nightly, hours, batteryRestored, survivedDay }
}

export function applyLodgingFromChoice(player, choice) {
  if (choice.setLodging) {
    setLodging(player, choice.setLodging)
    return player
  }
  if (choice.lodgingType) {
    setLodgingByType(player, choice.lodgingType)
    return player
  }
  return player
}

export function getDayHours() {
  return gameConfig.day?.hours ?? 24
}

/** 掃共享充電寶：需移動支付，扣錢回電解 */
export function canRentPowerBank(player) {
  const cfg = gameConfig.powerBank
  if (!cfg) return { ok: false, reason: 'disabled' }
  if ((player.battery ?? 0) >= 100) return { ok: false, reason: 'full' }
  const requires = cfg.requires || []
  const blocks = cfg.blocks_if || []
  const flags = new Set([...(player.flags || []), ...(player.activeEffects || [])])
  if (requires.some((f) => !flags.has(f))) return { ok: false, reason: 'needs_pay' }
  if (blocks.some((f) => flags.has(f))) return { ok: false, reason: 'cash_only' }
  if ((player.money ?? 0) < (cfg.cost || 0)) return { ok: false, reason: 'broke' }
  return { ok: true }
}

export function rentPowerBank(player) {
  const cfg = gameConfig.powerBank
  const check = canRentPowerBank(player)
  if (!check.ok) return { ...check, restored: 0 }

  applyEffect(player, {
    money: -(cfg.cost || 0),
    battery: cfg.restore || 60,
  })
  return {
    ok: true,
    cost: cfg.cost,
    restored: cfg.restore,
  }
}

export function getPowerBankConfig() {
  return gameConfig.powerBank
}
