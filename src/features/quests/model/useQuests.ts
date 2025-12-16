import { useMyQuests } from '../api/useMyQuests'
import type { Quest } from '@/shared/types/quest'

export function useActiveQuests() {
  const { active, isLoading, error } = useMyQuests()
  return { quests: active as Quest[], isLoading, error }
}
