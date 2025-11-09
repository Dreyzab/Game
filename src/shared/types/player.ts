export type PlayerFlags = Record<string, boolean | number | string | undefined>

export interface Player {
  id: string
  deviceId: string
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
  level: number
  xp: number
  maxXp: number
  skillPoints: number
  reputation: number
  completedQuests: number
  fame: number
  points: number
  daysInGame: number
  flags: PlayerFlags
  visitedScenes: string[]
  completedQuestIds: string[]
  currentScene?: string
  phase?: number
  reputationByFaction?: Record<string, number>
  lastUpdatedAt?: number
}
