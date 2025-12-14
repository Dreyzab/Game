/**
 * Mastery API Routes
 * =====================================================
 * Endpoints for weapon mastery progression system.
 * =====================================================
 */

import { Elysia, t } from 'elysia'
import { db } from '../../db'
import { weaponMastery, getXpForLevel, getUnlockedCardsForLevel, type WeaponMasteryType } from '../../db/schema'
import { players } from '../../db/schema'
import { eq, and } from 'drizzle-orm'
import { auth } from '../auth'

const now = () => Date.now()

/** Resolve player from auth */
type AuthedUser = { id: string; type: 'clerk' | 'guest' }

async function resolvePlayer(user: AuthedUser) {
    const [player] = await db
        .select()
        .from(players)
        .where(user.type === 'clerk' ? eq(players.userId, user.id) : eq(players.deviceId, user.id))
        .limit(1)
    return player
}

export const masteryRoutes = (app: Elysia) =>
    app.group('/mastery', (group) =>
        group
            .use(auth)

            // Get all mastery progress for current player
            .get('/my', async ({ user }) => {
                if (!user) return { error: 'Unauthorized', masteries: [] }

                const player = await resolvePlayer(user as AuthedUser)
                if (!player) return { error: 'Player not found', masteries: [] }

                const masteries = await db
                    .select()
                    .from(weaponMastery)
                    .where(eq(weaponMastery.playerId, player.id))

                return { masteries }
            })

            // Get mastery for specific weapon type
            .get('/:weaponType', async ({ user, params }) => {
                if (!user) return { error: 'Unauthorized' }

                const player = await resolvePlayer(user as AuthedUser)
                if (!player) return { error: 'Player not found' }

                const [mastery] = await db
                    .select()
                    .from(weaponMastery)
                    .where(
                        and(
                            eq(weaponMastery.playerId, player.id),
                            eq(weaponMastery.weaponType, params.weaponType as WeaponMasteryType)
                        )
                    )
                    .limit(1)

                if (!mastery) {
                    // Return default level 1 if no record exists
                    return {
                        weaponType: params.weaponType,
                        level: 1,
                        xp: 0,
                        xpToNextLevel: getXpForLevel(1),
                        unlockedCards: getUnlockedCardsForLevel(params.weaponType as WeaponMasteryType, 1),
                        totalKills: 0,
                    }
                }

                return {
                    ...mastery,
                    unlockedCardIds: getUnlockedCardsForLevel(mastery.weaponType, mastery.level),
                }
            }, {
                params: t.Object({
                    weaponType: t.String(),
                }),
            })

            // Add XP to a weapon type (called after combat)
            .post('/add-xp', async ({ user, body }) => {
                if (!user) return { error: 'Unauthorized' }

                const player = await resolvePlayer(user as AuthedUser)
                if (!player) return { error: 'Player not found' }

                const { weaponType, xpAmount, kills = 0 } = body

                // Get or create mastery record
                let [mastery] = await db
                    .select()
                    .from(weaponMastery)
                    .where(
                        and(
                            eq(weaponMastery.playerId, player.id),
                            eq(weaponMastery.weaponType, weaponType as WeaponMasteryType)
                        )
                    )
                    .limit(1)

                if (!mastery) {
                    // Create new mastery record
                    const [newMastery] = await db
                        .insert(weaponMastery)
                        .values({
                            playerId: player.id,
                            weaponType: weaponType as WeaponMasteryType,
                            level: 1,
                            xp: 0,
                            xpToNextLevel: getXpForLevel(1),
                            totalXpEarned: 0,
                            totalKills: 0,
                            unlockedCards: [],
                            createdAt: now(),
                            updatedAt: now(),
                        })
                        .returning()

                    mastery = newMastery
                }

                // Calculate new XP and potential level up
                let newXp = mastery.xp + xpAmount
                let newLevel = mastery.level
                let xpToNext = mastery.xpToNextLevel
                const newTotalXp = mastery.totalXpEarned + xpAmount
                const newTotalKills = mastery.totalKills + kills
                const newUnlocks: string[] = []

                // Check for level ups
                while (newXp >= xpToNext && newLevel < 10) {
                    newXp -= xpToNext
                    newLevel++
                    xpToNext = getXpForLevel(newLevel)

                    // Check for new card unlocks
                    const unlockedAtThisLevel = getUnlockedCardsForLevel(weaponType as WeaponMasteryType, newLevel)
                        .filter(cardId => !mastery.unlockedCards?.some(u => u.cardId === cardId))
                    newUnlocks.push(...unlockedAtThisLevel)
                }

                // Build updated unlocked cards array
                const updatedUnlockedCards = [
                    ...(mastery.unlockedCards ?? []),
                    ...newUnlocks.map(cardId => ({
                        cardId,
                        requiredLevel: newLevel,
                        unlockedAt: now(),
                    })),
                ]

                // Update mastery record
                await db
                    .update(weaponMastery)
                    .set({
                        xp: newXp,
                        level: newLevel,
                        xpToNextLevel: xpToNext,
                        totalXpEarned: newTotalXp,
                        totalKills: newTotalKills,
                        unlockedCards: updatedUnlockedCards,
                        updatedAt: now(),
                    })
                    .where(eq(weaponMastery.id, mastery.id))

                return {
                    success: true,
                    level: newLevel,
                    xp: newXp,
                    xpToNextLevel: xpToNext,
                    leveledUp: newLevel > mastery.level,
                    newUnlocks,
                    totalKills: newTotalKills,
                }
            }, {
                body: t.Object({
                    weaponType: t.String(),
                    xpAmount: t.Number(),
                    kills: t.Optional(t.Number()),
                }),
            })
    )
