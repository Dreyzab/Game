/**
 * =====================================================
 * BATTLE PAGE - Kinetic Layer Combat
 * Страница боя "Эхо Фрайбурга"
 * =====================================================
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery } from 'convex/react'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '@/shared/api/convex'
import { BattleArena } from '@/features/combat'
import ArenaBattle from '@/features/combat/ui/ArenaBattle'
import { cn } from '@/shared/lib/utils/cn'
import { useDeviceId } from '@/shared/hooks/useDeviceId'

// ================== BATTLE START SCREEN ==================

function BattleStartScreen({
  onStartBattle,
  isLoading
}: {
  onStartBattle: (enemies: string[], zoneId?: string, mode?: 'standard' | 'arena') => void
  isLoading: boolean
}) {
  const [selectedEnemies, setSelectedEnemies] = useState<string[]>(['scavenger_basic'])
  const [selectedZone, setSelectedZone] = useState<string>('neutral_zone')
  const [selectedMode, setSelectedMode] = useState<'standard' | 'arena'>('standard')

  const enemyOptions = [
    { id: 'scavenger_basic', name: 'Уличный Мародёр', tier: 'T1' },
    { id: 'scavenger_armed', name: 'Вооружённый Мародёр', tier: 'T1' },
    { id: 'fjr_patrol', name: 'Патрульный ФЯР', tier: 'T2' },
    { id: 'fjr_shield', name: 'Щитоносец ФЯР', tier: 'T2' },
    { id: 'drone_scout', name: 'Дрон-Разведчик', tier: 'T3' },
    { id: 'drone_assault', name: 'Штурмовой Дрон', tier: 'T3' },
  ]

  const zoneOptions = [
    { id: 'neutral_zone', name: 'Нейтральная Территория', icon: '🏙️' },
    { id: 'sanctuary_munster', name: 'Святилище Мюнстера', icon: '⛪' },
    { id: 'chaos_zone_vauban', name: 'Зона Хаоса Ваубан', icon: '☀️' },
    { id: 'forge_industrial', name: 'Кузница Севера', icon: '🏭' },
    { id: 'canals_bachle', name: 'Артерии Бёхле', icon: '💧' },
  ]

  const toggleEnemy = (id: string) => {
    if (selectedEnemies.includes(id)) {
      if (selectedEnemies.length > 1) {
        setSelectedEnemies(selectedEnemies.filter(e => e !== id))
      }
    } else {
      if (selectedEnemies.length < 4) {
        setSelectedEnemies([...selectedEnemies, id])
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-red-900/20 to-slate-900 p-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <h1 className="text-4xl font-bold text-center text-white mb-2">
          ⚔️ Подготовка к Бою
        </h1>
        <p className="text-center text-white/70 mb-8">
          Kinetic Layer Combat System v0.4
        </p>

        {/* Enemy Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Выберите противников (1-4)</h2>
          <div className="grid grid-cols-2 gap-3">
            {enemyOptions.map(enemy => (
              <motion.button
                key={enemy.id}
                onClick={() => toggleEnemy(enemy.id)}
                className={cn(
                  'p-4 rounded-lg border-2 transition-all text-left',
                  selectedEnemies.includes(enemy.id)
                    ? 'border-red-400 bg-red-900/30 text-white'
                    : 'border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-400'
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex justify-between items-center">
                  <span className="font-bold">{enemy.name}</span>
                  <span className={cn(
                    'text-xs px-2 py-1 rounded',
                    enemy.tier === 'T1' && 'bg-green-900 text-green-300',
                    enemy.tier === 'T2' && 'bg-yellow-900 text-yellow-300',
                    enemy.tier === 'T3' && 'bg-red-900 text-red-300'
                  )}>
                    {enemy.tier}
                  </span>
                </div>
                {selectedEnemies.includes(enemy.id) && (
                  <div className="text-red-400 text-sm mt-1">✓ Выбран</div>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Zone Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Выберите зону боя</h2>
          <div className="grid grid-cols-1 gap-2">
            {zoneOptions.map(zone => (
              <motion.button
                key={zone.id}
                onClick={() => setSelectedZone(zone.id)}
                className={cn(
                  'p-4 rounded-lg border-2 transition-all text-left flex items-center gap-3',
                  selectedZone === zone.id
                    ? 'border-amber-400 bg-amber-900/30 text-white'
                    : 'border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-400'
                )}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <span className="text-2xl">{zone.icon}</span>
                <span className="font-bold">{zone.name}</span>
                {selectedZone === zone.id && (
                  <span className="ml-auto text-amber-400">✓</span>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Mode Selection */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Режим боя</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedMode('standard')}
              className={cn(
                'flex-1 p-4 rounded-lg border-2 transition-all text-center font-bold',
                selectedMode === 'standard'
                  ? 'border-blue-400 bg-blue-900/30 text-white'
                  : 'border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-400'
              )}
            >
              Standard
              <div className="text-xs font-normal opacity-70 mt-1">Классический бой с рангами</div>
            </button>
            <button
              onClick={() => setSelectedMode('arena')}
              className={cn(
                'flex-1 p-4 rounded-lg border-2 transition-all text-center font-bold',
                selectedMode === 'arena'
                  ? 'border-amber-400 bg-amber-900/30 text-white'
                  : 'border-slate-600 bg-slate-800/50 text-slate-300 hover:border-slate-400'
              )}
            >
              Arena Protocol
              <div className="text-xs font-normal opacity-70 mt-1">Zero-Range • Posture • Jamming</div>
            </button>
          </div>
        </div>

        {/* Start Battle Button */}
        <motion.button
          onClick={() => onStartBattle(selectedEnemies, selectedZone, selectedMode)}
          disabled={isLoading || selectedEnemies.length === 0}
          className={cn(
            'w-full py-4 rounded-lg font-bold text-xl transition-all',
            isLoading
              ? 'bg-slate-700 text-slate-500'
              : 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white shadow-lg shadow-red-500/30'
          )}
          whileHover={!isLoading ? { scale: 1.02 } : {}}
          whileTap={!isLoading ? { scale: 0.98 } : {}}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full"
              />
              Загрузка...
            </span>
          ) : (
            `⚔️ Начать бой (${selectedEnemies.length} ${selectedEnemies.length === 1 ? 'враг' : 'врага'})`
          )}
        </motion.button>

        {/* Back Button */}
        <div className="mt-4 text-center">
          <a
            href="/"
            className="text-slate-400 hover:text-white transition-colors"
          >
            ← Вернуться на главную
          </a>
        </div>
      </motion.div>
    </div>
  )
}

// ================== BATTLE RESULT SCREEN ==================

function BattleResultScreen({
  result,
  onContinue
}: {
  result: 'victory' | 'defeat' | 'flee'
  onContinue: () => void
}) {
  const navigate = useNavigate()

  const resultData = {
    victory: {
      title: '🏆 ПОБЕДА!',
      subtitle: 'Враги повержены',
      color: 'from-green-900 to-emerald-900',
      textColor: 'text-green-300',
      rewards: [
        '+ 50 XP',
        '+ 25 Fame',
        'Возможен лут!'
      ]
    },
    defeat: {
      title: '💀 ПОРАЖЕНИЕ',
      subtitle: 'Вы были побеждены...',
      color: 'from-red-900 to-rose-900',
      textColor: 'text-red-300',
      rewards: [
        '- 10 Fame',
        'Потеряны ресурсы',
        'Но опыт остался...'
      ]
    },
    flee: {
      title: '🏃 ПОБЕГ',
      subtitle: 'Вы сбежали с поля боя',
      color: 'from-yellow-900 to-amber-900',
      textColor: 'text-yellow-300',
      rewards: [
        '+ 10 XP (за выживание)',
        'Снаряжение сохранено',
        'Враги запомнили вас...'
      ]
    }
  }

  const data = resultData[result]

  return (
    <div className={cn(
      'min-h-screen bg-gradient-to-b p-6 flex items-center justify-center',
      data.color
    )}>
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full text-center"
      >
        <motion.h1
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          className={cn('text-5xl font-bold mb-4', data.textColor)}
        >
          {data.title}
        </motion.h1>

        <p className="text-white/70 text-xl mb-8">{data.subtitle}</p>

        <div className="bg-black/30 rounded-lg p-6 mb-8">
          <h3 className="text-white font-bold mb-4">Результаты:</h3>
          <ul className="space-y-2">
            {data.rewards.map((reward, i) => (
              <motion.li
                key={i}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.2 }}
                className={cn('text-lg', data.textColor)}
              >
                {reward}
              </motion.li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <motion.button
            onClick={onContinue}
            className="w-full py-3 rounded-lg font-bold bg-white/20 hover:bg-white/30 text-white transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Ещё один бой
          </motion.button>

          <motion.button
            onClick={() => navigate('/')}
            className="w-full py-3 rounded-lg font-bold bg-black/30 hover:bg-black/50 text-white/70 hover:text-white transition-all"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Вернуться на главную
          </motion.button>
        </div>
      </motion.div>
    </div>
  )
}

// ================== MAIN PAGE COMPONENT ==================

export default function BattlePage() {
  const { deviceId } = useDeviceId()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [battleState, setBattleState] = useState<'start' | 'battle' | 'result'>('start')
  const [battleResult, setBattleResult] = useState<'victory' | 'defeat' | 'flee' | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [battleMode, setBattleMode] = useState<'standard' | 'arena'>('standard')
  const [isLoading, setIsLoading] = useState(false)

  const activeBattle = useQuery(api.battleSystem.getActiveBattle, { deviceId })
  const startBattle = useMutation(api.battleSystem.startBattle)

  // Check for active battle on mount
  useEffect(() => {
    if (activeBattle && activeBattle.isActive) {
      setSessionId(activeBattle._id)
      setBattleMode((activeBattle.mode as 'standard' | 'arena') || 'standard')
      setBattleState('battle')
    }
  }, [activeBattle])

  const handleStartBattle = async (enemies: string[], zoneId?: string, mode: 'standard' | 'arena' = 'standard') => {
    if (!deviceId) return

    setIsLoading(true)
    setBattleMode(mode)
    
    try {
      const result = await startBattle({
        deviceId,
        enemyTemplateIds: enemies,
        zoneId,
        // TODO: Get weapon from equipment store
        playerWeaponId: 'glock_19',
        playerAmmo: 15,
        mode
      })

      if (result.success && result.sessionId) {
        setSessionId(result.sessionId)
        setBattleState('battle')
      } else {
        console.error('Failed to start battle:', result.error)
      }
    } catch (error) {
      console.error('Error starting battle:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBattleEnd = (result: 'victory' | 'defeat' | 'flee') => {
    setBattleResult(result)
    setBattleState('result')
  }

  const handleContinue = () => {
    setBattleResult(null)
    setSessionId(null)
    setBattleState('start')
  }

  // Render based on state
  if (battleState === 'start') {
    return <BattleStartScreen onStartBattle={handleStartBattle} isLoading={isLoading} />
  }

  if (battleState === 'battle' && sessionId) {
    // Choose component based on battle mode
    if (battleMode === 'arena') {
      return (
        <ArenaBattle
          sessionId={sessionId}
          deviceId={deviceId}
          onBattleEnd={handleBattleEnd}
        />
      )
    }
    
    // Default to standard mode
    return (
      <BattleArena
        sessionId={sessionId}
        deviceId={deviceId}
        onBattleEnd={handleBattleEnd}
      />
    )
  }

  if (battleState === 'result' && battleResult) {
    return <BattleResultScreen result={battleResult} onContinue={handleContinue} />
  }

  return null
}
