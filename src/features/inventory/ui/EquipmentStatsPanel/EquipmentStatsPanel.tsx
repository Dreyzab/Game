import React from 'react'
import type { ActiveMastery, PlayerStatsSummary } from '@/features/inventory/model/helpers'

type EquipmentStatsPanelProps = {
  stats: PlayerStatsSummary
  masteryCards: ActiveMastery[]
}

export const EquipmentStatsPanel: React.FC<EquipmentStatsPanelProps> = ({ stats, masteryCards }) => {
  return (
    <div className="glass-panel space-y-4 p-4">
      <div className="text-xs uppercase tracking-[0.3em] text-slate-400">Equipment Impact</div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg border border-slate-700/80 px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Damage</div>
          <div className="text-lg font-semibold text-(--color-text-primary)">{stats.totalDamage}</div>
        </div>
        <div className="rounded-lg border border-slate-700/80 px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Defense</div>
          <div className="text-lg font-semibold text-(--color-text-primary)">{stats.totalDefense}</div>
        </div>
        <div className="rounded-lg border border-slate-700/80 px-3 py-2">
          <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Weight</div>
          <div className="text-lg font-semibold text-(--color-text-primary)">{stats.totalWeight} kg</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500">Mastery Cards</div>
        {masteryCards.length === 0 ? (
          <p className="text-sm text-slate-500">Equip mastery-ready items to unlock combat cards.</p>
        ) : (
          <div className="space-y-3">
            {masteryCards.map((entry) => (
              <div key={entry.itemId} className="rounded-lg border border-slate-700/80 p-3">
                <div className="text-sm font-semibold text-(--color-text-primary)">{entry.itemName}</div>
                <ul className="mt-2 space-y-1 text-sm text-(--color-text-secondary)">
                  {entry.cards.map((card) => (
                    <li key={card.id}>
                      <span className="font-semibold text-amber-300">{card.name}</span> — {card.description}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default EquipmentStatsPanel
