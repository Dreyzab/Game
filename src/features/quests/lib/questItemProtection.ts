import { useMemo, useEffect } from 'react'
import { useActiveQuests } from '@/shared/hooks/useQuests'
import { useInventoryStore } from '@/shared/stores/inventoryStore'

type QuestRequiredItem = { id: string } | string

const extractIds = (items: QuestRequiredItem[] | undefined): string[] => {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => (typeof item === 'string' ? item : item?.id))
    .filter((id): id is string => typeof id === 'string' && id.length > 0)
}

export const useQuestItemProtection = () => {
  const { quests } = useActiveQuests()
  const setQuestProtectedItems = useInventoryStore((state) => state.setQuestProtectedItems)
  const isQuestItem = useInventoryStore((state) => state.isQuestItem)

  const questItemIds = useMemo(() => {
    const ids = new Set<string>()
    quests.forEach((quest) => {
      const requiredItems = extractIds((quest as any)?.requiredItems)
      requiredItems.forEach((id) => ids.add(id))

      const steps = Array.isArray((quest as any)?.steps) ? ((quest as any).steps as any[]) : []
      steps.forEach((step) => {
        const stepItems = extractIds(step?.requirements?.items)
        stepItems.forEach((id) => ids.add(id))
      })
    })
    return Array.from(ids)
  }, [quests])

  useEffect(() => {
    setQuestProtectedItems(questItemIds)
  }, [questItemIds, setQuestProtectedItems])

  const canDropItem = (itemId: string) => !isQuestItem(itemId)

  return { questItemIds, canDropItem }
}
