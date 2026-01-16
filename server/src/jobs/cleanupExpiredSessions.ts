/**
 * Cleanup job for expired survival sessions
 * Runs periodically to delete sessions that have expired (24h after last activity)
 */

import { db } from '../db'
import { survivalSessions } from '../db/schema/survivalSessions'
import { sql, lt } from 'drizzle-orm'

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000 // Run every hour

/**
 * Delete expired sessions from the database
 */
export async function cleanupExpiredSessions(): Promise<number> {
    try {
        const result = await db.delete(survivalSessions)
            .where(lt(survivalSessions.expiresAt, sql`now()`))
            .returning({ sessionId: survivalSessions.sessionId })

        const count = result.length
        if (count > 0) {
            console.log(`[SurvivalCleanup] Deleted ${count} expired sessions`)
        }
        return count
    } catch (error) {
        console.error('[SurvivalCleanup] Failed to cleanup expired sessions:', error)
        return 0
    }
}

/**
 * Start the cleanup job scheduler
 */
export function startCleanupScheduler(): void {
    console.log('[SurvivalCleanup] Starting cleanup scheduler (interval: 1 hour)')

    // Run immediately on startup
    cleanupExpiredSessions()

    // Then run periodically
    setInterval(() => {
        cleanupExpiredSessions()
    }, CLEANUP_INTERVAL_MS)
}
