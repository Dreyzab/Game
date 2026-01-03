
export interface WorldNpcDefinition {
    id: string
    name: string // Internal ID/Name
    characterName: string // Display Name
    description: string

    // Core Identity
    archetype: string
    faction: string
    philosophy?: string
    ethel_affinity?: string

    // Location Binding
    defaultLocationId: string

    // RPG Data
    services?: string[]
    dialogues?: string[]
    questBindings?: string[]
    perk?: string

    // Visual/Flavor
    atmosphere?: string
    image?: string

    // Legacy / Misc Metadata from MapPoints
    // We keep these to ensure we can reconstruct the MapPoint metadata
    sceneBindings?: any[]
    unlockRequirements?: any
    danger_level?: any
}

export interface WorldNpcState {
    currentLocationId: string
    isAlive: boolean
    relationship: number
    // Optional overrides
    services?: string[]
    dialogues?: string[]
}
