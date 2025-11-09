import type { SceneMap } from '../../model/types'
import { BACKGROUNDS } from '@/shared/data/visualNovel/backgrounds'

export const scenarios: SceneMap = {
  market_quest_nudge: {
    id: 'market_quest_nudge',
    background: BACKGROUNDS.freiburg_market,
    characters: [],
    dialogue: [
      { speaker: 'Рассказчик', text: 'Довольно глазеть. Посреди всего этого шума ваш КПК издаёт тихий сигнал, напоминая о задании.' },
      { speaker: 'Рассказчик', text: 'Метка "Ржавый Якорь" мигает в дальнем, более тихом углу площади. Пора за работу.' }
    ],
    choices: [
      { id: 'go_to_elias', text: 'Отправиться на поиски.', nextScene: 'elias_shop_entrance' }
    ]
  }
}


