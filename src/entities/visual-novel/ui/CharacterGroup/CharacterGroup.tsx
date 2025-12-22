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
  if (!characters || characters.length === 0) return null

  return (
    <div className="flex justify-center gap-4 mt-8 px-4 w-full max-w-5xl mx-auto overflow-x-auto pb-4">
      {characters.map((character) => {
        const isActive = character.id === activeCharacterId

        return (
          <div
            key={character.id}
            className={cn(
              'flex flex-col items-center min-w-[140px] transition-all duration-500',
              isActive ? 'opacity-100 scale-105' : 'opacity-60 scale-95'
            )}
          >
            <div
              className={cn(
                'w-full p-3 rounded-lg border backdrop-blur-md flex flex-col items-center text-center',
                isActive
                  ? 'bg-white/10 border-white/30 shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                  : 'bg-black/20 border-white/10'
              )}
            >
              <span
                className="text-xs font-cinzel tracking-[0.2em] font-bold"
                style={{ color: character.color }}
              >
                {character.name.toUpperCase()}
              </span>
              {character.title && (
                <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider leading-none">
                  {character.title}
                </span>
              )}
            </div>

            {character.tagline && isActive && (
              <span className="text-[9px] text-slate-500 mt-2 italic font-medium tracking-tight animate-fade-in">
                {character.tagline}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}

