/**
 * @fileoverview Типы для карты и точек интереса
 * FSD: shared/types
 */

export type MapPointType =
  | 'poi'
  | 'quest'
  | 'npc'
  | 'location'
  | 'board'
  | 'settlement'
  | 'anomaly'
  | 'shop'

export type MapPointStatus = 'not_found' | 'discovered' | 'researched'

export type DangerLevel = 'low' | 'medium' | 'high'

export type ActivationType = 'qr' | 'conditional' | 'auto'

export interface SkillCheck {
  skill: string
  level?: number
  perk?: string
}

export type Condition =
  | { type: 'item'; id: string; count?: number }
  | { type: 'time'; range: { from: string; to: string } }
  | { type: 'reputation'; faction: string; min?: number; max?: number }
  | { type: 'questFlag'; id: string; value?: string | boolean | number }
  | { type: 'cooldown'; until: number }
  | { type: 'story'; id: string }

export interface PointActivationSpec {
  activationType?: ActivationType
  qrCodeId?: string
  conditionalTriggerId?: string
  conditions?: Condition[]
}

export interface PointVisibilitySpec {
  initiallyHidden?: boolean
  /** When `initiallyHidden` is true, controls whether /map/discover can reveal this point. Defaults to true. */
  discoverableByProximity?: boolean
  storyUnlockId?: string
  requiresSkill?: SkillCheck
  requiresZoneId?: string
  revealOnProximityRadius?: number
  autoReveal?: boolean
  isDiscovered?: boolean
}

export interface ZoneDiscoverySpec {
  storyUnlockId?: string
  requiresSkill?: SkillCheck
  revealRadiusMeters?: number
  autoRevealOnEntry?: boolean
  isDiscovered?: boolean
  progressFlags?: string[]
}

export interface ConditionalZone extends ZoneDiscoverySpec {
  _id?: string
  id: string
  name: string
  faction?: string
  polygon: Coordinates[]
  alwaysVisible?: boolean
}

export type FactionType =
  | 'fjr'
  | 'ordnung'
  | 'artisans'
  | 'synthesis'
  | 'anarchists'
  | 'merchants'
  | 'traders'
  | 'old_believers'
  | 'farmers'
  | 'neutral'
  | 'unknown'
  | 'contested'
  | 'government'

export interface Coordinates {
  lat: number
  lng: number
}

export interface BBox {
  minLat: number
  maxLat: number
  minLng: number
  maxLng: number
}

export interface SceneBindingCondition {
  flags?: string[]
  notFlags?: string[]
  phase?: number
  questCompleted?: string[]
  minLevel?: number
  reputation?: Array<{
    faction: string
    min?: number
    max?: number
  }>
}

export interface SceneBinding {
  sceneId: string
  triggerType: 'click' | 'proximity' | 'qr'
  conditions?: SceneBindingCondition
  priority?: number
}

export interface UnlockRequirements {
  flags?: string[]
  phase?: number
  questCompleted?: string[]
  reputation?: Record<string, number>
}

export interface MapPointMetadata {
  danger_level?: DangerLevel
  faction?: FactionType
  category?: string
  characterName?: string
  qrHint?: string
  qrRequired?: boolean
  isQRZone?: boolean
  isActiveQuestTarget?: boolean // Точка является целью активного задания (для пульсации)
  sceneBindings?: SceneBinding[]
  unlockRequirements?: UnlockRequirements
  visibility?: PointVisibilitySpec
  activation?: PointActivationSpec
  services?: string[]
  isGlobalObjective?: boolean
  philosophy?: string
  magic_level?: 'zero' | 'low' | 'medium' | 'high' | 'critical' | 'holy'
  npcId?: string
  questBindings?: string[]
  resources?: string[]
  atmosphere?: string
  archetype?: string
  ethel_affinity?: string
  perk?: string
  [key: string]: unknown
}

export interface MapPoint {
  _id?: string
  id: string
  title: string
  description: string
  coordinates: Coordinates
  type: MapPointType
  phase?: number
  isActive: boolean
  metadata?: MapPointMetadata
  qrCode?: string
  visibility?: PointVisibilitySpec
  activation?: PointActivationSpec
  createdAt?: number
  // Статус открытия (добавляется клиентом)
  status?: MapPointStatus
  discoveredAt?: number
  researchedAt?: number
  discoveredBy?: string
  distance?: number // расстояние от игрока (км)
}

export interface SafeZone {
  _id?: string
  id: string
  name: string
  faction?: string
  polygon: Coordinates[]
  isActive: boolean
  alwaysVisible?: boolean
  storyUnlockId?: string
  requiresSkill?: SkillCheck
  revealRadiusMeters?: number
  autoRevealOnEntry?: boolean
  isDiscovered?: boolean
  progressFlags?: string[]
  createdAt?: number
}

export interface DangerZone {
  _id?: string
  id: string
  name: string
  polygon: Coordinates[]
  dangerLevel: DangerLevel
  enemyTypes: string[]
  spawnPoints: Coordinates[]
  maxEnemies: number
  isActive: boolean
  storyUnlockId?: string
  requiresSkill?: SkillCheck
  revealRadiusMeters?: number
  isDiscovered?: boolean
  visionRadiusMeters?: number
  hearingRadiusMeters?: number
  patrolRoutes?: Coordinates[][]
  spawnCooldownSec?: number
  createdAt?: number
}

export interface MapViewport {
  center: [number, number] // [lng, lat]
  zoom: number
  bearing?: number
  pitch?: number
}

export interface MapBounds {
  north: number
  south: number
  east: number
  west: number
}

export interface MapState {
  viewport: MapViewport
  bounds?: MapBounds
  selectedPointId: string | null
  hoveredPointId: string | null
  showSafeZones: boolean
  showDangerZones: boolean
}
