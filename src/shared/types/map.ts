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

export type MapPointStatus = 'not_found' | 'discovered' | 'researched'

export type DangerLevel = 'low' | 'medium' | 'high'

export type FactionType = 
  | 'civilians'
  | 'alliance'
  | 'syndicate'
  | 'neutral'
  | 'unknown'

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

export interface SceneBinding {
  sceneId: string
  triggerType: 'click' | 'proximity' | 'qr'
  conditions?: {
    flags?: string[]
    phase?: number
    questCompleted?: string[]
  }
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
  qrCode?: string
  qrHint?: string
  qrRequired?: boolean
  isQRZone?: boolean
  isActiveQuestTarget?: boolean // Точка является целью активного задания (для пульсации)
  sceneBindings?: SceneBinding[]
  unlockRequirements?: UnlockRequirements
  services?: string[]
  [key: string]: any
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

