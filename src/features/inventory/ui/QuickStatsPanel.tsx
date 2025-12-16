import React from 'react'
import type { PlayerStatsSummary } from '@/entities/inventory/model/helpers'
import type { EncumbranceState } from '@/entities/item/model/types'

type QuickStatsPanelProps = {
  stats: PlayerStatsSummary
  encumbrance: EncumbranceState
}

export const QuickStatsPanel: React.FC<QuickStatsPanelProps> = ({ stats, encumbrance }) => {
  return (
    <div className="glass-panel flex items-center justify-between gap-4 p-3 text-xs text-[color:var(--color-text-secondary)]">
      <div>
        <div className="uppercase tracking-[0.3em] text-slate-500">Damage</div>
        <div className="text-sm font-semibold text-[color:var(--color-text-primary)]">{stats.totalDamage}</div>
      </div>
      <div>
        <div className="uppercase tracking-[0.3em] text-slate-500">Defense</div>
        <div className="text-sm font-semibold text-[color:var(--color-text-primary)]">{stats.totalDefense}</div>
      </div>
      <div>
        <div className="uppercase tracking-[0.3em] text-slate-500">Weight</div>
        <div className="text-sm font-semibold text-[color:var(--color-text-primary)]">
          {encumbrance.currentWeight}/{encumbrance.maxWeight} kg
        </div>
      </div>
    </div>
  )
}

export default QuickStatsPanel
