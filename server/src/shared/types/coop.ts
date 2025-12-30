import type { AttributeGroup, VoiceId } from './parliament'

export type CoopRoleId = 'valkyrie' | 'vorschlag' | 'ghost' | 'shustrya'

export interface CoopRoleDefinition {
  id: CoopRoleId
  label: string
  nameRu: string
  description: string
  primaryGroup: AttributeGroup
  focusVoices: VoiceId[]
  playstyleHint: string
}

export const COOP_ROLES: Record<CoopRoleId, CoopRoleDefinition> = {
  valkyrie: {
    id: 'valkyrie',
    label: 'VALKYRIE',
    nameRu: 'Ева «Валькирия»',
    primaryGroup: 'mind',
    focusVoices: ['analysis', 'resilience', 'empathy'],
    description: 'Полевой хирург. Холодная голова, быстрые руки.',
    playstyleHint: 'Держит команду живой и замечает угрозы по симптомам раньше остальных.',
  },
  vorschlag: {
    id: 'vorschlag',
    label: 'VORSCHLAG',
    nameRu: 'Йоханн «Vorschlag»',
    primaryGroup: 'motorics',
    focusVoices: ['logic', 'coordination', 'creativity'],
    description: 'Артисан-инженер. Латает железо и нервы.',
    playstyleHint: 'Находит технические решения, вытаскивает пользу из хлама и аномалий.',
  },
  ghost: {
    id: 'ghost',
    label: 'GHOST',
    nameRu: 'Дитрих «Ghost»',
    primaryGroup: 'motorics',
    focusVoices: ['perception', 'reaction', 'courage'],
    description: 'Разведчик-снайпер. Точность и тишина.',
    playstyleHint: 'Читает поле боя и предотвращает проблемы до того, как они начнутся.',
  },
  shustrya: {
    id: 'shustrya',
    label: 'SHUSTRAYA',
    nameRu: 'Агата «Шустрая»',
    primaryGroup: 'sociality',
    focusVoices: ['drama', 'solidarity', 'suggestion'],
    description: 'Анархистка-импровизатор. Дерзость вместо страха.',
    playstyleHint: 'Продавит разговор, сорвёт шаблон и поднимет группу, когда все сомневаются.',
  },
}

export type CoopQuestNodeInteraction = 'vote' | 'individual' | 'sync' | 'contribute'

export type CoopQuestChoiceAction =
  | 'start_side_quest'
  | 'return'
  | 'start_expedition'
  | 'resolve_expedition_event'
  | 'advance_expedition_stage'

export type CoopExpeditionDeadlineEventKind = 'enemy' | 'check'

export interface CoopExpeditionDeadlineEvent {
  nodeId: string
  kind?: CoopExpeditionDeadlineEventKind
  weight?: number
}

export interface CoopCampState {
  security: number
  operatives: number
  inventory: Record<string, number>
}

export interface CoopQuestChoice {
  id: string
  text: string
  nextNodeId?: string // If null, stays on same node (for individual dialogue)
  requiredRole?: CoopRoleId
  effectText?: string // Text shown to the user who picked it (or all if vote)
  flags?: Record<string, any> // Flags to set in session when this choice is made
  action?: CoopQuestChoiceAction // Server-resolved graph actions (side quests, returns, etc.)
  questId?: string // Optional quest identifier for side-quests / quest bookkeeping

  /** Base contribution score for this choice (opt-in). */
  baseScore?: number
  /** Optional per-role multiplier overrides for this choice. */
  classMultipliers?: Partial<Record<CoopRoleId, number>>
  /** Optional tags for score modifiers/artifacts (e.g. "analysis", "visual"). */
  scoreTags?: string[]

  /** Optional item requirement to enable this choice (templateId). */
  requiredItem?: string
  /** Optional consumable cost (templateId + amount). */
  consumableCost?: { templateId: string; amount: number }
  /** Optional flat bonus when consuming the above cost. */
  itemBonus?: number

  /** Optional score modifier deltas to apply on resolve (multipliers; see `tag:*` convention). */
  applyScoreModifiers?: Record<string, number>
  /** Optional status effect to apply on resolve (server-side). */
  applyStatus?: { target: 'all' | 'self' | 'others'; statusId: string; turns?: number }

  /** Optional expedition cost (time turns / research points). */
  cost?: { time?: number; rp?: number }
  /** Optional expedition rewards (research points). */
  reward?: { rp?: number }
  /** Optional expedition config payload (used by `action: 'start_expedition'`). */
  expedition?: {
    maxTurns?: number
    waveNodeId?: string
    deadlineEvents?: CoopExpeditionDeadlineEvent[]
    stagePoolId?: string
    startStageIndex?: number
  }

  /** Optional expedition event payload (used by `action: 'resolve_expedition_event'`). */
  expeditionEvent?: {
    id: string
    actorRole?: CoopRoleId
    successNextNodeId?: string
    failureNextNodeId?: string
  }
}

export interface CoopQuestNode {
  id: string
  title: string
  background?: string
  description: string // Markdown supported
  privateText?: Partial<Record<CoopRoleId, string>> // Secret text for specific roles
  interactionType: CoopQuestNodeInteraction
  /** Optional override: require all players to vote before advancing. */
  requiresAllVotesForProgress?: boolean
  choices: CoopQuestChoice[]
}

export interface CoopQuestState {
  nodeId: string
  votes: Record<string, string> // userId -> choiceId
  ready: Record<string, boolean> // userId -> isReady
  history: Array<{
    nodeId: string
    choiceId?: string
    actorId?: string // Who made the choice / OR 'vote'
    at: number
  }>
  startedAt: number
  finishedAt?: number

  /** Optional side-quest score accumulator (schema evolves; stored server-side). */
  score?: { current: number; target: number; history: number[] }
  /** Optional active score modifiers (multipliers; see `tag:*` convention). */
  modifiers?: Record<string, number>
}
