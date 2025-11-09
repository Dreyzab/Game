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
    skill: string
    difficulty: number
    label?: string
  }
}

export interface VisualNovelChoiceImpact {
  addFlags?: string[]
  removeFlags?: string[]
  reputation?: {
    faction: string
    delta: number
  }[]
  xp?: number
}

export interface VisualNovelChoice {
  id: string
  label: string
  description?: string
  tone?: 'calm' | 'firm' | 'curious' | 'aggressive'
  nextLineId?: string
  nextSceneId?: string
  requirements?: VisualNovelChoiceRequirement
  effects?: VisualNovelChoiceImpact
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
}

export interface VisualNovelHistoryEntry {
  sceneId: string
  lineId: string
  choiceId?: string
  timestamp: number
}
