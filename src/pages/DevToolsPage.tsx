import React, { useCallback, useState } from 'react'
import { Layout } from '@/widgets/layout'
import { Heading } from '@/shared/ui/components/Heading'
import { Text } from '@/shared/ui/components/Text'
import { useConvex } from 'convex/react'

export const DevToolsPage: React.FC = () => {
  const convex = useConvex()
  const [msg, setMsg] = useState<string>('')

  const callMutation = useCallback((name: string, args: Record<string, any> = {}) =>
    (convex as unknown as { mutation: (n: string, a: any) => Promise<any> }).mutation(name, args)
  , [convex])
  const seedPoints = useCallback(() => callMutation('mapPointsSeed:seedMapPoints', {}), [callMutation])
  const clearPoints = useCallback(() => callMutation('mapPointsSeed:clearMapPoints', {}), [callMutation])
  const reseedPoints = useCallback(() => callMutation('mapPointsSeed:reseedMapPoints', {}), [callMutation])
  const seedZones = useCallback(() => callMutation('zonesSeed:seedSafeZones', {}), [callMutation])
  const clearZones = useCallback(() => callMutation('zonesSeed:clearSafeZones', {}), [callMutation])

  const run = async (fn: (() => Promise<any>) | undefined, label: string) => {
    if (!fn) return setMsg(`${label}: function unavailable`)
    try {
      const res = await fn()
      setMsg(`${label}: done ${typeof res === 'object' ? JSON.stringify(res) : ''}`)
    } catch (e: any) {
      setMsg(`${label}: error ${e?.message ?? e}`)
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
    </Layout>
  )
}

export default DevToolsPage
