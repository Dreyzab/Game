import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Hourglass, RefreshCw, SquareTerminal, Terminal, Trophy, X } from 'lucide-react'
import { ENEMY_TEMPLATES, INITIAL_PLAYER_HAND } from '../model/constants'
import type { Achievement, BattleSession, CombatCard, Combatant } from '../model/types'
import { CardType, Side } from '../model/types'
import CombatCardUI from './components/CombatCardUI'
import GaugeUI from './components/GaugeUI'
import RankLane from './components/RankLane'

type DreyzabBattleResult = 'victory' | 'defeat'

type DreyzabBattleProps = {
    onBattleEnd?: (result: DreyzabBattleResult) => void
}

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

const calculateInitiative = (unit: Combatant) => unit.stamina / 10 + (unit.side === Side.PLAYER ? 5 : 0)

const sortTurnQueue = (players: Combatant[], enemies: Combatant[]) => {
    const all = [...players, ...enemies].filter((u) => !u.isDead)
    return all.sort((a, b) => calculateInitiative(b) - calculateInitiative(a)).map((u) => u.id)
}

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

const createInitialSession = (): { session: BattleSession; defaultTargetId: string | null } => {
    const players: Combatant[] = [
        {
            id: 'p1',
            name: 'Vanguard',
            side: Side.PLAYER,
            rank: 1,
            hp: 120,
            maxHp: 120,
            stamina: 100,
            maxStamina: 100,
            ap: 3,
            maxAp: 3,
            bonusAp: 0,
            initiative: 0,
            armor: 8,
            isDead: false,
            effects: [],
            weaponHeat: 0,
            isJammed: false,
            ammo: 10,
        },
        {
            id: 'p2',
            name: 'Operator',
            side: Side.PLAYER,
            rank: 2,
            hp: 100,
            maxHp: 100,
            stamina: 100,
            maxStamina: 100,
            ap: 3,
            maxAp: 3,
            bonusAp: 0,
            initiative: 0,
            armor: 5,
            isDead: false,
            effects: [],
            weaponHeat: 0,
            isJammed: false,
            ammo: 30,
        },
        {
            id: 'p3',
            name: 'Support',
            side: Side.PLAYER,
            rank: 3,
            hp: 80,
            maxHp: 80,
            stamina: 100,
            maxStamina: 100,
            ap: 3,
            maxAp: 3,
            bonusAp: 0,
            initiative: 0,
            armor: 3,
            isDead: false,
            effects: [],
            weaponHeat: 0,
            isJammed: false,
            ammo: 15,
        },
    ]

    const enemies: Combatant[] = ENEMY_TEMPLATES.map((t, idx) => ({
        id: `e${idx}`,
        name: t.name,
        side: Side.ENEMY,
        rank: t.rank,
        hp: t.hp,
        maxHp: t.hp,
        stamina: 50,
        maxStamina: 50,
        ap: 1,
        maxAp: 1,
        bonusAp: 0,
        initiative: 0,
        armor: t.armor,
        isDead: false,
        effects: [],
        weaponHeat: 0,
        isJammed: false,
        ammo: 10,
    }))

    const turnQueue = sortTurnQueue(players, enemies)

    return {
        session: {
            turnCount: 1,
            phase: 'PLAYER_TURN',
            logs: ['Units deployed.', 'Tactical link established.'],
            players,
            enemies,
            playerHand: [...INITIAL_PLAYER_HAND],
            stats: { damageTaken: 0, attacksInOneTurn: 0, turnCount: 1 },
            activeUnitId: turnQueue[0] ?? null,
            turnQueue,
        },
        defaultTargetId: enemies[0]?.id ?? null,
    }
}

const canPlayCard = ({ session, card }: { session: BattleSession; card: CombatCard }) => {
    if (session.phase !== 'PLAYER_TURN') return false
    const activePlayer = session.players.find((p) => p.id === session.activeUnitId)
    if (!activePlayer) return false
    return activePlayer.ap >= card.apCost && activePlayer.stamina >= card.staminaCost
}

export default function DreyzabBattle({ onBattleEnd }: DreyzabBattleProps) {
    const [initial] = useState(() => createInitialSession())
    const [battle, setBattle] = useState<BattleSession>(initial.session)
    const [selectedTargetId, setSelectedTargetId] = useState<string | null>(initial.defaultTargetId)
    const [achievements, setAchievements] = useState<Achievement[]>(() => readAchievements())
    const [showAchievements, setShowAchievements] = useState(false)

    const logEndRef = useRef<HTMLDivElement>(null)
    const battleRef = useRef<BattleSession>(battle)
    const enemyActionTimerRef = useRef<number | null>(null)
    const autoAdvanceTimerRef = useRef<number | null>(null)
    const reportedResultRef = useRef<DreyzabBattleResult | null>(null)

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
                    const carryOver = currentUnit.ap > 0 ? 1 : 0
                    nextPlayers[playerIndex] = { ...currentUnit, bonusAp: carryOver, ap: 0 }
                }
            }

            let nextIdx = (currentIdx + 1) % prev.turnQueue.length
            const isNewRound = nextIdx === 0

            if (isNewRound) {
                nextPlayers = nextPlayers.map((p) => ({ ...p, ap: p.maxAp + p.bonusAp, bonusAp: 0 }))
                nextEnemies = nextEnemies.map((e) => ({ ...e, ap: e.maxAp }))

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
                    (a, b) => Math.abs(a.rank - enemy.rank) - Math.abs(b.rank - enemy.rank)
                )[0]

                let damageDealt = 0
                const distance = Math.abs(enemy.rank - target.rank)

                if (distance > 2) {
                    enemies[enemyIndex] = { ...enemies[enemyIndex], rank: Math.max(1, enemy.rank - 1) }
                    nextLogs.push(`${enemy.name} advances to rank ${enemies[enemyIndex].rank}.`)
                } else {
                    const dmg = Math.max(1, 10 - target.armor)
                    const targetIndex = players.findIndex((p) => p.id === target.id)
                    const nextHp = Math.max(0, players[targetIndex].hp - dmg)
                    players[targetIndex] = { ...players[targetIndex], hp: nextHp, isDead: nextHp <= 0 }
                    damageDealt = dmg
                    nextLogs.push(`${enemy.name} strikes ${target.name} for ${dmg} damage.`)
                    if (nextHp <= 0) nextLogs.push(`${target.name} offline.`)
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
        [advanceTurn]
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
        (card: CombatCard) => {
            if (!canPlayCard({ session: battle, card })) return

            setBattle((prev) => {
                if (prev.phase !== 'PLAYER_TURN') return prev

                const playerIndex = prev.players.findIndex((p) => p.id === prev.activeUnitId)
                if (playerIndex < 0) return prev

                const players = prev.players.map((p) => ({ ...p }))
                const enemies = prev.enemies.map((e) => ({ ...e }))
                const nextLogs = [...prev.logs]

                const actingPlayer = players[playerIndex]
                if (actingPlayer.ap < card.apCost || actingPlayer.stamina < card.staminaCost) return prev

                const nextPlayer = {
                    ...actingPlayer,
                    ap: actingPlayer.ap - card.apCost,
                    stamina: actingPlayer.stamina - card.staminaCost,
                }
                players[playerIndex] = nextPlayer

                let nextAttacksInTurn = prev.stats.attacksInOneTurn

                if (card.type === CardType.ATTACK) {
                    nextAttacksInTurn++
                    const targetIndex = enemies.findIndex((e) => e.id === selectedTargetId)
                    const target = targetIndex >= 0 ? enemies[targetIndex] : null
                    if (target && !target.isDead) {
                        const dist = Math.abs(target.rank - nextPlayer.rank)
                        const isOptimal = card.optimalRange.includes(dist) || card.optimalRange.length === 0
                        const multiplier = isOptimal ? 1 : 0.6
                        let damage = Math.floor(card.damage * multiplier - target.armor)
                        damage = Math.max(1, damage)

                        const nextHp = Math.max(0, target.hp - damage)
                        enemies[targetIndex] = { ...target, hp: nextHp, isDead: nextHp <= 0 }

                        if (nextHp <= 0 && target.name === 'Rail Scorpion') unlockAchievement('scorpion_slayer')
                        nextLogs.push(`${nextPlayer.name} uses ${card.name}: ${damage} DMG to ${target.name}.`)
                    }
                } else if (card.type === CardType.MOVEMENT) {
                    if (nextPlayer.rank > 1) {
                        players[playerIndex] = { ...nextPlayer, rank: nextPlayer.rank - 1 }
                        nextLogs.push(`${players[playerIndex].name} advances.`)
                    } else {
                        const nextHp = Math.max(0, nextPlayer.hp - 5)
                        players[playerIndex] = { ...nextPlayer, hp: nextHp, isDead: nextHp <= 0 }
                        nextLogs.push(`${players[playerIndex].name} hit the boundary.`)
                    }
                } else if (card.type === CardType.VOICE) {
                    players[playerIndex] = {
                        ...nextPlayer,
                        stamina: Math.min(nextPlayer.maxStamina, nextPlayer.stamina + 30),
                    }
                    nextLogs.push(`${players[playerIndex].name} stabilizes vitals.`)
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
                if (activePlayer.ap <= 0 && !allEnemiesDead) advanceTurn()
            }, 800)
        },
        [advanceTurn, battle, selectedTargetId, unlockAchievement]
    )

    const resetBattle = useCallback(() => {
        clearTimers()
        const next = createInitialSession()
        setBattle(next.session)
        setSelectedTargetId(next.defaultTargetId)
        setShowAchievements(false)
        reportedResultRef.current = null
    }, [clearTimers])

    const activeUnit = useMemo(() => {
        if (!battle.activeUnitId) return null
        return [...battle.players, ...battle.enemies].find((u) => u.id === battle.activeUnitId) ?? null
    }, [battle.activeUnitId, battle.enemies, battle.players])

    const activePlayer = activeUnit?.side === Side.PLAYER ? activeUnit : null

    return (
        <div className="dreyzab-battle h-screen w-full flex flex-col arena-bg relative overflow-hidden text-xs md:text-sm">
            <div className="absolute top-2 left-2 z-50">
                <div className="bg-black/60 backdrop-blur-md border border-zinc-800 rounded px-1.5 py-1 flex items-center gap-1 shadow-lg">
                    <span className="text-[7px] text-zinc-500 font-black uppercase">Round</span>
                    <span className="text-amber-500 font-mono font-black text-[10px]">{battle.turnCount}</span>
                </div>
            </div>

            <div className="absolute top-2 right-2 z-50 flex gap-2">
                <button
                    onClick={() => setShowAchievements(true)}
                    className="p-1.5 bg-black/60 backdrop-blur-md border border-zinc-800 text-zinc-400 rounded-full hover:text-amber-500 transition-colors shadow-2xl"
                    type="button"
                >
                    <Trophy size={16} />
                </button>
            </div>

            <div className="absolute top-0 left-0 right-0 z-40 pointer-events-none flex flex-col items-center">
                <div className="flex items-start gap-1 p-1 bg-black/70 backdrop-blur-xl border-x border-b border-white/10 rounded-b-2xl shadow-2xl pointer-events-auto overflow-x-auto max-w-[calc(100%-100px)] no-scrollbar">
                    {battle.turnQueue.map((id) => {
                        const unit = [...battle.players, ...battle.enemies].find((u) => u.id === id)
                        if (!unit || unit.isDead) return null

                        const isActive = battle.activeUnitId === id
                        const isPlayer = unit.side === Side.PLAYER

                        return (
                            <div
                                key={id}
                                className={[
                                    'flex flex-col transition-all duration-300',
                                    isActive ? 'scale-105' : 'opacity-40 grayscale scale-90',
                                ].join(' ')}
                            >
                                <div
                                    className={[
                                        'relative w-9 h-9 md:w-16 md:h-16 bg-zinc-950 border-2 overflow-hidden rounded-lg shadow-xl',
                                        isActive
                                            ? isPlayer
                                                ? 'border-blue-500 ring-2 ring-blue-500/30'
                                                : 'border-red-600 ring-2 ring-red-600/30'
                                            : 'border-zinc-800',
                                    ].join(' ')}
                                >
                                    <img
                                        src={
                                            isPlayer
                                                ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`
                                                : `https://api.dicebear.com/7.x/bottts/svg?seed=${id}`
                                        }
                                        className="w-full h-full object-cover"
                                        alt="portrait"
                                    />
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 md:h-1 bg-zinc-900">
                                        <div
                                            className={isPlayer ? 'h-full bg-blue-500' : 'h-full bg-red-600'}
                                            style={{ width: `${(unit.hp / unit.maxHp) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="flex-1 relative flex overflow-hidden pt-12 md:pt-16">
                <div className="flex-1 grid grid-cols-4 h-full">
                    {[4, 3, 2, 1].map((rank) => (
                        <RankLane
                            key={`p-rank-${rank}`}
                            combatant={battle.players.find((p) => p.rank === rank && !p.isDead)}
                        />
                    ))}
                </div>
                <div className="w-1 md:w-16 h-full flex-shrink-0" />
                <div className="flex-1 grid grid-cols-4 h-full">
                    {[1, 2, 3, 4].map((rank) => {
                        const enemyInRank = battle.enemies.find((e) => e.rank === rank && !e.isDead)
                        return (
                            <RankLane
                                key={`e-rank-${rank}`}
                                combatant={enemyInRank}
                                isTargeted={selectedTargetId === enemyInRank?.id}
                                onTarget={() => {
                                    if (enemyInRank) setSelectedTargetId(enemyInRank.id)
                                }}
                            />
                        )
                    })}
                </div>

                <div className="hidden lg:flex absolute bottom-4 left-4 w-60 h-24 bg-black/60 backdrop-blur-md border border-zinc-800 p-2 z-30 flex-col rounded-xl overflow-hidden shadow-2xl">
                    <div className="flex items-center gap-1 text-[8px] text-zinc-500 mb-1 border-b border-zinc-800 font-bold uppercase pb-1">
                        <Terminal size={10} /> Logic_Stream
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar font-mono text-[9px] text-zinc-400 space-y-1">
                        {battle.logs.slice(-5).map((log, i) => (
                            <div
                                key={`${battle.turnCount}-${i}`}
                                className={log.includes('strike') || log.includes('DMG') ? 'text-red-500' : 'text-zinc-400'}
                            >
                                &gt; {log}
                            </div>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                </div>
            </div>

            <div className="h-32 md:h-44 bg-[#1a1a15] border-t-2 border-[#3d3d35] mt-auto z-40 flex px-0 items-center gap-0 flex-shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
                <div className="flex-shrink-0 flex flex-col items-center justify-center border-r border-[#3d3d35] h-full py-1 px-1.5 min-w-[85px] md:min-w-[180px]">
                    {activePlayer ? (
                        <>
                            <div className="flex gap-0.5 mb-1 scale-[0.7] md:scale-100 origin-center">
                                <GaugeUI value={activePlayer.hp} max={activePlayer.maxHp} label="HP" color="#ef4444" />
                                <GaugeUI
                                    value={activePlayer.stamina}
                                    max={activePlayer.maxStamina}
                                    label="WP"
                                    color="#3b82f6"
                                />
                            </div>

                            <div className="relative mb-1">
                                <div className="w-9 h-9 md:w-16 md:h-16 bg-zinc-950 border border-zinc-800 rounded flex items-center justify-center overflow-hidden grayscale opacity-80">
                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${activePlayer.id}`} alt="avatar" />
                                </div>
                                <div className="absolute -top-1 -right-1 flex flex-wrap gap-0.5 justify-end max-w-[25px]">
                                    {Array.from({ length: Math.min(activePlayer.ap, activePlayer.maxAp) }).map((_, i) => (
                                        <div
                                            key={`std-${i}`}
                                            className="w-2 h-2 bg-blue-500 rounded-full border border-blue-300"
                                        />
                                    ))}
                                    {Array.from({ length: Math.max(0, activePlayer.ap - activePlayer.maxAp) }).map((_, i) => (
                                        <div
                                            key={`bonus-${i}`}
                                            className="w-2 h-2 bg-amber-500 rounded-full border border-amber-300"
                                        />
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={advanceTurn}
                                className="py-1 px-1.5 bg-zinc-900 border border-zinc-700 hover:border-red-500 hover:bg-red-950/20 text-zinc-400 hover:text-red-500 rounded shadow-md transition-all group"
                                type="button"
                            >
                                <Hourglass size={12} className="group-hover:animate-spin" />
                            </button>
                        </>
                    ) : (
                        <RefreshCw className="animate-spin text-zinc-800" size={20} />
                    )}
                </div>

                <div className="flex-1 h-full flex items-center justify-center card-fan overflow-visible px-0.5">
                    {activePlayer &&
                        battle.playerHand.map((card, i) => (
                            <CombatCardUI
                                key={card.id}
                                card={card}
                                disabled={!canPlayCard({ session: battle, card })}
                                onClick={() => playCard(card)}
                                style={{
                                    transform: `rotate(${(i - (battle.playerHand.length - 1) / 2) * 4}deg) scale(1.1)`,
                                    margin: '0 -18px',
                                }}
                                className="md:scale-110 md:m-0"
                            />
                        ))}
                </div>

                <div className="flex-shrink-0 w-12 md:w-1/4 border-l border-[#3d3d35] h-full flex flex-col p-1 items-center justify-center bg-black/10">
                    {selectedTargetId ? (
                        <div className="flex flex-col items-center gap-0.5">
                            <div className="w-7 h-7 md:w-10 md:h-10 bg-zinc-950 border border-red-900/40 p-0.5 rounded">
                                <img
                                    src={`https://api.dicebear.com/7.x/bottts/svg?seed=${selectedTargetId}`}
                                    className="opacity-60 grayscale"
                                    alt="target"
                                />
                            </div>
                            <div className="text-[6px] md:text-[8px] text-zinc-600 font-mono truncate max-w-[35px] md:max-w-none">
                                {battle.enemies.find((e) => e.id === selectedTargetId)?.name.split(' ')[0]}
                            </div>
                        </div>
                    ) : (
                        <SquareTerminal size={12} className="text-zinc-800" />
                    )}
                </div>
            </div>

            {showAchievements && (
                <div className="fixed inset-0 bg-black/95 z-[110] flex items-center justify-center p-4 backdrop-blur-sm">
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
                <div className="fixed inset-0 bg-green-950/80 backdrop-blur-xl z-[120] flex flex-col items-center justify-center p-8">
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
                <div className="fixed inset-0 bg-red-950/80 backdrop-blur-xl z-[120] flex flex-col items-center justify-center p-8">
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
    )
}
