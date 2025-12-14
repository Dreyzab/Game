import { create } from 'zustand'

type InventoryOutboxEvent = unknown

interface InventoryOutboxState {
  events: InventoryOutboxEvent[]
  enqueue: (event: InventoryOutboxEvent) => void
  clear: () => void
}

export const inventoryOutbox = create<InventoryOutboxState>((set) => ({
  events: [],
  enqueue: (event) => set((state) => ({ events: [...state.events, event] })),
  clear: () => set({ events: [] }),
}))

// Outbox mutation stub - используйте client.inventory для мутаций
export const useOutboxMutation = () => {
  return {
    mutate: async () => undefined,
    isLoading: false,
    error: null,
  }
}
