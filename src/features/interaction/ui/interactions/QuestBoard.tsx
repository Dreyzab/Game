import React from 'react'
import type { QuestBoardInteraction } from '../../model/mapPointInteractions'

interface QuestBoardProps {
  interaction: QuestBoardInteraction
  onClose?: () => void
}

export const QuestBoard: React.FC<QuestBoardProps> = ({ interaction, onClose }) => {
  return (
    <div className="p-4 bg-slate-900 text-white rounded-lg border border-slate-700">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-bold mb-1">{interaction.title}</div>
          <div className="text-sm text-slate-400">{interaction.subtitle || 'Доступные задания'}</div>
        </div>
        {onClose && (
          <button className="text-slate-400 hover:text-white text-lg" onClick={onClose}>
            ×
          </button>
        )}
      </div>
      <div className="mt-3 space-y-2">
        {(interaction.entries ?? []).map((q) => (
          <div key={q.id} className="rounded border border-slate-700/80 bg-slate-800/50 px-3 py-2">
            <div className="text-sm font-semibold">{q.title}</div>
            {q.description && <div className="text-xs text-slate-400 mt-1">{q.description}</div>}
            {q.recommendedLevel !== undefined && (
              <div className="text-[11px] text-slate-500 mt-1">Реком. уровень: {q.recommendedLevel}</div>
            )}
          </div>
        ))}
        {(!interaction.entries || interaction.entries.length === 0) && (
          <div className="text-sm text-slate-500">Скоро появятся задания.</div>
        )}
      </div>
    </div>
  )
}

export default QuestBoard
