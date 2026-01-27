export type DetectivePointType = 'bureau' | 'crime' | 'npc' | 'support'
export type DetectivePointState = 'locked' | 'discovered' | 'active' | 'cleared'

export interface DetectivePointMetadata {
    detectiveType?: DetectivePointType
    detectiveState?: DetectivePointState
    faction?: string
}
