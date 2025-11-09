import type { SceneMap } from '../../model/types'
import { BACKGROUNDS } from '@/shared/data/visualNovel/backgrounds'

export const scenarios: SceneMap = {
  market_node_kitchen: {
    id: 'market_node_kitchen',
    background: BACKGROUNDS.freiburg_market,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Справа, у ступеней старого театра, дымится большой котёл. Люди с мисками выстраиваются в очередь. Разливает похлёбку девушка с ярко-рыжими волосами, а над кухней висит баннер: "Голоден? Поешь бесплатно. Спроси взамен: чем ты можешь помочь обществу?"'
      },
      {
        speaker: 'ЭМПАТИЯ',
        text: '(Тихо) Они не просто дают милостыню. Они предлагают сделку, основанную на достоинстве. Это... правильно.',
        emotion: { primary: 'happy', intensity: 30 }
      },
      {
        speaker: 'ЦИНИЗМ',
        text: 'Бесплатный суп. Самый древний крючок в истории. Прикормят, а потом попросят "помочь обществу", сдохнув на какой-нибудь баррикаде.',
        emotion: { primary: 'sad', intensity: 55 }
      }
    ],
    choices: [
      { id: 'return_to_hub', text: 'Отвести взгляд.', nextScene: 'market_square_arrival' }
    ]
  }
}


