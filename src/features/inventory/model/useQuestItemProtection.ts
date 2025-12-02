import { useEffect } from 'react'
import { useInventoryStore } from '@/shared/stores/inventoryStore'
import type { ItemState } from '@/entities/item/model/types'

const shouldProtect = (item: ItemState) => item.kind === 'quest' || item.tags?.includes('quest')

export const useQuestItemProtection = () => {
    const items = useInventoryStore((state) => state.items)
    const setQuestProtectedItems = useInventoryStore((state) => state.setQuestProtectedItems)

    useEffect(() => {
        const protectedIds: string[] = []
        Object.values(items).forEach((item) => {
            if (shouldProtect(item)) {
                protectedIds.push(item.id)
            }
        })

        // Only update if we found items to protect, or to clear if needed.
        // Ideally we might want to check if it changed to avoid loops, 
        // but setQuestProtectedItems in store likely just sets state.
        // To be safe, we can just set it. The store setter is simple.
        setQuestProtectedItems(protectedIds)

    }, [items, setQuestProtectedItems])
}
