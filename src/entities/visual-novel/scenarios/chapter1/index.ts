import type { SceneMap } from '../../model/types'
import { scenarios as hub } from './market_square_arrival'
import { scenarios as kitchen } from './market_node_kitchen'
import { scenarios as market } from './market_node_market'
import { scenarios as posters } from './market_node_posters'
import { scenarios as quest } from './market_quest_nudge'

export const chapter1Scenes: SceneMap = {
  ...hub,
  ...kitchen,
  ...market,
  ...posters,
  ...quest,
}

