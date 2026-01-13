import type { ItemKind } from '@/shared/data/itemTypes'
import type { PlayerRole } from '@/shared/types/survival'

export const DATAPAD_STATUS = {
  HEALTHY: 'HEALTHY',
  WOUNDED: 'WOUNDED',
  HUNGRY: 'HUNGRY',
} as const

export type DatapadStatus = (typeof DATAPAD_STATUS)[keyof typeof DATAPAD_STATUS]

export interface DatapadInventoryItem {
  templateId: string
  quantity: number
  name: string
  description: string
  kind: ItemKind
  imageUrl?: string
}

export interface DatapadPlayer {
  callsign: string
  role: PlayerRole | null
  status: DatapadStatus
  inventory: DatapadInventoryItem[]
}

