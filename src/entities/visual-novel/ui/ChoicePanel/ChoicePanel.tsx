import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { cn } from '@/shared/lib/utils/cn'
import type { VisualNovelChoiceView } from '@/shared/types/visualNovel'

export interface ChoicePanelProps {
  choices: VisualNovelChoiceView[]
  onSelect: (choiceId: string) => void
}

export const ChoicePanel: React.FC<ChoicePanelProps> = ({ choices, onSelect }) => {
  if (!choices || choices.length === 0) {
    return null
  }

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key="choice-panel"
        className="flex flex-col gap-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
      >
        {choices.map((choice, index) => (
          <motion.button
            key={choice.id}
            layout
            className={cn(
              'group flex w-full flex-col gap-1 rounded-2xl border px-4 py-3 text-left transition duration-200',
              choice.disabled
                ? 'cursor-not-allowed border-white/10 bg-white/5 text-white/40'
                : 'border-white/20 bg-white/10 text-white hover:border-white/40 hover:bg-white/20'
            )}
            style={{ '--choice-index': index } as React.CSSProperties}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
            disabled={choice.disabled}
            onClick={() => onSelect(choice.id)}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.25em]">
                {choice.label}
              </p>
              {!choice.disabled && (
                <span className="text-[10px] uppercase tracking-[0.35em] text-white/60">
                  Выбор
                </span>
              )}
            </div>
            {choice.description && (
              <p className="text-sm text-white/80">{choice.description}</p>
            )}
            {choice.lockReason && (
              <p className="text-xs text-red-200">{choice.lockReason}</p>
            )}
          </motion.button>
        ))}
      </motion.div>
    </AnimatePresence>
  )
}
