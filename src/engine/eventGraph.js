/**
 * Engine: Event Graph
 * 节点 → choices → next；用 requires / blocks_if 读取 activeEffects / flags
 */

import { matchesEventConditions } from './conditions.js'
import { applyEffect, addFlag, clampStats, hasFlag } from './effects.js'
import { applyLodgingFromChoice } from './lodging.js'

/** 将旧版 city.events[arrival] 转成单节点图（无选项，点继续即结束） */
export function legacyEventsToGraph(city) {
  const arrival = city?.events?.find((e) => e.trigger === 'arrival')
  if (!arrival) {
    return {
      id: city.id,
      entry: 'empty',
      nodes: {
        empty: {
          id: 'empty',
          text: {
            cn: `抵達${city.name?.cn ?? city.id}，一切風平浪靜。`,
            en: `Arrived at ${city.name?.en ?? city.id}. Nothing special happened.`,
          },
          end: true,
        },
      },
    }
  }

  return {
    id: city.id,
    entry: 'arrival',
    nodes: {
      arrival: {
        id: 'arrival',
        text: arrival.text,
        effect: arrival.effect || {},
        end: true,
      },
    },
  }
}

export function getCityGraph(city, eventGraphs = {}) {
  return eventGraphs[city.id] || legacyEventsToGraph(city)
}

export function getNode(graph, nodeId) {
  if (!graph?.nodes) return null
  return graph.nodes[nodeId] || null
}

export function getEntryNodeId(graph, player) {
  if (!graph) return null
  // 支持 entry 为字符串，或按条件选择的 entryCandidates
  if (Array.isArray(graph.entryCandidates)) {
    const hit = graph.entryCandidates.find((c) => matchesEventConditions(c, player))
    if (hit?.node) return hit.node
  }
  return graph.entry
}

/** 选项是否对当前玩家可见/可选 */
export function isChoiceAvailable(choice, player) {
  return matchesEventConditions(choice, player)
}

export function getAvailableChoices(node, player) {
  if (!node?.choices?.length) return []
  return node.choices.filter((c) => isChoiceAvailable(c, player))
}

/** 不可选但仍展示（灰显），方便玩家理解 Tutorial 选择的后果 */
export function getLockedChoices(node, player) {
  if (!node?.choices?.length) return []
  return node.choices.filter((c) => c.showIfLocked && !isChoiceAvailable(c, player))
}

export function describeChoiceLock(choice, player, language = 'cn') {
  const flags = new Set([...(player.flags || []), ...(player.activeEffects || [])])
  const missing = (choice.requires || []).filter((f) => !flags.has(f))
  const blocked = (choice.blocks_if || []).filter((f) => flags.has(f))

  if (choice.lockedHint) {
    return choice.lockedHint[language] || choice.lockedHint.cn
  }
  if (missing.length) {
    return language === 'en'
      ? `Requires: ${missing.join(', ')}`
      : `需要標記：${missing.join(', ')}`
  }
  if (blocked.length) {
    return language === 'en'
      ? `Blocked by: ${blocked.join(', ')}`
      : `被標記阻擋：${blocked.join(', ')}`
  }
  return language === 'en' ? 'Unavailable' : '目前不可用'
}

/**
 * 进入节点时：若有 onEnter / effect（且 end 或 autoApply），可结算
 * 默认：带 choices 的节点不自动套 effect；end 节点的 effect 在「继续」时套用
 */
export function applyChoiceToPlayer(player, choice) {
  if (choice.effect) applyEffect(player, choice.effect)
  // costs：money/time 为正表示消耗（与 tutorial 一致），sanity 已带符号
  if (choice.costs) {
    const c = choice.costs
    player.money -= c.money || 0
    player.sanity += c.sanity || 0
    player.timeRemaining -= c.time || 0
    if (c.battery) player.battery = (player.battery ?? 100) + c.battery
    if (c.locality) player.locality = (player.locality ?? 0) + c.locality
    clampStats(player)
  }
  const flags = [
    ...(choice.addFlags || []),
    choice.effectFlag,
  ].filter(Boolean)
  flags.forEach((f) => addFlag(player, f))
  applyLodgingFromChoice(player, choice)
  return player
}

export function applyNodeEffect(player, node) {
  if (node?.effect) applyEffect(player, node.effect)
  ;(node?.addFlags || []).forEach((f) => addFlag(player, f))
  return player
}

export function isTerminalNode(node) {
  if (!node) return true
  if (node.end) return true
  if (!node.choices?.length) return true
  return false
}

/**
 * 当前节点若没有任何可用选项，且存在无条件兜底选项以外的情况，
 * 仍可能锁死——调用方可提示。此处返回「是否可继续交互」。
 */
export function canInteractWithNode(node, player) {
  if (!node) return false
  if (isTerminalNode(node) && !node.choices?.length) return true
  if (node.end && !node.choices?.length) return true
  return getAvailableChoices(node, player).length > 0 || isTerminalNode(node)
}

export { matchesEventConditions, hasFlag }
