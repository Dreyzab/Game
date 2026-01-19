
import fs from 'node:fs'
import path from 'node:path'
import { GLOBAL_SCENE_REGISTRY, resolveNavigation } from '../src/entities/visual-novel/model/scenes'
import type { VisualNovelSceneDefinition } from '../src/shared/types/visualNovel'

// Force registration
import '../src/entities/visual-novel/model/scenes'

const ASSET_ROOTS = ['/images/', '/video/', '/audio/', '/music/']
const PROJECT_ROOT = path.resolve(import.meta.dirname, '..')

interface ValidationIssue {
    type: 'error' | 'warning'
    sceneId: string
    message: string
}

const issues: ValidationIssue[] = []

function logError(sceneId: string, message: string) {
    issues.push({ type: 'error', sceneId, message })
}

function logWarning(sceneId: string, message: string) {
    issues.push({ type: 'warning', sceneId, message })
}

function checkAsset(sceneId: string, assetPath?: string) {
    if (!assetPath) return
    if (assetPath.startsWith('http')) return // Remote ignored

    const isWhitelisted = ASSET_ROOTS.some(root => assetPath.startsWith(root))
    if (!isWhitelisted) {
        // If it's not a known asset root, maybe it's valid relative?
        // But we enforcing strict assets.
        // Allow if it doesn't look like a standard asset path?
        return
    }

    // Check physical existence
    // assetPath is like '/images/foo.png'.
    // Map to 'public/images/foo.png' or 'src/...'?
    // Vite usually serves /images from public/images.
    const publicPath = path.join(PROJECT_ROOT, 'public', assetPath)
    if (!fs.existsSync(publicPath)) {
        // Try src?
        const srcPath = path.join(PROJECT_ROOT, 'src', assetPath)
        if (!fs.existsSync(srcPath)) {
            logError(sceneId, `Missing asset: ${assetPath} (checked public/ and src/)`)
        }
    }
}

function validateScene(scene: VisualNovelSceneDefinition) {
    // Check Background
    checkAsset(scene.id, scene.background)

    // Check Music
    checkAsset(scene.id, scene.music)

    // Check Characters
    scene.characters.forEach(char => {
        checkAsset(scene.id, char.portraitUrl)
    })

    // Check Links & Dead Ends
    const terminalLine = scene.lines[scene.lines.length - 1]
    const hasChoices = (terminalLine.choices?.length ?? 0) > 0
    const nextSceneId = terminalLine.transition?.nextSceneId

    if (!hasChoices && !nextSceneId && !scene.isTerminal) {
        // Implicit end?
        // Check if marked explicitly as terminal
        // Note: we don't have isTerminal on runtime definition usually, unless we pass it through.
        // But typically we rely on 'END' marker in nextSceneId.
        // If conversion normalized everything, nextSceneId should be 'END' if it was terminal.
        // If it's undefined, it's a DEAD END.

        // We can't access `isTerminal` from runtime definition if `VisualNovelSceneDefinition` doesn't have it.
        // But `convertScene` handles logic? 
        // `convertScene` converts { nextScene: 'END' } -> `transition.nextSceneId = 'END'`.
        // It does NOT convert implicit endings (missing nextScene) to END automatically?
        // `normalizeNextScene` returns undefined if input is undefined.
        // And `convertScene` only sets transition if `scene.nextScene` matches.

        // So if source has NO nextScene and NO choices.
        // `transition` is undefined.
        // This is a true dead end.
        logError(scene.id, `Dead end detected: Scene has no choices and no nextScene. Explicitly mark as 'END' or add transition.`)
    } else if (nextSceneId) {
        // Validate Link
        const res = resolveNavigation(scene.id, nextSceneId)
        if (!res) {
            logError(scene.id, `Broken link to nextScene: "${nextSceneId}"`)
        }
    }

    // Check Choices
    terminalLine.choices?.forEach(choice => {
        if (choice.nextSceneId) {
            const res = resolveNavigation(scene.id, choice.nextSceneId)
            if (!res) {
                logError(scene.id, `Broken link in choice "${choice.label}": "${choice.nextSceneId}"`)
            }
        }
    })
}

// EXECUTION
console.log('Validating Visual Novel Scenes...')
const allScenes = GLOBAL_SCENE_REGISTRY.getAllScenesFlat()
const count = Object.keys(allScenes).length

Object.values(allScenes).forEach(validateScene)

const errors = issues.filter(i => i.type === 'error')
const warnings = issues.filter(i => i.type === 'warning')

console.log(`Checked ${count} scenes.`)
console.log(`Errors: ${errors.length}`)
console.log(`Warnings: ${warnings.length}`)

if (errors.length > 0) {
    console.error('\n--- ERRORS ---')
    errors.forEach(e => console.error(`[${e.sceneId}] ${e.message}`))
    process.exit(1)
} else {
    console.log('Validation passed.')
    process.exit(0)
}
