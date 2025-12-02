import { DndContext, DragOverlay, useDraggable, useDroppable, DragStartEvent, DragEndEvent } from '@dnd-kit/core'
import { ItemCard } from '@/entities/item/ui/ItemCard'
import { useInventoryStore } from '@/entities/item/model/store'
import { useState } from 'react'
import { cn } from '@/shared/lib/utils/cn'
import type { ItemState, EquipmentSlotId } from '@/entities/item/model/types'

// --- Components ---

const EquipmentSlot = ({ slotType, item }: { slotType: EquipmentSlotId, item?: ItemState | null }) => {
    const { setNodeRef, isOver } = useDroppable({ id: `equip-${slotType}` })

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "relative h-20 w-20 border-2 border-dashed rounded-lg flex items-center justify-center transition-colors",
                isOver ? "border-green-500 bg-green-500/10" : "border-slate-600 bg-slate-900/40"
            )}
        >
            {item ? (
                <DraggableItem item={item} />
            ) : (
                <span className="text-[10px] text-slate-500 uppercase text-center">{slotType.replace('_', ' ')}</span>
            )}
        </div>
    )
}

const DraggableItem = ({ item }: { item: ItemState }) => {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: item.instanceId,
        data: { item }
    })

    if (isDragging) {
        return <div ref={setNodeRef} className="h-20 w-20 opacity-30 bg-slate-700 rounded-md" />
    }

    return (
        <div ref={setNodeRef} {...listeners} {...attributes}>
            <ItemCard item={item} />
        </div>
    )
}

const ContainerGrid = ({ containerId, name, width, height, items }: { containerId: string, name?: string, width: number, height: number, items: ItemState[] }) => {
    const { setNodeRef, isOver } = useDroppable({ id: `container-${containerId}` })

    // Simple grid logic: just list items for now, real grid tetris is harder
    // We will simulate "slots" by rendering W*H cells
    const totalSlots = width * height

    return (
        <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-700">
            <h3 className="text-xs font-mono text-slate-400 mb-2 uppercase">{name || 'Container'}</h3>
            <div
                ref={setNodeRef}
                className={cn(
                    "grid gap-2 transition-colors min-h-[100px]",
                    isOver ? "bg-slate-800/50 ring-2 ring-green-500/30" : ""
                )}
                style={{ gridTemplateColumns: `repeat(${width}, minmax(0, 1fr))` }}
            >
                {items.map(item => (
                    <div key={item.instanceId} className="aspect-square">
                        <DraggableItem item={item} />
                    </div>
                ))}
                {/* Empty slots filler */}
                {Array.from({ length: Math.max(0, totalSlots - items.length) }).map((_, i) => (
                    <div key={`empty-${i}`} className="aspect-square border border-slate-800/50 rounded-md bg-slate-950/20" />
                ))}
            </div>
        </div>
    )
}

// --- Main Screen ---

export const InventoryScreen = () => {
    const { getEquippedItems, getContainers, equipItem, moveItem } = useInventoryStore()
    const equipped = getEquippedItems()
    const containers = getContainers()
    const [activeDragItem, setActiveDragItem] = useState<ItemState | null>(null)

    const handleDragStart = (event: DragStartEvent) => {
        if (event.active.data.current?.item) {
            setActiveDragItem(event.active.data.current.item as ItemState)
            // Haptic feedback if available
            if (navigator.vibrate) navigator.vibrate(20)
        }
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { over, active } = event
        setActiveDragItem(null)

        if (!over) return

        const itemId = active.id as string
        const overId = over.id as string

        // 1. Drop on Equipment Slot
        if (overId.startsWith('equip-')) {
            const slotType = overId.replace('equip-', '') as EquipmentSlotId
            equipItem(itemId, slotType)
        }
        // 2. Drop on Container
        else if (overId.startsWith('container-')) {
            const containerId = overId.replace('container-', '')
            // Logic to find first empty slot or just append
            // For now, we just move it to the container, x/y are 0
            moveItem(itemId, containerId, 0, 0)
        }
    }

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex flex-col lg:flex-row gap-6 p-4 h-full text-slate-100 overflow-y-auto">

                {/* Left: Equipment Doll */}
                <div className="flex-none w-full lg:w-[400px] bg-slate-900/80 p-6 rounded-xl border border-slate-700 backdrop-blur-md">
                    <h2 className="text-xl font-bold mb-6 font-mono text-amber-500 flex justify-between">
                        <span>OPERATOR</span>
                        <span className="text-sm text-slate-500 font-normal">STATUS: OK</span>
                    </h2>

                    <div className="relative flex flex-col items-center gap-4">
                        {/* Head */}
                        <EquipmentSlot slotType="helmet" item={equipped.helmet} />

                        <div className="flex gap-4 w-full justify-center">
                            {/* Left Arm / Weapon */}
                            <div className="flex flex-col gap-2">
                                <EquipmentSlot slotType="primary" item={equipped.primary} />
                                <EquipmentSlot slotType="secondary" item={equipped.secondary} />
                            </div>

                            {/* Body */}
                            <div className="flex flex-col gap-2">
                                <EquipmentSlot slotType="armor" item={equipped.armor} />
                                <EquipmentSlot slotType="rig" item={equipped.rig} />
                                <EquipmentSlot slotType="clothing_top" item={equipped.clothing_top} />
                                <EquipmentSlot slotType="clothing_bottom" item={equipped.clothing_bottom} />
                            </div>

                            {/* Right Arm / Backpack */}
                            <div className="flex flex-col gap-2">
                                <EquipmentSlot slotType="backpack" item={equipped.backpack} />
                                <EquipmentSlot slotType="melee" item={equipped.melee} />
                            </div>
                        </div>

                        {/* Quick Slots */}
                        <div className="grid grid-cols-5 gap-2 mt-4 w-full">
                            {equipped.quick.map((item, i) => (
                                // @ts-ignore
                                <EquipmentSlot key={i} slotType={`quick_${i + 1}`} item={item} />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right: Containers (Backpack, Pockets, etc.) */}
                <div className="flex-1 flex flex-col gap-4">
                    {containers.map(container => (
                        <ContainerGrid
                            key={container.id}
                            containerId={container.id}
                            name={container.name}
                            width={container.width}
                            height={container.height}
                            items={container.items}
                        />
                    ))}

                    {containers.length === 0 && (
                        <div className="text-center text-slate-500 mt-10">
                            No storage available. Equip a backpack or vest.
                        </div>
                    )}
                </div>

            </div>

            <DragOverlay>
                {activeDragItem ? <ItemCard item={activeDragItem} /> : null}
            </DragOverlay>
        </DndContext>
    )
}
