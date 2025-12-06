import React, { useMemo, useState } from 'react'
import { Layout } from '@/widgets/layout'
import { Heading } from '@/shared/ui/components/Heading'
import { Text } from '@/shared/ui/components/Text'
import { LoadingSpinner } from '@/shared/ui/components/LoadingSpinner'
import { Button } from '@/shared/ui/components/Button'
import { usePlayer, usePlayerProgress } from '@/shared/hooks/usePlayer'
import { useDeviceId } from '@/shared/hooks/useDeviceId'
import { convexMutations } from '@/shared/api/convex'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@convex/_generated/api'
import { VoiceCardGroup } from '@/features/visual-novel/consultation/ui/VoiceCardGroup'
import { VOICE_DEFINITIONS, type VoiceId } from '@/features/visual-novel/consultation/lib/voiceDefinitions'

export const CharacterPage: React.FC = () => {
  const { player } = usePlayer()
  const { progress, isLoading } = usePlayerProgress()
  const { deviceId } = useDeviceId()

  const skillTree = useQuery(api.skills.getSkillTree)
  const unlockedSubclasses = useQuery(api.skills.getSubclasses, deviceId ? { deviceId } : "skip")
  const unlockSubclass = useMutation(api.skills.unlockSubclass)

  const [activeVoiceId, setActiveVoiceId] = useState<string | null>(null)
  const [draftSkills, setDraftSkills] = useState<Record<string, number> | null>(null)
  const [draftSkillPoints, setDraftSkillPoints] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const baseSkills = progress?.skills ?? {}
  const skills = draftSkills ?? baseSkills
  const freePoints = draftSkillPoints ?? progress?.skillPoints ?? 0

  const availableVoiceIds = useMemo(() => Object.keys(VOICE_DEFINITIONS), [])
  const viewedVoiceIds = useMemo(() => new Set<string>(), [])

  const activeVoice = useMemo(() => {
    if (!activeVoiceId) return null
    return VOICE_DEFINITIONS[activeVoiceId as VoiceId]
  }, [activeVoiceId])

  const hasDraft = draftSkills !== null

  const handleIncrement = (voiceId: string) => {
    if (!progress) return
    if (freePoints <= 0) return

    setDraftSkills((prev) => {
      const current = prev ?? baseSkills
      return {
        ...current,
        [voiceId]: (current[voiceId] ?? 0) + 1,
      }
    })
    setDraftSkillPoints((prev) => (prev ?? progress.skillPoints ?? 0) - 1)
    setError(null)
  }

  const handleReset = () => {
    setDraftSkills(null)
    setDraftSkillPoints(null)
    setError(null)
  }

  const handleApply = async () => {
    if (!progress || !deviceId || !draftSkills) return

    const allocation: Record<string, number> = {}
    for (const [id, value] of Object.entries(draftSkills)) {
      const base = baseSkills[id] ?? 0
      const delta = value - base
      if (delta !== 0) {
        allocation[id] = delta
      }
    }

    if (Object.keys(allocation).length === 0) {
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      const result = await convexMutations.player.allocateSkills({
        deviceId,
        allocation,
      })
      setDraftSkills(null)
      setDraftSkillPoints(result.skillPoints)
    } catch (e) {
      console.error('[CharacterPage] Failed to allocate skills', e)
      setError('Не удалось сохранить распределение навыков. Попробуйте ещё раз.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUnlockSubclass = async (subclassId: string, baseSkillId: string) => {
    if (!deviceId) return
    try {
      await unlockSubclass({ deviceId, subclassId, baseSkillId })
    } catch (e) {
      alert("Failed to unlock: " + e)
    }
  }

  if (isLoading && !progress) {
    return (
      <Layout>
        <div className="glass-panel p-6">
          <LoadingSpinner text="Загрузка данных персонажа..." />
        </div>
      </Layout>
    )
  }

  if (!progress) {
    return (
      <Layout>
        <div className="glass-panel p-6 text-center">
          <Heading level={3}>Персонаж не найден</Heading>
          <Text variant="muted" size="sm" className="mt-3">
            Создайте нового игрока на главной странице, чтобы открыть экран персонажа.
          </Text>
        </div>
      </Layout>
    )
  }

  const level = progress.level ?? 1
  const xp = progress.xp ?? 0
  const maxXp = progress.maxXp ?? 100
  const skillPoints = freePoints

  return (
    <Layout>
      <div className="mb-8 text-center">
        <Heading level={1}>Персонаж</Heading>
        <Text variant="muted" size="sm" className="mt-3 uppercase tracking-[0.28em]">
          Обзор навыков и прогресса
        </Text>
      </div>

      <div className="panel-grid mb-8">
        <div className="panel-span-4">
          <div className="glass-panel p-6 space-y-4">
            <Heading level={5} className="panel-section-title">
              Сводка
            </Heading>
            <div className="space-y-2 text-left">
              <div className="flex items-center justify-between text-sm">
                <Text variant="muted" size="sm">
                  Имя
                </Text>
                <Text size="sm" className="font-medium">
                  {player?.name ?? 'Гость'}
                </Text>
              </div>
              <div className="flex items-center justify-between text-sm">
                <Text variant="muted" size="sm">
                  Уровень
                </Text>
                <Text size="sm" className="font-medium">
                  {level}
                </Text>
              </div>
              <div className="flex items-center justify-between text-sm">
                <Text variant="muted" size="sm">
                  Опыт
                </Text>
                <Text size="sm" className="font-medium">
                  {xp}/{maxXp} XP
                </Text>
              </div>
              <div className="flex items-center justify-between text-sm">
                <Text variant="muted" size="sm">
                  Свободные очки навыков
                </Text>
                <Text size="sm" className="font-medium">
                  {skillPoints}
                </Text>
              </div>
              <div className="flex items-center justify-between text-sm">
                <Text variant="muted" size="sm">
                  Фаза
                </Text>
                <Text size="sm" className="font-medium">
                  {progress.phase ?? 1}
                </Text>
              </div>
              <div className="flex items-center justify-between text-sm">
                <Text variant="muted" size="sm">
                  Статус
                </Text>
                <Text size="sm" className="font-medium">
                  {player?.status ?? 'Активен'}
                </Text>
              </div>

              <div className="pt-4 space-y-2">
                {error && (
                  <Text variant="muted" size="xs" className="text-red-500">
                    {error}
                  </Text>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleApply}
                    disabled={!hasDraft || isSaving || freePoints < 0}
                  >
                    Сохранить
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleReset}
                    disabled={!hasDraft || isSaving}
                  >
                    Сбросить
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="panel-span-8">
          <div className="glass-panel p-6">
            <div className="mb-4 flex items-center justify-between">
              <Heading level={5} className="panel-section-title">
                Навыки
              </Heading>
              <Text variant="muted" size="xs">
                Всего голосов: {availableVoiceIds.length}
              </Text>
            </div>
            <VoiceCardGroup
              skills={skills}
              availableVoiceIds={availableVoiceIds}
              activeVoiceId={activeVoiceId}
              viewedVoiceIds={viewedVoiceIds}
              onVoiceClick={(id) => {
                setActiveVoiceId(id)
                if (freePoints > 0) {
                  handleIncrement(id)
                }
              }}
            />
          </div>
        </div>
      </div>

      {activeVoice && (
        <div className="panel-grid">
          <div className="panel-span-12">
            <div className="glass-panel p-6 md:flex md:items-start md:justify-between md:gap-6">
              <div>
                <Heading level={3}>{activeVoice.name}</Heading>
                <Text variant="muted" size="sm" className="mt-2">
                  {activeVoice.description}
                </Text>

                {/* Subclass Section */}
                {/* @ts-ignore */}
                {skillTree && skillTree[activeVoice.id] && (
                  <div className="mt-6 border-t border-slate-700 pt-4">
                    <Heading level={5} className="mb-4">Specializations (Level {
                      // @ts-ignore
                      skillTree[activeVoice.id].level
                    }+)</Heading>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* @ts-ignore */}
                      {skillTree[activeVoice.id].subclasses.map((sub: any) => {
                        const isUnlocked = unlockedSubclasses?.includes(sub.id)
                        // @ts-ignore
                        const canUnlock = (skills[activeVoice.id] ?? 0) >= skillTree[activeVoice.id].level

                        return (
                          <div key={sub.id} className={`p-4 rounded border ${isUnlocked ? 'border-green-500 bg-green-900/20' : 'border-slate-600 bg-slate-800'}`}>
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-lg">{sub.name}</h4>
                              {isUnlocked ? (
                                <span className="text-green-400 text-xs uppercase font-bold">Unlocked</span>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={!canUnlock}
                                  onClick={() => handleUnlockSubclass(sub.id, activeVoice.id)}
                                >
                                  {canUnlock ? "Unlock" : "Locked"}
                                </Button>
                              )}
                            </div>
                            <p className="text-sm text-gray-400 mb-2">{sub.description}</p>
                            {sub.stats && (
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                {Object.entries(sub.stats).map(([stat, val]) => (
                                  <div key={stat} className="flex justify-between bg-black/20 p-1 rounded">
                                    <span className="text-gray-500 capitalize">{stat}</span>
                                    <span className="font-bold text-green-400">+{val as number}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

              </div>
              <div className="mt-4 md:mt-0 text-right">
                <Text variant="muted" size="sm">
                  Текущий уровень
                </Text>
                <p className="mt-1 text-3xl font-semibold text-[color:var(--color-text)]">
                  {skills[activeVoice.id] ?? 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default CharacterPage





