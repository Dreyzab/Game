import type { ItemKind, ItemState } from '@/entities/item/model/types'

export type InventoryFilter = ItemKind | 'all' | 'weapons' | 'armor' | 'consumables' | 'quest'

export const filterItems = (
    items: ItemState[],
    searchQuery: string,
    filter: InventoryFilter = 'all'
): ItemState[] => {
    let filtered = items

    // Text Search
    if (searchQuery) {
        const query = searchQuery.toLowerCase()
        filtered = filtered.filter((item) =>
            item.name.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query)
        )
    }

    // Category Filter
    if (filter !== 'all') {
        filtered = filtered.filter((item) => {
            if (filter === 'weapons') return item.kind === 'weapon'
            if (filter === 'armor') return item.kind === 'armor' || item.kind === 'clothing'
            if (filter === 'consumables') return item.kind === 'consumable'
            if (filter === 'quest') return item.kind === 'quest'
            // Default to exact match for other ItemKinds (e.g. 'backpack')
            return item.kind === filter
        })
    }

    return filtered
}

import { ITEM_TEMPLATES } from '@/entities/item/model/templates'
import type { EquipmentSlotId } from '@/entities/item/model/types'

export const isValidSlotDrop = (slotId: string, item: ItemState): boolean => {
    const template = ITEM_TEMPLATES[item.templateId]
    if (!template) return false

    // Quick slots allow consumables (and maybe grenades later)
    if (slotId.startsWith('quick_')) {
        return template.kind === 'consumable' || (template.tags?.includes('usable') ?? false)
    }

    switch (slotId) {
        case 'primary':
        case 'secondary':
        case 'melee': // For now allow any weapon in any slot, or restrict melee specifically?
            return template.kind === 'weapon'

        case 'helmet':
            // "armor" kind + "head" tag
            return template.kind === 'armor' && (template.tags?.includes('head') ?? false)

        case 'armor':
            // "armor" kind + NOT "head"
            return template.kind === 'armor' && !(template.tags?.includes('head') ?? false)

        case 'clothing_top':
            // "clothing" kind + NOT "bottom"
            return template.kind === 'clothing' && !(template.tags?.includes('bottom') ?? false)

        case 'clothing_bottom':
            return template.kind === 'clothing' && (template.tags?.includes('bottom') ?? false)

        case 'backpack':
            return template.kind === 'backpack'

        case 'rig':
            return template.kind === 'rig'

        case 'clothing': // Legacy/fallback?
            return template.kind === 'clothing'

        default:
            return true
    }
}
