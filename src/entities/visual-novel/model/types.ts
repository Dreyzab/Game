export type SceneMap = Record<string, Scene>

export interface Scene {
  id: string
  background: string
  music?: string
  characters: SceneCharacter[]
  dialogue: SceneDialogue[]
  choices?: SceneChoice[]
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
  }
  effects?: {
    addFlags?: string[]
    onSuccess?: {
      nextScene?: string
      addFlags?: string[]
    }
    onFailure?: {
      nextScene?: string
    }
  }
}
