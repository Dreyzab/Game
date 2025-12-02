import React from 'react'
import clsx from 'clsx'
import type { EncumbranceState } from '@/entities/item/model/types'

type EncumbrancePanelProps = {
  encumbrance: EncumbranceState
}

const levelColor: Record<EncumbranceState['level'], string> = {
  light: 'text-emerald-300',
  normal: 'text-sky-300',
  strained: 'text-amber-300',
  overloaded: 'text-orange-300',
  immobile: 'text-rose-400',
}

const barColor: Record<EncumbranceState['level'], string> = {
  light: 'from-emerald-500 to-emerald-400',
  normal: 'from-sky-500 to-sky-400',
  strained: 'from-amber-500 to-amber-400',
  overloaded: 'from-orange-500 to-orange-400',
  immobile: 'from-rose-500 to-rose-400',
}

export const EncumbrancePanel: React.FC<EncumbrancePanelProps> = ({ encumbrance }) => {
  const safeMax =
    Number.isFinite(encumbrance.maxWeight) && encumbrance.maxWeight > 0
      ? encumbrance.maxWeight
      : 0
  const rawRatio =
    safeMax > 0 ? encumbrance.currentWeight / safeMax : 0
  const ratio = Math.min(1, Math.max(0, rawRatio))
  const barWidth = `${Math.round(ratio * 100)}%`

  return (
    <div className="glass-panel space-y-3 p-4">
      <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
        <span>Encumbrance</span>
        <span className={clsx('font-semibold', levelColor[encumbrance.level])}>{encumbrance.level}</span>
      </div>
      <div className="relative h-4 overflow-hidden rounded bg-slate-800/90">
        <div
          className={clsx('absolute inset-y-0 left-0 rounded-r bg-linear-to-r', barColor[encumbrance.level])}
          style={{ width: barWidth }}
        />
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-(--color-text-secondary)">
          {encumbrance.currentWeight}/{encumbrance.maxWeight} kg
        </span>
        <span className="text-xs text-slate-500">Speed -{Math.round(encumbrance.speedPenalty * 100)}%</span>
      </div>
    </div>
  )
}

export default EncumbrancePanel
