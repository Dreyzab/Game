import type { VoiceId } from './parliament'

export type VisualNovelMood = 'neutral' | 'tense' | 'warm' | 'serious' | 'hopeful' | 'grim'

export type VisualNovelAlignment = 'left' | 'right' | 'center'

export interface VisualNovelCharacter {
  id: string
  name: string
  title?: string
  faction?: string
  color: string
  portraitUrl?: string
  alignment?: VisualNovelAlignment
  tagline?: string
}

export interface VisualNovelChoiceRequirement {
  flags?: string[]
  notFlags?: string[]
  skillCheck?: {
    skill: VoiceId
    difficulty: number
    label?: string
  }
}

export interface VisualNovelImmediateEffect {
  type: string
  data?: Record<string, unknown>
}

export type VisualNovelChoiceEffect =
  | { type: 'flag'; flag: string; value: boolean }
  | { type: 'stat_modifier'; stat: string; delta: number; duration?: number }
  | { type: 'xp'; amount: number }
  | { type: 'add_item'; itemId: string; quantity?: number }
  | { type: 'add_quest'; questId: string; questData?: Record<string, unknown> }
  | { type: 'relationship_change'; targetId: string; delta: number }
  | { type: 'immediate'; action: string; data?: Record<string, unknown> }
  | { type: 'narrative'; text: string }
  | { type: 'custom'; id: string; payload?: Record<string, unknown> }

export interface VisualNovelChoice {
  id: string
  label: string
  description?: string
  tone?: 'calm' | 'firm' | 'curious' | 'aggressive'
  nextLineId?: string
  nextSceneId?: string
  requirements?: VisualNovelChoiceRequirement
  effects?: VisualNovelChoiceEffect[]
}

export interface VisualNovelAdvice {
  characterId: VoiceId
  text: string
  mood?: VisualNovelMood
  stageDirection?: string
  minSkillLevel?: number
  maxSkillLevel?: number
  requiredFlags?: string[]
  excludedFlags?: string[]
}

export interface VisualNovelLine {
  id: string
  speakerId?: string
  text: string
  mood?: VisualNovelMood
  side?: VisualNovelAlignment
  backgroundOverride?: string
  emphasis?: string
  highlightCharacterId?: string
  stageDirection?: string
  nextLineId?: string
  autoAdvance?: boolean
  choices?: VisualNovelChoice[]
  characterAdvices?: VisualNovelAdvice[]
  condition?: {
    flag?: string
    notFlag?: string
  }
  transition?: {
    nextSceneId?: string
    label?: string
  }
}

export interface VisualNovelScene {
  id: string
  title: string
  location: string
  description?: string
  background: string
  ambientColor?: string
  entryLineId: string
  music?: string
  characters: VisualNovelCharacter[]
  tags?: string[]
}

export interface VisualNovelSceneDefinition extends VisualNovelScene {
  lines: VisualNovelLine[]
}

export interface VisualNovelChoiceView extends VisualNovelChoice {
  disabled?: boolean
  lockReason?: string
  isVisited?: boolean
}

export interface VisualNovelHistoryEntry {
  sceneId: string
  lineId: string
  choiceId?: string
  timestamp: number
}
