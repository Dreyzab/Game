import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useQuery } from '@tanstack/react-query'
import { ArenaBattle } from '@/features/combat'
import { authenticatedClient } from '@/shared/api/client'
import { useCombat } from '@/shared/hooks/useCombat'
import { Routes } from '@/shared/lib/utils/navigation'
import { Button } from '@/shared/ui/components/Button'
import { Heading } from '@/shared/ui/components/Heading'
import { Text } from '@/shared/ui/components/Text'

type EnemyOption = {
  key: string
  name: string
  faction: string
  archetype: string
  maxHp: number
  preferredRank: number
}

const EMPTY_ENEMIES: EnemyOption[] = []

export default function BattlePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { getToken, isLoaded, isSignedIn } = useAuth()
  const { battle, isLoading, createBattle } = useCombat()
  const autoCreateAttemptedRef = useRef(false)

  const returnScene = useMemo(() => searchParams.get('returnScene') || undefined, [searchParams])
  const defeatScene = useMemo(() => searchParams.get('defeatScene') || undefined, [searchParams])
  const enemyKeyFromUrl = useMemo(() => searchParams.get('enemyKey') || undefined, [searchParams])
  const isReturnFlow = Boolean(returnScene || defeatScene)

  const createPayload = useMemo(
    () => (enemyKeyFromUrl ? { enemyKey: enemyKeyFromUrl } : undefined),
    [enemyKeyFromUrl]
  )

  const enemyCatalogQuery = useQuery({
    queryKey: ['combat-enemies'],
    enabled: isLoaded && isSignedIn,
    retry: false,
    queryFn: async (): Promise<EnemyOption[]> => {
      const token = await getToken()
      if (!token) return []
      const client = authenticatedClient(token)
      const { data, error } = await client.combat.enemies.get()
      if (error) throw error
      if (!data || typeof data !== 'object' || !('enemies' in data) || !Array.isArray((data as any).enemies)) {
        return []
      }
      return (data as any).enemies as EnemyOption[]
    },
  })

  const enemyOptions = enemyCatalogQuery.data ?? EMPTY_ENEMIES
  const [selectedEnemyKey, setSelectedEnemyKey] = useState<string>(() => enemyKeyFromUrl ?? 'rail_scorpion')
  const selectedEnemy = useMemo(
    () => enemyOptions.find((enemy) => enemy.key === selectedEnemyKey) ?? null,
    [enemyOptions, selectedEnemyKey]
  )

  useEffect(() => {
    if (isReturnFlow) return
    if (!enemyCatalogQuery.isSuccess) return
    if (enemyOptions.length === 0) return

    setSelectedEnemyKey((prev) => {
      if (prev && enemyOptions.some((enemy) => enemy.key === prev)) return prev
      return enemyOptions[0].key
    })
  }, [enemyCatalogQuery.isSuccess, enemyOptions, isReturnFlow])

  const hasActiveBattle = battle?.isActive === true

  useEffect(() => {
    if (!isReturnFlow) return
    if (!isLoaded || !isSignedIn) return
    if (isLoading) return
    if (hasActiveBattle) return
    if (createBattle.isPending) return
    if (autoCreateAttemptedRef.current) return

    autoCreateAttemptedRef.current = true
    createBattle.mutate(createPayload)
  }, [createBattle, createPayload, hasActiveBattle, isLoaded, isLoading, isReturnFlow, isSignedIn])

  const handleBattleEnd = useCallback(
    (result: 'victory' | 'defeat' | 'flee') => {
      const targetScene = result === 'victory' ? returnScene : defeatScene ?? returnScene

      if (targetScene) {
        navigate(`${Routes.VISUAL_NOVEL}/${targetScene}`)
        return
      }

      navigate(Routes.VISUAL_NOVEL)
    },
    [defeatScene, navigate, returnScene]
  )

  const handleCreateSelected = useCallback(() => {
    const enemyKey = selectedEnemyKey === 'random' ? 'random' : selectedEnemyKey
    createBattle.mutate({ enemyKey })
  }, [createBattle, selectedEnemyKey])

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="text-4xl animate-spin">⚙️</div>
          <div className="text-white/70">Загрузка…</div>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-md">
          <Heading level={3}>Нужен вход</Heading>
          <Text variant="muted" size="sm">
            Авторизуйтесь, чтобы начать бой.
          </Text>
          <Button variant="secondary" onClick={() => navigate(Routes.HOME)}>
            На главную
          </Button>
        </div>
      </div>
    )
  }

  if (isReturnFlow && !hasActiveBattle) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-md">
          <Heading level={3}>Подготавливаем бой…</Heading>
          <Text variant="muted" size="sm">
            {createBattle.isError
              ? 'Не удалось создать бой. Попробуйте ещё раз.'
              : 'Создаём сессию и подтягиваем арену.'}
          </Text>
          {createBattle.isError && (
            <Button variant="secondary" onClick={() => createBattle.mutate(createPayload)}>
              Повторить
            </Button>
          )}
        </div>
      </div>
    )
  }

  if (!battle && !isLoading) {
    const fallbackEnemies: EnemyOption[] = [
      {
        key: 'rail_scorpion',
        name: 'Rail Scorpion',
        faction: 'SCAVENGER',
        archetype: 'GRUNT',
        maxHp: 60,
        preferredRank: 2,
      },
    ]

    const options = enemyOptions.length > 0 ? enemyOptions : fallbackEnemies

    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-md w-full">
          <Heading level={3}>Нет активного боя</Heading>
          <Text variant="muted" size="sm">
            Создайте бой, чтобы начать сражение.
          </Text>

          <div className="w-full space-y-2 text-left">
            <div className="text-xs text-white/50">Противник</div>
            <select
              className="w-full rounded-lg bg-slate-900/70 border border-white/10 px-3 py-2 text-white outline-none"
              value={selectedEnemyKey}
              onChange={(event) => setSelectedEnemyKey(event.target.value)}
              disabled={enemyCatalogQuery.isLoading || createBattle.isPending}
            >
              <option value="random">Random</option>
              {options.map((enemy) => (
                <option key={enemy.key} value={enemy.key}>
                  {enemy.name} ({enemy.faction}/{enemy.archetype})
                </option>
              ))}
            </select>
            {selectedEnemy && (
              <div className="text-xs text-white/50">
                HP: {selectedEnemy.maxHp} • Rank: {selectedEnemy.preferredRank}
              </div>
            )}
            {enemyCatalogQuery.isError && (
              <div className="text-xs text-amber-300">
                Не удалось загрузить список врагов — показываем базовый набор.
              </div>
            )}
          </div>

          <Button variant="secondary" onClick={handleCreateSelected} disabled={createBattle.isPending}>
            Создать бой
          </Button>
        </div>
      </div>
    )
  }

  if (battle && !battle.isActive && !isReturnFlow) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="text-center space-y-3 max-w-md">
          <Heading level={3}>Бой завершён</Heading>
          <Text variant="muted" size="sm">
            Результат: {battle.phase === 'victory' ? 'победа' : battle.phase === 'defeat' ? 'поражение' : battle.phase}
          </Text>
          <div className="flex items-center justify-center gap-2">
            <Button variant="secondary" onClick={handleCreateSelected} disabled={createBattle.isPending}>
              Новый бой
            </Button>
            <Button variant="ghost" onClick={() => navigate(Routes.MAP)}>
              На карту
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <ArenaBattle onBattleEnd={isReturnFlow ? handleBattleEnd : undefined} />
}
