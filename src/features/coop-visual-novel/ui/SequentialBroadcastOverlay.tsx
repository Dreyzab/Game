import React from 'react'
import { motion } from 'framer-motion'
import type { SequentialBroadcastState } from '@/shared/types/coop'

export type SequentialReaction = SequentialBroadcastState['reactions'][number]

export interface SequentialBroadcastOverlayProps {
  isNarrationDone: boolean
  isMyTurn: boolean
  sequentialBroadcast: SequentialBroadcastState | null
  participants: Array<{ id: number; name: string }>
  ephemeralReaction: SequentialReaction | null
  onContinue: () => void
}

export const SequentialBroadcastOverlay: React.FC<SequentialBroadcastOverlayProps> = ({
  isNarrationDone,
  isMyTurn,
  sequentialBroadcast,
  participants,
  ephemeralReaction,
  onContinue,
}) => {
  return (
    <>
      {!isMyTurn && isNarrationDone && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-40">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="px-6 py-3 rounded-xl bg-black/60 border border-cyan-500/30 backdrop-blur-md text-center max-w-md flex flex-col items-center gap-2"
          >
            {sequentialBroadcast?.activePlayerId ? (
              <>
                <div className="text-cyan-400 text-sm font-medium">
                  Ожидаем выбора:{' '}
                  {participants.find((p) => p.id === sequentialBroadcast.activePlayerId)?.name ??
                    'Player ' + sequentialBroadcast.activePlayerId}
                </div>
                <div className="text-xs text-slate-400">
                  Ход передается последовательно. Ваш черед скоро наступит.
                </div>
              </>
            ) : (
              <>
                <div className="text-emerald-400 text-sm font-medium">Брифинг завершен</div>
                <div className="text-xs text-slate-400 mb-2">Группа готова выдвигаться.</div>
                <button
                  onClick={onContinue}
                  className="px-4 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/40 border border-emerald-500/50 rounded text-xs font-bold text-emerald-300 transition-colors uppercase tracking-wider"
                >
                  Продолжить
                </button>
              </>
            )}
          </motion.div>
        </div>
      )}

      {ephemeralReaction && (
        <div
          key={ephemeralReaction.timestamp}
          className="absolute inset-0 z-60 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm pointer-events-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="max-w-2xl w-full bg-slate-900/90 border border-white/20 rounded-2xl p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-cyan-500 to-transparent opacity-50" />
            <div className="text-center mb-6">
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-400 mb-2">
                {ephemeralReaction.playerRole ? ephemeralReaction.playerRole.toUpperCase() : 'PLAYER'} ACTION
              </div>
              <div className="text-xl font-cinzel text-white">{ephemeralReaction.playerName}</div>
            </div>

            <div className="mb-6 p-4 rounded-lg bg-white/5 border border-white/10 text-center italic text-slate-300">
              "{ephemeralReaction.choiceText}"
            </div>

            <div className="text-base leading-relaxed text-slate-200 text-center whitespace-pre-wrap">
              {ephemeralReaction.effectText}
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}
