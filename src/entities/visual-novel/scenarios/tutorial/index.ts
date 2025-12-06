/**
 * Экспорт всех обучающих сценариев
 */

import { combatTutorialScenes } from './combat_tutorial'

// Объединённый объект всех обучающих сценариев
export const allTutorialScenes = {
  ...combatTutorialScenes,
}

// Реэкспорт отдельных модулей
export { combatTutorialScenes } from './combat_tutorial'

export default allTutorialScenes









