/**
 * =====================================================
 * BATTLE ARENA - Side-View Combat UI
 * Kinetic Layer Visual Component
 * =====================================================
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/shared/api/convex'
import { cn } from '@/shared/lib/utils/cn'

// Types
interface CombatantState {
  id: string
  name: string
  rank: number
  hp: number
  maxHp: number
  morale: number
  armor: number
  activeEffects: Array<{ type: string; value: number; remainingTurns: number; source: string }>
}

interface PlayerState {
  hp: number
  maxHp: number
  morale: number
  maxMorale: number
  stamina: number
  maxStamina: number
  exhaustionLevel: 'none' | 'winded' | 'exhausted' | 'collapsed'
  currentAmmo: number
  weaponCondition: number
  weaponHeat: number
  activeEffects: Array<{ type: string; value: number; remainingTurns: number; source: string }>
}

interface BattleArenaProps {
  sessionId: string
  deviceId: string
  onBattleEnd?: (result: 'victory' | 'defeat' | 'flee') => void
}

// ================== RANK SYSTEM VISUALIZATION ==================

const RankPosition = ({ 
  rank, 
  side, 
  children,
  isActive
}: { 
  rank: number
  side: 'player' | 'enemy'
  children?: React.ReactNode
  isActive?: boolean
}) => {
  const getRankLabel = (r: number) => {
    switch (r) {
      case 1: return 'Авангард'
      case 2: return 'Поддержка'
      case 3: return 'Тыл'
      case 4: return 'Артиллерия'
      default: return `Ранг ${r}`
    }
  }

  return (
    <div 
      className={cn(
        'relative h-24 flex items-center justify-center rounded-lg border-2 transition-all',
        side === 'player' 
          ? 'border-blue-500/30 bg-blue-900/20' 
          : 'border-red-500/30 bg-red-900/20',
        isActive && 'border-yellow-400 ring-2 ring-yellow-400/50'
      )}
    >
      <span className="absolute top-1 left-2 text-xs text-white/50">
        {getRankLabel(rank)}
      </span>
      {children}
    </div>
  )
}

// ================== COMBATANT CARD ==================

const CombatantCard = ({ 
  combatant, 
  isPlayer = false,
  isCurrentTurn = false,
  onClick
}: { 
  combatant: CombatantState | { name: string; hp: number; maxHp: number; stamina?: number; maxStamina?: number; morale?: number; maxMorale?: number }
  isPlayer?: boolean
  isCurrentTurn?: boolean
  onClick?: () => void
}) => {
  const hpPercent = (combatant.hp / combatant.maxHp) * 100
  const staminaPercent = 'stamina' in combatant && combatant.maxStamina 
    ? (combatant.stamina! / combatant.maxStamina) * 100 
    : 100
  
  return (
    <motion.div
      className={cn(
        'relative p-3 rounded-lg border-2 cursor-pointer transition-all',
        isPlayer 
          ? 'bg-gradient-to-br from-blue-900/80 to-blue-800/60 border-blue-400/50' 
          : 'bg-gradient-to-br from-red-900/80 to-red-800/60 border-red-400/50',
        isCurrentTurn && 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-400/30'
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Name */}
      <div className="text-sm font-bold text-white mb-2 truncate">
        {combatant.name}
      </div>
      
      {/* HP Bar */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-red-300">HP</span>
          <div className="flex-1 h-2 bg-black/50 rounded-full overflow-hidden">
            <motion.div 
              className={cn(
                'h-full rounded-full',
                hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${hpPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-xs text-white/70">{combatant.hp}/{combatant.maxHp}</span>
        </div>
        
        {/* Stamina Bar (Player only) */}
        {'stamina' in combatant && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-yellow-300">ST</span>
            <div className="flex-1 h-2 bg-black/50 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-yellow-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${staminaPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <span className="text-xs text-white/70">{combatant.stamina}/{combatant.maxStamina}</span>
          </div>
        )}
      </div>
      
      {/* Current Turn Indicator */}
      {isCurrentTurn && (
        <motion.div 
          className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          <span className="text-xs">⚡</span>
        </motion.div>
      )}
    </motion.div>
  )
}

// ================== CARD HAND ==================

const CardHand = ({ 
  cards, 
  onPlayCard,
  currentStamina,
  currentAmmo,
  disabled
}: { 
  cards: any[]
  onPlayCard: (cardId: string) => void
  currentStamina: number
  currentAmmo: number
  disabled?: boolean
}) => {
  const [selectedCard, setSelectedCard] = useState<string | null>(null)

  return (
    <div className="flex gap-2 justify-center flex-wrap p-4">
      {cards.map((card, index) => {
        const canAfford = currentStamina >= card.staminaCost
        const hasAmmo = !card.ammoCost || currentAmmo >= card.ammoCost
        const isPlayable = canAfford && hasAmmo && !disabled
        
        return (
          <motion.div
            key={card.id}
            className={cn(
              'relative w-28 h-40 rounded-lg border-2 p-2 cursor-pointer transition-all',
              'bg-gradient-to-br from-slate-800 to-slate-900',
              isPlayable 
                ? 'border-amber-400/50 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-400/20' 
                : 'border-slate-600/50 opacity-50',
              selectedCard === card.id && 'ring-2 ring-amber-400 scale-110'
            )}
            initial={{ opacity: 0, y: 50, rotateZ: -5 + index * 2 }}
            animate={{ opacity: 1, y: 0, rotateZ: -5 + index * 2 }}
            whileHover={isPlayable ? { y: -20, scale: 1.1, rotateZ: 0 } : {}}
            onClick={() => {
              if (!isPlayable) return
              if (selectedCard === card.id) {
                onPlayCard(card.id)
                setSelectedCard(null)
              } else {
                setSelectedCard(card.id)
              }
            }}
          >
            {/* Card Type Icon */}
            <div className="text-2xl text-center mb-1">
              {card.type === 'attack' && '⚔️'}
              {card.type === 'defense' && '🛡️'}
              {card.type === 'movement' && '🏃'}
              {card.type === 'voice' && '📢'}
              {card.type === 'item' && '🎒'}
              {card.type === 'cold_steel' && '🔨'}
            </div>
            
            {/* Card Name */}
            <div className="text-xs font-bold text-white text-center mb-2 leading-tight">
              {card.name}
            </div>
            
            {/* Card Stats */}
            <div className="absolute bottom-2 left-2 right-2 space-y-1">
              {card.damage && (
                <div className="text-xs text-red-400 flex items-center gap-1">
                  💥 {card.damage}
                </div>
              )}
              <div className={cn(
                'text-xs flex items-center gap-1',
                canAfford ? 'text-yellow-400' : 'text-red-500'
              )}>
                ⚡ {card.staminaCost}
              </div>
              {card.ammoCost && (
                <div className={cn(
                  'text-xs flex items-center gap-1',
                  hasAmmo ? 'text-blue-400' : 'text-red-500'
                )}>
                  🔫 {card.ammoCost}
                </div>
              )}
            </div>
            
            {/* Target Ranks */}
            {card.targetRanks && (
              <div className="absolute top-1 right-1 text-xs text-white/50">
                R{card.targetRanks.join(',')}
              </div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}

// ================== BATTLE LOG ==================

const BattleLog = ({ log }: { log: any[] }) => {
  return (
    <div className="h-32 overflow-y-auto bg-black/40 rounded-lg p-2 text-xs space-y-1">
      <AnimatePresence>
        {log.slice(-10).reverse().map((entry, i) => (
          <motion.div
            key={entry.timestamp}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              'p-1 rounded',
              entry.actorId === 'player' && 'bg-blue-900/30',
              entry.actorId === 'system' && 'bg-purple-900/30',
              entry.actorId !== 'player' && entry.actorId !== 'system' && 'bg-red-900/30'
            )}
          >
            <span className="text-white/70">[Ход {entry.turn}]</span>{' '}
            <span className="font-bold text-white">{entry.actorName}</span>:{' '}
            <span className="text-amber-300">{entry.action}</span>
            {entry.damage && <span className="text-red-400"> ({entry.damage} урона)</span>}
            {entry.effects?.map((e: string, j: number) => (
              <span key={j} className="text-green-400"> • {e}</span>
            ))}
            {entry.voiceComment && (
              <div className="mt-1 italic text-purple-300">
                "{entry.voiceComment.comment}" — {entry.voiceComment.voiceName}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ================== MAIN COMPONENT ==================

export function BattleArena({ sessionId, deviceId, onBattleEnd }: BattleArenaProps) {
  const battle = useQuery(api.battleSystem.getActiveBattle, { deviceId })
  const playCard = useMutation(api.battleSystem.playCard)
  const endTurn = useMutation(api.battleSystem.endTurn)
  const fleeBattle = useMutation(api.battleSystem.fleeBattle)
  
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // Handle battle end
  useEffect(() => {
    if (battle && !battle.isActive) {
      const result = battle.phase as 'victory' | 'defeat' | 'flee'
      onBattleEnd?.(result)
    }
  }, [battle?.isActive, battle?.phase, onBattleEnd])

  if (!battle) {
    return (
      <div className="flex items-center justify-center h-96 text-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          className="w-8 h-8 border-2 border-white border-t-transparent rounded-full"
        />
      </div>
    )
  }

  const isPlayerTurn = battle.phase === 'player_turn'
  const currentActor = battle.turnOrder[battle.currentActorIndex]

  const handlePlayCard = async (cardId: string) => {
    if (isProcessing || !isPlayerTurn) return
    
    const card = battle.hand.find((c: any) => c.id === cardId)
    
    // Для атак нужна цель
    if (card?.type === 'attack' || card?.type === 'cold_steel') {
      if (!selectedTarget) {
        // Выбираем первого живого врага по умолчанию
        const firstAlive = battle.enemyStates.find((e: any) => e.hp > 0)
        if (firstAlive) setSelectedTarget(firstAlive.id)
        return
      }
    }
    
    setIsProcessing(true)
    try {
      const result = await playCard({
        deviceId,
        sessionId: battle._id,
        cardId,
        targetEnemyId: selectedTarget || undefined
      })
      
      if (result.clickMoment) {
        // Показываем эффект "Момента Щелчка"
        console.log('CLICK MOMENT!')
      }
      
      setSelectedTarget(null)
    } catch (error) {
      console.error('Error playing card:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleEndTurn = async () => {
    if (isProcessing || !isPlayerTurn) return
    
    setIsProcessing(true)
    try {
      await endTurn({ deviceId, sessionId: battle._id })
    } catch (error) {
      console.error('Error ending turn:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFlee = async () => {
    if (isProcessing || !isPlayerTurn) return
    
    setIsProcessing(true)
    try {
      await fleeBattle({ deviceId, sessionId: battle._id })
    } catch (error) {
      console.error('Error fleeing:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-bold text-white">
          Ход {battle.turn} • {isPlayerTurn ? 'Ваш ход' : 'Ход противника'}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleEndTurn}
            disabled={!isPlayerTurn || isProcessing}
            className={cn(
              'px-4 py-2 rounded-lg font-bold transition-all',
              isPlayerTurn 
                ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                : 'bg-slate-700 text-slate-500'
            )}
          >
            Завершить ход
          </button>
          {battle.playerRank === 4 && (
            <button
              onClick={handleFlee}
              disabled={!isPlayerTurn || isProcessing}
              className="px-4 py-2 rounded-lg font-bold bg-slate-600 hover:bg-slate-500 text-white"
            >
              Сбежать
            </button>
          )}
        </div>
      </div>

      {/* Battle Arena - Side View */}
      <div className="grid grid-cols-8 gap-2 mb-4">
        {/* Enemy Side (Ranks 4-1) */}
        {[4, 3, 2, 1].map(rank => {
          const enemiesInRank = battle.enemyStates.filter((e: CombatantState) => e.rank === rank && e.hp > 0)
          return (
            <RankPosition key={`enemy-${rank}`} rank={rank} side="enemy">
              <div className="space-y-1">
                {enemiesInRank.map((enemy: CombatantState) => (
                  <CombatantCard
                    key={enemy.id}
                    combatant={enemy}
                    isCurrentTurn={currentActor === enemy.id}
                    onClick={() => setSelectedTarget(enemy.id)}
                  />
                ))}
              </div>
            </RankPosition>
          )
        })}
        
        {/* Player Side (Ranks 1-4) */}
        {[1, 2, 3, 4].map(rank => (
          <RankPosition 
            key={`player-${rank}`} 
            rank={rank} 
            side="player"
            isActive={battle.playerRank === rank}
          >
            {battle.playerRank === rank && (
              <CombatantCard
                combatant={{
                  name: 'Игрок',
                  hp: battle.playerState.hp,
                  maxHp: battle.playerState.maxHp,
                  stamina: battle.playerState.stamina,
                  maxStamina: battle.playerState.maxStamina,
                  morale: battle.playerState.morale,
                  maxMorale: battle.playerState.maxMorale
                }}
                isPlayer
                isCurrentTurn={currentActor === 'player'}
              />
            )}
          </RankPosition>
        ))}
      </div>

      {/* Player Stats */}
      <div className="grid grid-cols-4 gap-4 mb-4 p-4 bg-black/30 rounded-lg">
        <div className="text-center">
          <div className="text-red-400 font-bold">❤️ HP</div>
          <div className="text-white">{battle.playerState.hp} / {battle.playerState.maxHp}</div>
        </div>
        <div className="text-center">
          <div className="text-yellow-400 font-bold">⚡ Выносливость</div>
          <div className="text-white">{battle.playerState.stamina} / {battle.playerState.maxStamina}</div>
        </div>
        <div className="text-center">
          <div className="text-purple-400 font-bold">💜 Мораль</div>
          <div className="text-white">{battle.playerState.morale} / {battle.playerState.maxMorale}</div>
        </div>
        <div className="text-center">
          <div className="text-blue-400 font-bold">🔫 Патроны</div>
          <div className="text-white">{battle.playerState.currentAmmo}</div>
        </div>
      </div>

      {/* Exhaustion Warning */}
      {battle.playerState.exhaustionLevel !== 'none' && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'mb-4 p-3 rounded-lg text-center font-bold',
            battle.playerState.exhaustionLevel === 'winded' && 'bg-yellow-900/50 text-yellow-300',
            battle.playerState.exhaustionLevel === 'exhausted' && 'bg-orange-900/50 text-orange-300',
            battle.playerState.exhaustionLevel === 'collapsed' && 'bg-red-900/50 text-red-300'
          )}
        >
          {battle.playerState.exhaustionLevel === 'winded' && '😮‍💨 Вы устали...'}
          {battle.playerState.exhaustionLevel === 'exhausted' && '😰 Вы истощены! Действия ограничены!'}
          {battle.playerState.exhaustionLevel === 'collapsed' && '💀 Вы на грани! Используйте "Восстановление"!'}
        </motion.div>
      )}

      {/* Card Hand */}
      <div className="mb-4">
        <div className="text-sm text-white/70 mb-2 text-center">
          Ваши карты ({battle.hand.length}) • Колода: {battle.deck.length} • Сброс: {battle.discard.length}
        </div>
        <CardHand
          cards={battle.hand}
          onPlayCard={handlePlayCard}
          currentStamina={battle.playerState.stamina}
          currentAmmo={battle.playerState.currentAmmo}
          disabled={!isPlayerTurn || isProcessing}
        />
      </div>

      {/* Battle Log */}
      <div className="mb-4">
        <div className="text-sm text-white/70 mb-1">Лог боя</div>
        <BattleLog log={battle.log} />
      </div>

      {/* Victory/Defeat Overlay */}
      <AnimatePresence>
        {(battle.phase === 'victory' || battle.phase === 'defeat' || battle.phase === 'flee') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.5, rotateZ: -10 }}
              animate={{ scale: 1, rotateZ: 0 }}
              className={cn(
                'text-6xl font-bold p-8 rounded-2xl',
                battle.phase === 'victory' && 'bg-green-900/50 text-green-300',
                battle.phase === 'defeat' && 'bg-red-900/50 text-red-300',
                battle.phase === 'flee' && 'bg-yellow-900/50 text-yellow-300'
              )}
            >
              {battle.phase === 'victory' && '🏆 ПОБЕДА!'}
              {battle.phase === 'defeat' && '💀 ПОРАЖЕНИЕ...'}
              {battle.phase === 'flee' && '🏃 ПОБЕГ!'}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default BattleArena










