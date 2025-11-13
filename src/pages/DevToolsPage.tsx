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

  const seedPoints = useCallback(() => seedMapPoints({}), [seedMapPoints])
  const clearPoints = useCallback(() => clearMapPoints({}), [clearMapPoints])
  const reseedPoints = useCallback(() => reseedMapPoints({}), [reseedMapPoints])
  const seedZones = useCallback(() => seedSafeZones({}), [seedSafeZones])
  const clearZones = useCallback(() => clearSafeZones({}), [clearSafeZones])

  const run = async (fn: (() => Promise<unknown>) | undefined, label: string) => {
    if (!fn) return setMsg(`${label}: function unavailable`)
    try {
      const res = await fn()
      const serialized = typeof res === 'object' ? JSON.stringify(res) : ''
      setMsg(`${label}: done ${serialized}`)
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e)
      setMsg(`${label}: error ${message}`)
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
      <div className="glass-panel p-6">
        <div className="flex flex-wrap gap-3">
          <button onClick={() => run(() => seedPoints(), 'Seed Map Points')} className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-xs uppercase tracking-[0.24em] hover:border-[color:var(--color-cyan)]/70 hover:text-[color:var(--color-cyan)]">Seed Points</button>
          <button onClick={() => run(() => reseedPoints(), 'Reseed Map Points')} className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-xs uppercase tracking-[0.24em] hover:border-[color:var(--color-cyan)]/70 hover:text-[color:var(--color-cyan)]">Reseed Points</button>
          <button onClick={() => run(() => clearPoints(), 'Clear Map Points')} className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-xs uppercase tracking-[0.24em] hover:border-[color:var(--color-cyan)]/70 hover:text-[color:var(--color-cyan)]">Clear Points</button>
          <button onClick={() => run(() => seedZones(), 'Seed Safe Zones')} className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-xs uppercase tracking-[0.24em] hover:border-[color:var(--color-cyan)]/70 hover:text-[color:var(--color-cyan)]">Seed Zones</button>
          <button onClick={() => run(() => clearZones(), 'Clear Safe Zones')} className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2 text-xs uppercase tracking-[0.24em] hover:border-[color:var(--color-cyan)]/70 hover:text-[color:var(--color-cyan)]">Clear Zones</button>
        </div>
        <div className="mt-4 text-xs text-[color:var(--color-text-secondary)] font-mono break-all">{msg}</div>
      </div>

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
