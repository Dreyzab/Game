export type SceneMap = Record<string, Scene>

export interface Scene {
  id: string
  background: string
  music?: string
  characters: SceneCharacter[]
  dialogue: SceneDialogue[]
  choices?: SceneChoice[]
  advices?: SceneAdvice[]
  nextScene?: string
}

export interface SceneAdvice {
  characterId: string
  text: string
  mood?: string
  stageDirection?: string
  minSkillLevel?: number
  maxSkillLevel?: number
  requiredFlags?: string[]
  excludedFlags?: string[]
}

export interface SceneCharacter {
  id: string
  name: string
  position?: 'left' | 'right' | 'center'
  sprite?: string
  emotion?: SceneEmotion
}

export interface SceneEmotion {
  primary: string
  intensity?: number
}

export interface SceneDialogue {
  speaker: string
  text: string
  characterId?: string
  emotion?: SceneEmotion
}

export interface SceneChoiceFlagEffect {
  key: string
  value?: boolean
}

export interface SceneChoiceImmediateEffect {
  type: string
  data?: Record<string, unknown>
}

export interface SceneChoiceReputationEffect {
  faction: string
  delta: number
}

export interface SceneChoiceBranchEffects {
  nextScene?: string
  addFlags?: string[]
  removeFlags?: string[]
}

export interface SceneChoiceEffects {
  addFlags?: string[]
  removeFlags?: string[]
  flags?: SceneChoiceFlagEffect[]
  immediate?: SceneChoiceImmediateEffect[]
  narrative?: string
  xp?: number
  reputation?: SceneChoiceReputationEffect[]
  onSuccess?: SceneChoiceBranchEffects
  onFailure?: SceneChoiceBranchEffects
}

export interface SceneChoice {
  id: string
  text: string
  nextScene?: string
  presentation?: {
    color?: string
    icon?: string
    tooltip?: string
  }
  availability?: {
    skillCheck?: {
      skill: string
      difficulty: number
      successText?: string
      failureText?: string
    }
    condition?: {
      flag?: string
      notFlag?: string
    }
  }
  effects?: SceneChoiceEffects
}

