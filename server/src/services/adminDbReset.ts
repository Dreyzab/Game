import { db } from '../db'
import { sql, inArray } from 'drizzle-orm'
import { mapPoints, items, safeZones, dangerZones, worldRifts } from '../db/schema'
import { SEED_MAP_POINTS } from '../seeds/mapPoints'
import { ITEM_TEMPLATES } from '../seeds/itemTemplates'
import { SEED_SAFE_ZONES } from '../seeds/safeZones'
import { SEED_DANGER_ZONES } from '../seeds/dangerZones'

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

export async function seedDatabase(): Promise<{ success: boolean; stats: any }> {
  const stats: any = {};
  const now = Date.now();

  // 1. Map Points
  let mpCount = 0;
  for (const p of SEED_MAP_POINTS) {
    await db.insert(mapPoints)
      .values({
        id: p.id,
        title: p.title,
        description: p.description,
        lat: p.coordinates.lat,
        lng: p.coordinates.lng,
        type: p.type,
        qrCode: p.qrCode ?? (p.metadata as any)?.qrCode,
        phase: p.phase ?? null,
        isActive: p.isActive,
        metadata: { ...(p.metadata ?? {}) },
      })
      .onConflictDoUpdate({
        target: mapPoints.id,
        set: {
          title: p.title,
          description: p.description,
          lat: p.coordinates.lat,
          lng: p.coordinates.lng,
          type: p.type,
          qrCode: p.qrCode ?? (p.metadata as any)?.qrCode,
          phase: p.phase ?? null,
          isActive: p.isActive,
          metadata: { ...(p.metadata ?? {}) },
        },
      });
    mpCount++;
  }
  stats.mapPoints = mpCount;

  // 2. Safe Zones
  await db.delete(safeZones);
  let szCount = 0;
  for (const zone of SEED_SAFE_ZONES) {
    await db.insert(safeZones).values({
      title: zone.name,
      faction: zone.faction,
      polygon: zone.polygon,
      isActive: zone.isActive,
    });
    szCount++;
  }
  stats.safeZones = szCount;

  // 3. Danger Zones
  await db.delete(worldRifts);
  await db.delete(dangerZones);
  let dzCount = 0;
  for (const zone of SEED_DANGER_ZONES) {
    await db.insert(dangerZones).values({
      key: zone.key,
      title: zone.title,
      dangerLevel: zone.dangerLevel,
      polygon: zone.polygon,
      spawnPoints: zone.spawnPoints ?? [],
      isActive: true,
    });
    dzCount++;
  }
  stats.dangerZones = dzCount;

  // 4. Item Templates
  const templateIds = ITEM_TEMPLATES.map((t) => t.id);
  await db.delete(items).where(inArray(items.templateId, templateIds));
  let itemCount = 0;
  for (const tpl of ITEM_TEMPLATES) {
    await db.insert(items).values({
      templateId: tpl.id,
      instanceId: `tpl_${tpl.id}`,
      name: tpl.name,
      description: tpl.description,
      kind: tpl.kind,
      rarity: tpl.rarity,
      stats: {
        ...tpl.baseStats,
        width: tpl.baseStats.width,
        height: tpl.baseStats.height,
        weight: tpl.baseStats.weight,
      },
      quantity: 1,
      createdAt: now,
    });
    itemCount++;
  }
  stats.itemTemplates = itemCount;

  return { success: true, stats };
}

