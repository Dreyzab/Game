import type { CoopEquipmentSlotConfig } from './types'

export const CELL_SIZE = 40

export const COOP_EQUIPMENT_SLOTS: CoopEquipmentSlotConfig[] = [
  { id: 'head', label: 'HEAD', accepts: ['head'], dimensions: { w: 2, h: 2 } },
  { id: 'body', label: 'BODY', accepts: ['vest'], dimensions: { w: 2, h: 2 } },
  { id: 'primary', label: 'PRIMARY', accepts: ['weapon'], dimensions: { w: 4, h: 2 } },
  { id: 'secondary', label: 'SECONDARY', accepts: ['weapon'], dimensions: { w: 4, h: 2 } },
  { id: 'backpack', label: 'BACK', accepts: ['backpack'], dimensions: { w: 2, h: 2 } },
  { id: 'rig', label: 'RIG', accepts: ['rig'], dimensions: { w: 2, h: 2 } },
  { id: 'pocket1', label: '', accepts: ['consumable', 'tool', 'misc', 'quest', 'artifact', 'ammo'], dimensions: { w: 1, h: 1 } },
  { id: 'pocket2', label: '', accepts: ['consumable', 'tool', 'misc', 'quest', 'artifact', 'ammo'], dimensions: { w: 1, h: 1 } },
  { id: 'pocket3', label: '', accepts: ['consumable', 'tool', 'misc', 'quest', 'artifact', 'ammo'], dimensions: { w: 1, h: 1 } },
  { id: 'pocket4', label: '', accepts: ['consumable', 'tool', 'misc', 'quest', 'artifact', 'ammo'], dimensions: { w: 1, h: 1 } },
]

