const STORAGE_KEY = 'grenw3_local_state_v1'

export type LocalQuestStatus = 'active' | 'completed'

export interface LocalQuest {
  id: string
  title: string
  description?: string
  status: LocalQuestStatus
  progress?: number
  maxProgress?: number
  createdAt: number
}

export interface LocalState {
  flags: string[]
  visitedScenes: string[]
  quests: LocalQuest[]
  lastUpdatedAt: number
}

const DEFAULT_STATE: LocalState = {
  flags: [],
  visitedScenes: [],
  quests: [],
  lastUpdatedAt: Date.now(),
}

export function loadLocalState(): LocalState {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_STATE }
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { ...DEFAULT_STATE }
    }

    const parsed = JSON.parse(raw) as Partial<LocalState>

    return {
      flags: Array.isArray(parsed.flags) ? [...parsed.flags] : [],
      visitedScenes: Array.isArray(parsed.visitedScenes) ? [...parsed.visitedScenes] : [],
      quests: Array.isArray(parsed.quests)
        ? parsed.quests
            .filter((quest): quest is LocalQuest =>
              typeof quest?.id === 'string' && typeof quest?.title === 'string' && typeof quest?.status === 'string'
            )
            .map((quest) => ({
              ...quest,
              createdAt: typeof quest.createdAt === 'number' ? quest.createdAt : Date.now(),
            }))
        : [],
      lastUpdatedAt: typeof parsed.lastUpdatedAt === 'number' ? parsed.lastUpdatedAt : Date.now(),
    }
  } catch (error) {
    console.warn('[localFallbackState] Не удалось прочитать сохранённое состояние', error)
    return { ...DEFAULT_STATE }
  }
}

export function updateLocalState(mutator: (draft: LocalState) => void): LocalState {
  const current = loadLocalState()
  const draft: LocalState = {
    flags: [...current.flags],
    visitedScenes: [...current.visitedScenes],
    quests: current.quests.map((quest) => ({ ...quest })),
    lastUpdatedAt: current.lastUpdatedAt,
  }

  mutator(draft)
  draft.lastUpdatedAt = Date.now()

  saveLocalState(draft)
  return draft
}

function saveLocalState(state: LocalState) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.warn('[localFallbackState] Не удалось сохранить состояние', error)
  }
}
