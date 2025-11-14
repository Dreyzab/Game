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
        text: 'Вы задерживаетесь у импровизированной «кухни» — пара складных столов, газовые горелки и кастрюли с чем‑то подозрительно ароматным. Здесь утром кормят рабочих, а вечером обсуждают новости и слухи.',
      },
      {
        speaker: 'ЛОГИКА',
        text: 'Сейчас здесь относительно тихо: пара поваров что‑то нарезает, один из торговцев подогревает суп, а несколько усталых фигур допивает чай перед сменой. Неплохое место, чтобы запомнить, где можно перекусить или услышать последние разговоры.',
      },
    ],
    choices: [
      {
        id: 'return_to_hub',
        text: 'Вернуться к обзору площади.',
        nextScene: 'market_square_arrival',
      },
    ],
  },
}

