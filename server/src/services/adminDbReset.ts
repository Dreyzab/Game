import { db } from '../db'
import { sql } from 'drizzle-orm'

export type ResetResult = {
  truncatedTables: string[]
  deletedBots: number
  mode: 'all' | 'multiplayer'
}

async function truncateTablesByName(tableNames: string[]): Promise<string[]> {
  const truncated: string[] = []
  for (const tableName of tableNames) {
    // Safety: only allow [a-z0-9_]
    if (!/^[a-z0-9_]+$/i.test(tableName)) continue
    await db.execute(sql.raw(`TRUNCATE TABLE "${tableName}" RESTART IDENTITY CASCADE`))
    truncated.push(tableName)
  }
  return truncated
}

export async function resetDatabaseAll(): Promise<ResetResult> {
  const tablesResponse = await db.execute(sql`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename NOT LIKE '__drizzle_migrations%'
  `)

  const tableNames = (tablesResponse as any[]).map((r) => String(r?.tablename)).filter(Boolean)
  const truncatedTables = await truncateTablesByName(tableNames)

  return { truncatedTables, deletedBots: 0, mode: 'all' }
}

export async function resetDatabaseMultiplayer(): Promise<ResetResult> {
  // Multiplayer persistent state:
  // - coop_* tables (sessions, participants, votes)
  // - resonance_* session runtime tables (keep content tables like resonance_scenes/items)
  const multiplayerTables = [
    'coop_sessions',
    'resonance_sessions',
  ]

  const truncatedTables = await truncateTablesByName(multiplayerTables)

  // Cleanup: remove bot players created by debug add_bot (deviceId starts with 'bot-')
  let deletedBots = 0
  try {
    const res = await db.execute(sql`DELETE FROM players WHERE device_id LIKE 'bot-%'`)
    // postgres-js returns RowList, delete count is driver-specific; best-effort:
    deletedBots = (res as any)?.count ?? 0
  } catch {
    // ignore
  }

  return { truncatedTables, deletedBots, mode: 'multiplayer' }
}


