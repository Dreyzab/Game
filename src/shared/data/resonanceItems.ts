import type { ResonanceItem } from '../types/resonance'

export const RESONANCE_ITEMS: Record<string, ResonanceItem> = {
  insight_lens_t1: {
    id: 'insight_lens_t1',
    name: 'Линзы наблюдателя',
    slot: 'main',
    charges: 2,
    cooldownScenes: 1,
    data: { skillMods: { insight: 2 }, onUse: { reveal: 'trap_hint' }, sideEffects: { strainDelta: 1 } },
  },
  data_copy: {
    id: 'data_copy',
    name: 'Шифрованная копия данных',
    slot: 'rare',
    data: { questFlag: 'has_copy' },
  },
  bonus_pay: {
    id: 'bonus_pay',
    name: 'Бонусный гонорар',
    slot: 'rare',
    data: { currency: 1 },
  },
}








