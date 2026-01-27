import { Elysia, t } from 'elysia'
import { auth } from '../auth'
import { resetDatabaseAll, resetDatabaseMultiplayer, seedDatabase } from '../../services/adminDbReset'
import { repairDatabase, repairDatabaseSoloCoop } from '../../services/adminDbRepair'
import { resetPresenceRuntime } from './presence'
import { resetPvpRuntime } from '../../lib/roomStore'

type AuthedUser = { id: string; type: 'clerk' | 'guest' }

function isAllowedAdmin(user: AuthedUser | null, headers: Record<string, string | undefined>): boolean {
  const tokenHeader = headers['x-admin-token'] ?? headers['X-Admin-Token']
  const adminToken = (process.env.ADMIN_TOKEN ?? '').trim()
  const adminUserIds = (process.env.ADMIN_USER_IDS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  // 1) Clerk allowlist (recommended for prod)
  if (user?.type === 'clerk' && adminUserIds.length > 0) {
    return adminUserIds.includes(user.id)
  }

  // 2) Token header (useful for guest mode / local dev)
  if (adminToken && tokenHeader) {
    return tokenHeader === adminToken
  }

  // 3) Dev fallback: allow in development
  if (process.env.NODE_ENV !== 'production') {
    return true
  }

  return false
}

export const adminRoutes = (app: Elysia) =>
  app
    .use(auth)
    .group('/admin', (app) =>
      app
        .post(
          '/db/reset-all',
          async ({ user, headers, set }) => {
            if (!isAllowedAdmin((user as any) ?? null, headers as any)) {
              set.status = 403
              return { error: 'Forbidden' }
            }

            const result = await resetDatabaseAll()
            return { ok: true, result }
          },
          {
            // no body
            body: t.Optional(t.Object({})),
          }
        )
        .post(
          '/db/reset-multiplayer',
          async ({ user, headers, set }) => {
            if (!isAllowedAdmin((user as any) ?? null, headers as any)) {
              set.status = 403
              return { error: 'Forbidden' }
            }

            const result = await resetDatabaseMultiplayer()

            // Clear runtime multiplayer state (in-memory)
            resetPresenceRuntime()
            resetPvpRuntime()

            return { ok: true, result, runtime: { presence: 'cleared', pvp: 'cleared' } }
          },
          {
            body: t.Optional(t.Object({})),
          }
        )
        .post(
          '/db/seed',
          async ({ user, headers, set }) => {
            if (!isAllowedAdmin((user as any) ?? null, headers as any)) {
              set.status = 403
              return { error: 'Forbidden' }
            }

            const result = await seedDatabase()
            return { ok: true, ...result }
          },
          {
            body: t.Optional(t.Object({})),
          }
        )
        .post(
          '/db/repair',
          async ({ user, headers, set }) => {
            if (!isAllowedAdmin((user as any) ?? null, headers as any)) {
              set.status = 403
              return { error: 'Forbidden' }
            }

            const result = await repairDatabase()
            return { ok: true, ...result }
          },
          {
            body: t.Optional(t.Object({})),
          }
        )
        .post(
          '/db/repair-solo-coop',
          async ({ user, headers, set }) => {
            if (!isAllowedAdmin((user as any) ?? null, headers as any)) {
              set.status = 403
              return { error: 'Forbidden' }
            }

            const result = await repairDatabaseSoloCoop()
            return { ok: true, ...result }
          },
          {
            body: t.Optional(t.Object({})),
          }
        )
    )
