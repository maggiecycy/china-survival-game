/**
 * Engine: 城际交通花费计算
 */
import travel from '../content/travel.json'

export function listTravelModes() {
  return travel.modes
}

export function estimateTravelCost(fromCity, toCity, modeId) {
  const mode = travel.modes.find((m) => m.id === modeId) || travel.modes[0]
  const tier = toCity?.tier || 'medium'
  const base = travel.tierBase[tier] || travel.tierBase.medium

  let factor = 1
  if (fromCity?.region && toCity?.region && fromCity.region === toCity.region) {
    factor = travel.sameRegionFactor
  }

  // 同城「再探索」不走路费
  if (fromCity?.id && toCity?.id && fromCity.id === toCity.id) {
    return {
      mode,
      effect: { money: 0, time: 0, sanity: 0, battery: 0 },
      isSameCity: true,
    }
  }

  const money = Math.round(base.money * mode.multiplier.money * factor)
  const time = Math.round(base.time * mode.multiplier.time * factor * 10) / 10
  const sanity = Math.round(base.sanity * mode.multiplier.sanity)
  const battery = Math.round(base.battery * mode.multiplier.battery)

  return {
    mode,
    effect: {
      money: -money,
      time: -time,
      sanity,
      battery,
    },
    isSameCity: false,
  }
}

export function shouldPlayFirstBeijingDeparture(player, fromCityId, toCityId) {
  if (fromCityId !== 'beijing') return false
  if (!toCityId || toCityId === 'beijing') return false
  const flag = travel.firstDepartureFromBeijing.flag
  const has = player.activeEffects?.includes(flag) || player.flags?.includes(flag)
  return !has
}

export function getFirstDepartureGraphId() {
  return travel.firstDepartureFromBeijing.graphId
}

export { travel }
