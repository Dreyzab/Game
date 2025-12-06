import React, { useCallback, useState } from 'react'
import { Layout } from '@/widgets/layout'
import { Heading } from '@/shared/ui/components/Heading'
import { Text } from '@/shared/ui/components/Text'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api.js'
import { convexClient } from '@/shared/api/convex'
import { getDeviceId } from '@/shared/lib/utils/deviceId'
import { useQuestDetails } from '@/shared/hooks/useQuestDetails'

type Quest = {
  id: string
  title: string
  currentStep?: number | null
  attempt?: number | null
  templateVersion?: number | null
  completedAt?: number | string | null
  abandonedAt?: number | string | null
}

const isQuest = (value: unknown): value is Quest => {
  if (!value || typeof value !== 'object') {
    return false
  }
  const quest = value as Record<string, unknown>
  return typeof quest.id === 'string' && typeof quest.title === 'string'
}

const normalizeQuests = (value: unknown): Quest[] =>
  Array.isArray(value) ? value.filter(isQuest) : []

export const DevToolsPage: React.FC = () => {
  const [msg, setMsg] = useState<string>('')

  const seedMapPoints = useMutation(api.mapPointsSeed.seedMapPoints)
  const clearMapPoints = useMutation(api.mapPointsSeed.clearMapPoints)
  const reseedMapPoints = useMutation(api.mapPointsSeed.reseedMapPoints)

  const seedSafeZones = useMutation(api.zonesSeed.seedSafeZones)
  const clearSafeZones = useMutation(api.zonesSeed.clearSafeZones)
  const seedDangerZones = useMutation(api.zonesSeed.seedDangerZones)
  const clearDangerZones = useMutation(api.zonesSeed.clearDangerZones)

  const seedQuests = useMutation(api.questsSeed.seedQuests)
  const clearQuests = useMutation(api.questsSeed.clearQuests)

  const seedCombat = useMutation(api.combatSeed.seedAllCombatData)
  const clearCombat = useMutation(api.combatSeed.clearCombatData)

  const seedPoints = useCallback(() => seedMapPoints({}), [seedMapPoints])
  const clearPoints = useCallback(() => clearMapPoints({}), [clearMapPoints])
  const reseedPoints = useCallback(() => reseedMapPoints({}), [reseedMapPoints])

  const seedZones = useCallback(() => seedSafeZones({}), [seedSafeZones])
  const clearZones = useCallback(() => clearSafeZones({}), [clearSafeZones])
  const seedDanger = useCallback(() => seedDangerZones({}), [seedDangerZones])
  const clearDanger = useCallback(() => clearDangerZones({}), [clearDangerZones])

  const seedQuestData = useCallback(() => seedQuests({}), [seedQuests])
  const clearQuestData = useCallback(() => clearQuests({}), [clearQuests])

  const seedCombatData = useCallback(() => seedCombat({}), [seedCombat])
  const clearCombatData = useCallback(() => clearCombat({}), [clearCombat])

  const run = async (fn: (() => Promise<unknown>) | undefined, label: string) => {
    if (!fn) return setMsg(`${label}: function unavailable`)
    try {
      const res = await fn()
      const serialized = typeof res === 'object' ? JSON.stringify(res) : ''
      setMsg(`${label}: done ${serialized}`)
      console.log(`[DevTools] ${label} response:`, res)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e)
      setMsg(`${label}: error ${message}`)
      console.error(`[DevTools] ${label} error:`, e)
    }
  }

  // Quests QA Panel
  const [quests, setQuests] = useState<Quest[]>([])
  const [selectedQuestId, setSelectedQuestId] = useState<string | null>(null)
  const { data: details, isLoading: detailsLoading } = useQuestDetails(selectedQuestId ?? undefined)

  const loadActiveQuests = async () => {
    if (!convexClient) {
      setQuests([])
      return
    }
    const deviceId = getDeviceId()
    try {
      // @ts-expect-error calling string route without codegen
      const res = await convexClient.query('quests:getActive', { deviceId })
      setQuests(normalizeQuests(res))
    } catch (e) {
      console.warn('[DevTools] loadActiveQuests failed', e)
      setQuests([])
    }
  }

  const loadCompletedQuests = async () => {
    if (!convexClient) {
      setQuests([])
      return
    }
    const deviceId = getDeviceId()
    try {
      // @ts-expect-error calling string route without codegen
      const res = await convexClient.query('quests:getCompleted', { deviceId, limit: 100 })
      setQuests(normalizeQuests(res))
    } catch (e) {
      console.warn('[DevTools] loadCompletedQuests failed', e)
      setQuests([])
    }
  }

  return (
    <Layout>
      <div className="mb-8 text-center">
        <Heading level={1}>DevTools</Heading>
        <Text variant="muted" size="sm" className="mt-3 uppercase tracking-[0.28em]">
          Сиды, очистка и тестовые операции (MVP)
        </Text>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* MAP & ZONES */}
        <div className="glass-panel p-6 space-y-4">
          <Heading level={3}>Map & Zones</Heading>
          <div className="flex flex-wrap gap-2">
            <div className="flex flex-col gap-2 w-full">
              <Text size="xs" variant="muted" className="uppercase">Map Points</Text>
              <div className="flex gap-2">
                <button onClick={() => run(() => seedPoints(), 'Seed Map')} className="btn-dev">Seed Points</button>
                <button onClick={() => run(() => reseedPoints(), 'Reseed Map')} className="btn-dev">Reseed Points</button>
                <button onClick={() => run(() => clearPoints(), 'Clear Map')} className="btn-dev btn-danger">Clear Points</button>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full mt-2">
              <Text size="xs" variant="muted" className="uppercase">Zones</Text>
              <div className="flex gap-2 flex-wrap">
                <button onClick={() => run(() => seedZones(), 'Seed Safe')} className="btn-dev">Seed Safe Zones</button>
                <button onClick={() => run(() => clearZones(), 'Clear Safe')} className="btn-dev btn-danger">Clear Safe</button>
                <button onClick={() => run(() => seedDanger(), 'Seed Danger')} className="btn-dev">Seed Danger</button>
                <button onClick={() => run(() => clearDanger(), 'Clear Danger')} className="btn-dev btn-danger">Clear Danger</button>
              </div>
            </div>
          </div>
        </div>

        {/* GAMEPLAY SYSTEMS */}
        <div className="glass-panel p-6 space-y-4">
          <Heading level={3}>Gameplay Data</Heading>
          <div className="flex flex-wrap gap-2">

            <div className="flex flex-col gap-2 w-full">
              <Text size="xs" variant="muted" className="uppercase">Quests</Text>
              <div className="flex gap-2">
                <button onClick={() => run(() => seedQuestData(), 'Seed Quests')} className="btn-dev">Seed Quests</button>
                <button onClick={() => run(() => clearQuestData(), 'Clear Quests')} className="btn-dev btn-danger">Clear Quests</button>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full mt-2">
              <Text size="xs" variant="muted" className="uppercase">Combat</Text>
              <div className="flex gap-2">
                <button onClick={() => run(() => seedCombatData(), 'Seed Combat')} className="btn-dev">Seed Combat All</button>
                <button onClick={() => run(() => clearCombatData(), 'Clear Combat')} className="btn-dev btn-danger">Clear Combat All</button>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* INVENTORY NOTE */}
      <div className="glass-panel p-4 my-6 text-center">
        <Text size="sm" variant="muted">
          Player Inventory & Equipment tools are located in the <span className="text-cyan-400">Inventory Screen</span>
        </Text>
      </div>

      <div className="glass-panel p-4 mt-2 mb-6 bg-black/40">
        <Text size="xs" className="font-mono text-cyan-500 break-all">{msg || 'Ready'}</Text>
      </div>

      <style>{`
        .btn-dev {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            border-radius: 9999px;
            border: 1px solid var(--color-border);
            background-color: var(--color-surface);
            padding: 0.5rem 0.75rem;
            font-size: 0.75rem;
            line-height: 1rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            transition: all 0.2s;
        }
        .btn-dev:hover {
            border-color: rgba(6, 182, 212, 0.7);
            color: rgba(6, 182, 212, 1);
        }
        .btn-danger {
            border-color: rgba(239, 68, 68, 0.3);
            color: rgba(239, 68, 68, 0.8);
        }
        .btn-danger:hover {
             border-color: rgba(239, 68, 68, 0.8);
             color: rgba(239, 68, 68, 1);
             background-color: rgba(239, 68, 68, 0.1);
        }
      `}</style>

      <div className="glass-panel p-6 mt-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Heading level={3}>Quests QA</Heading>
          <div className="flex items-center gap-2">
            <button onClick={loadActiveQuests} className="inline-flex items-center gap-2 rounded border border-[color:var(--color-border)] px-3 py-1 text-xs hover:border-[color:var(--color-cyan)]/70 hover:text-[color:var(--color-cyan)]">Load Active</button>
            <button onClick={loadCompletedQuests} className="inline-flex items-center gap-2 rounded border border-[color:var(--color-border)] px-3 py-1 text-xs hover:border-[color:var(--color-cyan)]/70 hover:text-[color:var(--color-cyan)]">Load Completed</button>
          </div>
        </div>
        {quests.length === 0 ? (
          <Text variant="muted" size="sm">No active quests loaded</Text>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[color:var(--color-text-secondary)]">
                  <th className="py-2 pr-3">ID</th>
                  <th className="py-2 pr-3">Title</th>
                  <th className="py-2 pr-3">Step</th>
                  <th className="py-2 pr-3">Attempt</th>
                  <th className="py-2 pr-3">TplVer</th>
                  <th className="py-2 pr-3">Completed</th>
                  <th className="py-2 pr-3">Abandoned</th>
                  <th className="py-2 pr-3"></th>
                </tr>
              </thead>
              <tbody>
                {quests.map((q) => (
                  <tr key={q.id} className="border-t border-[color:var(--color-border)]/40">
                    <td className="py-2 pr-3 font-mono text-[12px]">{q.id}</td>
                    <td className="py-2 pr-3">{q.title}</td>
                    <td className="py-2 pr-3 font-mono text-[12px]">{q.currentStep ?? '-'}</td>
                    <td className="py-2 pr-3 font-mono text-[12px]">{q.attempt ?? '-'}</td>
                    <td className="py-2 pr-3 font-mono text-[12px]">{q.templateVersion ?? '-'}</td>
                    <td className="py-2 pr-3 font-mono text-[12px]">{q.completedAt ? new Date(q.completedAt).toLocaleString() : '-'}</td>
                    <td className="py-2 pr-3 font-mono text-[12px]">{q.abandonedAt ? new Date(q.abandonedAt).toLocaleString() : '-'}</td>
                    <td className="py-2 pr-3">
                      <button onClick={() => setSelectedQuestId(q.id)} className="rounded border border-[color:var(--color-border)] px-2 py-1 text-xs hover:border-[color:var(--color-cyan)]/70 hover:text-[color:var(--color-cyan)]">Подробнее</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedQuestId && (
          <div className="mt-4">
            <Heading level={4}>Details: {selectedQuestId}</Heading>
            {detailsLoading ? (
              <Text variant="muted" size="sm">Loading…</Text>
            ) : details ? (
              <pre className="mt-2 text-xs font-mono whitespace-pre-wrap">{JSON.stringify(details, null, 2)}</pre>
            ) : (
              <Text variant="muted" size="sm">No details</Text>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default DevToolsPage
