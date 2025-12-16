import { useEffect, useMemo } from 'react'
import { useActiveQuests } from '@/features/quests'
import { useInventoryStore } from '@/entities/inventory'

type QuestRequiredItem = { id: string } | string

interface QuestWithRequirements {
  requiredItems?: QuestRequiredItem[]
  steps?: { requirements?: { items?: QuestRequiredItem[] } }[]
}

const extractIds = (items: QuestRequiredItem[] | undefined): string[] => {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => (typeof item === 'string' ? item : item?.id))
    .filter((id): id is string => typeof id === 'string' && id.length > 0)
}

type UseQuestInventoryProtectionOptions = {
  enabled?: boolean
}

export function useQuestInventoryProtection(options: UseQuestInventoryProtectionOptions = {}) {
  const { enabled = true } = options

  const { quests, isLoading, error } = useActiveQuests()
  const items = useInventoryStore((state) => state.items)
  const setQuestProtectedItems = useInventoryStore((state) => state.setQuestProtectedItems)

  const questItemIds = useMemo(() => {
    const ids = new Set<string>()
    quests.forEach((quest) => {
      const q = quest as unknown as QuestWithRequirements
      extractIds(q.requiredItems).forEach((id) => ids.add(id))
      ;(q.steps ?? []).forEach((step) => {
        extractIds(step.requirements?.items).forEach((id) => ids.add(id))
      })
    })
    return Array.from(ids)
  }, [quests])

  useEffect(() => {
    if (!enabled) return
    setQuestProtectedItems(questItemIds)
  }, [enabled, items, questItemIds, setQuestProtectedItems])

  return { questItemIds, isLoading, error }
}

