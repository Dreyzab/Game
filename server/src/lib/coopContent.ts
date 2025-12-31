import type { CoopQuestNode } from '../shared/types/coop'

import { COOP_STAGE_PROLOGUE_NODES } from './coopContent/stage_prologue'
import { COOP_STAGE_OUTPOST_AND_ROUTE_NODES } from './coopContent/stage_outpost_and_route'
import { COOP_STAGE_OTHER_SIDE_NODES } from './coopContent/stage_other_side'
import { COOP_STAGE_CROSSROADS_NODES } from './coopContent/stage_crossroads'
import { COOP_STAGE_MOUNTAIN_TORA_END_NODES } from './coopContent/stage_mountain_tora_end'
import { COOP_STAGE_RIFT_EXPEDITION_NODES } from './coopContent/stage_rift_expedition'

export const COOP_PROLOGUE_NODES: Record<string, CoopQuestNode> = {
  ...COOP_STAGE_PROLOGUE_NODES,
  ...COOP_STAGE_OUTPOST_AND_ROUTE_NODES,
  ...COOP_STAGE_OTHER_SIDE_NODES,
  ...COOP_STAGE_CROSSROADS_NODES,
  ...COOP_STAGE_MOUNTAIN_TORA_END_NODES,
  ...COOP_STAGE_RIFT_EXPEDITION_NODES,
}

