import type { VisualNovelSceneDefinition } from '@/shared/types/visualNovel'
import type { SceneID, ChapterID, TerminalMarker } from './types'

type SceneMap = Map<SceneID, VisualNovelSceneDefinition>

export class SceneRegistry {
    private chapters = new Map<ChapterID, SceneMap>()
    private globalIndex = new Map<SceneID, Set<ChapterID>>()

    /**
     * Registers a collection of scenes under a namespace (ChapterID).
     * @throws Error if ID constraints are violated (dots, reserved words, FQN collisions).
     */
    public registerChapter(chapterId: ChapterID, scenes: VisualNovelSceneDefinition[]) {
        if (chapterId.includes('.')) {
            throw new Error(`Invalid ChapterID "${chapterId}". Dots are forbidden.`)
        }

        let chapterMap = this.chapters.get(chapterId)
        if (!chapterMap) {
            chapterMap = new Map()
            this.chapters.set(chapterId, chapterMap)
        }

        for (const scene of scenes) {
            let shortId = scene.id
            if (scene.id.includes(':')) {
                const [ns, suffix] = scene.id.split(':')
                if (ns !== chapterId) {
                    console.warn(`[SceneRegistry] Scene FQN "${scene.id}" mismatches registration chapter "${chapterId}".`)
                }
                shortId = suffix
            }

            this.validateSceneId(shortId)

            // Strict Collision check
            if (chapterMap.has(shortId)) {
                console.warn(`[SceneRegistry] Duplicate SceneID "${shortId}" in chapter "${chapterId}". Overwriting.`)
            }

            chapterMap.set(shortId, scene)
            this.addToGlobalIndex(shortId, chapterId)
        }
    }

    /**
     * Finds the ChapterID where a specific SceneID is defined.
     * If the scene ID is unique globally, returns that chapter.
     * If it's ambiguous, returns undefined (or throws?).
     * Returns undefined if not found.
     */
    public getChapterId(sceneId: string): ChapterID | undefined {
        // If it's an FQN, parse it
        if (sceneId.includes(':')) {
            const [ns] = sceneId.split(':')
            // Verify it actually exists?
            return ns
        }

        const containing = this.globalIndex.get(sceneId)
        if (!containing || containing.size === 0) return undefined
        if (containing.size > 1) return undefined // Ambiguous, cannot determine chapter without context
        return containing.values().next().value
    }

    /**
     * Resolves a target ID to a Scene Definition using strict precedence rules.
     * 1. Explicit Namespace (chapter:scene) -> Exact lookup.
     * 2. Unqualified (scene) -> Local check (current chapter).
     * 3. Unqualified (scene) -> Global check (must be unique).
     * 
     * @returns The resolved scene, or undefined if not found.
     * @throws Error if the reference is ambiguous (exists in multiple chapters and not current).
     */
    public resolve(currentChapterId: ChapterID | undefined, target: string | TerminalMarker): VisualNovelSceneDefinition | undefined {
        if (target === 'END') return undefined // handled by runtime
        if (!target) return undefined

        // 1. Explicit Namespace check
        if (target.includes(':')) {
            const [ns, id] = target.split(':')
            return this.chapters.get(ns)?.get(id)
        }

        // 2. Local check
        if (currentChapterId) {
            const localScene = this.chapters.get(currentChapterId)?.get(target)
            if (localScene) return localScene
        }

        // 3. Global check with Ambiguity detection
        const containingChapters = this.globalIndex.get(target)

        if (!containingChapters || containingChapters.size === 0) {
            return undefined // Not found anywhere
        }

        if (containingChapters.size > 1) {
            // It exists in multiple places. If we are here, it wasn't in the current chapter (step 2).
            // So this is an ambiguous reference.
            const chaptersList = Array.from(containingChapters).join(', ')
            throw new Error(
                `Ambiguous scene reference "${target}". It exists in chapters: [${chaptersList}]. ` +
                `Please use an explicit namespace (e.g., "${chaptersList.split(', ')[0]}:${target}").`
            )
        }

        // Unique match globally
        const uniqueChapter = containingChapters.values().next().value
        return this.chapters.get(uniqueChapter!)?.get(target)
    }

    public get(id: string): VisualNovelSceneDefinition | undefined {
        // Legacy support: try to resolve without a context context
        // This effectively only finds globally unique scenes or throws on ambiguity
        try {
            return this.resolve(undefined, id)
        } catch (e) {
            console.error(e)
            return undefined
        }
    }

    public getAllScenesFlat(): Record<string, VisualNovelSceneDefinition> {
        const flat: Record<string, VisualNovelSceneDefinition> = {}
        this.chapters.forEach((map) => {
            map.forEach((scene) => {
                flat[scene.id] = scene
            })
        })
        return flat
    }

    private validateSceneId(id: string) {
        if (id.includes('.')) {
            throw new Error(`Invalid SceneID "${id}". Dots are forbidden.`)
        }
        if (id === 'END') {
            throw new Error(`Invalid SceneID "${id}". "END" is a reserved keyword.`)
        }
    }

    private addToGlobalIndex(sceneId: string, chapterId: ChapterID) {
        let set = this.globalIndex.get(sceneId)
        if (!set) {
            set = new Set()
            this.globalIndex.set(sceneId, set)
        }
        set.add(chapterId)
    }
}

export const GLOBAL_SCENE_REGISTRY = new SceneRegistry()
