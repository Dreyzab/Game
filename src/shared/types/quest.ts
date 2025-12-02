export interface Quest {
    id: string
    title: string
    description?: string
    status: 'active' | 'completed' | 'abandoned'
    createdAt?: number
    startedAt?: number
    completedAt?: number
    abandonedAt?: number
    progress?: number
    maxProgress?: number
    currentStep?: string
    templateVersion?: number
    attempt?: number
}
