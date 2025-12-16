import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { InventoryGrid } from './InventoryGrid'
import type { ItemState } from '@/entities/item/model/types'

// Mock dependencies
vi.mock('@/entities/inventory', () => ({
    useInventoryStore: vi.fn((selector) => selector({
        moveItemWithinGrid: vi.fn(),
        equipItem: vi.fn(),
        setQuickSlot: vi.fn(),
    })),
}))

vi.mock('@/features/inventory/model/useInventoryDrag', () => ({
    useInventoryDragStore: vi.fn(() => ({
        isDragging: false,
        itemId: null,
        target: null,
        startDrag: vi.fn(),
        setDropTarget: vi.fn(),
        updateCursor: vi.fn(),
        endDrag: vi.fn(),
        cursor: null,
    })),
}))

describe('InventoryGrid', () => {
    const mockItems: ItemState[] = [
        {
            id: 'item-1',
            templateId: 'scout_jacket',
            instanceId: 'inst-1',
            kind: 'clothing',
            name: 'Scout Jacket',
            description: 'A jacket',
            icon: '🧥',
            rarity: 'rare',
            stats: { weight: 1.5, width: 2, height: 2 },
            quantity: 1,
            gridPosition: { x: 0, y: 0 },
        },
    ]

    it('renders items correctly', () => {
        render(<InventoryGrid items={mockItems} />)
        expect(screen.getByText('Scout Jacket')).toBeInTheDocument()
    })

    it('calls onSelect when an item is clicked', () => {
        const onSelect = vi.fn()
        render(<InventoryGrid items={mockItems} onSelect={onSelect} />)

        const item = screen.getByText('Scout Jacket')
        fireEvent.pointerDown(item)

        expect(onSelect).toHaveBeenCalledWith('item-1')
    })
})
