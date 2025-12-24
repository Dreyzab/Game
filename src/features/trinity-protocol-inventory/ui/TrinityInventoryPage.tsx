import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@clerk/clerk-react'
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
import { clsx } from 'clsx'
import { CELL_SIZE, EQUIPMENT_SLOTS } from '../model/constants'
import { useTrinityInventoryStore } from '../model/store'
import type { InventoryItem as InventoryItemType, ItemTemplate } from '../model/types'
import { EquipmentSlot } from './components/EquipmentSlot'
import { GridContainer } from './components/GridContainer'
import InventoryItem from './components/InventoryItem'
import { ItemDetailsModal } from './components/ItemDetailsModal'
import { StatusPanel } from './components/StatusPanel'

export function TrinityInventoryPage() {
  const { initialize, moveItemToGrid, equipItem, unequipAll, items, templates, equipment } = useTrinityInventoryStore()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showMobileStatus, setShowMobileStatus] = useState(false)

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    })
  )

  const { getToken } = useAuth()

  useEffect(() => {
    const init = async () => {
      const token = await getToken()
      await initialize(token || undefined)
    }
    init()
  }, [initialize, getToken])

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
    <div className="trinity-inventory w-full h-screen bg-trinity-bg text-gray-200 flex flex-col overflow-hidden selection:bg-cyan-500/30">
      <ItemDetailsModal />

      <header className="h-10 md:h-12 xl:h-16 border-b border-trinity-border flex items-center justify-between px-4 xl:px-8 bg-trinity-panel z-20 shadow-lg shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 md:w-3 md:h-3 bg-trinity-accent rounded-full animate-pulse shadow-[0_0_10px_#0ea5e9]" />
          <h1 className="text-lg md:text-xl xl:text-2xl font-bold tracking-tighter font-mono text-white hidden sm:block">
            TRINITY <span className="text-trinity-accent">SYSTEM</span>
          </h1>
          <h1 className="text-md font-bold tracking-tighter font-mono text-white sm:hidden">TRINITY</h1>
        </div>

        <nav className="flex gap-1">{/* reserved */}</nav>

        <div className="flex gap-4 items-center">
          <div className="flex gap-4 font-mono text-xs xl:text-sm text-trinity-accent">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full" /> 31k
            </span>
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> 240 P
            </span>
          </div>

          <button
            onClick={() => setShowMobileStatus((prev) => !prev)}
            className={clsx(
              'xl:hidden border px-2 py-0.5 text-[10px] font-bold tracking-wider transition-colors',
              showMobileStatus
                ? 'border-trinity-accent text-trinity-accent bg-trinity-accent/10'
                : 'border-trinity-border text-gray-400'
            )}
            type="button"
          >
            STATUS
          </button>
        </div>
      </header>

      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
        <main className="flex-1 flex overflow-hidden relative w-full">
          <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none z-0" />

          <section className="flex flex-col gap-2 xl:gap-4 z-10 shrink-0 h-full border-r border-trinity-border/20 bg-trinity-bg/30 backdrop-blur-sm pt-4 pb-4">
            <div className="flex justify-between items-center shrink-0 pl-4 pr-4">
              <h2 className="text-sm md:text-lg xl:text-xl font-bold text-gray-300 tracking-wider">STASH</h2>
              <button className="text-[10px] xl:text-xs border border-trinity-border px-2 py-1 hover:bg-white/5 transition-colors" type="button">
                SORT
              </button>
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar px-4 pb-4">
              <GridContainer containerId="stash" title="MAIN STORAGE" />
            </div>
          </section>

          <section className="flex-1 flex flex-col gap-2 xl:gap-6 z-10 overflow-y-auto custom-scrollbar py-8 px-4 items-center">
            <div className="flex justify-between items-center shrink-0 w-full max-w-2xl">
              <h2 className="text-sm md:text-lg xl:text-xl font-bold text-gray-300 tracking-wider">LOADOUT</h2>
              <button
                onClick={unequipAll}
                className="text-[10px] xl:text-xs border border-trinity-danger text-trinity-danger px-2 py-1 hover:bg-trinity-danger/10 transition-colors uppercase font-bold tracking-wider"
                type="button"
              >
                UNEQUIP
              </button>
            </div>

            <div className="flex gap-4 xl:gap-8">
              <div className="flex flex-col gap-2 xl:gap-4">{leftSlots.map((s) => <EquipmentSlot key={s.id} config={s} />)}</div>
              <div className="flex flex-col gap-2 mt-4 md:mt-8 xl:mt-12 xl:gap-4">{midSlots.map((s) => <EquipmentSlot key={s.id} config={s} />)}</div>
              <div className="flex flex-col gap-2 xl:gap-4">{rightSlots.map((s) => <EquipmentSlot key={s.id} config={s} />)}</div>
            </div>

            <div className="flex mt-2 xl:mt-4 gap-8 w-full max-w-2xl">
              <div className="flex flex-col gap-1 mt-4">
                <span className="text-[9px] text-gray-500 font-mono tracking-wider uppercase opacity-50 pl-1">POCKETS</span>
                <div className="grid grid-cols-2 gap-2">{pocketSlots.map((s) => <EquipmentSlot key={s.id} config={s} />)}</div>
              </div>

              {backpackId && (
                <div className="ml-auto border-t border-trinity-border pt-4">
                  <GridContainer containerId={backpackId} title="BACKPACK" className="items-center" />
                </div>
              )}
            </div>
          </section>

          <section
            className={clsx(
              'w-[260px] xl:w-[320px] flex-col gap-4 z-30 transition-transform duration-300 h-full border-l border-trinity-border/20 bg-trinity-bg/30 backdrop-blur-sm pt-4 pb-4 pr-4 pl-4',
              showMobileStatus ? 'flex fixed right-0 top-12 bottom-0 bg-trinity-bg/95 backdrop-blur-md border-l border-trinity-border p-4 shadow-2xl' : 'hidden xl:flex',
              !showMobileStatus && 'xl:flex'
            )}
          >
            <h2 className="text-lg xl:text-xl font-bold text-gray-300 tracking-wider">STATUS</h2>
            <StatusPanel />

            <div className="mt-auto border border-trinity-border bg-trinity-panel p-4 h-32 xl:h-48 shrink-0">
              <h3 className="text-gray-500 text-xs font-mono mb-2">QUICK ACCESS</h3>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-square border border-trinity-border/50 bg-black/40 flex items-end justify-end p-1">
                    <span className="text-[10px] text-gray-600">{i}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </main>

        <DragOverlay>
          {activeItem && activeTemplate ? (
            <InventoryItem item={activeItem} template={activeTemplate} isGridItem isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="landscape-warning fixed inset-0 z-[9999] bg-black flex-col items-center justify-center text-center p-8 hidden">
        <div className="text-trinity-accent text-4xl mb-4">↻</div>
        <h2 className="text-xl font-bold uppercase tracking-widest text-white mb-2">System Locked</h2>
        <p className="text-gray-500 font-mono text-sm">Rotate device to landscape mode for inventory access.</p>
      </div>
    </div>
  )
}

