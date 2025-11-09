import type { SceneMap } from '../../model/types'
import { BACKGROUNDS } from '@/shared/data/visualNovel/backgrounds'

export const scenarios: SceneMap = {
  market_node_posters: {
    id: 'market_node_posters',
    background: BACKGROUNDS.freiburg_market,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Вы подходите к доске, утыканной листовками. Приказы FJR о расстреле висят рядом с рекламой вакцинации от "Синтеза". Но один лист выделяется. С официальной печатью Городского Совета.'
      },
      { speaker: 'Плакат', text: 'ОПАСНОСТЬ НА ШЛОССБЕРГЕ! ВХОД В ЗОНУ ЗАМКА СТРОГО ЗАПРЕЩЁН!' },
      {
        speaker: 'Рассказчик',
        text: 'Прямо под текстом кто-то нацарапал красной краской: "ШЁПОТ СЛЫШАТ УЖЕ ПЯТЕРО. ЭТО ЗНАК?"'
      },
      {
        speaker: 'ПАРАНОЙЯ',
        text: '(Тревожно) Они что-то скрывают! "Опасность" — слишком общее слово. А эта приписка... это не вандализм. Это предупреждение для своих!',
        emotion: { primary: 'worried', intensity: 80 }
      },
      {
        speaker: 'ИНТУИЦИЯ',
        text: '(Едва слышно) Шёпот... От этого слова веет холодом. Это не мутанты. Это что-то... неправильное.',
        emotion: { primary: 'confused', intensity: 40 }
      }
    ],
    choices: [
      {
        id: 'return_to_hub',
        text: 'Отойти от доски.',
        nextScene: 'market_square_arrival',
        effects: { addFlags: ['heard_about_schlossberg_whispers'] }
      }
    ]
  }
}


