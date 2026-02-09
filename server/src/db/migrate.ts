import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { sql } from 'drizzle-orm'
import crypto from 'node:crypto'
import fs from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { db } from './index'

const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), '../../drizzle')

type JournalEntry = { idx: number; when: number; tag: string; breakpoints: boolean }
type Journal = { entries: JournalEntry[] }
type MigrationOptions = { force?: boolean }

type CorePatch = { table: string; column: string; sql: string }
type CorePatchResult = { table: string; column: string; status: 'applied' | 'skipped' | 'failed'; error?: string }
type CorePatchOptions = { includeDetective?: boolean }

type MigrationRunResult = {
  targetTag: string
  applied: string[]
  skipped?: boolean
}

function getPgErrorCode(error: unknown): string | undefined {
  const maybe = error as any
  if (!maybe) return undefined
  if (typeof maybe.code === 'string') return maybe.code
  if (maybe.cause && typeof maybe.cause.code === 'string') return maybe.cause.code
  return undefined
}

function isDuplicateSchemaOrRelationError(error: unknown): boolean {
  const code = getPgErrorCode(error)
  return code === '42P06' || code === '42P07' || code === '42701' || code === '42710'
}

async function ensureMigrationsTable() {
  await db.execute(sql.raw('CREATE SCHEMA IF NOT EXISTS "drizzle"'))
  await db.execute(sql.raw(`
    CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `))
}

async function tableExists(schemaName: string, tableName: string): Promise<boolean> {
  const rows = await db.execute(sql`
    SELECT 1 AS ok
    FROM information_schema.tables
    WHERE table_schema = ${schemaName}
      AND table_name = ${tableName}
    LIMIT 1
  `)
  return Array.isArray(rows) && rows.length > 0
}

async function columnExists(schemaName: string, tableName: string, columnName: string): Promise<boolean> {
  const rows = await db.execute(sql`
    SELECT 1 AS ok
    FROM information_schema.columns
    WHERE table_schema = ${schemaName}
      AND table_name = ${tableName}
      AND column_name = ${columnName}
    LIMIT 1
  `)
  return Array.isArray(rows) && rows.length > 0
}

const CORE_PATCHES: CorePatch[] = [
  {
    table: 'players',
    column: 'password_hash',
    sql: `ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "password_hash" text`,
  },
  {
    table: 'players',
    column: 'password_salt',
    sql: `ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "password_salt" text`,
  },
  {
    table: 'players',
    column: 'locale',
    sql: `ALTER TABLE "players" ADD COLUMN IF NOT EXISTS "locale" text DEFAULT 'ru'`,
  },
  {
    table: 'game_progress',
    column: 'state_version',
    sql: `ALTER TABLE "game_progress" ADD COLUMN IF NOT EXISTS "state_version" integer DEFAULT 1`,
  },
  {
    table: 'game_progress',
    column: 'game_mode',
    sql: `ALTER TABLE "game_progress" ADD COLUMN IF NOT EXISTS "game_mode" text DEFAULT 'survival' NOT NULL`,
  },
  {
    table: 'coop_sessions',
    column: 'flags',
    sql: `ALTER TABLE "coop_sessions" ADD COLUMN IF NOT EXISTS "flags" json DEFAULT '{}'::json`,
  },
  {
    table: 'coop_participants',
    column: 'current_scene',
    sql: `ALTER TABLE "coop_participants" ADD COLUMN IF NOT EXISTS "current_scene" text`,
  },
  {
    table: 'quest_progress',
    column: 'abandoned_at',
    sql: `ALTER TABLE "quest_progress" ADD COLUMN IF NOT EXISTS "abandoned_at" bigint`,
  },
  {
    table: 'quest_progress',
    column: 'failed_at',
    sql: `ALTER TABLE "quest_progress" ADD COLUMN IF NOT EXISTS "failed_at" bigint`,
  },
  {
    table: 'danger_zones',
    column: 'key',
    sql: `ALTER TABLE "danger_zones" ADD COLUMN IF NOT EXISTS "key" text`,
  },
  {
    table: 'danger_zones',
    column: 'spawn_points',
    sql: `ALTER TABLE "danger_zones" ADD COLUMN IF NOT EXISTS "spawn_points" jsonb`,
  },
]

const DETECTIVE_PATCHES: CorePatch[] = [
  {
    table: 'game_progress',
    column: 'detective_state',
    sql: `ALTER TABLE "game_progress" ADD COLUMN IF NOT EXISTS "detective_state" jsonb DEFAULT '{"entries":[],"evidence":[],"pointStates":{},"flags":{},"detectiveName":null,"lastSyncedAt":0}'::jsonb`,
  },
]

async function applyCorePatches(options: CorePatchOptions = {}): Promise<CorePatchResult[]> {
  const patches = options.includeDetective === false
    ? CORE_PATCHES
    : [...CORE_PATCHES, ...DETECTIVE_PATCHES]
  const results: CorePatchResult[] = []
  for (const patch of patches) {
    const exists = await tableExists('public', patch.table)
    if (!exists) {
      results.push({ table: patch.table, column: patch.column, status: 'skipped' })
      continue
    }
    try {
      await db.execute(sql.raw(patch.sql))
      results.push({ table: patch.table, column: patch.column, status: 'applied' })
    } catch (error) {
      results.push({
        table: patch.table,
        column: patch.column,
        status: 'failed',
        error: (error as any)?.message ?? String(error),
      })
    }
  }
  return results
}

export async function repairDatabaseCore(options: CorePatchOptions = {}) {
  const patches = await applyCorePatches(options)
  const summary = {
    applied: patches.filter((p) => p.status === 'applied').length,
    skipped: patches.filter((p) => p.status === 'skipped').length,
    failed: patches.filter((p) => p.status === 'failed').length,
  }
  return { patches, summary }
}

function loadJournal(): Journal {
  const journalPath = join(migrationsFolder, 'meta', '_journal.json')
  const raw = fs.readFileSync(journalPath, 'utf8')
  return JSON.parse(raw) as Journal
}

function hashMigrationFile(tag: string): string {
  const migrationPath = join(migrationsFolder, `${tag}.sql`)
  const query = fs.readFileSync(migrationPath, 'utf8')
  return crypto.createHash('sha256').update(query).digest('hex')
}

function readMigrationStatements(tag: string): string[] {
  const migrationPath = join(migrationsFolder, `${tag}.sql`)
  const query = fs.readFileSync(migrationPath, 'utf8')
  return query
    .split('--> statement-breakpoint')
    .map((stmt) => stmt.trim())
    .filter(Boolean)
}

async function getLastMigrationTimestamp(): Promise<number | null> {
  await ensureMigrationsTable()
  const existing = await db.execute(sql`
    SELECT created_at
    FROM "drizzle"."__drizzle_migrations"
    WHERE created_at IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 1
  `)
  if (!Array.isArray(existing) || existing.length === 0) return null
  const value = (existing as any)?.[0]?.created_at
  if (value === null || value === undefined) return null
  const num = Number(value)
  return Number.isNaN(num) ? null : num
}

async function baselineExistingDatabase(): Promise<boolean> {
  // If the core tables already exist but migrations are not tracked (e.g. drizzle-kit push),
  // migrating from scratch will fail with "relation already exists". In that case we "baseline"
  // by inserting a single row for the latest already-present migration.
  await ensureMigrationsTable()

  const existing = await db.execute(sql`
    SELECT created_at
    FROM "drizzle"."__drizzle_migrations"
    WHERE created_at IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 1
  `)

  if (Array.isArray(existing) && existing.length > 0) return false

  const hasProgress = await tableExists('public', 'game_progress')
  if (!hasProgress) return false

  const hasBehaviorTrees = await tableExists('public', 'behavior_trees')

  const journal = loadJournal()
  const candidates = journal.entries
    .filter((entry) => typeof entry.when === 'number')
    .sort((a, b) => a.when - b.when)

  if (candidates.length === 0) return false

  const desiredTag = hasBehaviorTrees ? '0001_good_major_mapleleaf' : '0000_opposite_fenris'
  const entry = candidates.find((e) => e.tag === desiredTag) ?? candidates[0]

  await db.execute(sql`
    INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
    VALUES (${hashMigrationFile(entry.tag)}, ${entry.when})
  `)

  console.warn(
    `[DB] Baseline applied: marked ${entry.tag} as already executed (existing schema detected).`
  )

  return true
}

export async function runDbMigrationsUpTo(maxTag: string): Promise<MigrationRunResult> {
  await ensureMigrationsTable()
  const journal = loadJournal()
  const targetEntry = journal.entries.find((entry) => entry.tag === maxTag)
  if (!targetEntry) {
    throw new Error(`Unknown migration tag: ${maxTag}`)
  }

  const lastApplied = await getLastMigrationTimestamp()
  if (lastApplied && lastApplied >= targetEntry.when) {
    return { targetTag: maxTag, applied: [], skipped: true }
  }

  const entries = journal.entries
    .filter((entry) => entry.when <= targetEntry.when)
    .sort((a, b) => a.when - b.when)

  const applied: string[] = []
  for (const entry of entries) {
    if (lastApplied && entry.when <= lastApplied) continue
    const statements = readMigrationStatements(entry.tag)
    for (const stmt of statements) {
      try {
        await db.execute(sql.raw(stmt))
      } catch (error) {
        if (isDuplicateSchemaOrRelationError(error)) {
          continue
        }
        throw error
      }
    }

    await db.execute(sql`
      INSERT INTO "drizzle"."__drizzle_migrations" ("hash", "created_at")
      VALUES (${hashMigrationFile(entry.tag)}, ${entry.when})
    `)
    applied.push(entry.tag)
  }

  return { targetTag: maxTag, applied }
}

async function ensureGameModeColumn(): Promise<boolean> {
  try {
    // Idempotent safety patch for legacy DBs missing the column.
    await db.execute(sql.raw(
      `ALTER TABLE "game_progress" ADD COLUMN IF NOT EXISTS "game_mode" text DEFAULT 'survival' NOT NULL;`
    ))
    return true
  } catch {
    return false
  }
}

export async function runDbMigrations(options: MigrationOptions = {}) {
  const shouldRun =
    options.force || (process.env.DB_MIGRATE_ON_STARTUP !== 'false' && process.env.NODE_ENV !== 'test')
  if (!shouldRun) return

  try {
    const migrateMode = (process.env.DB_MIGRATE_MODE ?? '').toLowerCase()
    if (migrateMode === 'solo-coop' || migrateMode === 'solo_coop') {
      await runDbMigrationsUpTo('0009_fresh_oracle')
      await applyCorePatches({ includeDetective: false })
      return
    }

    const hasProgressTable = await tableExists('public', 'game_progress')
    const hasGameModeColumn = hasProgressTable
      ? await columnExists('public', 'game_progress', 'game_mode')
      : false
    const journal = loadJournal()
    const tags = journal?.entries?.map((e) => e.tag).filter(Boolean) ?? []
    const has0009 = tags.includes('0009_fresh_oracle')
    const sqlFiles = (() => {
      try {
        return fs.readdirSync(migrationsFolder).filter((name) => name.endsWith('.sql')).slice(0, 50)
      } catch {
        return []
      }
    })()

    // #region agent log (debug)

    // #endregion agent log (debug)

    await migrate(db, { migrationsFolder })

    const hasGameModeAfter = (await columnExists('public', 'game_progress', 'game_mode'))
    // #region agent log (debug)

    // #endregion agent log (debug)
    await applyCorePatches()
  } catch (error) {
    // #region agent log (debug)

    // #endregion agent log (debug)
    // Try to recover from existing schemas (common in dev).
    if (isDuplicateSchemaOrRelationError(error)) {
      const baselined = await baselineExistingDatabase()
      if (baselined) {
        await migrate(db, { migrationsFolder })
        await applyCorePatches()
        return
      }

      // Even if the DB looks "already migrated", it may still miss late-added columns.
      const patched = await ensureGameModeColumn()
      await applyCorePatches()
      // #region agent log (debug)

      // #endregion agent log (debug)

      console.warn('[DB] Migrations already appear to be applied; continuing without startup migration.')
      return
    }

    // As a last-resort safety net, try to patch the missing game_mode column anyway.
    const patched = await ensureGameModeColumn()
    await applyCorePatches()
    // #region agent log (debug)

    // #endregion agent log (debug)

    throw error
  }
}
