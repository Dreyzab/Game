import React from 'react'
import { useMyPlayer } from '@/shared/hooks/useMyPlayer'
import { useMySkills } from '@/shared/hooks/useMySkills'
import { Layout } from '@/widgets/layout'
import { Heading, Text } from '@/shared/ui/components'
import { ParliamentPanel } from '@/entities/parliament/ui/ParliamentPanel'
import { isAuthDisabled, useAppAuth } from '@/shared/auth'


// Локализация фракций
const FACTION_NAMES: Record<string, string> = {
  fjr: 'ФЖР',
  anarchists: 'Анархисты',
  artisans: 'Ремесленники',
  old_believers: 'Старообрядцы',
  synthesis: 'Синтез',
}

const ProgressBar: React.FC<{
  value: number
  max: number
  color: string
  label?: string
}> = ({ value, max, color, label }) => {
  const percentage = max > 0 ? Math.min(100, (value / max) * 100) : 0

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">{label}</span>
          <span className="text-slate-300">{value}/{max}</span>
        </div>
      )}
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

const StatCard: React.FC<{
  icon: string
  label: string
  value: number | string
  subtext?: string
}> = ({ icon, label, value, subtext }) => (
  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
    <div className="flex items-center gap-2 mb-1">
      <span className="text-lg">{icon}</span>
      <span className="text-xs text-slate-400 uppercase tracking-wide">{label}</span>
    </div>
    <div className="text-xl font-bold text-white">{value}</div>
    {subtext && <div className="text-xs text-slate-500 mt-0.5">{subtext}</div>}
  </div>
)


const CharacterPage: React.FC = () => {
  const { isLoaded: isAuthLoaded, isSignedIn } = useAppAuth()
  const { data: playerData, isLoading: playerLoading, error: playerError } = useMyPlayer()
  const { tree: skillTree, subclasses, isLoading: skillsLoading } = useMySkills()

  if (!isAuthLoaded) {
    return (
      <Layout>
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <div className="text-4xl animate-pulse">🔐</div>
            <Text variant="muted">Проверяем сессию...</Text>
          </div>
        </div>
      </Layout>
    )
  }

  if (!isSignedIn && !isAuthDisabled) {
    return (
      <Layout>
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <div className="text-4xl">🔐</div>
            <Heading level={3}>Нужно войти</Heading>
            <Text variant="muted">Авторизуйтесь, чтобы увидеть данные персонажа</Text>
          </div>
        </div>
      </Layout>
    )
  }

  const isLoading = playerLoading || skillsLoading

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="text-4xl animate-pulse">👤</div>
            <Text variant="muted">Загрузка данных персонажа...</Text>
          </div>
        </div>
      </Layout>
    )
  }

  if (playerError || !playerData) {
    return (
      <Layout>
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <div className="text-5xl">⚠️</div>
            <Heading level={3}>Ошибка загрузки</Heading>
            <Text variant="muted">
              {playerError instanceof Error ? playerError.message : 'Не удалось загрузить данные'}
            </Text>
          </div>
        </div>
      </Layout>
    )
  }

  const { player, progress } = playerData as {
    player: {
      id: number
      name: string
      fame?: number
      factionId?: string
    } | null
    progress?: {
      level?: number
      xp?: number
      skillPoints?: number
      skills?: Record<string, number>
      gold?: number
      reputation?: Record<string, number>
      hp?: number
      maxHp?: number
      morale?: number
      maxMorale?: number
      stamina?: number
      maxStamina?: number
      phase?: number
      subclasses?: string[]
    }
  }

  if (!player) {
    return (
      <Layout>
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
          <div className="text-center space-y-3">
            <div className="text-5xl">👤</div>
            <Heading level={3}>Персонаж не создан</Heading>
            <Text variant="muted">Начните игру, чтобы создать персонажа</Text>
          </div>
        </div>
      </Layout>
    )
  }

  // const skills = progress?.skills ?? {}
  const reputation = progress?.reputation ?? {}
  const level = progress?.level ?? 1
  const xp = progress?.xp ?? 0
  const skillPoints = progress?.skillPoints ?? 0
  const gold = progress?.gold ?? 0
  const hp = progress?.hp ?? 100
  const maxHp = progress?.maxHp ?? 100
  const morale = progress?.morale ?? 100
  const maxMorale = progress?.maxMorale ?? 100
  const currentStamina = progress?.stamina ?? 100
  const maxStamina = progress?.maxStamina ?? 100
  const phase = progress?.phase ?? 1

  // XP для следующего уровня
  const xpForNextLevel = 50 * level + 50

  return (
    <Layout>
      <div className="min-h-screen bg-slate-950 text-white p-4 pb-24">
        {/* Header */}
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Player Info Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-5 border border-slate-700/50 shadow-xl">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-xl bg-slate-700 border-2 border-amber-500/50 flex items-center justify-center text-4xl shrink-0">
                👤
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-white truncate">{player.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-amber-400 text-sm">Уровень {level}</span>
                  {player.factionId && (
                    <span className="text-xs bg-slate-700 px-2 py-0.5 rounded text-slate-300">
                      {FACTION_NAMES[player.factionId] ?? player.factionId}
                    </span>
                  )}
                </div>

                {/* XP Bar */}
                <div className="mt-3">
                  <ProgressBar
                    value={xp}
                    max={xpForNextLevel}
                    color="bg-amber-500"
                    label="Опыт"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Vital Stats */}
          <div className="space-y-3">
            <ProgressBar value={hp} max={maxHp} color="bg-red-500" label="Здоровье" />
            <ProgressBar value={morale} max={maxMorale} color="bg-blue-500" label="Мораль" />
            <ProgressBar value={currentStamina} max={maxStamina} color="bg-green-500" label="Выносливость" />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon="💰" label="Золото" value={gold} />
            <StatCard icon="⭐" label="Очки навыков" value={skillPoints} />
            <StatCard icon="🏆" label="Слава" value={player.fame ?? 0} />
          </div>

          {/* Phase Badge */}
          <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">📜</span>
              <span className="text-sm text-slate-300">Глава</span>
            </div>
            <span className="text-lg font-bold text-amber-400">{phase}</span>
          </div>


          {/* Skills Section (Internal Parliament) */}
          <div className="space-y-4">
            <ParliamentPanel />
          </div>

          {/* Subclasses */}
          {(subclasses.length > 0 || (progress?.subclasses?.length ?? 0) > 0) && (
            <div className="space-y-3">
              <Heading level={3} className="text-slate-200">Специализации</Heading>
              <div className="grid grid-cols-2 gap-3">
                {[...(subclasses as string[]), ...(progress?.subclasses ?? [])].filter((v, i, a) => a.indexOf(v) === i).map((subclassId) => {
                  // Находим информацию о подклассе в дереве
                  let subclassInfo: { name: string; description: string } | undefined
                  if (skillTree) {
                    for (const skill of Object.values(skillTree as Record<string, { subclasses: Array<{ id: string; name: string; description: string }> }>)) {
                      const found = skill.subclasses?.find((s) => s.id === subclassId)
                      if (found) {
                        subclassInfo = found
                        break
                      }
                    }
                  }

                  return (
                    <div
                      key={subclassId}
                      className="bg-gradient-to-br from-purple-900/30 to-slate-800 rounded-lg p-3 border border-purple-700/30"
                    >
                      <div className="font-medium text-purple-300">
                        {subclassInfo?.name ?? subclassId}
                      </div>
                      {subclassInfo?.description && (
                        <div className="text-xs text-slate-400 mt-1">
                          {subclassInfo.description}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Reputation */}
          {Object.keys(reputation).length > 0 && (
            <div className="space-y-3">
              <Heading level={3} className="text-slate-200">Репутация</Heading>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-800 space-y-3">
                {Object.entries(reputation).map(([factionId, value]) => (
                  <div key={factionId} className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">
                      {FACTION_NAMES[factionId] ?? factionId}
                    </span>
                    <span className={`font-medium ${value > 0 ? 'text-green-400' : value < 0 ? 'text-red-400' : 'text-slate-400'
                      }`}>
                      {value > 0 ? '+' : ''}{value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default CharacterPage
