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

export type CoopQuestNodeInteraction = 'vote' | 'individual' | 'sync' | 'contribute' | 'sequential_broadcast'

export type CoopQuestChoiceAction =
  | 'start_side_quest'
  | 'return'
  | 'start_expedition'
  | 'resolve_expedition_event'
  | 'advance_expedition_stage'
  | 'start_coop_battle'

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
  baseLevel?: number
  upgrades?: Record<string, number>// upgradeId -> level
  credits?: number // "Camp Credits" derived from contributions
}

export interface CoopQuestChoice {
  id: string
  text: string
  nextNodeId?: string // If null, stays on same node (for individual dialogue)
  requiredRole?: CoopRoleId
  /** Optional stat requirements (validated server-side). */
  requiredStats?: { hp?: number; morale?: number; stamina?: number }
  /** Optional attribute requirements (validated server-side). */
  requiredAttributes?: Record<string, number>
  /** Optional trait requirements (validated server-side). */
  requiredTraits?: string[]
  effectText?: string // Text shown to the user who picked it (or all if vote)
  flags?: Record<string, any> // Session flags applied by the server when this choice wins
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
  /** Optional items received upon choosing/winning this choice. */
  itemRewards?: Array<{ templateId: string; quantity: number }>

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

  /** Optional battle payload (used by `action: 'start_coop_battle'`). */
  battle?: {
    /** Optional scenario hint for the client battle UI. */
    scenarioId?: string
    /** Optional threat adjustment (e.g. fallback = -1). */
    threatDelta?: number
    /** Optional override nodes to return to after the battle. */
    victoryNextNodeId?: string
    defeatNextNodeId?: string
  }

  /** If true, effectText will be shown to ALL players in sequential_broadcast mode. */
  broadcastEffect?: boolean
}

export interface CoopPassiveCheck {
  id: string
  attribute: string
  threshold: number
  requiredRole?: CoopRoleId
  successText: string
  failureText?: string
  broadcast?: boolean
  xpReward?: number
  successFlags?: Record<string, any>
  failureFlags?: Record<string, any>
}

export interface CoopQuestNode {
  id: string
  title: string
  background?: string
  description: string // Markdown supported
  privateText?: Partial<Record<CoopRoleId, string>> // Secret text for specific roles
  passiveChecks?: CoopPassiveCheck[]
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

/**
 * State for sequential_broadcast interaction mode.
 * Tracks which player is currently choosing and history of reactions.
 */
export interface SequentialBroadcastState {
  /** Current player who should make a choice (null = waiting for first arrival) */
  activePlayerId: number | null
  /** Players who have already made their choice */
  completedPlayerIds: number[]
  /** Order of players (first = first to arrive, rest = random) */
  playerOrder: number[]
  /** History of reactions shown to all players */
  reactions: Array<{
    playerId: number
    playerName: string
    playerRole: string | null
    choiceId: string
    choiceText: string
    effectText: string
    timestamp: number
  }>
  /** Currently showing reaction (for animation sync) */
  showingReactionIndex: number | null
}
