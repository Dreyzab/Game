/**
 * Quest Types - Single Source of Truth
 *
 * Status values:
 * - 'active': Quest in progress
 * - 'completed': Quest finished successfully
 * - 'abandoned': Quest cancelled by player
 * - 'failed': Quest failed by gameplay outcome
 */
export type QuestStatus = 'active' | 'completed' | 'abandoned' | 'failed'

export type QuestStep = {
    id: string
    title?: string
    description?: string
}

export interface QuestDTO {
    id: string
    title: string
    description?: string
    status?: QuestStatus
    createdAt?: number
    startedAt?: number
    completedAt?: number
    abandonedAt?: number
    failedAt?: number
    progress?: number
    maxProgress?: number
    currentStep?: string
    phase?: number
    recommendedLevel?: number
    steps?: QuestStep[]
    templateVersion?: number
    attempt?: number
}

// Backwards-compatible alias for existing UI imports.
export type Quest = QuestDTO

export function normalizeQuestStatus(status: string | null | undefined): QuestStatus {
    if (status === 'active' || status === 'completed' || status === 'abandoned' || status === 'failed') {
        return status
    }
    return 'active'
}
