import type { Scene } from '../../model/types'

const FALLBACK_BACKGROUND = '/images/backgrounds/station1.png'

export const chapter1CommonScenes: Record<string, Scene> = {
  exit_to_map: {
    id: 'exit_to_map',
    background: FALLBACK_BACKGROUND,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Ты возвращаешься к карте.',
      },
    ],
    choices: [
      {
        id: 'open_map',
        text: 'Открыть карту.',
        effects: {
          immediate: [{ type: 'open_map' }],
        },
      },
    ],
  },
}

