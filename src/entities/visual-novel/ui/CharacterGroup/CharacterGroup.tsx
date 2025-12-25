import React from 'react'
import { cn } from '@/shared/lib/utils/cn'
import type { VisualNovelCharacter } from '@/shared/types/visualNovel'

export interface CharacterGroupProps {
  characters: VisualNovelCharacter[]
  activeCharacterId?: string
}

export const CharacterGroup: React.FC<CharacterGroupProps> = ({
  characters,
  activeCharacterId,
}) => {
  const activeCharacter = characters.find(c => c.id === activeCharacterId)
  if (!activeCharacter) return null

  return (
    <div className="flex justify-center mt-4 sm:mt-8 px-4 w-full max-w-5xl mx-auto animate-fade-in">
      <div className="flex flex-col items-center min-w-[140px] transition-all duration-500">
        <div
          className="bg-slate-900/70 border border-slate-200/20 shadow-[0_0_20px_rgba(0,0,0,0.35)] p-3 rounded-lg backdrop-blur-md flex flex-col items-center text-center"
        >
          <span
            className="text-xs sm:text-sm font-cinzel tracking-[0.2em] font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]"
            style={{ color: activeCharacter.color }}
          >
            {activeCharacter.name.toUpperCase()}
          </span>
          {activeCharacter.title && (
            <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider leading-none">
              {activeCharacter.title}
            </span>
          )}
        </div>

        {activeCharacter.tagline && (
          <span className="text-[9px] text-slate-500 mt-2 italic font-medium tracking-tight">
            {activeCharacter.tagline}
          </span>
        )}
      </div>
    </div>
  )
}

