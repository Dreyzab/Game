import { runDbMigrations, runDbMigrationsUpTo, repairDatabaseCore } from '../db/migrate'

export type RepairDatabaseResult = {
  migrated: boolean
  mode?: 'full' | 'solo-coop'
  migrations?: {
    targetTag: string
    applied: string[]
    skipped?: boolean
  }
  patches: Array<{
    table: string
    column: string
    status: 'applied' | 'skipped' | 'failed'
    error?: string
  }>
  summary: {
    applied: number
    skipped: number
    failed: number
  }
}

export async function repairDatabase(): Promise<RepairDatabaseResult> {
  await runDbMigrations({ force: true })
  const repair = await repairDatabaseCore({ includeDetective: true })
  return { migrated: true, mode: 'full', ...repair }
}

export async function repairDatabaseSoloCoop(): Promise<RepairDatabaseResult> {
  const migrations = await runDbMigrationsUpTo('0009_fresh_oracle')
  const repair = await repairDatabaseCore({ includeDetective: false })
  const migrated = !migrations.skipped && migrations.applied.length > 0
  return { migrated, mode: 'solo-coop', migrations, ...repair }
}
