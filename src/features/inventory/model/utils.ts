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
