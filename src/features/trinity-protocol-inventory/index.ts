/**
 * Trinity Protocol Inventory - Public API
 */

// UI Components
export { TrinityInventoryPage } from './ui/TrinityInventoryPage'
export { EquipmentSlot } from './ui/components/EquipmentSlot'
export { GridContainer } from './ui/components/GridContainer'
export { default as InventoryItem } from './ui/components/InventoryItem'
export { ItemDetailsModal } from './ui/components/ItemDetailsModal'

// Model / Store
export { useTrinityInventoryStore } from './model/store'
export { CELL_SIZE, EQUIPMENT_SLOTS, ITEM_TEMPLATES } from './model/constants'

// Types
export type {
    InventoryItem as InventoryItemType,
    ItemTemplate,
    EquipmentSlotConfig,
    LoadoutState,
    InventoryState,
    ItemType,
    Rarity,
} from './model/types'

