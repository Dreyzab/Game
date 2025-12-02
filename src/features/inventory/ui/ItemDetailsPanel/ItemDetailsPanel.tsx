import React from 'react'
import clsx from 'clsx'
import type { ItemState } from '@/entities/item/model/types'

type ItemDetailsPanelProps = {
  item: ItemState | null
  isQuestItem?: boolean
  onEquip?: (item: ItemState) => void
  onUnequip?: (item: ItemState) => void
}

const StatBadge: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
  <div className="rounded-md border border-slate-700/80 px-3 py-2 text-center">
    <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">{label}</div>
    <div className="text-sm font-semibold text-[color:var(--color-text-primary)]">{value}</div>
  </div>
)

const PlaceholderPanel = () => (
  <div className="glass-panel p-4 text-center text-sm text-slate-500">
    Select an item in the grid to inspect stats, condition and possible actions.
  </div>
)

const rarityStyles: Record<string, string> = {
  common: 'text-slate-400',
  uncommon: 'text-emerald-300',
  rare: 'text-sky-300',
  epic: 'text-violet-300',
  legendary: 'text-amber-300',
}

export const ItemDetailsPanel: React.FC<ItemDetailsPanelProps> = ({ item, isQuestItem, onEquip, onUnequip }) => {
  if (!item) return <PlaceholderPanel />

  const stats = [
    { label: 'DMG', value: item.stats.damage },
    { label: 'DEF', value: item.stats.defense },
    { label: 'WT', value: item.stats.weight },
    { label: 'SIZE', value: `${item.stats.width}×${item.stats.height}` },
    { label: 'COND', value: item.condition ? `${item.condition}%` : undefined },
  ].filter((stat) => stat.value !== undefined)

  return (
    <div className="glass-panel space-y-4 p-4">
      <div className="flex items-start gap-3">
        <div className="text-3xl">{item.icon}</div>
        <div>
          <div className="text-lg font-semibold text-[color:var(--color-text-primary)]">{item.name}</div>
          <div className={clsx('text-xs uppercase tracking-[0.3em]', rarityStyles[item.rarity] ?? 'text-slate-400')}>
            {item.rarity}
          </div>
          {isQuestItem ? (
            <div className="mt-1 inline-flex items-center rounded-full border border-amber-500/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-amber-200">
              Quest Item
            </div>
          ) : null}
        </div>
      </div>

      <p className="text-sm text-[color:var(--color-text-secondary)]">{item.description}</p>

      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-2 text-sm md:grid-cols-3">
          {stats.map((stat) => (
            <StatBadge key={stat.label} label={stat.label} value={stat.value!} />
          ))}
        </div>
      )}

      {item.tags && item.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs text-slate-400">
          {item.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-slate-700 px-3 py-1">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => {
            if (item.isEquipped) {
              onUnequip?.(item)
            } else {
              onEquip?.(item)
            }
          }}
          className={clsx(
            "rounded-md border px-4 py-2 text-sm font-semibold transition",
            item.isEquipped
              ? "border-red-500/70 text-red-200 hover:bg-red-500/10"
              : "border-amber-500/70 text-amber-200 hover:bg-amber-500/10"
          )}
        >
          {item.isEquipped ? 'Unequip' : 'Equip'}
        </button>
        <button
          type="button"
          className="rounded-md border border-slate-600 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-slate-800/80"
        >
          Inspect
        </button>
      </div>
    </div>
  )
}

export default ItemDetailsPanel
