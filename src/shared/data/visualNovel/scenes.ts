import { scenarios as prologueScenarios } from '@/entities/visual-novel/scenarios/prolog/scenarioTr-ST'
import { chapter1Scenes } from '@/entities/visual-novel/scenarios/chapter1'
import { BACKGROUNDS } from './backgrounds'
import type { Scene, SceneCharacter, SceneChoice } from '@/entities/visual-novel/model/types'
import type {
  VisualNovelChoice,
  VisualNovelChoiceView,
  VisualNovelLine,
  VisualNovelSceneDefinition,
  VisualNovelCharacter,
  VisualNovelMood,
} from '@/shared/types/visualNovel'

export const DEFAULT_VN_SCENE_ID = 'prologue_start'

const BASE_LOCATION = 'Фрайбург — Пролог'
const DEFAULT_AMBIENT = 'rgba(2, 6, 23, 0.78)'
const COLOR_PALETTE = ['#7dd3fc', '#f97316', '#facc15', '#f472b6', '#a855f7', '#2dd4bf']

type SceneRecord = Record<string, VisualNovelSceneDefinition>

const convertedPrologue = Object.values(prologueScenarios).map((scene) => convertScene(scene))
const convertedChapter1 = Object.values(chapter1Scenes).map((scene) => convertScene(scene))
const exitScene = createExitScene()

const ALL_SCENES: VisualNovelSceneDefinition[] = [
  ...convertedPrologue,
  ...convertedChapter1,
  exitScene,
]

export const VISUAL_NOVEL_SCENES: SceneRecord = ALL_SCENES.reduce<SceneRecord>((acc, scene) => {
  acc[scene.id] = scene
  return acc
}, {})

export function getVisualNovelScene(sceneId: string | undefined | null) {
  if (!sceneId) {
    return VISUAL_NOVEL_SCENES[DEFAULT_VN_SCENE_ID]
  }
  return VISUAL_NOVEL_SCENES[sceneId] ?? VISUAL_NOVEL_SCENES[DEFAULT_VN_SCENE_ID]
}

export function getLineById(scene: VisualNovelSceneDefinition, lineId?: string | null): VisualNovelLine | null {
  if (!lineId) return null
  return scene.lines.find((line) => line.id === lineId) ?? null
}

export function buildChoiceViews(line: VisualNovelLine | null, flags: Set<string>): VisualNovelChoiceView[] {
  if (!line?.choices) return []
  return line.choices.map((choice) => {
    let disabled = false
    let lockReason: string | undefined

    if (choice.requirements?.flags) {
      const missing = choice.requirements.flags.filter((flag) => !flags.has(flag))
      if (missing.length > 0) {
        disabled = true
        lockReason = `Нужно: ${missing.join(', ')}`
      }
    }

    if (!disabled && choice.requirements?.notFlags) {
      const blocking = choice.requirements.notFlags.filter((flag) => flags.has(flag))
      if (blocking.length > 0) {
        disabled = true
        lockReason = `Недоступно при состоянии: ${blocking.join(', ')}`
      }
    }

    return {
      ...choice,
      disabled,
      lockReason,
    }
  })
}

function convertScene(scene: Scene): VisualNovelSceneDefinition {
  const derivedCharacters = new Map<string, VisualNovelCharacter>()

  const resolveSpeakerId = (speaker?: string, explicitId?: string, index?: number): string | undefined => {
    if (explicitId) {
      return explicitId
    }

    if (!speaker) {
      return undefined
    }

    const slug = slugify(speaker)
    const fallbackIndex = typeof index === 'number' ? index : 0
    const identifier = slug.length > 0 ? slug : String(fallbackIndex)
    const autoId = `auto_${identifier}`

    if (!derivedCharacters.has(autoId)) {
      derivedCharacters.set(autoId, {
        id: autoId,
        name: speaker,
        color: pickColor(COLOR_PALETTE, scene.characters.length + derivedCharacters.size, speaker),
        alignment: 'center',
      })
    }

    return autoId
  }

  const lines: VisualNovelLine[] = scene.dialogue.map((entry, lineIndex, array) => {
    const id = `${scene.id}__line${lineIndex}`
    const nextLineId = lineIndex < array.length - 1 ? `${scene.id}__line${lineIndex + 1}` : undefined

    return {
      id,
      text: entry.text,
      speakerId: resolveSpeakerId(entry.speaker, entry.characterId, lineIndex),
      mood: normalizeMood(entry.emotion?.primary),
      nextLineId,
    }
  })

  if (lines.length === 0) {
    lines.push({
      id: `${scene.id}__line0`,
      text: '',
      mood: 'neutral',
    })
  }

  if (scene.choices?.length) {
    const terminalLine = lines[lines.length - 1]
    terminalLine.choices = scene.choices.map(convertChoice)
  }

  const convertedCharacters = scene.characters.map((character, index) =>
    convertCharacter(character, index)
  )

  const allCharacters = [...convertedCharacters, ...Array.from(derivedCharacters.values())]

  return {
    id: scene.id,
    title: formatTitle(scene.id),
    location: BASE_LOCATION,
    background: scene.background,
    ambientColor: DEFAULT_AMBIENT,
    music: scene.music,
    entryLineId: lines[0].id,
    characters: allCharacters,
    lines,
  }
}

function convertCharacter(character: SceneCharacter, index: number): VisualNovelCharacter {
  return {
    id: character.id,
    name: character.name,
    color: pickColor(COLOR_PALETTE, index, character.id),
    alignment: convertAlignment(character.position),
    portraitUrl: character.sprite,
  }
}

function convertChoice(choice: SceneChoice): VisualNovelChoice {
  const skillCheck = choice.availability?.skillCheck
  const descriptionSegments: string[] = []

  if (choice.presentation?.tooltip) {
    descriptionSegments.push(choice.presentation.tooltip)
  }

  if (skillCheck?.successText) {
    descriptionSegments.push(`Успех: ${skillCheck.successText}`)
  }

  if (skillCheck?.failureText) {
    descriptionSegments.push(`Провал: ${skillCheck.failureText}`)
  }

  const description = descriptionSegments.length > 0 ? descriptionSegments.join(' • ') : undefined
  const nextSceneId =
    choice.effects?.onSuccess?.nextScene ?? choice.nextScene ?? choice.effects?.onFailure?.nextScene

  const addFlags = new Set<string>()
  choice.effects?.addFlags?.forEach((flag) => addFlags.add(flag))
  choice.effects?.onSuccess?.addFlags?.forEach((flag) => addFlags.add(flag))

  const effects = addFlags.size > 0 ? { addFlags: Array.from(addFlags) } : undefined

  return {
    id: choice.id,
    label: choice.text,
    description,
    tone: mapTone(choice.presentation?.color),
    nextSceneId,
    requirements: skillCheck
      ? {
          skillCheck: {
            skill: skillCheck.skill,
            difficulty: skillCheck.difficulty,
            label: buildSkillLabel(skillCheck.skill, skillCheck.difficulty),
          },
        }
      : undefined,
    effects,
  }
}

function createExitScene(): VisualNovelSceneDefinition {
  const lineId = 'exit_to_map__line0'
  return {
    id: 'exit_to_map',
    title: 'Возвращение на карту',
    location: BASE_LOCATION,
    background: BACKGROUNDS.station,
    ambientColor: DEFAULT_AMBIENT,
    entryLineId: lineId,
    characters: [],
    lines: [
      {
        id: lineId,
        text: 'Вы готовы продолжить путь по карте. Нажмите «Завершить», чтобы перейти на карту.',
        mood: 'neutral',
      },
    ],
  }
}

function formatTitle(id: string): string {
  return id
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

function convertAlignment(position?: string) {
  if (position === 'left' || position === 'right' || position === 'center') {
    return position
  }
  return 'center'
}

function normalizeMood(value?: string): VisualNovelMood {
  if (!value) {
    return 'neutral'
  }

  const normalized = value.toLowerCase()
  switch (normalized) {
    case 'neutral':
      return 'neutral'
    case 'tense':
    case 'worried':
    case 'anxious':
      return 'tense'
    case 'warm':
    case 'excited':
      return 'warm'
    case 'serious':
    case 'determined':
      return 'serious'
    case 'hopeful':
    case 'optimistic':
      return 'hopeful'
    case 'grim':
    case 'sad':
    case 'melancholy':
      return 'grim'
    default:
      return 'neutral'
  }
}

function mapTone(color?: string) {
  switch (color) {
    case 'skill':
      return 'curious'
    case 'bold':
    case 'negative':
      return 'aggressive'
    case 'cautious':
      return 'calm'
    default:
      return undefined
  }
}

function buildSkillLabel(skill: string, difficulty: number) {
  return `Проверка: ${skill.toUpperCase()} • Сложность ${difficulty}`
}

function pickColor(palette: string[], index: number, key?: string) {
  if (key) {
    const hash = Math.abs(hashString(key))
    return palette[hash % palette.length]
  }
  return palette[index % palette.length]
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё\s-]/g, '')
    .replace(/\s+/g, '-')
}

function hashString(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return hash
}
