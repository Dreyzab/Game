import type { MouseEventHandler } from 'react'
import { Cpu, Crosshair, HelpCircle, Package, Shield, Wrench } from 'lucide-react'
import type { DatapadInventoryItem } from '../../model/types'

interface InventoryItemProps {
  item: DatapadInventoryItem
  colorClass: string
  borderColorClass?: string
  isSelected?: boolean
  onClick: MouseEventHandler<HTMLButtonElement>
}

function ItemKindIcon({ kind }: { kind: DatapadInventoryItem['kind'] }) {
  switch (kind) {
    case 'consumable':
      return <Package size={32} />
    case 'weapon':
      return <Crosshair size={32} />
    case 'tool':
      return <Wrench size={32} />
    case 'armor':
    case 'clothing':
      return <Shield size={32} />
    case 'artifact':
    case 'quest':
    case 'misc':
    case 'backpack':
    case 'rig':
      return <Cpu size={32} />
    default:
      return <HelpCircle size={32} />
  }
}

export function InventoryItem({
  item,
  colorClass,
  borderColorClass = 'border-white',
  isSelected = false,
  onClick,
}: InventoryItemProps) {
  return (
    <button
      onClick={onClick}
      className={[
        'aspect-square flex flex-col items-center justify-center p-2 transition-all duration-300 group relative overflow-hidden',
        isSelected
          ? `border-2 ${borderColorClass} bg-gray-800/50 shadow-[0_0_15px_rgba(255,255,255,0.05)] scale-95 z-0`
          : 'border border-gray-800 bg-gray-900/40 hover:bg-gray-800/60 active:bg-gray-700/60 opacity-80 hover:opacity-100',
      ].join(' ')}
    >
      <div
        className={[
          'transition-colors duration-300',
          colorClass,
          isSelected ? '' : 'opacity-60 group-hover:opacity-100',
        ].join(' ')}
      >
        <ItemKindIcon kind={item.kind} />
      </div>

      <span
        className={[
          'text-[10px] mt-2 font-bold tracking-tighter uppercase truncate w-full text-center',
          isSelected ? 'text-white' : 'text-gray-400',
        ].join(' ')}
        title={item.name}
      >
        {item.name}
      </span>

      {item.quantity > 1 && (
        <span className="absolute top-1 right-1 text-[10px] px-1.5 py-0.5 rounded border border-gray-600 bg-black/60 text-gray-200">
          x{item.quantity}
        </span>
      )}

      {!isSelected && (
        <>
          <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-gray-600" />
          <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-gray-600" />
        </>
      )}
    </button>
  )
}
