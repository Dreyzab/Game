import type { VoiceId } from './parliament'

export type PlayerFlags = Record<string, boolean | number | string | undefined>

export interface Player {
  id: string
  deviceId: string
  name?: string
  createdAt: number
  status?: string
  reputation?: number
  level?: number
  xp?: number
  completedQuests?: number
  fame?: number
  points?: number
  daysInGame?: number
  developmentPhase?: string
}

export interface PlayerProgress {
  // Базовые характеристики прогресса
  level: number
  xp: number
  maxXp: number
  skillPoints: number
  reputation: Record<string, number>
  completedQuests: number
  totalQuests?: number
  fame: number
  points: number
  daysInGame: number
  // Текущее состояние персонажа
  attributes?: Partial<Record<VoiceId, number>>
  skills?: Partial<Record<VoiceId, number>>

  // Persistent resource state (HP, WP, MP, SP)
  currentResources?: {
    hp?: number
    mp?: number
    wp?: number
    sp?: number
  }

  // Schema version for migrations
  version?: number

  flags: PlayerFlags
  visitedScenes: string[]
  completedQuestIds: string[]
  currentScene?: string
  phase?: number
  reputationByFaction?: Record<string, number>
  lastUpdatedAt?: number
  gameMode?: 'survival' | 'detective'
}
