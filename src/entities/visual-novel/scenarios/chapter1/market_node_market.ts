import type { SceneMap } from '../../model/types'
import { BACKGROUNDS } from '@/shared/data/visualNovel/backgrounds'

export const scenarios: SceneMap = {
  market_node_market: {
    id: 'market_node_market',
    background: BACKGROUNDS.freiburg_market,
    characters: [],
    dialogue: [
      {
        speaker: 'Рассказчик',
        text: 'Слева тянется ряд палаток. Ваше внимание привлекает дородный торговец, который ловко втюхивает какому-то бойцу FJR дозиметр.'
      },
      {
        speaker: 'Торговец',
        text: 'Лучший прибор! Швейцарское качество, довоенное! Ладно-ладно, вижу, ты свой парень — даю сухпаёк впридачу. По рукам?'
      },
      {
        speaker: 'ЛОГИКА',
        text: '[ПАРАМЕТР: МЫСЛЬ/ЛОГИКА (Успех)] Над палаткой флаг: три переплетённых кольца на чёрном фоне. Символ Гильдии Торговцев. Это не просто барахолка. А приём классический: завысить ценность, создать иллюзию скидки с бонусом. Солдат уже попался.',
        emotion: { primary: 'neutral', intensity: 80 }
      }
    ],
    choices: [
      { id: 'return_to_hub', text: 'Отвести взгляд.', nextScene: 'market_square_arrival' }
    ]
  }
}


