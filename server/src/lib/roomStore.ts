export type PvpMatch = {
  id: string
  status: 'matching' | 'active' | 'finished'
  players: string[]
  startedAt: number
  updatedAt: number
}

const pvpMatches = new Map<string, PvpMatch>()

export function createPvpMatch(userId: string): PvpMatch {
  const now = Date.now()
  const match: PvpMatch = {
    id: `match_${now}_${Math.random().toString(16).slice(2, 6)}`,
    status: 'matching',
    players: [userId],
    startedAt: now,
    updatedAt: now,
  }
  pvpMatches.set(match.id, match)
  return match
}

export function joinPvpMatch(matchId: string, userId: string): PvpMatch | null {
  const match = pvpMatches.get(matchId)
  if (!match) return null
  if (!match.players.includes(userId)) {
    match.players.push(userId)
  }
  match.updatedAt = Date.now()
  if (match.players.length >= 2) {
    match.status = 'active'
  }
  return match
}

export function getPvpMatch(matchId: string): PvpMatch | undefined {
  return pvpMatches.get(matchId)
}

export function resetPvpRuntime() {
  pvpMatches.clear()
}
