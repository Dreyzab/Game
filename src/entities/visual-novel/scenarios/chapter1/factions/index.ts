/**
 * Экспорт всех сценариев фракций для Акта 1
 * 
 * Каждая фракция имеет свой набор сценариев для:
 * - Первого знакомства
 * - Квестовых линий
 * - Повторных визитов
 * - Особых событий
 */

export { fjrScenes } from './fjr_scenes'
export { synthesisScenes } from './synthesis_scenes'
export { oldBelieversScenes } from './old_believers_scenes'
export { anarchistsScenes } from './anarchists_scenes'
export { artisansScenes } from './artisans_scenes'

// Объединённый объект всех сценариев фракций
import { fjrScenes } from './fjr_scenes'
import { synthesisScenes } from './synthesis_scenes'
import { oldBelieversScenes } from './old_believers_scenes'
import { anarchistsScenes } from './anarchists_scenes'
import { artisansScenes } from './artisans_scenes'

export const allFactionScenes = {
  ...fjrScenes,
  ...synthesisScenes,
  ...oldBelieversScenes,
  ...anarchistsScenes,
  ...artisansScenes,
}












