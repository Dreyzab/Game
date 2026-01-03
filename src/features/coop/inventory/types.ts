export interface CoopInventoryItem {
  instanceId: string
  templateId: string
  x: number
  y: number
  quantity: number
  containerId: string
}

export interface CoopEquipmentSlotConfig {
  id: string
  label: string
  accepts: string[]
  dimensions: { w: number; h: number }
}

export interface CoopLocalInventoryState {
  bag: Record<string, number>
  equipment: Record<string, { templateId: string; quantity: number } | null>
}

