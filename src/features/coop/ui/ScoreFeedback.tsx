import React from 'react'
import { cn } from '@/shared/lib/utils/cn'

export interface ScoreFeedbackProps {
  questId: string
  current: number
  target: number
  className?: string
}

export const ScoreFeedback: React.FC<ScoreFeedbackProps> = ({
  questId,
  current,
  target,
  className,
}) => {
  const safeTarget = Number.isFinite(target) && target > 0 ? target : 0
  const safeCurrent = Number.isFinite(current) ? current : 0
  const pct = safeTarget > 0 ? Math.max(0, Math.min(100, Math.round((safeCurrent / safeTarget) * 100))) : 0

  return (
    <div className={cn('px-3 py-2 rounded-lg bg-black/40 border border-white/10 backdrop-blur-md w-[280px]', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-[10px] uppercase tracking-widest text-slate-400">
          Contribution Score
        </div>
        <div className="text-xs font-mono text-slate-200">
          {Math.round(safeCurrent)} / {Math.round(safeTarget)}
        </div>
      </div>
      <div className="mt-2 h-2 rounded bg-white/10 overflow-hidden">
        <div className="h-full bg-emerald-500/70 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1 text-[10px] text-slate-400 uppercase tracking-wider truncate">
        Side Quest: {questId}
      </div>
    </div>
  )
}

