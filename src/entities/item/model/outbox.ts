import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useMutation } from 'convex/react'
import { api } from '../../../../../convex/_generated/api'
import { useEffect } from 'react'

export type InventoryEvent =
    | { type: 'ADD_ITEM'; payload: any }
    | { type: 'EQUIP_ITEM'; itemId: string; slot: string }
    | { type: 'UNEQUIP_ITEM'; itemId: string }
    | { type: 'MOVE_ITEM'; itemId: string; containerId: string; x: number; y: number }
    | { type: 'REMOVE_ITEM'; itemId: string }
    | { type: 'TRADE_ITEM'; itemId: string; targetPlayerId: string }

interface OutboxState {
    queue: InventoryEvent[]
    enqueue: (event: InventoryEvent) => void
    clearQueue: () => void
}

export const inventoryOutbox = create<OutboxState>()(
    persist(
        (set) => ({
            queue: [],
            enqueue: (event) => set((state) => ({ queue: [...state.queue, event] })),
            clearQueue: () => set({ queue: [] }),
        }),
        { name: 'inventory-outbox' }
    )
)

export const useInventorySync = () => {
    const syncMutation = useMutation(api.inventory.sync)
    const queue = inventoryOutbox((s) => s.queue)
    const clear = inventoryOutbox((s) => s.clearQueue)

    useEffect(() => {
        if (navigator.onLine && queue.length > 0) {
            // @ts-ignore - sync mutation might not be generated yet
            syncMutation({ events: queue })
                .then(() => {
                    console.log('Inventory synced successfully')
                    clear()
                })
                .catch((err) => {
                    console.error('Failed to sync inventory:', err)
                })
        }
    }, [queue, clear, syncMutation])
}
