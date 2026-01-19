import type {
    Scene,
    SceneCharacter,
    SceneChoice,
    SceneTarget,
    TerminalMarker,
} from './types'
import type { VoiceId } from '@/shared/types/parliament'
import type {
    VisualNovelCharacter,
    VisualNovelChoice,
    VisualNovelChoiceEffect,
    VisualNovelChoiceView,
    VisualNovelLine,
    VisualNovelMood,
    VisualNovelSceneDefinition,
} from '@/shared/types/visualNovel'

const BASE_LOCATION = 'Фрайбург — Пролог'
const DEFAULT_AMBIENT = 'rgba(2, 6, 23, 0.78)'
const COLOR_PALETTE = ['#7dd3fc', '#f97316', '#facc15', '#f472b6', '#a855f7', '#2dd4bf']

/**
 * Known character sprite mappings for normalization
 */
const CANONICAL_CHARACTER_SPRITES_BY_ID: Record<string, string> = {
    bruno: '/images/characters/Bruno.png',
    lena: '/images/characters/Lena.png',
    otto: '/images/characters/Otto.png',
    adel: '/images/characters/Adel.png',
    adele: '/images/characters/Adel.png',
    player: '/images/characters/Player.png',
}

/**
 * Validates that an ID does not contain restricted characters.
 * @throws Error if ID is invalid
 */
function validateId(id: string, scope: string) {
    if (id.includes('.')) {
        throw new Error(`Invalid ID in ${scope}: "${id}". Dots are forbidden in IDs.`)
    }
}

/**
 * Normalizes a target scene ID into a valid SceneTarget.
 * Handles explicit 'END', 'EXIT', 'EXIT_SCENE' aliases, and normalizes null/undefined if provided.
 */
function normalizeNextScene(nextScene?: string | null): SceneTarget | undefined {
    if (!nextScene) return undefined
    if (nextScene === 'END' || nextScene === 'EXIT' || nextScene === 'EXIT_SCENE') {
        return 'END'
    }
    validateId(nextScene, 'nextScene reference')
    return nextScene
}

/**
 * Converts a raw Scene definition into a runtime VisualNovelSceneDefinition.
 * @param chapterId The namespace for this scene.
 * @param scene The raw scene definition.
 */
export function convertScene(chapterId: string, scene: Scene): VisualNovelSceneDefinition {
    validateId(chapterId, 'chapterId')
    validateId(scene.id, `scene definition ${scene.id}`)

    const fqnId = `${chapterId}:${scene.id}`
    const derivedCharacters = new Map<string, VisualNovelCharacter>()

    const resolveSpeakerId = (speaker?: string, explicitId?: string, index?: number): string | undefined => {
        if (explicitId) {
            return explicitId
        }

        if (!speaker) {
            return undefined
        }

        const normalizeSpeakerName = (value: string) =>
            value.trim().toLowerCase().replace(/\s+/g, ' ')

        const normalizedSpeaker = normalizeSpeakerName(speaker)
        if (normalizedSpeaker === 'рассказчик' || normalizedSpeaker === 'narrator') {
            return 'narrator'
        }

        // Prefer mapping to an existing scene character by display name.
        const exactMatch = scene.characters.find(
            (character) => normalizeSpeakerName(character.name) === normalizedSpeaker
        )
        if (exactMatch) return exactMatch.id

        const looseMatch = scene.characters.find((character) => {
            const normalizedName = normalizeSpeakerName(character.name)
            return normalizedName.includes(normalizedSpeaker) || normalizedSpeaker.includes(normalizedName)
        })
        if (looseMatch) return looseMatch.id

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
        const id = `${fqnId}__line${lineIndex}`
        const nextLineId = lineIndex < array.length - 1 ? `${fqnId}__line${lineIndex + 1}` : undefined

        return {
            id,
            text: entry.text,
            speakerId: resolveSpeakerId(entry.speaker, entry.characterId, lineIndex),
            mood: normalizeMood(entry.emotion?.primary),
            backgroundOverride: normalizeAssetPath(entry.background) ?? entry.background,
            condition: entry.condition,
            nextLineId,
        }
    })

    // Ensure at least one line exists
    if (lines.length === 0) {
        lines.push({
            id: `${fqnId}__line0`,
            text: '',
            mood: 'neutral',
        })
    }

    // Handle Choices
    if (scene.choices?.length) {
        const terminalLine = lines[lines.length - 1]
        terminalLine.choices = scene.choices.map(convertChoice)
    }

    // Handle Implicit Next Scene (if no choices)
    if (scene.nextScene && (!scene.choices || scene.choices.length === 0)) {
        const terminalLine = lines[lines.length - 1]
        const normalizedNext = normalizeNextScene(scene.nextScene as string)

        if (normalizedNext) {
            terminalLine.transition = {
                ...(terminalLine.transition ?? {}),
                nextSceneId: normalizedNext,
            }
        }
    }

    // Handle Advices
    if (scene.advices?.length) {
        const terminalLine = lines[lines.length - 1]
        terminalLine.characterAdvices = scene.advices.map((advice) => ({
            characterId: advice.characterId as VoiceId,
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
        id: fqnId,
        title: formatTitle(scene.id),
        location: BASE_LOCATION,
        background: normalizeAssetPath(scene.background) ?? scene.background ?? '',
        ambientColor: DEFAULT_AMBIENT,
        music: scene.music,
        isTerminal: scene.isTerminal,
        entryLineId: lines[0].id,
        characters: allCharacters,
        lines,
    }
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

        const isVisitedByNotFlags = Boolean(
            choice.requirements?.notFlags?.some((flag) => flags.has(flag))
        )

        const isVisitedByEffectFlags = Boolean(
            choice.effects?.some(
                (e) =>
                    e.type === 'flag' &&
                    e.value === true &&
                    flags.has(e.flag) &&
                    !/visited_any$/i.test(e.flag)
            )
        )

        const isVisited = isVisitedByNotFlags || isVisitedByEffectFlags

        return {
            ...choice,
            disabled,
            lockReason,
            isVisited,
        }
    })
}

// ============================================================================
// INTERNAL HELPERS
// ============================================================================

function convertCharacter(character: SceneCharacter, index: number): VisualNovelCharacter {
    validateId(character.id, `character ${character.id}`)
    return {
        id: character.id,
        name: character.name,
        color: pickColor(COLOR_PALETTE, index, character.id),
        alignment: convertAlignment(character.position),
        portraitUrl: resolvePortraitUrl(character),
    }
}

function resolvePortraitUrl(character: SceneCharacter): string | undefined {
    const fromSprite = canonicalizeKnownCharacterSpritePath(character.sprite)
    if (fromSprite) return fromSprite

    const idKey = character.id.trim().toLowerCase()
    return CANONICAL_CHARACTER_SPRITES_BY_ID[idKey]
}

function canonicalizeKnownCharacterSpritePath(path?: string | null): string | undefined {
    const normalized = normalizeAssetPath(path)
    if (!normalized) return undefined

    // Fix case mismatches for known sprites
    const lower = normalized.toLowerCase()
    const map: Record<string, string> = {
        '/images/characters/bruno.png': '/images/characters/Bruno.png',
        '/images/characters/lena.png': '/images/characters/Lena.png',
        '/images/characters/otto.png': '/images/characters/Otto.png',
        '/images/characters/adel.png': '/images/characters/Adel.png',
        '/images/characters/adele.png': '/images/characters/Adel.png',
        '/images/characters/player.png': '/images/characters/Player.png',
    }

    return map[lower] ?? normalized
}

function convertChoice(choice: SceneChoice): VisualNovelChoice {
    validateId(choice.id, `choice ${choice.id}`)

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

    const normalizeSkillCheckDc = (rawDifficulty: number) => {
        const raw = Number(rawDifficulty)
        if (!Number.isFinite(raw) || raw <= 0) {
            return { dc: 50, isLegacy: false }
        }

        if (raw <= 20) {
            const dc = Math.max(5, Math.min(95, Math.round(raw * 5)))
            return { dc, isLegacy: true }
        }

        const dc = Math.max(5, Math.min(95, Math.round(raw)))
        return { dc, isLegacy: false }
    }

    const skillCheckDc = skillCheck ? normalizeSkillCheckDc(skillCheck.difficulty) : null

    // Helper to resolve nextScene for branches
    const resolveNext = (target?: string | TerminalMarker): string | TerminalMarker | undefined =>
        normalizeNextScene(target as string)

    const directNext = resolveNext(choice.nextScene)
    const successNext = resolveNext(choice.effects?.onSuccess?.nextScene)
    const failureNext = resolveNext(choice.effects?.onFailure?.nextScene)

    const nextSceneId = skillCheck
        ? choice.nextScene // Typically undefined in skillchecks, logic uses branches
        : (successNext ?? directNext ?? failureNext)

    const addFlags = new Set<string>()
    const removeFlags = new Set<string>()

    choice.effects?.addFlags?.forEach((flag) => { if (flag) { addFlags.add(flag); removeFlags.delete(flag) } })
    choice.effects?.removeFlags?.forEach((flag) => { if (flag) { removeFlags.add(flag); addFlags.delete(flag) } })
    choice.effects?.flags?.forEach(({ key, value }) => {
        if (!key) return
        if (value === false) { removeFlags.add(key); addFlags.delete(key) }
        else { addFlags.add(key); removeFlags.delete(key) }
    })

    const effects: VisualNovelChoiceEffect[] = []
    addFlags.forEach((flag) => effects.push({ type: 'flag', flag, value: true }))
    removeFlags.forEach((flag) => effects.push({ type: 'flag', flag, value: false }))

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

    const toBranchFlagEffects = (branch?: { addFlags?: string[]; removeFlags?: string[] }) => {
        const out: VisualNovelChoiceEffect[] = []
        branch?.addFlags?.forEach((flag) => { if (flag) out.push({ type: 'flag', flag, value: true }) })
        branch?.removeFlags?.forEach((flag) => { if (flag) out.push({ type: 'flag', flag, value: false }) })
        return out.length > 0 ? out : undefined
    }

    return {
        id: choice.id,
        label: choice.text,
        description,
        tone: mapTone(choice.presentation?.color),
        nextSceneId: nextSceneId as string | undefined, // Type assertion for compatibility if strict typing not updated everywhere
        requirements: {
            ...(skillCheck
                ? {
                    skillCheck: {
                        skill: skillCheck.skill as VoiceId,
                        difficulty: skillCheck.difficulty,
                        dc: skillCheckDc?.dc,
                        label: buildSkillLabel(skillCheck.skill, skillCheck.difficulty, skillCheckDc?.dc, skillCheckDc?.isLegacy),
                        successText: skillCheck.successText,
                        failureText: skillCheck.failureText,
                        successNextSceneId: resolveNext(choice.effects?.onSuccess?.nextScene ?? choice.nextScene) as string,
                        failureNextSceneId: resolveNext(choice.effects?.onFailure?.nextScene ?? choice.nextScene) as string,
                        successEffects: toBranchFlagEffects(choice.effects?.onSuccess),
                        failureEffects: toBranchFlagEffects(choice.effects?.onFailure),
                    },
                }
                : {}),
            ...(choice.availability?.condition?.flag || choice.availability?.condition?.flags
                ? {
                    flags: [
                        ...(choice.availability?.condition?.flag ? [choice.availability.condition.flag] : []),
                        ...(choice.availability?.condition?.flags || []),
                    ],
                }
                : {}),
            ...(choice.availability?.condition?.notFlag || choice.availability?.condition?.notFlags
                ? {
                    notFlags: [
                        ...(choice.availability?.condition?.notFlag ? [choice.availability.condition.notFlag] : []),
                        ...(choice.availability?.condition?.notFlags || []),
                    ],
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
    if (!value) return 'neutral'
    const normalized = value.toLowerCase()
    switch (normalized) {
        case 'neutral': return 'neutral'
        case 'tense':
        case 'worried':
        case 'anxious': return 'tense'
        case 'warm':
        case 'excited': return 'warm'
        case 'serious':
        case 'determined': return 'serious'
        case 'hopeful':
        case 'optimistic': return 'hopeful'
        case 'grim':
        case 'sad':
        case 'melancholy': return 'grim'
        default: return 'neutral'
    }
}

function mapTone(color?: string) {
    switch (color) {
        case 'skill': return 'curious'
        case 'bold':
        case 'negative': return 'aggressive'
        case 'cautious': return 'calm'
        default: return undefined
    }
}

function buildSkillLabel(skill: string, difficulty: number, dc?: number, isLegacy?: boolean) {
    const safeDc = typeof dc === 'number' && Number.isFinite(dc) ? Math.round(dc) : Math.round(difficulty)
    const raw = Math.round(difficulty)
    if (isLegacy && safeDc !== raw) {
        return `Проверка: ${skill.toUpperCase()} • Сложность ${raw} (DC ${safeDc})`
    }
    return `Проверка: ${skill.toUpperCase()} • DC ${safeDc}`
}

function pickColor(palette: string[], index: number, key?: string) {
    if (key) {
        const hash = Math.abs(hashString(key))
        return palette[hash % palette.length]
    }
    return palette[index % palette.length]
}

function normalizeAssetPath(path?: string | null): string | undefined {
    if (!path) return undefined
    const trimmed = path.trim()
    if (!trimmed) return undefined
    if (/^https?:\/\//i.test(trimmed)) return trimmed

    let normalized = trimmed
    if (normalized.startsWith('/public/')) normalized = `/${normalized.slice('/public/'.length)}`
    else if (normalized.startsWith('public/')) normalized = `/${normalized.slice('public/'.length)}`

    if (!normalized.startsWith('/')) normalized = `/${normalized}`
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
