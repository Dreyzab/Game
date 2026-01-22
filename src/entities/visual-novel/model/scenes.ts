import { SCENARIO_CHAPTERS } from '@/entities/visual-novel/scenarios'
import { COOP_BRIEFING_SCENE } from '@/shared/data/visualNovel/coopBriefingScene'
import { TEST_SCENE_WITH_ADVICES } from '@/shared/data/visualNovel/testSceneWithAdvices'
import { GLOBAL_SCENE_REGISTRY } from './sceneRegistry'
import { convertScene } from './sceneConverter'
import type { VisualNovelSceneDefinition, VisualNovelLine } from '@/shared/types/visualNovel'

// Export shared types and helpers
export * from './types'
export { buildChoiceViews } from './sceneConverter'
export { GLOBAL_SCENE_REGISTRY }

// Initialize Registry
Object.entries(SCENARIO_CHAPTERS).forEach(([chapterId, scenes]) => {
  // Convert raw scenes to runtime definitions
  const converted = Object.values(scenes).map((s) => convertScene(chapterId, s))
  GLOBAL_SCENE_REGISTRY.registerChapter(chapterId, converted)
})

// Register System Scenes (Misc)
GLOBAL_SCENE_REGISTRY.registerChapter('system', [
  COOP_BRIEFING_SCENE,
  TEST_SCENE_WITH_ADVICES,
])

export const DEFAULT_VN_SCENE_ID = 'prologue_coupe_start'

/**
 * Legacy flat export for backwards compatibility.
 * Use GLOBAL_SCENE_REGISTRY.resolve() for stricter lookups.
 * @deprecated Prefer using the Registry directly or getVisualNovelScene
 */
export const VISUAL_NOVEL_SCENES = GLOBAL_SCENE_REGISTRY.getAllScenesFlat()

/**
 * Retrieves a scene by ID using the global registry.
 * Fallbacks to DEFAULT_VN_SCENE_ID if not found.
 * 
 * @param sceneId Target Scene ID (can be namespaced 'chapter:id' or simple 'id')
 * @returns The resolved scene definition
 */
export function getVisualNovelScene(sceneId: string | undefined | null) {
  if (!sceneId) {
    return VISUAL_NOVEL_SCENES[DEFAULT_VN_SCENE_ID]
  }

  // Use the registry's legacy-compatible get() which tries to resolve globally
  const scene = GLOBAL_SCENE_REGISTRY.get(sceneId)

  return scene ?? VISUAL_NOVEL_SCENES[DEFAULT_VN_SCENE_ID]
}

/**
 * Resolves a navigation target to a fully qualified ID (chapter:scene) or 'END'.
 * Uses the registry to find the target relative to the current scene context.
 * 
 * @param currentSceneIdContext The ID of the current scene (can be simple or FQN).
 * @param targetId The target ID to navigate to.
 * @returns The FQN of the target scene, 'END' if terminal, or undefined if invalid.
 */
export function resolveNavigation(currentSceneIdContext: string | undefined, targetId: string | undefined): string | 'END' | undefined {
  if (!targetId || targetId === 'END' || targetId === 'EXIT') return 'END'

  // If strict FQN is provided, trust it (if it resolves)
  if (targetId.includes(':')) {
    const resolved = GLOBAL_SCENE_REGISTRY.get(targetId)
    return resolved ? targetId : undefined
  }

  // Determine context chapter
  let currentChapterId: string | undefined
  if (currentSceneIdContext) {
    if (currentSceneIdContext.includes(':')) {
      currentChapterId = currentSceneIdContext.split(':')[0]
    } else {
      currentChapterId = GLOBAL_SCENE_REGISTRY.getChapterId(currentSceneIdContext)
    }
  }

  try {
    const resolved = GLOBAL_SCENE_REGISTRY.resolve(currentChapterId, targetId)
    if (!resolved) return undefined

    // #region agent log (H6)
    if (typeof fetch === 'function') {
      fetch('http://127.0.0.1:7242/ingest/eff19081-7ed6-43af-8855-49ceea64ef9c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'run1',
          hypothesisId: 'H6',
          location: 'scenes.ts:resolveNavigation:resolved',
          message: 'Registry resolved navigation target',
          data: {
            currentSceneIdContext,
            currentChapterId,
            targetId,
            resolvedId: (resolved as any)?.id,
            resolvedIdHasColon: typeof (resolved as any)?.id === 'string' ? (resolved as any).id.includes(':') : null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => { })
    }
    // #endregion

    // If the registry already returned a fully-qualified id, trust it as-is.
    // This prevents accidental double-prefixing like "prologue:prologue:scene".
    if (resolved.id.includes(':')) {
      return resolved.id
    }

    // Reconstruct FQN
    // If we resolved it locally, it's in currentChapterId
    if (currentChapterId && GLOBAL_SCENE_REGISTRY.resolve(currentChapterId, targetId) === resolved) {
      return `${currentChapterId}:${resolved.id}`
    }

    // Otherwise it was a global lookup
    const foundChapter = GLOBAL_SCENE_REGISTRY.getChapterId(resolved.id)
    if (foundChapter) {
      return `${foundChapter}:${resolved.id}`
    }

    return resolved.id // Fallback if something is weird
  } catch (e) {
    console.warn(`[Navigation] resolution failed for ${targetId} from ${currentSceneIdContext}:`, e)
    return undefined
  }
}

export function getLineById(scene: VisualNovelSceneDefinition, lineId?: string | null): VisualNovelLine | null {
  if (!lineId) return null
  return scene.lines.find((line) => line.id === lineId) ?? null
}
