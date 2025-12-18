import { useDroppable } from '@dnd-kit/core'
import { clsx } from 'clsx'
import type { ReactElement } from 'react'
import { CELL_SIZE } from '../../model/constants'
import { useTrinityInventoryStore } from '../../model/store'
import InventoryItem from './InventoryItem'

interface Props {
  containerId: string
  className?: string
  title?: string
}

export function GridContainer({ containerId, className, title }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: `container-${containerId}`,
    data: { type: 'container', containerId },
  })

  const { getContainerItems, containers, templates } = useTrinityInventoryStore()
  const items = getContainerItems(containerId)
  const dimensions = containers[containerId]

  if (!dimensions) return null

  const widthPx = dimensions.width * CELL_SIZE
  const heightPx = dimensions.height * CELL_SIZE

  const totalSlots = dimensions.width * dimensions.height
  const usedSlots = items.reduce((acc, item) => {
    const template = templates[item.templateId]
    return acc + (template ? template.width * template.height : 0)
  }, 0)

  const cells: ReactElement[] = []
  for (let y = 0; y < dimensions.height; y++) {
    for (let x = 0; x < dimensions.width; x++) {
      cells.push(
        <div
          key={`${x}-${y}`}
          className="border-r border-b border-trinity-border/20 box-border pointer-events-none"
          style={{ width: CELL_SIZE, height: CELL_SIZE }}
        />
      )
    }
  }

  return (
    <div className={clsx('flex flex-col gap-2', className)}>
      {title && (
        <div className="flex justify-between items-end border-b border-trinity-border pb-1 mb-1">
          <h3 className="text-trinity-accent font-bold tracking-widest text-sm uppercase">{title}</h3>
          <span className="text-[10px] text-gray-500 font-mono">
            {usedSlots}/{totalSlots} SLOTS
          </span>
        </div>
      )}

      <div
        ref={setNodeRef}
        className={clsx(
          'relative bg-trinity-panel border transition-colors',
          isOver ? 'border-trinity-accent shadow-[0_0_15px_rgba(14,165,233,0.1)]' : 'border-trinity-border'
        )}
        style={{
          width: widthPx,
          height: heightPx,
          backgroundImage: 'radial-gradient(circle at 50% 50%, #1e293b 1px, transparent 1px)',
          backgroundSize: `${CELL_SIZE}px ${CELL_SIZE}px`,
        }}
      >
        <div className="absolute inset-0 flex flex-wrap pointer-events-none opacity-30">{cells}</div>

        {items.map((item) => (
          <InventoryItem key={item.instanceId} item={item} template={templates[item.templateId]} />
        ))}
      </div>
    </div>
  )
}
