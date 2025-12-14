/**
 * =====================================================
 * TUTORIAL BATTLE COMPONENT
 * Обучающий бой со стаминой и уроном
 * =====================================================
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/shared/lib/utils/cn'

// ================== ТИПЫ ==================

interface TutorialStep {
  id: string
  title: string
  description: string
  highlight?: 'stamina' | 'damage' | 'card' | 'enemy' | 'recovery'
  action?: 'attack' | 'recover' | 'wait'
  completed: boolean
}

interface TutorialEnemy {
  id: string
  name: string
  hp: number
  maxHp: number
  armor: number
  rank: number
}

interface TutorialPlayerState {
  hp: number
  maxHp: number
  stamina: number
  maxStamina: number
  exhaustionLevel: 'none' | 'winded' | 'exhausted' | 'collapsed'
}

interface TutorialCard {
  id: string
  name: string
  type: 'attack' | 'defense' | 'recovery'
  staminaCost: number
  damage?: string
  icon: string
  description: string
}

interface TutorialBattleProps {
  onComplete: (result: 'victory' | 'defeat') => void
  onSkip?: () => void
}

// ================== КОНСТАНТЫ ==================

const TUTORIAL_CARDS: TutorialCard[] = [
  {
    id: 'punch',
    name: 'Удар кулаком',
    type: 'attack',
    staminaCost: 15,
    damage: '1d4',
    icon: '👊',
    description: 'Базовая атака ближнего боя',
  },
  {
    id: 'heavy_punch',
    name: 'Сильный удар',
    type: 'attack',
    staminaCost: 35,
    damage: '2d6',
    icon: '💪',
    description: 'Мощная атака с высокой ценой',
  },
  {
    id: 'recover',
    name: 'Восстановление',
    type: 'recovery',
    staminaCost: 0,
    icon: '💨',
    description: 'Восстановить 30 выносливости',
  },
  {
    id: 'dodge',
    name: 'Уклонение',
    type: 'defense',
    staminaCost: 20,
    icon: '🏃',
    description: '+50% к уклонению на ход',
  },
]

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'intro',
    title: '⚔️ Добро пожаловать в бой!',
    description: 'Перед вами враг — Искажённый Мутант. Используйте карты для атаки.',
    completed: false,
  },
  {
    id: 'stamina_intro',
    title: '⚡ Выносливость (Stamina)',
    description: 'Каждое действие стоит выносливости. Следите за жёлтой шкалой!',
    highlight: 'stamina',
    completed: false,
  },
  {
    id: 'first_attack',
    title: '👊 Первая атака',
    description: 'Нажмите на карту "Удар кулаком", затем на врага для атаки.',
    highlight: 'card',
    action: 'attack',
    completed: false,
  },
  {
    id: 'damage_explained',
    title: '💥 Урон',
    description: 'Вы нанесли урон! Базовый урон минус броня врага = итоговый урон.',
    highlight: 'damage',
    completed: false,
  },
  {
    id: 'stamina_low',
    title: '😰 Низкая выносливость',
    description: 'Когда выносливость ниже 30%, вы устаёте. Используйте "Восстановление"!',
    highlight: 'recovery',
    action: 'recover',
    completed: false,
  },
  {
    id: 'finish_enemy',
    title: '🎯 Добейте врага',
    description: 'Продолжайте атаковать, пока HP врага не достигнет нуля!',
    action: 'attack',
    completed: false,
  },
]

// ================== УТИЛИТЫ ==================

function rollDice(notation: string): number {
  const match = notation.match(/(\d+)d(\d+)([+-]\d+)?/)
  if (!match) return 0
  
  const count = parseInt(match[1])
  const sides = parseInt(match[2])
  const modifier = match[3] ? parseInt(match[3]) : 0
  
  let total = modifier
  for (let i = 0; i < count; i++) {
    total += Math.floor(Math.random() * sides) + 1
  }
  return total
}

function getExhaustionLevel(stamina: number, maxStamina: number): 'none' | 'winded' | 'exhausted' | 'collapsed' {
  const percent = (stamina / maxStamina) * 100
  if (percent <= 0) return 'collapsed'
  if (percent < 10) return 'exhausted'
  if (percent < 30) return 'winded'
  return 'none'
}

// ================== КОМПОНЕНТЫ ==================

function TutorialTooltip({ 
  step, 
  onNext 
}: { 
  step: TutorialStep
  onNext: () => void 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96"
    >
      <div className="rounded-xl border-2 border-amber-400/50 bg-gradient-to-br from-slate-900/95 to-amber-900/30 p-4 shadow-xl shadow-amber-500/20 backdrop-blur-sm">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xl">📘</span>
          <h3 className="text-lg font-bold text-amber-300">{step.title}</h3>
        </div>
        <p className="mb-4 text-sm text-white/80">{step.description}</p>
        {!step.action && (
          <button
            onClick={onNext}
            className="w-full rounded-lg bg-amber-600 px-4 py-2 font-bold text-white transition-all hover:bg-amber-500"
          >
            Понятно →
          </button>
        )}
        {step.action && (
          <div className="text-center text-xs text-amber-400/70">
            Выполните действие для продолжения...
          </div>
        )}
      </div>
    </motion.div>
  )
}

function StaminaBar({ 
  current, 
  max, 
  highlight 
}: { 
  current: number
  max: number
  highlight?: boolean 
}) {
  const percent = (current / max) * 100
  const exhaustionLevel = getExhaustionLevel(current, max)

  return (
    <motion.div
      animate={highlight ? { scale: [1, 1.05, 1] } : {}}
      transition={{ repeat: highlight ? Infinity : 0, duration: 1 }}
      className={cn(
        'relative overflow-hidden rounded-lg border-2 p-3 transition-all',
        highlight ? 'border-amber-400 bg-amber-900/30 ring-2 ring-amber-400/50' : 'border-slate-600 bg-slate-800/50'
      )}
    >
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-bold text-yellow-400">⚡ ВЫНОСЛИВОСТЬ</span>
        <span className="text-white/70">{current}/{max}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-black/50">
        <motion.div
          className={cn(
            'h-full rounded-full transition-all',
            percent > 50 ? 'bg-yellow-400' : percent > 25 ? 'bg-orange-400' : 'bg-red-400'
          )}
          initial={{ width: '100%' }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      {exhaustionLevel !== 'none' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            'mt-2 text-center text-xs font-bold',
            exhaustionLevel === 'winded' && 'text-yellow-400',
            exhaustionLevel === 'exhausted' && 'text-orange-400',
            exhaustionLevel === 'collapsed' && 'text-red-400'
          )}
        >
          {exhaustionLevel === 'winded' && '😮‍💨 Устал'}
          {exhaustionLevel === 'exhausted' && '😰 Истощён!'}
          {exhaustionLevel === 'collapsed' && '💀 На пределе!'}
        </motion.div>
      )}
    </motion.div>
  )
}

function HealthBar({ 
  current, 
  max, 
  label, 
  color = 'red' 
}: { 
  current: number
  max: number
  label: string
  color?: 'red' | 'green' | 'blue'
}) {
  const percent = (current / max) * 100

  return (
    <div className="overflow-hidden rounded-lg border border-slate-600 bg-slate-800/50 p-2">
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className={cn(
          'font-bold',
          color === 'red' && 'text-red-400',
          color === 'green' && 'text-green-400',
          color === 'blue' && 'text-blue-400'
        )}>
          {label}
        </span>
        <span className="text-white/70">{current}/{max}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-black/50">
        <motion.div
          className={cn(
            'h-full rounded-full',
            color === 'red' && 'bg-red-500',
            color === 'green' && 'bg-green-500',
            color === 'blue' && 'bg-blue-500'
          )}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  )
}

function TutorialCardComponent({
  card,
  canAfford,
  selected,
  highlight,
  onClick,
}: {
  card: TutorialCard
  canAfford: boolean
  selected: boolean
  highlight?: boolean
  onClick: () => void
}) {
  return (
    <motion.button
      onClick={onClick}
      disabled={!canAfford}
      className={cn(
        'relative flex h-32 w-24 flex-col items-center justify-between rounded-xl border-2 p-2 transition-all',
        canAfford
          ? 'cursor-pointer bg-gradient-to-br from-slate-800 to-slate-900 hover:scale-105'
          : 'cursor-not-allowed opacity-50 bg-slate-900',
        selected && 'border-amber-400 ring-2 ring-amber-400/50',
        highlight && !selected && 'border-amber-400/50 animate-pulse',
        !selected && !highlight && 'border-slate-600'
      )}
      whileHover={canAfford ? { y: -8 } : {}}
      whileTap={canAfford ? { scale: 0.95 } : {}}
    >
      <span className="text-2xl">{card.icon}</span>
      <div className="text-center">
        <div className="text-xs font-bold text-white leading-tight">{card.name}</div>
        {card.damage && (
          <div className="text-xs text-red-400">💥 {card.damage}</div>
        )}
      </div>
      <div className={cn(
        'text-xs font-bold',
        canAfford ? 'text-yellow-400' : 'text-red-500'
      )}>
        ⚡ {card.staminaCost}
      </div>
    </motion.button>
  )
}

function EnemyCard({
  enemy,
  selected,
  highlight,
  onClick,
}: {
  enemy: TutorialEnemy
  selected: boolean
  highlight?: boolean
  onClick: () => void
}) {
  const hpPercent = (enemy.hp / enemy.maxHp) * 100

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative flex flex-col items-center rounded-xl border-2 p-4 transition-all',
        'bg-gradient-to-br from-red-900/80 to-red-800/60',
        selected && 'border-amber-400 ring-2 ring-amber-400/50',
        highlight && !selected && 'border-red-400/50 animate-pulse',
        !selected && !highlight && 'border-red-500/50'
      )}
      animate={enemy.hp <= 0 ? { opacity: 0.3, scale: 0.9 } : { opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <span className="text-4xl mb-2">👹</span>
      <div className="text-sm font-bold text-white mb-2">{enemy.name}</div>
      
      <div className="w-full space-y-1">
        <div className="flex items-center gap-2 text-xs">
          <span className="text-red-300">HP</span>
          <div className="flex-1 h-2 rounded-full bg-black/50 overflow-hidden">
            <motion.div
              className={cn(
                'h-full rounded-full',
                hpPercent > 50 ? 'bg-green-500' : hpPercent > 25 ? 'bg-yellow-500' : 'bg-red-500'
              )}
              animate={{ width: `${hpPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-white/70 w-12 text-right">{enemy.hp}/{enemy.maxHp}</span>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">🛡️ Броня: {enemy.armor}</span>
          <span className="text-slate-400">📍 Ранг: {enemy.rank}</span>
        </div>
      </div>

      {enemy.hp <= 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/70"
        >
          <span className="text-4xl">💀</span>
        </motion.div>
      )}
    </motion.button>
  )
}

function DamagePopup({ damage, x, y }: { damage: number; x: number; y: number }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -50, scale: 1.5 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="pointer-events-none fixed z-50 text-2xl font-bold text-red-400"
      style={{ left: x, top: y }}
    >
      -{damage}
    </motion.div>
  )
}

function CombatLog({ 
  entries 
}: { 
  entries: Array<{ id: number; text: string; type: 'player' | 'enemy' | 'system' }> 
}) {
  return (
    <div className="h-24 overflow-y-auto rounded-lg bg-black/40 p-2 text-xs space-y-1">
      <AnimatePresence>
        {entries.slice(-5).map((entry) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={cn(
              'rounded px-2 py-1',
              entry.type === 'player' && 'bg-blue-900/30 text-blue-200',
              entry.type === 'enemy' && 'bg-red-900/30 text-red-200',
              entry.type === 'system' && 'bg-purple-900/30 text-purple-200'
            )}
          >
            {entry.text}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ================== ГЛАВНЫЙ КОМПОНЕНТ ==================

export function TutorialBattle({ onComplete, onSkip }: TutorialBattleProps) {
  // Состояние игрока
  const [playerState, setPlayerState] = useState<TutorialPlayerState>({
    hp: 100,
    maxHp: 100,
    stamina: 100,
    maxStamina: 100,
    exhaustionLevel: 'none',
  })

  // Враг
  const [enemy, setEnemy] = useState<TutorialEnemy>({
    id: 'mutant_1',
    name: 'Искажённый Мутант',
    hp: 35,
    maxHp: 35,
    armor: 2,
    rank: 1,
  })

  // UI состояние
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [steps, setSteps] = useState<TutorialStep[]>(TUTORIAL_STEPS)
  const [selectedCard, setSelectedCard] = useState<string | null>(null)
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [damagePopups, setDamagePopups] = useState<Array<{ id: number; damage: number; x: number; y: number }>>([])
  const [combatLog, setCombatLog] = useState<Array<{ id: number; text: string; type: 'player' | 'enemy' | 'system' }>>([
    { id: 1, text: '⚔️ Бой начался! Выберите карту для атаки.', type: 'system' },
  ])

  const currentStep = steps[currentStepIndex]

  // Добавить запись в лог
  const addLog = useCallback((text: string, type: 'player' | 'enemy' | 'system') => {
    setCombatLog(prev => [...prev, { id: Date.now(), text, type }])
  }, [])

  // Показать всплывающий урон
  const showDamagePopup = useCallback((damage: number) => {
    const id = Date.now()
    setDamagePopups(prev => [...prev, { id, damage, x: 200 + Math.random() * 100, y: 150 }])
    setTimeout(() => {
      setDamagePopups(prev => prev.filter(p => p.id !== id))
    }, 1000)
  }, [])

  // Переход к следующему шагу
  const nextStep = useCallback(() => {
    if (currentStepIndex < steps.length - 1) {
      setSteps(prev => prev.map((s, i) => 
        i === currentStepIndex ? { ...s, completed: true } : s
      ))
      setCurrentStepIndex(prev => prev + 1)
    }
  }, [currentStepIndex, steps.length])

  // Атака
  const performAttack = useCallback(async (card: TutorialCard) => {
    if (isProcessing) return
    setIsProcessing(true)

    // Списываем стамину
    const newStamina = Math.max(0, playerState.stamina - card.staminaCost)
    const newExhaustion = getExhaustionLevel(newStamina, playerState.maxStamina)
    
    setPlayerState(prev => ({
      ...prev,
      stamina: newStamina,
      exhaustionLevel: newExhaustion,
    }))

    // Рассчитываем урон
    const baseDamage = card.damage ? rollDice(card.damage) : 0
    const actualDamage = Math.max(0, baseDamage - enemy.armor)

    // Наносим урон
    const newEnemyHp = Math.max(0, enemy.hp - actualDamage)
    setEnemy(prev => ({ ...prev, hp: newEnemyHp }))

    // Эффекты
    showDamagePopup(actualDamage)
    addLog(`👊 Вы нанесли ${actualDamage} урона (${baseDamage} - ${enemy.armor} брони)`, 'player')

    // Продвигаем обучение
    if (currentStep.id === 'first_attack') {
      setTimeout(() => {
        nextStep()
        setTimeout(nextStep, 2000) // Автоматически показываем объяснение урона
      }, 500)
    }

    // Проверяем победу
    if (newEnemyHp <= 0) {
      addLog('🏆 Враг повержен! Победа!', 'system')
      setTimeout(() => onComplete('victory'), 1500)
      setIsProcessing(false)
      return
    }

    // Ход врага
    setTimeout(() => {
      const enemyDamage = 5 + Math.floor(Math.random() * 5)
      const newPlayerHp = Math.max(0, playerState.hp - enemyDamage)
      setPlayerState(prev => ({ ...prev, hp: newPlayerHp }))
      addLog(`👹 Мутант наносит ${enemyDamage} урона!`, 'enemy')

      if (newPlayerHp <= 0) {
        addLog('💀 Вы потеряли сознание...', 'system')
        setTimeout(() => onComplete('defeat'), 1500)
      }

      // Если низкая стамина — показываем шаг про восстановление
      if (newStamina < 30 && currentStep.id !== 'stamina_low' && currentStep.id !== 'finish_enemy') {
        setCurrentStepIndex(4) // stamina_low
      } else if (currentStep.id === 'damage_explained') {
        nextStep() // К шагу про низкую стамину или финиш
      }

      setIsProcessing(false)
    }, 800)

    setSelectedCard(null)
    setSelectedTarget(null)
  }, [isProcessing, playerState, enemy, currentStep, nextStep, showDamagePopup, addLog, onComplete])

  // Восстановление
  const performRecovery = useCallback(() => {
    if (isProcessing) return
    setIsProcessing(true)

    const recoveredStamina = Math.min(playerState.maxStamina, playerState.stamina + 30)
    const newExhaustion = getExhaustionLevel(recoveredStamina, playerState.maxStamina)

    setPlayerState(prev => ({
      ...prev,
      stamina: recoveredStamina,
      exhaustionLevel: newExhaustion,
    }))

    addLog('💨 Вы восстановили 30 выносливости!', 'player')

    // Продвигаем обучение
    if (currentStep.id === 'stamina_low') {
      setTimeout(() => {
        nextStep()
      }, 500)
    }

    // Ход врага (слабее, т.к. мы восстанавливались)
    setTimeout(() => {
      const enemyDamage = 3 + Math.floor(Math.random() * 3)
      const newPlayerHp = Math.max(0, playerState.hp - enemyDamage)
      setPlayerState(prev => ({ ...prev, hp: newPlayerHp }))
      addLog(`👹 Мутант наносит ${enemyDamage} урона (слабый удар)`, 'enemy')

      if (newPlayerHp <= 0) {
        addLog('💀 Вы потеряли сознание...', 'system')
        setTimeout(() => onComplete('defeat'), 1500)
      }

      setIsProcessing(false)
    }, 800)

    setSelectedCard(null)
  }, [isProcessing, playerState, currentStep, nextStep, addLog, onComplete])

  // Обработчик клика по карте
  const handleCardClick = (card: TutorialCard) => {
    if (card.type === 'recovery') {
      performRecovery()
    } else if (card.type === 'attack') {
      if (selectedCard === card.id) {
        // Если карта уже выбрана — атакуем
        if (enemy.hp > 0) {
          performAttack(card)
        }
      } else {
        setSelectedCard(card.id)
        setSelectedTarget(enemy.id)
      }
    }
  }

  // Эффект для автоматических переходов
  useEffect(() => {
    if (currentStepIndex === 1) {
      // После intro автоматически показываем stamina_intro
      const timer = setTimeout(() => nextStep(), 3000)
      return () => clearTimeout(timer)
    }
  }, [currentStepIndex, nextStep])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-red-900/20 to-slate-900 p-4">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="text-lg font-bold text-white">
          📘 Обучение: Боевая система
        </div>
        {onSkip && (
          <button
            onClick={onSkip}
            className="rounded-lg bg-slate-700 px-3 py-1 text-sm text-white/70 hover:bg-slate-600 hover:text-white"
          >
            Пропустить
          </button>
        )}
      </div>

      {/* Player Stats */}
      <div className="mb-4 grid grid-cols-2 gap-3">
        <HealthBar current={playerState.hp} max={playerState.maxHp} label="❤️ HP" color="red" />
        <StaminaBar
          current={playerState.stamina}
          max={playerState.maxStamina}
          highlight={currentStep.highlight === 'stamina'}
        />
      </div>

      {/* Enemy */}
      <div className="mb-4 flex justify-center">
        <EnemyCard
          enemy={enemy}
          selected={selectedTarget === enemy.id}
          highlight={currentStep.highlight === 'enemy'}
          onClick={() => setSelectedTarget(enemy.id)}
        />
      </div>

      {/* Damage Popups */}
      <AnimatePresence>
        {damagePopups.map(popup => (
          <DamagePopup key={popup.id} damage={popup.damage} x={popup.x} y={popup.y} />
        ))}
      </AnimatePresence>

      {/* Cards */}
      <div className="mb-4">
        <div className="mb-2 text-center text-sm text-white/70">Ваши карты</div>
        <div className="flex justify-center gap-2 flex-wrap">
          {TUTORIAL_CARDS.map(card => (
            <TutorialCardComponent
              key={card.id}
              card={card}
              canAfford={playerState.stamina >= card.staminaCost}
              selected={selectedCard === card.id}
              highlight={
                (currentStep.highlight === 'card' && card.type === 'attack') ||
                (currentStep.highlight === 'recovery' && card.type === 'recovery')
              }
              onClick={() => handleCardClick(card)}
            />
          ))}
        </div>
      </div>

      {/* Combat Log */}
      <div className="mb-4">
        <div className="mb-1 text-sm text-white/70">Лог боя</div>
        <CombatLog entries={combatLog} />
      </div>

      {/* Tutorial Tooltip */}
      <AnimatePresence mode="wait">
        {currentStep && (
          <TutorialTooltip
            key={currentStep.id}
            step={currentStep}
            onNext={nextStep}
          />
        )}
      </AnimatePresence>

      {/* Progress Indicator */}
      <div className="fixed bottom-20 left-4 right-4 flex justify-center gap-1 md:left-auto md:right-4 md:w-96">
        {steps.map((step, i) => (
          <div
            key={step.id}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-all',
              i < currentStepIndex && 'bg-green-500',
              i === currentStepIndex && 'bg-amber-400',
              i > currentStepIndex && 'bg-slate-600'
            )}
          />
        ))}
      </div>
    </div>
  )
}

export default TutorialBattle

















