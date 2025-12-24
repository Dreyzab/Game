import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { MapPointInteraction } from '../model/mapPointInteractions'
import { TradeWindow } from './interactions/TradeWindow'
import { UpgradeStation } from './interactions/UpgradeStation'
import { TrainingModal } from './interactions/TrainingModal'
import { DialogueInteractionView } from './interactions/DialogueInteractionView'
import { QuestBoard } from './interactions/QuestBoard'

interface MapPointInteractionModalProps {
  interaction: MapPointInteraction | null
  onClose: () => void
  onStartDialogue: (sceneId: string) => void
}

export const MapPointInteractionModal: React.FC<MapPointInteractionModalProps> = ({
  interaction,
  onClose,
  onStartDialogue,
}) => {
  return (
    <AnimatePresence>
      {interaction && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-3xl rounded-3xl border border-white/10 bg-slate-950/90 p-6 shadow-[0_35px_80px_rgba(0,0,0,0.65)] backdrop-blur-xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <button
              type="button"
              className="absolute right-4 top-4 rounded-full border border-white/15 bg-white/10 px-2 py-1 text-sm text-white/60 hover:border-white/30 hover:text-white"
              onClick={onClose}
            >
              ×
            </button>

            <div className="space-y-2 pr-6">
              <p className="text-xs uppercase tracking-[0.38em] text-white/40">Взаимодействие</p>
              <h2 className="text-2xl font-semibold text-white">{interaction.title}</h2>
              {interaction.subtitle && (
                <p className="text-sm text-white/60">{interaction.subtitle}</p>
              )}
            </div>

            <div className="mt-4">
              {interaction.type === 'trade' && (
                <TradeWindow interaction={interaction} onClose={onClose} />
              )}
              {interaction.type === 'upgrade' && (
                <UpgradeStation interaction={interaction} onClose={onClose} />
              )}
              {interaction.type === 'training' && (
                <TrainingModal interaction={interaction} onClose={onClose} />
              )}
              {interaction.type === 'dialogue' && (
                <DialogueInteractionView
                  interaction={interaction}
                  onStartDialogue={onStartDialogue}
                  onClose={onClose}
                />
              )}
              {interaction.type === 'quests' && (
                <QuestBoard interaction={interaction} onClose={onClose} />
              )}
              {interaction.type === 'storage' && (
                <div className="flex flex-col items-center justify-center py-12 space-y-6">
                  <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-4xl shadow-inner">
                    📦
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-white/60 max-w-sm">
                      Вы можете получить доступ к своему глобальному хранилищу из этой точки.
                      Предметы в хранилище защищены от потери при смерти.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      window.location.hash = '/inventory'
                      onClose()
                    }}
                    className="px-8 py-3 bg-white text-slate-950 rounded-xl font-bold hover:bg-white/90 transition-all transform hover:scale-105 active:scale-95 shadow-[0_10px_20px_rgba(255,255,255,0.1)]"
                  >
                    ОТКРЫТЬ ХРАНИЛИЩЕ
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default MapPointInteractionModal

