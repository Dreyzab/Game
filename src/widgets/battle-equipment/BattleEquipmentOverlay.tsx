/**
 * BattleEquipmentOverlay widget
 * 
 * This widget composes features from both dreyzab-combat-simulator and 
 * trinity-protocol-inventory, so it lives in the widgets layer to comply
 * with FSD (Feature-Sliced Design) boundaries.
 */
import { useEffect, useMemo, useState } from 'react'
import {
    DndContext,
    DragOverlay,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from '@dnd-kit/core'
import { Backpack, X } from 'lucide-react'
import {
    CELL_SIZE,
    EQUIPMENT_SLOTS,
    useTrinityInventoryStore,
    EquipmentSlot,
    GridContainer,
    InventoryItem,
    ItemDetailsModal,
    type InventoryItemType,
    type ItemTemplate,
} from '@/features/trinity-protocol-inventory'
import { useAppAuth } from '@/shared/auth'
import { useDeviceId } from '@/shared/hooks/useDeviceId'

type Props = {
    onClose: () => void
    title?: string
}

export default function BattleEquipmentOverlay({ onClose, title }: Props) {
    const { initialize, moveItemToGrid, equipItem, items, templates, equipment } = useTrinityInventoryStore()
    const [activeId, setActiveId] = useState<string | null>(null)
    const { getToken } = useAppAuth()
    const { deviceId } = useDeviceId()

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: { distance: 5 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 150, tolerance: 5 },
        })
    )

    useEffect(() => {
        const init = async () => {
            const token = await getToken()
            initialize(token || undefined, deviceId)
        }
        init()
    }, [initialize, getToken, deviceId])

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string)
    }

    const handleDragCancel = () => {
        setActiveId(null)
    }

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        setActiveId(null)

        if (!over) return

        const activeItem = active.data.current?.item as InventoryItemType | undefined
        const activeTemplate = active.data.current?.template as ItemTemplate | undefined
        if (!activeItem || !activeTemplate) return

        if (over.data.current?.type === 'container') {
            const containerId = over.data.current.containerId as string

            let targetX = 0
            let targetY = 0

            const activeRect = active.rect.current.translated
            const overRect = over.rect

            if (activeRect && overRect) {
                const relativeX = activeRect.left - overRect.left
                const relativeY = activeRect.top - overRect.top
                targetX = Math.round(relativeX / CELL_SIZE)
                targetY = Math.round(relativeY / CELL_SIZE)
            }

            moveItemToGrid(activeItem.instanceId, containerId, targetX, targetY)
        }

        if (over.data.current?.type === 'slot') {
            const slotId = over.data.current.slotId as string
            const accepts = over.data.current.accepts as string[]
            if (accepts.includes(activeTemplate.type)) {
                equipItem(activeItem.instanceId, slotId)
            }
        }
    }

    const activeItem = activeId ? items[activeId] : null
    const activeTemplate = activeItem ? templates[activeItem.templateId] : null

    const leftSlots = useMemo(() => EQUIPMENT_SLOTS.filter((s) => ['helmet', 'armor'].includes(s.id)), [])
    const midSlots = useMemo(() => EQUIPMENT_SLOTS.filter((s) => ['primary', 'secondary'].includes(s.id)), [])
    const rightSlots = useMemo(() => EQUIPMENT_SLOTS.filter((s) => ['backpack', 'rig'].includes(s.id)), [])
    const pocketSlots = useMemo(() => EQUIPMENT_SLOTS.filter((s) => s.id.startsWith('pocket')), [])

    const backpackId = equipment.backpack

    return (
        <div className="fixed inset-0 bg-black/95 z-[95] flex items-center justify-center p-4 backdrop-blur-sm">
            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
                <div className="trinity-inventory bg-trinity-bg border border-trinity-border w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden">
                    <ItemDetailsModal />

                    <div className="h-12 border-b border-trinity-border flex items-center justify-between px-4 bg-trinity-panel">
                        <div className="flex items-center gap-2">
                            <Backpack size={18} className="text-trinity-accent" />
                            <div className="font-bold tracking-widest text-gray-200 text-sm uppercase">
                                Equipment{title ? ` · ${title}` : ''}
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1.5 border border-trinity-border/50 text-gray-400 hover:text-white hover:border-white/30 transition-colors"
                            type="button"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-4 flex flex-col xl:flex-row gap-6 overflow-hidden">
                        <div className="shrink-0">
                            <div className="flex gap-4">
                                <div className="flex flex-col gap-3">{leftSlots.map((s) => <EquipmentSlot key={s.id} config={s} />)}</div>
                                <div className="flex flex-col gap-3 mt-3">{midSlots.map((s) => <EquipmentSlot key={s.id} config={s} />)}</div>
                                <div className="flex flex-col gap-3">{rightSlots.map((s) => <EquipmentSlot key={s.id} config={s} />)}</div>
                            </div>

                            <div className="mt-6">
                                <div className="text-[9px] text-gray-500 font-mono tracking-wider uppercase opacity-60 pl-1 mb-2">
                                    Pockets
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {pocketSlots.map((s) => (
                                        <EquipmentSlot key={s.id} config={s} />
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto">
                            {backpackId ? (
                                <GridContainer containerId={backpackId} title="BACKPACK" className="items-start" />
                            ) : (
                                <div className="border border-trinity-border bg-trinity-panel/50 p-4 text-gray-400 font-mono text-xs">
                                    NO BACKPACK EQUIPPED
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <DragOverlay>
                    {activeItem && activeTemplate ? (
                        <InventoryItem item={activeItem} template={activeTemplate} isGridItem isOverlay />
                    ) : null}
                </DragOverlay>
            </DndContext>
        </div>
    )
}
