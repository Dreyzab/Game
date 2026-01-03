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
import { clsx } from 'clsx'
import { COOP_EQUIPMENT_SLOTS } from './constants'
import { CoopEquipmentSlot } from './CoopEquipmentSlot'
import CoopInventoryItemView from './CoopInventoryItem'
import { CoopStashGrid } from './CoopStashGrid'
import type { CoopLocalInventoryState } from './types'
import { COOP_CHARACTERS } from '../model/characters'
import { ITEM_TEMPLATES } from '@/shared/data/itemTemplates'
import type { ItemTemplate } from '@/shared/data/itemTypes'
import type { CoopCampState, CoopRoleId } from '@/shared/types/coop'

type EquippedEntry = { templateId: string; quantity: number }

function createEmptyEquipmentState() {
  const equipment: Record<string, EquippedEntry | null> = {}
  for (const slot of COOP_EQUIPMENT_SLOTS) equipment[slot.id] = null
  return equipment
}

function chooseDefaultSlot(template: ItemTemplate, equipment: Record<string, EquippedEntry | null>): string | null {
  const tags = template.tags ?? []

  if (template.kind === 'backpack' && !equipment.backpack) return 'backpack'
  if (template.kind === 'rig' && !equipment.rig) return 'rig'

  if (template.kind === 'armor') {
    if (tags.includes('head') && !equipment.head) return 'head'
    if (tags.includes('vest') && !equipment.body) return 'body'
  }

  if (template.kind === 'weapon') {
    if (!equipment.primary) return 'primary'
    if (!equipment.secondary) return 'secondary'
  }

  return null
}

function initLocalState(role: CoopRoleId): CoopLocalInventoryState {
  const bag: Record<string, number> = {}
  const equipment = createEmptyEquipmentState()
  const character = COOP_CHARACTERS.find((c) => c.id === role)
  const loadout = character?.loadout ?? []

  for (const entry of loadout) {
    const qty = typeof entry.qty === 'number' && Number.isFinite(entry.qty) ? entry.qty : 1
    if (qty <= 0) continue

    if (entry.inBackpack) {
      bag[entry.itemId] = (bag[entry.itemId] ?? 0) + qty
      continue
    }

    const template = ITEM_TEMPLATES[entry.itemId]
    const slotId = template ? chooseDefaultSlot(template, equipment) : null

    if (slotId && !equipment[slotId]) {
      equipment[slotId] = { templateId: entry.itemId, quantity: qty }
      continue
    }

    bag[entry.itemId] = (bag[entry.itemId] ?? 0) + qty
  }

  return { bag, equipment }
}

function slotAccepts(accepts: string[], template: ItemTemplate): boolean {
  if (accepts.includes('any')) return true
  if (accepts.includes(template.kind)) return true
  const tags = template.tags ?? []
  return accepts.some((a) => tags.includes(a))
}

export interface CoopInventoryViewProps {
  controlledRole: CoopRoleId
  camp: CoopCampState | null
  withdrawCampItem: (templateId: string, quantity?: number) => Promise<void>
  contributeItem: (templateId: string, quantity: number) => Promise<void>
}

export function CoopInventoryView({ controlledRole, camp, withdrawCampItem, contributeItem }: CoopInventoryViewProps) {
  const templates = ITEM_TEMPLATES

  const [localByRole, setLocalByRole] = useState<Record<string, CoopLocalInventoryState>>(() => ({
    [controlledRole]: initLocalState(controlledRole),
  }))

  useEffect(() => {
    setLocalByRole((prev) => {
      if (prev[controlledRole]) return prev
      return { ...prev, [controlledRole]: initLocalState(controlledRole) }
    })
  }, [controlledRole])

  const local = localByRole[controlledRole] ?? initLocalState(controlledRole)

  const setLocal = (updater: (state: CoopLocalInventoryState) => CoopLocalInventoryState) => {
    setLocalByRole((prev) => {
      const current = prev[controlledRole] ?? initLocalState(controlledRole)
      const next = updater(current)
      return { ...prev, [controlledRole]: next }
    })
  }

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    })
  )

  const [activeDrag, setActiveDrag] = useState<{ item: any; template: ItemTemplate } | null>(null)

  const handleDragStart = (event: DragStartEvent) => {
    const item = event.active.data.current?.item as any | undefined
    const template = event.active.data.current?.template as ItemTemplate | undefined
    if (!item || !template) return
    setActiveDrag({ item, template })
  }

  const handleDragCancel = () => {
    setActiveDrag(null)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveDrag(null)
    if (!over) return

    const activeItem = active.data.current?.item as { templateId: string; quantity: number; containerId: string } | undefined
    const activeTemplate = active.data.current?.template as ItemTemplate | undefined
    if (!activeItem || !activeTemplate) return

    // Drop into a grid container (bag/stash)
    if (over.data.current?.type === 'container') {
      const targetContainerId = String(over.data.current.containerId ?? '')

      if (targetContainerId === 'stash') {
        if (activeItem.containerId === 'stash') return

        const qty = Math.max(1, Math.trunc(activeItem.quantity))
        try {
          await contributeItem(activeItem.templateId, qty)
        } catch {
          return
        }

        setLocal((state) => {
          const nextBag = { ...state.bag }
          const nextEquipment = { ...state.equipment }

          if (activeItem.containerId === 'bag') {
            delete nextBag[activeItem.templateId]
          } else if (Object.prototype.hasOwnProperty.call(nextEquipment, activeItem.containerId)) {
            nextEquipment[activeItem.containerId] = null
          }

          return { ...state, bag: nextBag, equipment: nextEquipment }
        })

        return
      }

      if (targetContainerId === 'bag') {
        if (activeItem.containerId === 'bag') return

        if (activeItem.containerId === 'stash') {
          try {
            await withdrawCampItem(activeItem.templateId, 1)
          } catch {
            return
          }

          setLocal((state) => ({
            ...state,
            bag: { ...state.bag, [activeItem.templateId]: (state.bag[activeItem.templateId] ?? 0) + 1 },
          }))

          return
        }

        setLocal((state) => {
          const nextBag = { ...state.bag }
          const nextEquipment = { ...state.equipment }
          const origin = activeItem.containerId
          const equipped = nextEquipment[origin]
          if (!equipped) return state
          nextEquipment[origin] = null
          nextBag[equipped.templateId] = (nextBag[equipped.templateId] ?? 0) + equipped.quantity
          return { ...state, bag: nextBag, equipment: nextEquipment }
        })

        return
      }
    }

    // Drop into a slot
    if (over.data.current?.type === 'slot') {
      const slotId = String(over.data.current.slotId ?? '')
      const accepts = (over.data.current.accepts as string[]) ?? []
      if (!slotId) return
      if (!slotAccepts(accepts, activeTemplate)) return

      if (activeItem.containerId === slotId) return

      // From camp stash -> equip 1
      if (activeItem.containerId === 'stash') {
        try {
          await withdrawCampItem(activeItem.templateId, 1)
        } catch {
          return
        }

        setLocal((state) => {
          const nextBag = { ...state.bag }
          const nextEquipment = { ...state.equipment }
          const prev = nextEquipment[slotId]
          if (prev) nextBag[prev.templateId] = (nextBag[prev.templateId] ?? 0) + prev.quantity
          nextEquipment[slotId] = { templateId: activeItem.templateId, quantity: 1 }
          return { ...state, bag: nextBag, equipment: nextEquipment }
        })

        return
      }

      // From bag -> equip full stack
      if (activeItem.containerId === 'bag') {
        const qty = Math.max(1, Math.trunc(activeItem.quantity))
        setLocal((state) => {
          const nextBag = { ...state.bag }
          const nextEquipment = { ...state.equipment }
          const prev = nextEquipment[slotId]
          if (prev) nextBag[prev.templateId] = (nextBag[prev.templateId] ?? 0) + prev.quantity
          delete nextBag[activeItem.templateId]
          nextEquipment[slotId] = { templateId: activeItem.templateId, quantity: qty }
          return { ...state, bag: nextBag, equipment: nextEquipment }
        })

        return
      }

      // Slot -> slot swap
      setLocal((state) => {
        const originSlotId = activeItem.containerId
        if (!Object.prototype.hasOwnProperty.call(state.equipment, originSlotId)) return state
        if (!Object.prototype.hasOwnProperty.call(state.equipment, slotId)) return state
        const nextEquipment = { ...state.equipment }
        const a = nextEquipment[originSlotId]
        const b = nextEquipment[slotId]
        nextEquipment[originSlotId] = b ?? null
        nextEquipment[slotId] = a ?? null
        return { ...state, equipment: nextEquipment }
      })
    }
  }

  const character = useMemo(() => COOP_CHARACTERS.find((c) => c.id === controlledRole), [controlledRole])
  const portraitUrl = character?.portraitUrl

  const bagInventory = local.bag
  const stashInventory = camp?.inventory ?? {}

  const equippedBySlot = local.equipment

  const leftSlots = useMemo(() => COOP_EQUIPMENT_SLOTS.filter((s) => ['head', 'body'].includes(s.id)), [])
  const midSlots = useMemo(() => COOP_EQUIPMENT_SLOTS.filter((s) => ['primary', 'secondary'].includes(s.id)), [])
  const rightSlots = useMemo(() => COOP_EQUIPMENT_SLOTS.filter((s) => ['backpack', 'rig'].includes(s.id)), [])
  const pocketSlots = useMemo(() => COOP_EQUIPMENT_SLOTS.filter((s) => s.id.startsWith('pocket')), [])

  return (
    <div className="w-full text-gray-200 selection:bg-cyan-500/30">
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragCancel={handleDragCancel} onDragEnd={handleDragEnd}>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="w-40 shrink-0">
                <div className="border border-trinity-border bg-trinity-panel overflow-hidden">
                  {portraitUrl ? (
                    <img src={portraitUrl} alt="Portrait" className="w-full h-48 object-cover" draggable={false} />
                  ) : (
                    <div className="w-full h-48 bg-black/40" />
                  )}
                </div>
              </div>

              <div className="flex-1 flex flex-col gap-4">
                <div className="flex justify-between items-center shrink-0">
                  <h2 className="text-sm md:text-lg font-bold text-gray-300 tracking-wider">LOADOUT</h2>
                  <span className="text-[10px] text-gray-500 font-mono">Drag & Drop</span>
                </div>

                <div className="flex gap-4 justify-center">
                  <div className="flex flex-col gap-2">
                    {leftSlots.map((s) => (
                      <CoopEquipmentSlot key={s.id} config={s} equipped={equippedBySlot[s.id]} templates={templates} />
                    ))}
                  </div>
                  <div className="flex flex-col gap-2">
                    {midSlots.map((s) => (
                      <CoopEquipmentSlot key={s.id} config={s} equipped={equippedBySlot[s.id]} templates={templates} />
                    ))}
                  </div>
                  <div className="flex flex-col gap-2">
                    {rightSlots.map((s) => (
                      <CoopEquipmentSlot key={s.id} config={s} equipped={equippedBySlot[s.id]} templates={templates} />
                    ))}
                  </div>
                </div>

                <div className="flex gap-8 justify-center">
                  <div className="flex flex-col gap-1 mt-2">
                    <span className="text-[9px] text-gray-500 font-mono tracking-wider uppercase opacity-60 pl-1">POCKETS</span>
                    <div className="grid grid-cols-2 gap-2">
                      {pocketSlots.map((s) => (
                        <CoopEquipmentSlot key={s.id} config={s} equipped={equippedBySlot[s.id]} templates={templates} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <section className="border border-trinity-border bg-trinity-bg/30 backdrop-blur-sm p-4">
              <CoopStashGrid
                containerId="bag"
                title="BACKPACK"
                inventory={bagInventory}
                templates={templates}
                gridWidth={6}
                viewportRows={4}
                emptyText="Empty"
              />
              <div className="mt-2 text-[10px] text-gray-500 font-mono">
                Личный инвентарь хранится только локально в сессии.
              </div>
            </section>
          </div>

          <div className={clsx('w-full lg:w-[280px] shrink-0', !camp && 'opacity-60')}>
            <section className="border border-trinity-border bg-trinity-bg/30 backdrop-blur-sm p-4">
              <CoopStashGrid
                containerId="stash"
                title="CAMP STASH"
                inventory={stashInventory}
                templates={templates}
                gridWidth={6}
                viewportRows={6}
                emptyText={camp ? 'Empty' : 'No camp'}
              />
              <div className="mt-2 text-[10px] text-gray-500 font-mono">
                Перетаскивай предметы: из рюкзака в склад (взнос) и обратно (снять 1 шт).
              </div>
            </section>
          </div>
        </div>

        <DragOverlay>
          {activeDrag ? (
            <CoopInventoryItemView item={activeDrag.item} template={activeDrag.template} isGridItem isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
