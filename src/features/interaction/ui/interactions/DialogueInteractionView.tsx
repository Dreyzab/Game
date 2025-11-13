import React from 'react'
import type { DialogueInteraction } from '../../model/mapPointInteractions'

interface DialogueInteractionViewProps {
  interaction: DialogueInteraction
  onStartDialogue: (sceneId: string) => void
  onClose?: () => void
}

export const DialogueInteractionView: React.FC<DialogueInteractionViewProps> = ({
  interaction,
  onStartDialogue,
  onClose,
}) => {
  const handleStart = () => {
    onStartDialogue(interaction.sceneId)
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-white/70">{interaction.subtitle}</p>
        <p className="text-xs text-white/50 mt-1">{interaction.summary}</p>
      </div>

      {interaction.preview && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
          {interaction.preview}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          className="flex-1 rounded-lg border border-sky-400/40 bg-sky-500/20 px-4 py-2 text-xs uppercase tracking-[0.32em] text-sky-200 hover:border-sky-300/60 hover:bg-sky-500/30"
          onClick={handleStart}
        >
          Начать диалог
        </button>
        <button
          type="button"
          className="flex-1 rounded-lg border border-white/10 bg-black/40 px-4 py-2 text-xs uppercase tracking-[0.3em] text-white/60 hover:border-white/30"
          onClick={onClose}
        >
          Закрыть
        </button>
      </div>
    </div>
  )
}

export default DialogueInteractionView

