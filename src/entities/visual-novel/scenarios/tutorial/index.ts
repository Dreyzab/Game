/**
 * Экспорт всех обучающих сценариев
 */

import { combatTutorialScenes } from './combat_tutorial'
import { scorpionBattleScenes } from './scorpion_battle'

// Объединённый объект всех обучающих сценариев
export const allTutorialScenes = {
  ...combatTutorialScenes,
  ...scorpionBattleScenes,
}

// Реэкспорт отдельных модулей
export { combatTutorialScenes } from './combat_tutorial'
export { scorpionBattleScenes } from './scorpion_battle'

export default allTutorialScenes

















