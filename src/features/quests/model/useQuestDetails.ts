import { useMemo } from 'react'
import { useMyQuests } from '../api/useMyQuests'

type QuestDetails = {
  id: string
  title: string
  description?: string
  phase?: number
  isActive?: boolean
  stepsCount?: number
  repeatable?: boolean
  templateVersion?: number
}

export function useQuestDetails(questId: string | undefined) {
  const { active, completed, available, isLoading, error } = useMyQuests()
  const all = useMemo(() => [...(active || []), ...(completed || []), ...(available || [])], [active, completed, available])
  const data = useMemo(() => all.find((q) => q.id === questId) ?? null, [all, questId])
  return { data: data as QuestDetails | null, isLoading, error }
}
