import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
    DndContext,
    DragOverlay,
    MouseSensor,
    TouchSensor,
    useDroppable,
    useSensor,
    useSensors,
    type DragEndEvent,
    type DragStartEvent,
} from '@dnd-kit/core'
import { Backpack, Trophy, X, Terminal, Hourglass, RefreshCw, SquareTerminal } from 'lucide-react'
import { NPC_CARDS } from '../model/constants'
import type { Achievement, BattleSession, Combatant, CombatCard } from '../model/types'
import { Side, CardType } from '../model/types'
import { SCENARIOS, type ScenarioId } from '../model/scenarios'
import RankLane from './components/RankLane'
import type { FloatingTextEvent } from './components/FloatingText'
import { sortTurnQueue, canPlayCard, rollAttack } from '../model/utils'
import CombatCardUI from './components/CombatCardUI'
import DraggableCombatCard from './components/DraggableCombatCard'
import GaugeUI from './components/GaugeUI'

type DreyzabBattleResult = 'victory' | 'defeat'

type DreyzabBattleProps = {
    onBattleEnd?: (result: DreyzabBattleResult) => void
    scenarioId?: ScenarioId
    renderEquipmentOverlay?: (props: { onClose: () => void; title?: string }) => ReactNode
}

type BattleDropZoneProps = {
    id: string
    disabled: boolean
    data: Record<string, unknown>
    isActive: boolean
    isValid: boolean
    highlightClassName: string
    children: ReactNode
}

const BattleDropZone = ({ id, disabled, data, isActive, isValid, highlightClassName, children }: BattleDropZoneProps) => {
    const { setNodeRef, isOver } = useDroppable({ id, disabled, data })

    return (
        <div ref={setNodeRef} className="relative h-full">
            {children}
            {isActive && isValid && (
                <div
                    className={[
                        'absolute inset-1 rounded-xl pointer-events-none transition-all',
                        highlightClassName,
                        isOver ? 'ring-4 opacity-100' : 'ring-2 opacity-40',
                    ].join(' ')}
                />
            )}
        </div>
    )
}

type CardPlayTarget =
    | { type: 'enemy'; enemyId: string }
    | { type: 'player-rank'; rank: number }

const INITIAL_ACHIEVEMENTS: Achievement[] = [
    {
        id: 'first_win',
        title: 'First Drop',
        description: 'Complete your first successful mission.',
        icon: 'ÐYZî',
        unlocked: false,
    },
    {
        id: 'no_damage',
        title: 'Untouchable',
        description: 'Win a battle without taking any damage.',
        icon: 'ÐY>­‹÷?',
        unlocked: false,
    },
    {
        id: 'tactical_genius',
        title: 'Tactical Genius',
        description: 'Perform 3 attacks in a single turn.',
        icon: 'ÐYõÿ',
        unlocked: false,
    },
    {
        id: 'survivor',
        title: 'Last Breath',
        description: 'Win a battle with less than 10% HP remaining.',
        icon: 'ÐY¸÷',
        unlocked: false,
    },
    {
        id: 'scorpion_slayer',
        title: 'Scorpion Slayer',
        description: 'Neutralize a Rail Scorpion.',
        icon: "ÐYÝ'",
        unlocked: false,
    },
]

const ACHIEVEMENTS_STORAGE_KEY = 'dreyzab_achievements'

const readAchievements = (): Achievement[] => {
    const saved = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY)
    if (!saved) return INITIAL_ACHIEVEMENTS
    try {
        const parsed = JSON.parse(saved) as unknown
        if (!Array.isArray(parsed)) return INITIAL_ACHIEVEMENTS
        return parsed as Achievement[]
    } catch {
        return INITIAL_ACHIEVEMENTS
    }
}

const writeAchievements = (value: Achievement[]) => {
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(value))
}

const createInitialSession = (scenarioId: ScenarioId = 'default'): { session: BattleSession; defaultTargetId: string | null } => {
    const scenarioFactory = SCENARIOS[scenarioId] ?? SCENARIOS['default']
    const session = scenarioFactory()

    return {
        session,
        defaultTargetId: session.enemies[0]?.id ?? null,
    }
}

// Battle component
export default function DreyzabBattle({ onBattleEnd, scenarioId = 'default', renderEquipmentOverlay }: DreyzabBattleProps) {
    const [initial] = useState(() => createInitialSession(scenarioId))
    const [battle, setBattle] = useState<BattleSession>(initial.session)
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(initial.defaultTargetId)
    const [achievements, setAchievements] = useState<Achievement[]>(() => readAchievements())
    const [showAchievements, setShowAchievements] = useState(false)
    const [showEquipment, setShowEquipment] = useState(false)
    const [combatEvents, setCombatEvents] = useState<(FloatingTextEvent & { unitId: string })[]>([])
    const [activeDragCardId, setActiveDragCardId] = useState<string | null>(null)

    const logEndRef = useRef<HTMLDivElement>(null)
    const battleRef = useRef<BattleSession>(battle)
    const enemyActionTimerRef = useRef<number | null>(null)
    const autoAdvanceTimerRef = useRef<number | null>(null)
    const reportedResultRef = useRef<DreyzabBattleResult | null>(null)
    const scriptedEventTriggeredRef = useRef(false)

    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: { distance: 5 },
        }),
        useSensor(TouchSensor, {
            activationConstraint: { delay: 150, tolerance: 5 },
        })
    )

    const addCombatEvent = useCallback((unitId: string, text: string, type: 'damage' | 'heal' | 'miss' | 'debuff' | 'buff') => {
        const id = Math.random().toString(36).substr(2, 9)
        const color = type === 'damage' ? '#ef4444' :
            type === 'heal' ? '#10b981' :
                type === 'debuff' ? '#a855f7' :
                    type === 'buff' ? '#3b82f6' :
                        '#fbbf24'
        setCombatEvents((prev) => [...prev, { id, text, color, unitId }])

        // Auto-cleanup
        setTimeout(() => {
            setCombatEvents((prev) => prev.filter((e) => e.id !== id))
        }, 2000)
    }, [])

    useEffect(() => {
        if (scenarioId !== 'boss_train_prologue') return
        if (scriptedEventTriggeredRef.current) return

        if (battle.turnCount >= 2 && battle.phase === 'ENEMY_TURN') {
            const condIdx = battle.players.findIndex(p => p.id === 'npc_cond' && !p.isDead)
            if (condIdx >= 0) {
                scriptedEventTriggeredRef.current = true

                setTimeout(() => {
                    setBattle(prev => {
                        const newLogs = [...prev.logs, "!!! ЭКЗЕКУТОР РАЗРЫВАЕТ ПРОВОДНИКА !!!", "Бруно: «Лови подарочек, тварь!»"]

                        const players = [...prev.players]
                        // Kill conductor
                        const cond = players[condIdx]
                        players[condIdx] = { ...cond, isDead: true, resources: { ...cond.resources, hp: 0 } }

                        // Create Bruno
                        const bruno: Combatant = {
                            id: 'npc_bruno',
                            name: 'Бруно Вебер',
                            side: Side.PLAYER,
                            rank: cond.rank, // Talked Conductor's place
                            resources: { hp: 100, maxHp: 100, ap: 3, maxAp: 3, mp: 0, maxMp: 0, wp: 50, maxWp: 50, pp: 0, maxPp: 100 },
                            bonusAp: 0, initiative: 15, armor: 4, isDead: false,
                            effects: [], weaponHeat: 0, isJammed: false, ammo: 5,
                        }

                        // Determine new set of players (keep dead conductor for log/visual or remove?)
                        // If we remove him, rank management is easier. 
                        // Let's replace him in array but mark dead, and push Bruno.
                        // Actually, let's swap him out active duty to avoid clutter or stacking.
                        // But seeing the body is cool using `isDead`.
                        // Problem: 2 units on same rank?
                        // Hack: Move Bruno to Rank 1 and shift others? No.
                        // Let's just push Bruno. `sortTurnQueue` handles order.

                        // Add Bruno cards
                        const brunoCards = NPC_CARDS.filter(c => c.id.startsWith('bruno')).map(c => ({ ...c, ownerId: 'npc_bruno' }))
                        const newHand = [...prev.playerHand, ...brunoCards]

                        // Ensure turn queue is updated
                        const newPlayers = [...players, bruno]
                        const newQueue = sortTurnQueue(newPlayers, prev.enemies)

                        return {
                            ...prev,
                            players: newPlayers,
                            turnQueue: newQueue,
                            playerHand: newHand,
                            logs: newLogs
                        }
                    })
                    addCombatEvent('npc_cond', 'FATAL', 'damage')
                }, 1500)
            }
        }
    }, [battle.turnCount, battle.phase, battle.players, scenarioId, addCombatEvent])

    useEffect(() => {
        battleRef.current = battle
    }, [battle])

    useEffect(() => {
        if (!onBattleEnd) return

        if (battle.phase === 'VICTORY' && reportedResultRef.current !== 'victory') {
            reportedResultRef.current = 'victory'
            onBattleEnd('victory')
        }

        if (battle.phase === 'DEFEAT' && reportedResultRef.current !== 'defeat') {
            reportedResultRef.current = 'defeat'
            onBattleEnd('defeat')
        }

        if (battle.phase !== 'VICTORY' && battle.phase !== 'DEFEAT') {
            reportedResultRef.current = null
        }
    }, [battle.phase, onBattleEnd])

    useEffect(() => {
        writeAchievements(achievements)
    }, [achievements])

    const unlockAchievement = useCallback((id: string) => {
        setAchievements((prev) => {
            const achievement = prev.find((a) => a.id === id)
            if (achievement && !achievement.unlocked) {
                return prev.map((a) => (a.id === id ? { ...a, unlocked: true } : a))
            }
            return prev
        })
    }, [])

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [battle.logs])

    const clearTimers = useCallback(() => {
        if (enemyActionTimerRef.current !== null) {
            window.clearTimeout(enemyActionTimerRef.current)
            enemyActionTimerRef.current = null
        }
        if (autoAdvanceTimerRef.current !== null) {
            window.clearTimeout(autoAdvanceTimerRef.current)
            autoAdvanceTimerRef.current = null
        }
    }, [])

    const advanceTurn = useCallback(() => {
        clearTimers()
        setBattle((prev) => {
            if (prev.phase === 'VICTORY' || prev.phase === 'DEFEAT') return prev

            const currentIdx = prev.turnQueue.indexOf(prev.activeUnitId ?? '')
            const currentUnit = [...prev.players, ...prev.enemies].find((u) => u.id === prev.activeUnitId)

            let nextPlayers = [...prev.players]
            let nextEnemies = [...prev.enemies]

            if (currentUnit?.side === Side.PLAYER) {
                const playerIndex = nextPlayers.findIndex((p) => p.id === currentUnit.id)
                if (playerIndex >= 0) {
                    const carryOver = currentUnit.resources.ap > 0 ? 1 : 0
                    nextPlayers[playerIndex] = {
                        ...currentUnit,
                        bonusAp: carryOver,
                        resources: { ...currentUnit.resources, ap: 0 },
                    }
                }
            }

            let nextIdx = (currentIdx + 1) % prev.turnQueue.length
            const isNewRound = nextIdx === 0

            if (isNewRound) {
                nextPlayers = nextPlayers.map((p) => ({
                    ...p,
                    resources: { ...p.resources, ap: p.resources.maxAp + p.bonusAp },
                    bonusAp: 0,
                }))
                nextEnemies = nextEnemies.map((e) => ({
                    ...e,
                    resources: { ...e.resources, ap: e.resources.maxAp },
                }))

                const newQueue = sortTurnQueue(nextPlayers, nextEnemies)
                const nextId = newQueue[0] ?? null
                const nextUnit = [...nextPlayers, ...nextEnemies].find((u) => u.id === nextId)

                return {
                    ...prev,
                    players: nextPlayers,
                    enemies: nextEnemies,
                    activeUnitId: nextId,
                    turnQueue: newQueue,
                    phase: nextUnit?.side === Side.PLAYER ? 'PLAYER_TURN' : 'ENEMY_TURN',
                    turnCount: prev.turnCount + 1,
                    stats: { ...prev.stats, attacksInOneTurn: 0 },
                }
            }

            let safetyCounter = 0
            while (safetyCounter < prev.turnQueue.length) {
                const nextIdCandidate = prev.turnQueue[nextIdx]
                const unit = [...nextPlayers, ...nextEnemies].find((u) => u.id === nextIdCandidate)
                if (unit && !unit.isDead) break
                nextIdx = (nextIdx + 1) % prev.turnQueue.length
                safetyCounter++
            }

            const nextId = prev.turnQueue[nextIdx] ?? null
            const nextUnit = [...nextPlayers, ...nextEnemies].find((u) => u.id === nextId)

            return {
                ...prev,
                players: nextPlayers,
                enemies: nextEnemies,
                activeUnitId: nextId,
                phase: nextUnit?.side === Side.PLAYER ? 'PLAYER_TURN' : 'ENEMY_TURN',
                stats: { ...prev.stats, attacksInOneTurn: 0 },
            }
        })
    }, [clearTimers])

    const resolveEnemyAction = useCallback(
        (enemyId: string) => {
            setBattle((prev) => {
                if (prev.phase !== 'ENEMY_TURN') return prev

                const enemyIndex = prev.enemies.findIndex((e) => e.id === enemyId)
                if (enemyIndex < 0) return prev

                const enemy = prev.enemies[enemyIndex]
                if (enemy.isDead) return prev

                const players = prev.players.map((p) => ({ ...p }))
                const enemies = prev.enemies.map((e) => ({ ...e }))
                const nextLogs = [...prev.logs]

                const alivePlayers = players.filter((p) => !p.isDead)
                if (alivePlayers.length === 0) return prev

                const target = [...alivePlayers].sort(
                    (a, b) => (a.rank + enemy.rank - 1) - (b.rank + enemy.rank - 1)
                )[0]

                let damageDealt = 0
                // Correct distance for mirrored lanes: (Enemy Rank) + (Player Rank) - 1
                // Assuming R1 vs R1 is distance 1
                const distance = enemy.rank + target.rank - 1

                if (distance > 2) {
                    enemies[enemyIndex] = { ...enemies[enemyIndex], rank: Math.max(1, enemy.rank - 1) }
                    nextLogs.push(`${enemy.name} advances to rank ${enemies[enemyIndex].rank}.`)
                } else {
                    // Perform hit roll with dodge system
                    const targetIndex = players.findIndex((p) => p.id === target.id)
                    const attackResult = rollAttack(enemy, target, 70) // Enemy base accuracy 70%

                    if (attackResult.hit) {
                        // Hit - deal damage
                        const dmg = enemy.name === 'Mutant Marauder' ? 10 : Math.max(1, 10 - target.armor)
                        const nextHp = Math.max(0, players[targetIndex].resources.hp - dmg)
                        players[targetIndex] = {
                            ...players[targetIndex],
                            resources: { ...players[targetIndex].resources, hp: nextHp },
                            isDead: nextHp <= 0,
                        }
                        damageDealt = dmg
                        nextLogs.push(`${enemy.name} strikes ${target.name} for ${dmg} DMG! (roll: ${attackResult.roll}/${attackResult.needed})`)
                        addCombatEvent(target.id, `-${dmg}`, 'damage')
                        if (nextHp <= 0) nextLogs.push(`${target.name} offline.`)
                    } else {
                        // Miss - target dodged
                        nextLogs.push(`${target.name} dodges ${enemy.name}'s attack! (${attackResult.dodgeChance}% dodge from ${target.resources.ap} unused AP)`)
                        addCombatEvent(target.id, 'DODGE!', 'miss')
                    }
                }

                const allPlayersDead = players.every((p) => p.isDead)

                return {
                    ...prev,
                    players,
                    enemies,
                    logs: nextLogs,
                    stats: { ...prev.stats, damageTaken: prev.stats.damageTaken + damageDealt },
                    phase: allPlayersDead ? 'DEFEAT' : prev.phase,
                }
            })

            if (autoAdvanceTimerRef.current !== null) window.clearTimeout(autoAdvanceTimerRef.current)
            autoAdvanceTimerRef.current = window.setTimeout(() => {
                const current = battleRef.current
                if (current.phase === 'DEFEAT' || current.phase === 'VICTORY') return
                advanceTurn()
            }, 500)
        },
        [advanceTurn, addCombatEvent]
    )

    useEffect(() => {
        if (enemyActionTimerRef.current !== null) window.clearTimeout(enemyActionTimerRef.current)

        if (battle.phase !== 'ENEMY_TURN' || !battle.activeUnitId) return
        const activeUnit = [...battle.players, ...battle.enemies].find((u) => u.id === battle.activeUnitId)
        if (!activeUnit || activeUnit.side !== Side.ENEMY || activeUnit.isDead) return

        enemyActionTimerRef.current = window.setTimeout(() => resolveEnemyAction(activeUnit.id), 1000)
        return () => {
            if (enemyActionTimerRef.current !== null) window.clearTimeout(enemyActionTimerRef.current)
        }
    }, [battle.activeUnitId, battle.enemies, battle.phase, battle.players, resolveEnemyAction])

    const playCard = useCallback(
        (card: CombatCard, target?: CardPlayTarget) => {
            if (!canPlayCard({ session: battle, card })) return

            setBattle((prev) => {
                if (prev.phase !== 'PLAYER_TURN') return prev

                const playerIndex = prev.players.findIndex((p) => p.id === prev.activeUnitId)
                if (playerIndex < 0) return prev

                const players = prev.players.map((p) => ({ ...p }))
                const enemies = prev.enemies.map((e) => ({ ...e }))
                const nextLogs = [...prev.logs]

                const actingPlayer = players[playerIndex]
                if (actingPlayer.resources.ap < card.apCost || actingPlayer.resources.wp < card.staminaCost) return prev

                const spendCosts = (unit: Combatant) => ({
                    ...unit,
                    resources: {
                        ...unit.resources,
                        ap: unit.resources.ap - card.apCost,
                        wp: unit.resources.wp - card.staminaCost,
                    },
                })

                let nextAttacksInTurn = prev.stats.attacksInOneTurn

                if (card.type === CardType.ATTACK) {
                    const enemyId = target?.type === 'enemy' ? target.enemyId : selectedTargetId
                    const targetIndex = enemies.findIndex((e) => e.id === enemyId)
                    const enemy = targetIndex >= 0 ? enemies[targetIndex] : null

                    if (!enemy || enemy.isDead) {
                        nextLogs.push('No valid target.')
                        return { ...prev, logs: nextLogs }
                    }

                    const dist = Math.abs(enemy.rank + actingPlayer.rank - 1)
                    const inRange = card.optimalRange.length === 0 || card.optimalRange.includes(dist)

                    if (!inRange) {
                        nextLogs.push(`${actingPlayer.name} cannot reach ${enemy.name} with ${card.name}.`)
                        return { ...prev, logs: nextLogs }
                    }

                    const nextPlayer = spendCosts(actingPlayer)
                    players[playerIndex] = nextPlayer
                    nextAttacksInTurn++

                    // Perform hit roll with dodge system
                    const attackResult = rollAttack(nextPlayer, enemy, 75) // Player base accuracy 75%

                    if (attackResult.hit) {
                        // Hit - deal damage
                        let damage = Math.floor(card.damage - enemy.armor)
                        damage = Math.max(1, damage)

                        const nextHp = Math.max(0, enemy.resources.hp - damage)
                        enemies[targetIndex] = {
                            ...enemy,
                            resources: { ...enemy.resources, hp: nextHp },
                            isDead: nextHp <= 0,
                        }

                        if (nextHp <= 0 && enemy.name === 'Rail Scorpion') unlockAchievement('scorpion_slayer')
                        nextLogs.push(`${nextPlayer.name} uses ${card.name}: ${damage} DMG to ${enemy.name}! (roll: ${attackResult.roll}/${attackResult.needed})`)
                        addCombatEvent(enemy.id, `-${damage}`, 'damage')
                    } else {
                        // Miss - enemy dodged
                        nextLogs.push(`${enemy.name} dodges ${nextPlayer.name}'s ${card.name}! (${attackResult.dodgeChance}% dodge from ${enemy.resources.ap} AP)`)
                        addCombatEvent(enemy.id, 'DODGE!', 'miss')
                    }
                } else if (card.type === CardType.MOVEMENT) {
                    const desiredRank = target?.type === 'player-rank' ? target.rank : actingPlayer.rank - 1
                    const isAdjacent = Math.abs(desiredRank - actingPlayer.rank) === 1
                    const inBounds = desiredRank >= 1 && desiredRank <= 4

                    if (!isAdjacent || !inBounds) {
                        nextLogs.push(`${actingPlayer.name} cannot reposition there.`)
                        return { ...prev, logs: nextLogs }
                    }

                    const nextPlayer = spendCosts(actingPlayer)

                    const occupantIndex = players.findIndex(
                        (p) => p.id !== nextPlayer.id && !p.isDead && p.rank === desiredRank
                    )

                    if (occupantIndex >= 0) {
                        players[occupantIndex] = { ...players[occupantIndex], rank: nextPlayer.rank }
                    }

                    players[playerIndex] = { ...nextPlayer, rank: desiredRank }
                    nextLogs.push(`${nextPlayer.name} repositions to rank ${desiredRank}.`)
                } else if (card.type === CardType.VOICE) {
                    const nextPlayer = spendCosts(actingPlayer)
                    players[playerIndex] = {
                        ...nextPlayer,
                        resources: {
                            ...nextPlayer.resources,
                            wp: Math.min(nextPlayer.resources.maxWp, nextPlayer.resources.wp + 30),
                        },
                    }
                    nextLogs.push(`${players[playerIndex].name} stabilizes vitals.`)
                    addCombatEvent(actingPlayer.id, '+30 WP', 'heal')
                } else if (card.type === CardType.ANALYSIS) {
                    const enemyId = target?.type === 'enemy' ? target.enemyId : selectedTargetId
                    const targetIndex = enemies.findIndex((e) => e.id === enemyId)
                    const enemy = targetIndex >= 0 ? enemies[targetIndex] : null

                    if (!enemy || enemy.isDead) {
                        nextLogs.push('No valid target for analysis.')
                        return { ...prev, logs: nextLogs }
                    }

                    const nextPlayer = spendCosts(actingPlayer)
                    players[playerIndex] = nextPlayer

                    const currentScan = enemy.scannedLevel || 0
                    const nextScan = Math.min(2, currentScan + 1)

                    enemies[targetIndex] = {
                        ...enemy,
                        scannedLevel: nextScan
                    }

                    // Log info based on scan level
                    let info = ''
                    if (nextScan >= 1) info += `HP: ${enemy.resources.hp}/${enemy.resources.maxHp} | ARM: ${enemy.armor}`
                    if (nextScan >= 2) info += ` | AP: ${enemy.resources.ap} | THR: ${enemy.threatLevel || 'Unknown'}`

                    nextLogs.push(`${nextPlayer.name} scans ${enemy.name}. Analysis: [${info}]`)
                    addCombatEvent(enemy.id, 'SCANNED', 'debuff') // Visual feedback
                } else if (card.type === CardType.DEFENSE) {
                    nextLogs.push('Defense protocols unavailable.')
                    return { ...prev, logs: nextLogs }
                }

                const allDead = enemies.every((e) => e.isDead)

                if (allDead) {
                    unlockAchievement('first_win')
                    if (prev.stats.damageTaken === 0) unlockAchievement('no_damage')
                }

                return {
                    ...prev,
                    players,
                    enemies,
                    logs: nextLogs,
                    phase: allDead ? 'VICTORY' : prev.phase,
                    stats: { ...prev.stats, attacksInOneTurn: nextAttacksInTurn },
                }
            })

            if (autoAdvanceTimerRef.current !== null) window.clearTimeout(autoAdvanceTimerRef.current)
            autoAdvanceTimerRef.current = window.setTimeout(() => {
                const current = battleRef.current
                if (current.phase !== 'PLAYER_TURN') return

                const activePlayer = current.players.find((p) => p.id === current.activeUnitId)
                if (!activePlayer) return

                const allEnemiesDead = current.enemies.every((e) => e.isDead)
                if (activePlayer.resources.ap <= 0 && !allEnemiesDead) advanceTurn()
            }, 800)
        },
        [advanceTurn, battle, selectedTargetId, unlockAchievement, addCombatEvent]
    )

    const resetBattle = useCallback(() => {
        clearTimers()
        const next = createInitialSession()
        setBattle(next.session)
        setSelectedTargetId(next.defaultTargetId)
        setShowAchievements(false)
        reportedResultRef.current = null
    }, [clearTimers])

    const handleTouchScrub = useCallback((e: React.TouchEvent) => {
        const touch = e.touches[0]
        const { clientX, clientY } = touch

        // Расширенный поиск: проверяем не только точку касания, но и область над/под ней
        // Это позволяет легче выбирать карты, не удерживая палец точно на них
        const verticalOffsets = [0, -20, 20, -40, 40, -60, 60, -100, 100]
        let foundId: string | null = null

        for (const offset of verticalOffsets) {
            const el = document.elementFromPoint(clientX, clientY + offset)
            const cardEl = el?.closest('[data-card-id]')
            if (cardEl) {
                foundId = cardEl.getAttribute('data-card-id')
                break
            }
        }

        if (foundId) {
            return
        } else {
            // Если мы всё еще в горизонтальной зоне карт, но выше/ниже допустимого,
            // можно не сбрасывать выделение сразу для плавности (опционально)
            return
        }
    }, [])

    const handleTouchEnd = useCallback(() => {
    }, [])

    const activeUnit = useMemo(() => {
        if (!battle.activeUnitId) return null
        return [...battle.players, ...battle.enemies].find((u) => u.id === battle.activeUnitId) ?? null
    }, [battle.activeUnitId, battle.enemies, battle.players])

    const activePlayer = activeUnit?.side === Side.PLAYER ? activeUnit : null

    const resolveLocalPortrait = useCallback((unit: Combatant): string | null => {
        const id = unit.id.toLowerCase()
        const name = unit.name.toLowerCase()

        // Player (p1) portrait
        if (unit.side === Side.PLAYER && (id === 'p1' || name === 'player')) {
            return '/images/characters/Player.png'
        }

        // Conductor / Provodnik
        if (unit.side === Side.PLAYER && (id === 'npc_cond' || name.includes('conductor') || name.includes('проводник'))) {
            return '/images/npcs/Provodnik.png'
        }

        // Party members
        if (id.includes('bruno') || name.includes('bruno')) return '/images/characters/Bruno.png'
        if (id.includes('lena') || name.includes('lena')) return '/images/characters/Lena.png'
        if (id.includes('otto') || name.includes('otto')) return '/images/characters/Otto.png'
        if (id.includes('adel') || id.includes('adele') || name.includes('adel')) return '/images/characters/Adel.png'

        // Enemies
        if (unit.side === Side.ENEMY && name.includes('mutant marauder')) return '/images/enemy/melkiyShuk.png'
        if (unit.side === Side.ENEMY && (id === 'boss' || name.includes('executioner'))) return '/images/enemy/BossPalach.png'

        return null
    }, [])

    const resolvePortrait = useCallback((unit: Combatant): string => {
        const local = resolveLocalPortrait(unit)
        if (local) return local
        return unit.side === Side.PLAYER
            ? `https://api.dicebear.com/7.x/avataaars/svg?seed=operator${unit.id}&backgroundColor=transparent&style=straight`
            : `https://api.dicebear.com/7.x/bottts/svg?seed=enemy${unit.id}&backgroundColor=transparent`
    }, [resolveLocalPortrait])

    const activeDraggedCard = useMemo(() => {
        if (!activeDragCardId) return null
        return battle.playerHand.find((c) => c.id === activeDragCardId) ?? null
    }, [activeDragCardId, battle.playerHand])

    const dragHighlightClassName = useMemo(() => {
        if (!activeDraggedCard) return ''
        switch (activeDraggedCard.type) {
            case CardType.ATTACK:
                return 'ring-red-500/60 bg-red-950/10'
            case CardType.MOVEMENT:
                return 'ring-blue-500/60 bg-blue-950/10'
            case CardType.DEFENSE:
                return 'ring-emerald-500/60 bg-emerald-950/10'
            case CardType.VOICE:
                return 'ring-amber-500/60 bg-amber-950/10'
            case CardType.ANALYSIS:
                return 'ring-purple-500/60 bg-purple-950/10'
            default:
                return ''
        }
    }, [activeDraggedCard])

    const validEnemyDropIds = useMemo(() => {
        const ids = new Set<string>()
        if (!activeDraggedCard || !activePlayer) return ids
        if (activeDraggedCard.type !== CardType.ATTACK && activeDraggedCard.type !== CardType.ANALYSIS) return ids

        for (const enemy of battle.enemies) {
            if (enemy.isDead) continue
            const dist = Math.abs(enemy.rank + activePlayer.rank - 1)
            if (activeDraggedCard.optimalRange.length === 0 || activeDraggedCard.optimalRange.includes(dist)) {
                ids.add(enemy.id)
            }
        }

        return ids
    }, [activeDraggedCard, activePlayer, battle.enemies])

    const validPlayerRankDrops = useMemo(() => {
        const ranks = new Set<number>()
        if (!activeDraggedCard || !activePlayer) return ranks

        if (activeDraggedCard.type === CardType.MOVEMENT) {
            if (activePlayer.rank > 1) ranks.add(activePlayer.rank - 1)
            if (activePlayer.rank < 4) ranks.add(activePlayer.rank + 1)
        } else if (activeDraggedCard.type === CardType.VOICE || activeDraggedCard.type === CardType.DEFENSE) {
            ranks.add(activePlayer.rank)
        }

        return ranks
    }, [activeDraggedCard, activePlayer])

    const handleDragStart = useCallback((event: DragStartEvent) => {
        setActiveDragCardId(event.active.id as string)
    }, [])

    const handleDragCancel = useCallback(() => {
        setActiveDragCardId(null)
    }, [])

    const handleDragEnd = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event
            setActiveDragCardId(null)

            if (!over) return

            const card = active.data.current?.card as CombatCard | undefined
            if (!card) return

            if (over.data.current?.type === 'enemy') {
                const enemyId = over.data.current.enemyId as string | undefined
                if (!enemyId) return
                setSelectedTargetId(enemyId)
                playCard(card, { type: 'enemy', enemyId })
                return
            }

            if (over.data.current?.type === 'player-rank') {
                const rank = over.data.current.rank as number | undefined
                if (typeof rank !== 'number') return
                playCard(card, { type: 'player-rank', rank })
            }
        },
        [playCard]
    )

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragCancel={handleDragCancel} onDragEnd={handleDragEnd}>
            <div
                className="dreyzab-battle h-screen w-full flex flex-col arena-bg relative overflow-hidden text-xs md:text-sm select-none"
            >

                {/* Turn Order Display (Original Style) */}
                <div className="absolute top-0 left-0 right-0 z-40 pointer-events-none flex flex-col items-center">
                    <div className="flex items-start gap-1 p-1 bg-black/60 backdrop-blur-md border-x border-b border-white/10 rounded-b-2xl shadow-2xl pointer-events-auto overflow-x-auto max-w-[calc(100%-120px)] no-scrollbar">
                        {battle.turnQueue.map((id) => {
                            const unit = [...battle.players, ...battle.enemies].find((u) => u.id === id)
                            if (!unit || unit.isDead) return null
                            const isActive = battle.activeUnitId === id
                            const isPlayer = unit.side === Side.PLAYER
                            return (
                                <div key={id} className={`flex flex-col transition-all duration-300 ${isActive ? 'scale-105' : 'opacity-40 grayscale scale-90'}`}>
                                    <div className={`relative w-9 h-9 md:w-14 md:h-14 bg-zinc-950 border-2 overflow-hidden rounded-lg shadow-xl ${isActive ? (isPlayer ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-red-600 ring-1 ring-red-600/30') : 'border-zinc-800'}`}>
                                        <img
                                            src={resolvePortrait(unit)}
                                            className="w-full h-full object-cover"
                                            alt="portrait"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 h-0.5 md:h-1 bg-zinc-900">
                                            <div className={`h-full ${isPlayer ? 'bg-blue-500' : 'bg-red-600'}`} style={{ width: `${(unit.resources.hp / unit.resources.maxHp) * 100}%` }} />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Top HUD Controls */}
                <div className="relative z-50 pt-2 px-4 flex justify-between items-start pointer-events-none dreyzab-top-hud">
                    <div className="flex items-center gap-2 pointer-events-auto mt-2">
                        <button
                            onClick={() => setShowEquipment(true)}
                            className="p-2 bg-black/40 backdrop-blur-md border border-white/10 text-zinc-400 rounded-full hover:text-blue-400 transition-colors shadow-xl"
                            title="Equipment"
                            type="button"
                        >
                            <Backpack size={16} />
                        </button>
                        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg px-2 py-1 flex items-center gap-2 shadow-xl">
                            <span className="text-[8px] text-zinc-400 font-black uppercase tracking-widest">Round</span>
                            <span className="text-amber-500 font-mono font-black text-xs">{battle.turnCount}</span>
                        </div>
                    </div>

                    <div className="flex gap-2 pointer-events-auto mt-2">
                        <button
                            onClick={() => setShowAchievements(true)}
                            className="p-2 bg-black/40 backdrop-blur-md border border-white/10 text-zinc-400 rounded-full hover:text-amber-500 transition-colors shadow-xl"
                            type="button"
                        >
                            <Trophy size={16} />
                        </button>
                    </div>
                </div>

                {/* Battlefield */}
                <div className="flex-1 relative flex overflow-hidden pt-12 pb-28 md:pb-36 dreyzab-battlefield">

                    {/* Player Lanes */}
                    <div className="flex-1 grid grid-cols-4 h-full">
                        {[4, 3, 2, 1].map((rank) => {
                            const player = battle.players.find((p) => p.rank === rank && !p.isDead)
                            const isValidDrop = validPlayerRankDrops.has(rank)
                            return (
                                <BattleDropZone
                                    key={`p-rank-${rank}`}
                                    id={`player-rank-${rank}`}
                                    data={{ type: 'player-rank', rank }}
                                    disabled={!activeDraggedCard || !isValidDrop}
                                    isActive={!!activeDraggedCard}
                                    isValid={isValidDrop}
                                    highlightClassName={dragHighlightClassName}
                                >
                                    <RankLane
                                        combatant={player}
                                        isActive={activePlayer?.id === player?.id}
                                        events={combatEvents.filter((e) => e.unitId === player?.id)}
                                    />
                                </BattleDropZone>
                            )
                        })}
                    </div>

                    <div className="w-0 md:w-16 h-full shrink-0 relative">
                    </div>

                    {/* Enemy Lanes */}
                    <div className="flex-1 grid grid-cols-4 h-full">
                        {[1, 2, 3, 4].map((rank) => {
                            const enemyInRank = battle.enemies.find((e) => e.rank === rank && !e.isDead)
                            const isValidDrop = enemyInRank ? validEnemyDropIds.has(enemyInRank.id) : false
                            return (
                                <BattleDropZone
                                    key={`e-rank-${rank}`}
                                    id={`enemy-rank-${rank}`}
                                    data={{ type: 'enemy', enemyId: enemyInRank?.id ?? null }}
                                    disabled={!activeDraggedCard || !isValidDrop}
                                    isActive={!!activeDraggedCard}
                                    isValid={isValidDrop}
                                    highlightClassName={dragHighlightClassName}
                                >
                                    <RankLane
                                        combatant={enemyInRank}
                                        isTargeted={selectedTargetId === enemyInRank?.id}
                                        isActive={battle.activeUnitId === enemyInRank?.id}
                                        onTarget={() => {
                                            if (enemyInRank) setSelectedTargetId(enemyInRank.id)
                                        }}
                                        events={combatEvents.filter((e) => e.unitId === enemyInRank?.id)}
                                    />
                                </BattleDropZone>
                            )
                        })}
                    </div>

                    {/* Combat Log Panel */}
                    <div className="hidden lg:flex absolute bottom-4 left-4 w-64 h-40 bg-black/60 backdrop-blur-md border border-zinc-800 p-2 z-30 flex-col rounded-xl overflow-hidden shadow-2xl">
                        <div className="flex items-center gap-1 text-[8px] text-zinc-500 mb-1 border-b border-zinc-800 font-bold uppercase pb-1">
                            <Terminal size={10} /> Logic_Stream
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[10px] text-zinc-400 space-y-1">
                            {battle.logs.slice().reverse().map((log, i) => (
                                <div
                                    key={`${battle.turnCount}-${i}`}
                                    className={log.includes('strike') || log.includes('DMG') ? 'text-red-400' : 'text-zinc-400'}
                                >
                                    &gt; {log}
                                </div>
                            ))}
                            <div ref={logEndRef} />
                        </div>
                    </div>
                </div>

                {/* Bottom Interface: Floating & Transparent (Original Style) */}
                <div className="absolute bottom-0 left-0 right-0 p-2 md:p-4 z-50 flex items-end gap-1 md:gap-4 pointer-events-none">
                    {/* Left Side: Status & Portrait Cluster */}
                    <div className="flex flex-col items-start gap-1 pointer-events-auto">
                        <div className="flex items-center gap-1.5 p-1 bg-black/60 backdrop-blur-lg border border-white/10 rounded-xl shadow-2xl">
                            {activeUnit ? (
                                <>
                                    {/* Portrait & Action Cluster */}
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="relative">
                                            <div className="w-12 h-12 md:w-16 md:h-16 bg-zinc-950/80 border border-white/20 rounded-lg overflow-hidden flex items-center justify-center grayscale opacity-90 shadow-inner">
                                                <img src={resolvePortrait(activeUnit)} alt="avatar" />
                                            </div>
                                            {/* AP Dots on the portrait corner */}
                                            {activeUnit.side === Side.PLAYER ? (
                                                <div className="absolute -top-1.5 -right-1.5 flex flex-wrap-reverse gap-0.5 justify-end max-w-[30px] z-10">
                                                    {Array.from({ length: Math.min(activeUnit.resources.ap, activeUnit.resources.maxAp) }).map((_, i) => (
                                                        <div key={`std-${i}`} className="w-2.5 h-2.5 bg-blue-500 rounded-full border border-blue-200 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                                                    ))}
                                                    {Array.from({ length: Math.max(0, activeUnit.resources.ap - activeUnit.resources.maxAp) }).map((_, i) => (
                                                        <div key={`bonus-${i}`} className="w-2.5 h-2.5 bg-amber-500 rounded-full border border-amber-200 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></div>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>
                                        {/* End Turn (Hourglass) */}
                                        {activeUnit.side === Side.PLAYER ? (
                                            <button
                                                onClick={advanceTurn}
                                                className="w-full py-1.5 flex items-center justify-center bg-zinc-900/80 border border-white/10 hover:border-red-500 hover:bg-red-950/40 text-zinc-400 rounded-lg transition-all shadow-lg group"
                                                title="End Turn"
                                                type="button"
                                            >
                                                <Hourglass size={14} className="group-hover:animate-spin" />
                                            </button>
                                        ) : (
                                            <div className="w-full py-1.5 flex items-center justify-center bg-zinc-900/60 border border-white/5 text-zinc-500 rounded-lg shadow-lg">
                                                <Hourglass size={14} className="animate-pulse" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Vertical Indicators */}
                                    <div className="flex flex-col gap-2 scale-90 md:scale-100 origin-left">
                                        <GaugeUI value={activeUnit.resources.hp} max={activeUnit.resources.maxHp} label="HP" color="#ef4444" />
                                        <GaugeUI value={activeUnit.resources.wp} max={activeUnit.resources.maxWp} label="WP" color="#3b82f6" />
                                    </div>
                                </>
                            ) : (
                                <div className="p-4"><RefreshCw className="animate-spin text-zinc-600" size={24} /></div>
                            )}
                        </div>
                    </div>

                    {/* Center: Cards (Original Floating Style) */}
                    <div className="flex-1 h-32 md:h-40 flex items-end justify-center pointer-events-none mb-4">
                        <div
                            className="flex items-center justify-center card-fan pointer-events-auto py-32 -my-32"
                            onTouchStart={handleTouchScrub}
                            onTouchMove={handleTouchScrub}
                            onTouchEnd={handleTouchEnd}
                        >
                            {battle.playerHand
                                .filter(card => card.ownerId === battle.activeUnitId)
                                .map((card, i) => {
                                    // Double check (redundant given filter, but safe)
                                    if (card.ownerId !== battle.activeUnitId) return null
                                    return (
                                        <DraggableCombatCard
                                            key={card.id}
                                            card={card}
                                            disabled={!canPlayCard({ session: battle, card })}
                                            onClick={() => playCard(card)}
                                            style={{
                                                transform: `rotate(${(i - (battle.playerHand.length - 1) / 2) * 5}deg) scale(1.0) translateY(${Math.abs(i - (battle.playerHand.length - 1) / 2) * 2}px)`,
                                                margin: '0 -10px'
                                            }}
                                            className="cursor-grab active:cursor-grabbing hover:z-100 transition-all duration-300 hover:-translate-y-12 md:hover:-translate-y-16"
                                        />
                                    )
                                })}
                        </div>
                    </div>

                    {/* Right Side: Small Target Icon (Unobtrusive) */}
                    <div className="shrink-0 mb-4 mr-2 pointer-events-auto">
                        {selectedTargetId ? (
                            <div className="flex flex-col items-center p-1.5 bg-black/40 backdrop-blur border border-white/10 rounded-xl shadow-2xl">
                                <div className="w-8 h-8 md:w-12 md:h-12 bg-red-950/20 border border-red-500/30 rounded-lg overflow-hidden grayscale">
                                    <img
                                        src={
                                            (() => {
                                                const targetUnit = [...battle.players, ...battle.enemies].find((u) => u.id === selectedTargetId)
                                                if (targetUnit) return resolvePortrait(targetUnit)
                                                return `https://api.dicebear.com/7.x/bottts/svg?seed=${selectedTargetId}`
                                            })()
                                        }
                                        alt="target"
                                    />
                                </div>
                                <span className="text-[6px] md:text-[8px] text-zinc-500 mt-1 uppercase font-black">
                                    {battle.enemies.find(e => e.id === selectedTargetId)?.name.split(' ')[0]}
                                </span>
                            </div>
                        ) : (
                            <div className="p-2 bg-black/40 backdrop-blur border border-white/10 rounded-xl">
                                <SquareTerminal className="text-zinc-600" size={16} />
                            </div>
                        )}
                    </div>
                </div>

                {showEquipment && renderEquipmentOverlay && (
                    renderEquipmentOverlay({
                        onClose: () => setShowEquipment(false),
                        title: activePlayer?.name
                    })
                )}

                {showAchievements && (
                    <div className="fixed inset-0 bg-black/95 z-110 flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-[#1a1a15] border-2 border-zinc-800 w-full max-w-xl rounded-2xl flex flex-col max-h-[80vh] shadow-2xl overflow-hidden">
                            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-black/40">
                                <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2">
                                    <Trophy className="text-amber-500" /> Archives
                                </h2>
                                <button
                                    onClick={() => setShowAchievements(false)}
                                    className="p-1 bg-zinc-900 rounded-lg text-zinc-500"
                                    type="button"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-4 overflow-y-auto grid grid-cols-1 gap-2 custom-scrollbar">
                                {achievements.map((a) => (
                                    <div
                                        key={a.id}
                                        className={[
                                            'p-3 border rounded-xl flex gap-4',
                                            a.unlocked
                                                ? 'bg-amber-950/20 border-amber-900/50'
                                                : 'bg-zinc-950 border-zinc-900 opacity-40',
                                        ].join(' ')}
                                    >
                                        <span className="text-3xl">{a.icon}</span>
                                        <div>
                                            <div className="font-bold text-sm text-white">{a.title}</div>
                                            <div className="text-[10px] text-zinc-500 italic">{a.description}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {battle.phase === 'VICTORY' && (
                    <div className="fixed inset-0 bg-green-950/80 backdrop-blur-xl z-120 flex flex-col items-center justify-center p-8">
                        <div className="text-5xl md:text-9xl font-black text-green-500 uppercase tracking-tighter drop-shadow-2xl">
                            Victory
                        </div>
                        <button
                            onClick={resetBattle}
                            className="mt-8 px-8 py-3 bg-black border-2 border-green-600 text-green-500 font-black rounded-full hover:bg-green-600 hover:text-black transition-all"
                            type="button"
                        >
                            RE-DEPLOY
                        </button>
                    </div>
                )}

                {battle.phase === 'DEFEAT' && (
                    <div className="fixed inset-0 bg-red-950/80 backdrop-blur-xl z-120 flex flex-col items-center justify-center p-8">
                        <div className="text-5xl md:text-9xl font-black text-red-600 uppercase tracking-tighter glitch-text">
                            Lost
                        </div>
                        <button
                            onClick={resetBattle}
                            className="mt-8 px-8 py-3 bg-black border-2 border-red-600 text-red-500 font-black rounded-full hover:bg-red-600 hover:text-black transition-all"
                            type="button"
                        >
                            RESTORE LINK
                        </button>
                    </div>
                )}
            </div>

            <DragOverlay>
                {activeDraggedCard ? (
                    <CombatCardUI card={activeDraggedCard} onClick={() => { }} className="cursor-grabbing" />
                ) : null}
            </DragOverlay>
        </DndContext>
    )
}
