import React from 'react'
import { cn } from '@/shared/lib/utils/cn'

export interface ExpeditionFeedbackProps {
  turnCount: number
  maxTurns: number
  researchPoints: number
  lastEventSummary?: string
  className?: string
}

export const ExpeditionFeedback: React.FC<ExpeditionFeedbackProps> = ({
  turnCount,
  maxTurns,
  researchPoints,
  lastEventSummary,
  className,
}) => {
  const safeMaxTurns = Number.isFinite(maxTurns) && maxTurns > 0 ? Math.floor(maxTurns) : 0
  const safeTurnCount = Number.isFinite(turnCount) ? Math.max(0, Math.floor(turnCount)) : 0
  const safeRp = Number.isFinite(researchPoints) ? Math.max(0, Math.floor(researchPoints)) : 0

  const turnsLeft = safeMaxTurns > 0 ? Math.max(0, safeMaxTurns - safeTurnCount) : 0
  const pct = safeMaxTurns > 0 ? Math.max(0, Math.min(100, Math.round((safeTurnCount / safeMaxTurns) * 100))) : 0

  return (
    <div className={cn('px-3 py-2 rounded-lg bg-black/40 border border-white/10 backdrop-blur-md w-[280px]', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-[10px] uppercase tracking-widest text-slate-400">
          Expedition
        </div>
        <div className="text-xs font-mono text-slate-200">
          RP {safeRp}
        </div>
      </div>
      <div className="mt-2 h-2 rounded bg-white/10 overflow-hidden">
        <div className="h-full bg-amber-500/70 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 uppercase tracking-wider">
        <span>Event in</span>
        <span className="font-mono text-slate-200">{turnsLeft}</span>
      </div>
      {lastEventSummary && (
        <div className="mt-2 text-[10px] text-slate-300 leading-snug">
          {lastEventSummary}
        </div>
      )}
    </div>
  )
}
