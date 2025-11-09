import React from 'react'
import { motion } from 'framer-motion'
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
  if (!characters || characters.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-3">
      {characters.map((character) => {
        const isActive = character.id === activeCharacterId
        return (
          <motion.div
            key={character.id}
            layout
            className={cn(
              'min-w-[160px] flex-1 rounded-2xl border px-4 py-3 backdrop-blur',
              isActive
                ? 'border-white/70 bg-white/15 shadow-lg'
                : 'border-white/10 bg-white/5'
            )}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p
              className="text-xs uppercase tracking-[0.35em] text-white/60"
              style={{ color: character.color }}
            >
              {character.name}
            </p>
            {character.title && (
              <p className="text-xs text-white/60">{character.title}</p>
            )}
            {character.tagline && (
              <p className="text-[11px] text-white/70">{character.tagline}</p>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
