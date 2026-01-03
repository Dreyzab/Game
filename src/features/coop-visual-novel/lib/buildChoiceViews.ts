import { ITEM_TEMPLATES } from '@/shared/data/itemTemplates'
import type { CoopQuestChoice, CoopRoleId } from '@/shared/types/coop'
import type { VisualNovelChoiceView } from '@/shared/types/visualNovel'
import { computeEstimatedScore } from './scoreCalculator'

export interface CoopQuestScoreLike {
  modifiers?: Record<string, number>
  playerModifiers?: Record<string, Record<string, number>>
  statuses?: Record<string, number>
  playerStatuses?: Record<string, Record<string, number>>
}

export interface BuildVisibleChoicesParams {
  shouldShowChoices: boolean
  rawChoices: CoopQuestChoice[]
  isGroupVoteNode: boolean
  voteCounts: Record<string, number>
  participantCount: number
  selectedChoiceId?: string
  controlledRole?: CoopRoleId
  controlledPlayerId?: number | null
  inventory?: Record<string, number> | null
  questScore?: CoopQuestScoreLike | null
}

function getItemName(templateId: string) {
  return ITEM_TEMPLATES[templateId]?.name ?? templateId
}

function normalizeRewards(raw: CoopQuestChoice['itemRewards']): Array<{ templateId: string; quantity: number }> {
  if (!Array.isArray(raw)) return []
  return raw
    .map((r) => ({
      templateId: String(r.templateId ?? ''),
      quantity: Math.max(1, Math.floor(Number(r.quantity ?? 1))),
    }))
    .filter((r) => r.templateId)
}

function formatRewardList(rewards: Array<{ templateId: string; quantity: number }>): string {
  return rewards.map((r) => `${getItemName(r.templateId)} ×${r.quantity}`).join(', ')
}

export function buildVisibleChoices(params: BuildVisibleChoicesParams): VisualNovelChoiceView[] {
  if (!params.shouldShowChoices) return []

  const inv = params.inventory ?? {}
  const modifiers = params.questScore?.modifiers ?? {}
  const playerModifiers =
    params.controlledPlayerId !== null && params.controlledPlayerId !== undefined
      ? (params.questScore?.playerModifiers?.[String(params.controlledPlayerId)] ?? {})
      : {}
  const globalStatuses = params.questScore?.statuses ?? {}
  const playerStatuses =
    params.controlledPlayerId !== null && params.controlledPlayerId !== undefined
      ? (params.questScore?.playerStatuses?.[String(params.controlledPlayerId)] ?? {})
      : {}

  return params.rawChoices.map((choice) => {
    const count = params.voteCounts[choice.id] || 0
    const total = params.participantCount
    const percent = total > 0 ? Math.round((count / total) * 100) : 0

    const baseLabel = params.isGroupVoteNode
      ? `${choice.text} (${count} votes • ${percent}%)`
      : choice.text
    const isAlreadyPicked = params.selectedChoiceId !== undefined && params.selectedChoiceId !== choice.id

    let disabled = isAlreadyPicked
    let lockReason: string | undefined

    if (choice.requiredItem) {
      const have = Number(inv?.[choice.requiredItem] ?? 0)
      if (have < 1) {
        disabled = true
        lockReason = `Requires ${getItemName(choice.requiredItem)}`
      }
    }

    if (choice.consumableCost) {
      const templateId = String(choice.consumableCost.templateId ?? '')
      const amount = Math.max(1, Math.floor(Number(choice.consumableCost.amount ?? 1)))
      const have = Number(inv?.[templateId] ?? 0)
      if (have < amount) {
        disabled = true
        lockReason = `Needs ${amount}× ${getItemName(templateId)}`
      }
    }

    const score = computeEstimatedScore({
      choice,
      role: params.controlledRole,
      modifiers,
      playerModifiers,
      statuses: globalStatuses,
      playerStatuses,
      inventory: inv,
    })

    const appliedGlobalMods = score.appliedGlobalMods.map(([id, val]) => `${id} x${val}`)
    const appliedSelfMods = score.appliedPlayerMods.map(([id, val]) => `self:${id} x${val}`)
    const appliedMods = [...appliedGlobalMods, ...appliedSelfMods]
    const appliedStatuses = score.appliedStatuses.map(({ statusId, turns }) => `${statusId}(${turns})`)

    const rewards = normalizeRewards(choice.itemRewards)
    const rewardList = rewards.length > 0 ? formatRewardList(rewards) : ''

    const tooltipLines: string[] = []
    if (choice.requiredItem) tooltipLines.push(`Requires: ${getItemName(choice.requiredItem)}`)
    if (choice.consumableCost) {
      const templateId = String(choice.consumableCost.templateId ?? '')
      const amount = Math.max(1, Math.floor(Number(choice.consumableCost.amount ?? 1)))
      tooltipLines.push(`Cost: ${getItemName(templateId)} ×${amount}`)
    }
    if (rewardList) tooltipLines.push(`Rewards: ${rewardList}`)

    if (score.baseScore || score.itemBonus) {
      tooltipLines.push(`Base: ${score.baseScore}`)
      tooltipLines.push(`Role (${params.controlledRole ?? 'unknown'}): x${score.classMult}`)
      if (appliedMods.length > 0) tooltipLines.push(`Modifiers: ${appliedMods.join(', ')}`)
      if (appliedStatuses.length > 0) {
        tooltipLines.push(`Statuses: ${appliedStatuses.join(', ')} (x${score.statusMult})`)
      }
      if (choice.consumableCost && typeof choice.itemBonus === 'number') {
        const templateId = String(choice.consumableCost.templateId ?? '')
        const amount = Math.max(1, Math.floor(Number(choice.consumableCost.amount ?? 1)))
        tooltipLines.push(`Item: +${choice.itemBonus} (consume ${getItemName(templateId)} x${amount})`)
      }
      tooltipLines.push(`Total Estimate: ~${score.estimated} pts`)
    }

    const descriptionParts: string[] = []
    if (score.baseScore || score.itemBonus) {
      descriptionParts.push(`~${score.estimated} pts`)
      if (choice.consumableCost && typeof choice.itemBonus === 'number') {
        const templateId = String(choice.consumableCost.templateId ?? '')
        const amount = Math.max(1, Math.floor(Number(choice.consumableCost.amount ?? 1)))
        descriptionParts.push(`+${choice.itemBonus} if consume ${getItemName(templateId)} ×${amount}`)
      }
    }
    if (rewardList) descriptionParts.push(`Rewards: ${rewardList}`)

    const description = descriptionParts.length > 0 ? descriptionParts.join(' • ') : undefined

    return {
      id: choice.id,
      label: baseLabel,
      description,
      disabled,
      lockReason,
      tooltip: tooltipLines.length > 0 ? tooltipLines.join('\n') : undefined,
      isVisited: params.selectedChoiceId === choice.id,
    }
  })
}
