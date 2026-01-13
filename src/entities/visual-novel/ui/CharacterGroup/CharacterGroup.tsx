import React from 'react'
import type { VisualNovelCharacter } from '@/shared/types/visualNovel'
import { PARLIAMENT_VOICES, type VoiceId } from '@/shared/types/parliament'

export interface CharacterGroupProps {
  characters: VisualNovelCharacter[]
  activeCharacterId?: string
}

export const CharacterGroup: React.FC<CharacterGroupProps> = ({
  characters,
  activeCharacterId,
}) => {
  const activeCharacter = characters.find(c => c.id === activeCharacterId)

  // 1. Сначала проверяем, является ли id внутренним голосом
  const voiceId = activeCharacterId?.toLowerCase() as VoiceId
  const voiceDef = activeCharacterId && PARLIAMENT_VOICES[voiceId]

  if (voiceDef) {
    return (
      <div className="flex justify-center mt-4 sm:mt-8 px-4 w-full max-w-5xl mx-auto animate-fade-in relative z-50 pointer-events-none">
        <div className="flex flex-col items-center">
          {/* Иконка голоса (крупная, по центру) */}
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#4a0404]/90 border border-white/10 shadow-[0_0_30px_rgba(74,4,4,0.6)] flex items-center justify-center text-4xl sm:text-5xl mb-4 backdrop-blur-sm"
            style={{ borderColor: voiceDef.group ? undefined : 'rgba(255,255,255,0.1)' }}
          >
            {voiceDef.icon || '?'}
          </div>

          {/* Имя голоса */}
          <div className="bg-[#4a0404]/90 backdrop-blur-md border border-white/10 rounded-lg px-4 py-2 shadow-xl">
            <span
              className="text-sm sm:text-base font-cinzel font-bold tracking-[0.15em] uppercase text-white/90 drop-shadow-md"
            >
              {voiceDef.nameRu || voiceDef.name}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // 2. Если это обычный персонаж
  if (activeCharacter) {
    return (
      <div className="flex justify-center mt-4 sm:mt-8 px-4 w-full max-w-5xl mx-auto animate-fade-in relative z-50 pointer-events-none">
        <div className="flex flex-col items-center min-w-[140px] transition-all duration-500">
          {/* New Design Tag - Metallic Slate Background */}
          <div className="mb-3">
            <span
              className="inline-block px-3 py-1 text-xs sm:text-sm font-semibold uppercase tracking-wider bg-slate-800/90 border border-slate-500/50 rounded-lg shadow-[0_0_15px_rgba(0,0,0,0.5)]"
              style={activeCharacter.color ? { color: activeCharacter.color, boxShadow: `0 0 8px ${activeCharacter.color}1A` } : { color: '#ffffff' }}
            >
              {activeCharacter.name}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // 3. Fallback: просто отображаем ID, если нет ни персонажа, ни голоса (например 'narrator')
  if (activeCharacterId && activeCharacterId !== 'narrator') {
    // Можно добавить логику для чистого ID или игнорировать
    // Для narrator обычно ничего не пишем
    return (
      <div className="flex justify-center mt-4 sm:mt-8 px-4 w-full max-w-5xl mx-auto animate-fade-in relative z-50 pointer-events-none">
        <div className="bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded border border-white/10">
          <span className="text-xs uppercase tracking-widest text-slate-400">
            {activeCharacterId}
          </span>
        </div>
      </div>
    )
  }

  return null
}

