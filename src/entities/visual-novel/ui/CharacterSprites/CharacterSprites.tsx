import React from 'react'
import type { VisualNovelAlignment, VisualNovelCharacter } from '@/shared/types/visualNovel'

export interface CharacterSpritesProps {
  characters: VisualNovelCharacter[]
  activeSpeakerId: string | null
}

const getPositionStyles = (
  alignment: VisualNovelAlignment | undefined,
  isActive: boolean
): React.CSSProperties => {
  switch (alignment) {
    case 'left':
      return {
        left: isActive ? '18%' : '12%',
        transform: `translateX(-50%) ${isActive ? 'scale(1.05)' : 'scale(1)'}`,
      }
    case 'right':
      return {
        right: isActive ? '18%' : '12%',
        transform: `translateX(50%) ${isActive ? 'scale(1.05)' : 'scale(1)'}`,
      }
    case 'center':
      return {
        left: '50%',
        transform: `translateX(-50%) ${isActive ? 'scale(1.05)' : 'scale(1)'}`,
      }
    default:
      return {
        left: '50%',
        transform: 'translateX(-50%)',
      }
  }
}

export const CharacterSprites: React.FC<CharacterSpritesProps> = ({
  characters,
  activeSpeakerId,
}) => {
  const visibleCharacters = characters.filter((char) => char.id !== 'narrator' && Boolean(char.portraitUrl))
  const activeCharacter = activeSpeakerId
    ? visibleCharacters.find((char) => char.id === activeSpeakerId)
    : undefined

  // Если говорит рассказчик/нет активного говорящего (или у говорящего нет спрайта) — не показываем никого.
  if (!activeCharacter) return null

  return (
    <div className="absolute inset-0 pointer-events-none flex items-end justify-center overflow-hidden z-10">
      <div className="relative w-full h-full max-w-[1400px] mx-auto">
        <div
          key={activeCharacter.id}
          className={[
            'absolute bottom-0 transition-all duration-500 ease-out h-[90vh] w-auto flex justify-center',
            'opacity-100 z-20 brightness-110 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]',
          ].join(' ')}
          style={getPositionStyles(activeCharacter.alignment, true)}
        >
          <img
            src={activeCharacter.portraitUrl}
            alt={activeCharacter.name}
            className="h-full w-auto object-contain transition-transform duration-500"
          />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[150%] h-1/4 bg-linear-to-t from-white/10 to-transparent blur-3xl -z-10" />
        </div>
      </div>
    </div>
  )
}

