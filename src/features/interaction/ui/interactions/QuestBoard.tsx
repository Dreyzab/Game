import React from 'react'
import type { QuestBoardInteraction, QuestBoardEntry } from '../../model/mapPointInteractions'

interface QuestBoardProps {
  interaction: QuestBoardInteraction
  onClose?: () => void
}

const QuestCard: React.FC<{ entry: QuestBoardEntry }> = ({ entry }) => (
  <div className="rounded-2xl border border-white/15 bg-white/5 p-4 space-y-2">
    <div className="flex items-center justify-between">
      <h4 className="text-sm font-semibold text-white">{entry.title}</h4>
      {typeof entry.recommendedLevel === 'number' && (
        <span className="text-xs text-white/60">Ур. {entry.recommendedLevel}</span>
      )}
    </div>
    {entry.description && <p className="text-xs text-white/55">{entry.description}</p>}
    <div className="flex justify-end">
      <button
        type="button"
        className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs uppercase tracking-[0.28em] text-white/70 hover:border-white/25 hover:bg-white/15"
        onClick={() =>
          console.log('🗒️ Принятие квеста из доски', { questId: entry.id, title: entry.title })
        }
      >
        Принять
      </button>
    </div>
  </div>
)

export const QuestBoard: React.FC<QuestBoardProps> = ({ interaction, onClose }) => (
  <div className="space-y-4">
    <div>
      <p className="text-sm text-white/70">{interaction.subtitle}</p>
      <p className="text-xs text-white/50 mt-1">{interaction.summary}</p>
    </div>

    <div className="flex flex-col gap-3">
      {interaction.entries.map((entry) => (
        <QuestCard key={entry.id} entry={entry} />
      ))}
    </div>

    <button
      type="button"
      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs uppercase tracking-[0.3em] text-white/60 hover:border-white/30"
      onClick={onClose}
    >
      Закрыть
    </button>
  </div>
)

export default QuestBoard

