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

function getPgErrorCode(error: unknown): string | undefined {
  const maybe = error as any
  if (!maybe) return undefined
  if (typeof maybe.code === 'string') return maybe.code
  if (maybe.cause && typeof maybe.cause.code === 'string') return maybe.cause.code
  return undefined
}

function isDuplicateSchemaOrRelationError(error: unknown): boolean {
  const code = getPgErrorCode(error)
  return code === '42P06' || code === '42P07'
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

export async function runDbMigrations() {
  const shouldRun =
    process.env.DB_MIGRATE_ON_STARTUP !== 'false' && process.env.NODE_ENV !== 'test'
  if (!shouldRun) return

  try {
    await migrate(db, { migrationsFolder })
  } catch (error) {
    // Try to recover from existing schemas (common in dev).
    if (isDuplicateSchemaOrRelationError(error)) {
      const baselined = await baselineExistingDatabase()
      if (baselined) {
        await migrate(db, { migrationsFolder })
        return
      }

      console.warn('[DB] Migrations already appear to be applied; continuing without startup migration.')
      return
    }

    throw error
  }
}
