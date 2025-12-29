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

export type CoopQuestNodeInteraction = 'vote' | 'individual' | 'sync'

export type CoopQuestChoiceAction = 'start_side_quest' | 'return'

export interface CoopQuestChoice {
  id: string
  text: string
  nextNodeId?: string // If null, stays on same node (for individual dialogue)
  requiredRole?: CoopRoleId
  effectText?: string // Text shown to the user who picked it (or all if vote)
  flags?: Record<string, any> // Session flags applied by the server when this choice wins
  action?: CoopQuestChoiceAction // Server-resolved graph actions (side quests, returns, etc.)
  questId?: string // Optional quest identifier for side-quests / quest bookkeeping
}

export interface CoopQuestNode {
  id: string
  title: string
  background?: string
  description: string // Markdown supported
  privateText?: Partial<Record<CoopRoleId, string>> // Secret text for specific roles
  interactionType: CoopQuestNodeInteraction
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
}
