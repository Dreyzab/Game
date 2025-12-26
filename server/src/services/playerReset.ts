import { db } from '../db'
import { eq, inArray, or } from 'drizzle-orm'
import {
  battles,
  battleParticipants,
  coopParticipants,
  coopSessions,
  coopVotes,
  gameProgress,
  items,
  pointDiscoveries,
  questProgress,
  resonancePlayers,
  sceneLogs,
  trades,
  tradeItems,
  tradeSessions,
  voiceAttributes,
  weaponMastery,
} from '../db/schema'
import { coopService } from './coopService'
import { STARTING_SKILLS } from '../lib/gameProgress'

type AuthedUser = { id: string; type: 'clerk' | 'guest' }

const DEFAULT_SCENE_ID = 'prologue_coupe_start'

export type ResetSelfResult = {
  playerId: number
  coopRoomsLeft: number
  deleted: Record<string, number>
  recreatedProgress: boolean
}

export async function resetSelf(user: AuthedUser, playerId: number): Promise<ResetSelfResult> {
  const deleted: Record<string, number> = {}

  // 1) Leave all coop rooms properly (handles host transfer & session cleanup)
  let coopRoomsLeft = 0
  try {
    const sessions = await db
      .select({ code: coopSessions.inviteCode })
      .from(coopSessions)
      .innerJoin(coopParticipants, eq(coopParticipants.sessionId, coopSessions.id))
      .where(eq(coopParticipants.playerId, playerId))

    for (const row of sessions) {
      try {
        await coopService.leaveRoom(row.code, playerId)
        coopRoomsLeft += 1
      } catch {
        // fallback: brute cleanup for this player
      }
    }
  } catch {
    // ignore
  }

  // 2) Multiplayer coop votes/participants safety cleanup (in case leaveRoom failed)
  await db.delete(coopVotes).where(eq(coopVotes.voterId, playerId))
  await db.delete(coopParticipants).where(eq(coopParticipants.playerId, playerId))

  // 3) Resonance: remove this user from resonance sessions (cascades to votes/logs linked to resonancePlayers)
  if (user.type === 'clerk') {
    await db.delete(resonancePlayers).where(eq(resonancePlayers.userId, user.id))
  } else {
    await db.delete(resonancePlayers).where(eq(resonancePlayers.deviceId, user.id))
  }

  // 4) Combat: remove battle participants; remove battles hosted by this player (safe for solo)
  await db.delete(battleParticipants).where(eq(battleParticipants.playerId, playerId))
  await db.delete(battles).where(eq(battles.hostId, playerId))

  // 5) Trading: remove any trade sessions involving this player + their items in sessions
  const sessionsToDelete = await db
    .select({ id: tradeSessions.id })
    .from(tradeSessions)
    .where(or(eq(tradeSessions.initiatorId, playerId), eq(tradeSessions.partnerId, playerId)))
  const tradeSessionIds = sessionsToDelete.map((r) => r.id)
  if (tradeSessionIds.length > 0) {
    await db.delete(tradeItems).where(inArray(tradeItems.sessionId, tradeSessionIds))
    await db.delete(tradeSessions).where(inArray(tradeSessions.id, tradeSessionIds))
  }
  await db.delete(trades).where(or(eq(trades.senderId, playerId), eq(trades.receiverId, playerId)))

  // 6) Inventory items owned by player
  await db.delete(items).where(eq(items.ownerId, playerId))

  // 7) Quests & discoveries
  await db.delete(questProgress).where(eq(questProgress.playerId, playerId))
  if (user.type === 'clerk') {
    await db.delete(pointDiscoveries).where(eq(pointDiscoveries.userId, user.id))
  } else {
    await db.delete(pointDiscoveries).where(eq(pointDiscoveries.deviceId, user.id))
  }

  // 8) VN logs
  await db.delete(sceneLogs).where(eq(sceneLogs.playerId, playerId))
  if (user.type === 'clerk') {
    await db.delete(sceneLogs).where(eq(sceneLogs.userId, user.id))
  } else {
    await db.delete(sceneLogs).where(eq(sceneLogs.deviceId, user.id))
  }

  // 9) Attributes / mastery
  await db.delete(voiceAttributes).where(eq(voiceAttributes.playerId, playerId))
  await db.delete(weaponMastery).where(eq(weaponMastery.playerId, playerId))

  // 10) Recreate fresh game progress
  await db.delete(gameProgress).where(eq(gameProgress.playerId, playerId))
  await db.insert(gameProgress).values({
    playerId,
    currentScene: DEFAULT_SCENE_ID,
    visitedScenes: [],
    flags: {},
    skills: STARTING_SKILLS,
    level: 1,
    xp: 0,
    skillPoints: 0,
    phase: 1,
    reputation: {},
    updatedAt: Date.now(),
  } as any)

  return {
    playerId,
    coopRoomsLeft,
    deleted,
    recreatedProgress: true,
  }
}


