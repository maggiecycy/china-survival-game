/**
 * Engine: 城际交通 — routes.json 逐城对定价
 */
import travel from '../content/travel.json'
import routesData from '../content/routes.json'

export function listTravelModes() {
  return travel.modes
}

export function routeKey(fromId, toId) {
  return [fromId, toId].filter(Boolean).sort().join('|')
}

export function getRouteModes(fromId, toId) {
  if (!fromId || !toId || fromId === toId) return null
  return routesData.routes?.[routeKey(fromId, toId)] || null
}

export function isTravelModeAvailable(fromId, toId, modeId) {
  if (fromId && toId && fromId === toId) return true
  const route = getRouteModes(fromId, toId)
  if (!route) return false
  return !!route[modeId]
}

/**
 * @returns {{ mode, effect, isSameCity, available, unavailableReason }}
 */
export function estimateTravelCost(fromCity, toCity, modeId) {
  const mode = travel.modes.find((m) => m.id === modeId) || travel.modes[0]

  if (fromCity?.id && toCity?.id && fromCity.id === toCity.id) {
    return {
      mode,
      effect: { money: 0, time: 0, sanity: 0, battery: 0 },
      isSameCity: true,
      available: true,
      unavailableReason: null,
    }
  }

  const fromId = fromCity?.id
  const toId = toCity?.id
  const route = getRouteModes(fromId, toId)
  const entry = route?.[modeId]

  if (!entry) {
    return {
      mode,
      effect: { money: 0, time: 0, sanity: 0, battery: 0 },
      isSameCity: false,
      available: false,
      unavailableReason: {
        cn: '此路线无该交通方式（或极少直达），请换其他方式。',
        en: 'This mode is not available on this route. Pick another.',
      },
    }
  }

  return {
    mode,
    effect: {
      money: -Math.abs(entry.money || 0),
      time: -Math.abs(entry.time || 0),
      sanity: entry.sanity ?? -6,
      battery: entry.battery ?? -15,
    },
    isSameCity: false,
    available: true,
    unavailableReason: null,
    estimated: !!entry.estimated,
    note: entry.note || null,
  }
}

export function listModeAvailability(fromCity, toCity) {
  return travel.modes.map((mode) => {
    const estimate = estimateTravelCost(fromCity, toCity, mode.id)
    return { mode, ...estimate }
  })
}

export function firstAvailableModeId(fromCity, toCity) {
  const list = listModeAvailability(fromCity, toCity)
  const hit = list.find((x) => x.available && !x.isSameCity)
  return hit?.mode?.id || travel.modes[0]?.id || 'hsr'
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

export { travel, routesData }
