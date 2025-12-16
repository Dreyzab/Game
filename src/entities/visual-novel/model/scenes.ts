import {
  scenarios as prologueScenarios,
  chapter1ArrivalScenes,
  infoBureauScenes,
} from '@/entities/visual-novel/scenarios/prolog/scenarioTr-ST'
import { chapter1Scenes } from '@/entities/visual-novel/scenarios/chapter1'
import { allTutorialScenes } from '@/entities/visual-novel/scenarios/tutorial'
import { TEST_SCENE_WITH_ADVICES } from '@/shared/data/visualNovel/testSceneWithAdvices'
import type { Scene, SceneCharacter, SceneChoice } from './types'
import type {
  VisualNovelChoice,
  VisualNovelChoiceEffect,
  VisualNovelChoiceView,
  VisualNovelLine,
  VisualNovelSceneDefinition,
  VisualNovelCharacter,
  VisualNovelMood,
} from '@/shared/types/visualNovel'

export const DEFAULT_VN_SCENE_ID = 'prologue_coupe_start'

const BASE_LOCATION = 'Фрайбург — Пролог'
const DEFAULT_AMBIENT = 'rgba(2, 6, 23, 0.78)'
const COLOR_PALETTE = ['#7dd3fc', '#f97316', '#facc15', '#f472b6', '#a855f7', '#2dd4bf']

type SceneRecord = Record<string, VisualNovelSceneDefinition>

const convertedPrologue = Object.values(prologueScenarios).map((scene) => convertScene(scene))
const convertedArrivals = Object.values(chapter1ArrivalScenes).map((scene) => convertScene(scene))
const convertedInfoBureau = Object.values(infoBureauScenes).map((scene) => convertScene(scene))
const convertedChapter1 = Object.values(chapter1Scenes).map((scene) => convertScene(scene))
const convertedTutorial = Object.values(allTutorialScenes).map((scene) => convertScene(scene))

const ALL_SCENES: VisualNovelSceneDefinition[] = [
  ...convertedPrologue,
  ...convertedArrivals,
  ...convertedInfoBureau,
  ...convertedChapter1,
  ...convertedTutorial,
  TEST_SCENE_WITH_ADVICES, // Тестовая сцена с системой консультаций
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

  if (scene.nextScene && (!scene.choices || scene.choices.length === 0)) {
    const terminalLine = lines[lines.length - 1]
    terminalLine.transition = {
      ...(terminalLine.transition ?? {}),
      nextSceneId: scene.nextScene,
    }
  }

  if (scene.advices?.length) {
    const terminalLine = lines[lines.length - 1]
    terminalLine.characterAdvices = scene.advices.map((advice) => ({
      characterId: advice.characterId,
      text: advice.text,
      mood: normalizeMood(advice.mood),
      stageDirection: advice.stageDirection,
      minSkillLevel: advice.minSkillLevel,
      maxSkillLevel: advice.maxSkillLevel,
      requiredFlags: advice.requiredFlags,
      excludedFlags: advice.excludedFlags,
    }))
  }

  const convertedCharacters = scene.characters.map((character, index) =>
    convertCharacter(character, index)
  )

  const allCharacters = [...convertedCharacters, ...Array.from(derivedCharacters.values())]

  return {
    id: scene.id,
    title: formatTitle(scene.id),
    location: BASE_LOCATION,
    background: normalizeAssetPath(scene.background) ?? scene.background ?? '',
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
    portraitUrl: normalizeAssetPath(character.sprite) ?? character.sprite,
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
  const removeFlags = new Set<string>()

  choice.effects?.addFlags?.forEach((flag) => {
    if (flag) {
      addFlags.add(flag)
      removeFlags.delete(flag)
    }
  })

  choice.effects?.removeFlags?.forEach((flag) => {
    if (flag) {
      removeFlags.add(flag)
      addFlags.delete(flag)
    }
  })

  choice.effects?.flags?.forEach(({ key, value }) => {
    if (!key) return
    if (value === false) {
      removeFlags.add(key)
      addFlags.delete(key)
      return
    }
    addFlags.add(key)
    removeFlags.delete(key)
  })

  const effects: VisualNovelChoiceEffect[] = []

  addFlags.forEach((flag) => {
    effects.push({ type: 'flag', flag, value: true })
  })

  removeFlags.forEach((flag) => {
    effects.push({ type: 'flag', flag, value: false })
  })

  if (typeof choice.effects?.xp === 'number' && choice.effects.xp !== 0) {
    effects.push({ type: 'xp', amount: choice.effects.xp })
  }

  if (choice.effects?.reputation?.length) {
    choice.effects.reputation.forEach((entry) => {
      if (!entry?.faction) return
      effects.push({
        type: 'relationship_change',
        targetId: entry.faction,
        delta: entry.delta ?? 0,
      })
    })
  }

  if (choice.effects?.immediate?.length) {
    choice.effects.immediate.forEach((entry) => {
      if (!entry?.type) return
      effects.push({
        type: 'immediate',
        action: entry.type,
        data: entry.data,
      })
    })
  }

  if (choice.effects?.narrative) {
    effects.push({ type: 'narrative', text: choice.effects.narrative })
  }

  const normalizedEffects = effects.length > 0 ? effects : undefined

  return {
    id: choice.id,
    label: choice.text,
    description,
    tone: mapTone(choice.presentation?.color),
    nextSceneId,
    requirements: {
      ...(skillCheck
        ? {
          skillCheck: {
            skill: skillCheck.skill,
            difficulty: skillCheck.difficulty,
            label: buildSkillLabel(skillCheck.skill, skillCheck.difficulty),
          },
        }
        : {}),
      ...(choice.availability?.condition?.flag
        ? {
          flags: [choice.availability.condition.flag],
        }
        : {}),
      ...(choice.availability?.condition?.notFlag
        ? {
          notFlags: [choice.availability.condition.notFlag],
        }
        : {}),
    },
    effects: normalizedEffects,
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

function normalizeAssetPath(path?: string | null): string | undefined {
  if (!path) {
    return undefined
  }

  const trimmed = path.trim()
  if (!trimmed) {
    return undefined
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  let normalized = trimmed

  if (normalized.startsWith('/public/')) {
    normalized = `/${normalized.slice('/public/'.length)}`
  } else if (normalized.startsWith('public/')) {
    normalized = `/${normalized.slice('public/'.length)}`
  }

  if (!normalized.startsWith('/')) {
    normalized = `/${normalized}`
  }

  return normalized.replace(/\/{2,}/g, '/')
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
