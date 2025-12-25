import React from 'react'
import { cn } from '@/shared/lib/utils/cn'
import type { VisualNovelChoiceView } from '@/shared/types/visualNovel'
import type { VoiceId } from '@/shared/types/parliament'

export interface ChoicePanelProps {
  choices: VisualNovelChoiceView[]
  onSelect: (choiceId: string) => void
  skills?: Partial<Record<VoiceId, number>> | Record<string, number>
}

export const ChoicePanel: React.FC<ChoicePanelProps> = ({
  choices,
  onSelect,
  skills = {},
}) => {
  if (!choices || choices.length === 0) return null

  const readSkill = (skill: VoiceId) =>
    (skills as Partial<Record<VoiceId, number>>)[skill] ?? 0

  return (
    <div className="flex flex-col gap-2 sm:gap-3 w-full max-w-4xl mx-auto px-4 sm:px-6 mb-6 sm:mb-12 animate-slide-up">
      {choices.map((choice) => {
        const check = choice.requirements?.skillCheck
        const skillLevel = check ? readSkill(check.skill) : 0
        const isSkillLocked = Boolean(check && skillLevel < check.difficulty)
        const isLocked = Boolean(choice.disabled || isSkillLocked)
        const lockReason =
          choice.lockReason ??
          (isSkillLocked && check
            ? check.label ?? `Requires ${check.skill.toUpperCase()} ${check.difficulty}+`
            : undefined)
        const isVisited = choice.isVisited

        return (
          <button
            key={choice.id}
            disabled={isLocked}
            onClick={() => onSelect(choice.id)}
            className={cn(
              'relative group flex flex-col p-3 sm:p-4 rounded-xl text-left border transition-all duration-300',
              isLocked && !isVisited
                ? 'bg-slate-900/40 border-slate-800 cursor-not-allowed opacity-60'
                : isVisited
                ? 'bg-emerald-950/20 border-emerald-500/30 opacity-80 cursor-not-allowed'
                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/30 hover:-translate-y-0.5 active:translate-y-0'
            )}
          >
            <div className="flex justify-between items-center w-full">
              <span
                className={cn(
                  'font-cinzel text-xs sm:text-sm tracking-widest font-bold',
                  isLocked && !isVisited ? 'text-slate-500' : isVisited ? 'text-emerald-200/60' : 'text-white'
                )}
              >
                {choice.label} {isVisited && '✓'}
              </span>
              <span
                className={cn(
                  'text-[10px] uppercase tracking-tighter font-bold',
                  isLocked && !isVisited
                    ? 'text-red-500/60'
                    : isVisited
                    ? 'text-emerald-500/40'
                    : 'text-slate-500 group-hover:text-white/80'
                )}
              >
                {isLocked && !isVisited ? 'Заблокировано' : isVisited ? 'Посещено' : ''}
              </span>
            </div>

            {choice.description && (
              <p className="text-[10px] sm:text-[11px] text-slate-400 mt-1 leading-normal font-medium max-w-[90%]">
                {choice.description}
              </p>
            )}

            {check && (
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <div
                  className={cn(
                    'text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border',
                    isSkillLocked
                      ? 'border-red-900/30 text-red-500/70'
                      : 'border-blue-900/30 text-blue-400'
                  )}
                >
                  Check: {check.skill.toUpperCase()} &gt;= {check.difficulty}
                </div>
                <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  Level: {skillLevel}
                </div>
              </div>
            )}

            {lockReason && isLocked && (
              <p className="text-[9px] text-red-400 italic mt-2">{lockReason}</p>
            )}
          </button>
        )
      })}
    </div>
  )
}

