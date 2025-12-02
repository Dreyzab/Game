import React from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/shared/api/convex'
import { useDeviceId } from '@/shared/hooks/useDeviceId'
import type { QuestBoardInteraction } from '../../model/mapPointInteractions'
import { Loader2 } from 'lucide-react'

interface QuestBoardProps {
  interaction: QuestBoardInteraction
  onClose?: () => void
}

const QuestCard: React.FC<{
  entry: { id: string; title: string; description: string; recommendedLevel?: number };
  onAccept: (questId: string) => void;
  isAccepting: boolean;
}> = ({ entry, onAccept, isAccepting }) => (
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
        disabled={isAccepting}
        className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs uppercase tracking-[0.28em] text-white/70 hover:border-white/25 hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        onClick={() => onAccept(entry.id)}
      >
        {isAccepting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Принять'}
      </button>
    </div>
  </div>
)

export const QuestBoard: React.FC<QuestBoardProps> = ({ interaction, onClose }) => {
  const { deviceId } = useDeviceId()

  // Fetch real available quests for this point
  const availableQuests = useQuery(api.quests.getAvailable, {
    deviceId,
    pointId: interaction.pointId
  })

  const startQuest = useMutation(api.quests.start)
  const [acceptingId, setAcceptingId] = React.useState<string | null>(null)

  const handleAccept = async (questId: string) => {
    if (!deviceId) return
    try {
      setAcceptingId(questId)
      await startQuest({ deviceId, questId })
      // Quest will disappear from list automatically due to reactivity
    } catch (error) {
      console.error('Failed to start quest:', error)
    } finally {
      setAcceptingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-white/70">{interaction.subtitle}</p>
        <p className="text-xs text-white/50 mt-1">{interaction.summary}</p>
      </div>

      <div className="flex flex-col gap-3 min-h-[100px]">
        {availableQuests === undefined ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin text-white/30" />
          </div>
        ) : availableQuests.length === 0 ? (
          <div className="text-center py-4 text-white/40 text-sm">
            Нет доступных заданий
          </div>
        ) : (
          availableQuests.map((entry: { id: string; title: string; description: string; recommendedLevel?: number }) => (
            <QuestCard
              key={entry.id}
              entry={entry}
              onAccept={handleAccept}
              isAccepting={acceptingId === entry.id}
            />
          ))
        )}
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
}

export default QuestBoard

