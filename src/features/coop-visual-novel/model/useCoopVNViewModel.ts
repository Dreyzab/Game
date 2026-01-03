import { useEffect, useMemo, useRef, useState } from 'react'
import { authenticatedClient } from '@/shared/api/client'
import type {
  CoopQuestChoice,
  CoopQuestNode,
  CoopRoleId,
  SequentialBroadcastState,
} from '@/shared/types/coop'

const FALLBACK_NODE: CoopQuestNode = {
  id: '',
  title: '',
  description: '',
  background: '/images/backgrounds/default_dark.jpg',
  interactionType: 'sync',
  choices: [],
  privateText: {},
}

export type SequentialReaction = SequentialBroadcastState['reactions'][number]

export type CoopVNLogger = (
  hypothesisId: string,
  location: string,
  message: string,
  data: Record<string, unknown>
) => void

export interface UseCoopVNViewModelParams {
  roomCode?: string | null
  sceneId: string
  questNode: CoopQuestNode | null
  participants: Array<{ id: number; name: string }>
  votes: any[]
  controlledPlayerId: number | null
  controlledRole?: CoopRoleId
  sequentialBroadcast: SequentialBroadcastState | null
  castVote: (choiceId: string, asPlayerId?: number, nodeId?: string) => Promise<void>
  logger?: CoopVNLogger
}

export interface UseCoopVNViewModelReturn {
  localNodeId: string
  localNode: CoopQuestNode
  backgroundUrl: string

  rawChoices: CoopQuestChoice[]
  sortedVotes: any[]
  selectedChoiceId?: string
  isGroupVoteNode: boolean
  voteCounts: Record<string, number>

  narrativeChunks: string[]
  chunkIndex: number
  isNarrationDone: boolean

  isCheckpoint: boolean
  isAtSharedCheckpoint: boolean

  isSequentialMode: boolean
  isMyTurnInSequential: boolean
  ephemeralReaction: SequentialReaction | null

  shouldShowChoices: boolean

  handleChoiceSelect: (choiceId: string) => Promise<void>
  handleAdvance: () => Promise<void>
  handleSequentialContinue: () => Promise<void>
}

const isCheckpointNode = (node: CoopQuestNode | null | undefined) =>
  node?.interactionType === 'vote' ||
  node?.interactionType === 'contribute' ||
  (node?.interactionType === 'sync' && Array.isArray(node?.choices) && node.choices.length > 1)

export function useCoopVNViewModel(params: UseCoopVNViewModelParams): UseCoopVNViewModelReturn {
  const [localNodeId, setLocalNodeId] = useState<string>(params.sceneId)
  const [localNode, setLocalNode] = useState<CoopQuestNode>(params.questNode ?? FALLBACK_NODE)
  const nodeCache = useRef<Map<string, CoopQuestNode | null>>(new Map([[params.sceneId, params.questNode]]))
  const localNodeIdRef = useRef<string>(localNodeId)
  const loggerRef = useRef(params.logger)
  const syncLogContextRef = useRef({
    roomCode: params.roomCode ?? null,
    participantsCount: Array.isArray(params.participants) ? params.participants.length : null,
    controlledPlayerId: params.controlledPlayerId ?? null,
    controlledRole: params.controlledRole ?? null,
  })

  useEffect(() => {
    loggerRef.current = params.logger
  }, [params.logger])

  useEffect(() => {
    syncLogContextRef.current = {
      roomCode: params.roomCode ?? null,
      participantsCount: Array.isArray(params.participants) ? params.participants.length : null,
      controlledPlayerId: params.controlledPlayerId ?? null,
      controlledRole: params.controlledRole ?? null,
    }
  }, [params.controlledPlayerId, params.controlledRole, params.participants, params.roomCode])

  useEffect(() => {
    localNodeIdRef.current = localNodeId
  }, [localNodeId])

  useEffect(() => {
    if (!params.sceneId) return
    const syncLogContext = syncLogContextRef.current
    loggerRef.current?.(
      'H1',
      'src/features/coop-visual-novel/model/useCoopVNViewModel.ts:scene-sync',
      'sync local node to room sceneId/questNode',
      {
        roomCode: syncLogContext.roomCode,
        prevLocalNodeId: localNodeIdRef.current ?? null,
        sceneId: params.sceneId,
        questNodeId: (params.questNode as any)?.id ?? null,
        participants: syncLogContext.participantsCount,
        controlledPlayerId: syncLogContext.controlledPlayerId,
        controlledRole: syncLogContext.controlledRole,
      }
    )
    setLocalNodeId(params.sceneId)
    setLocalNode(params.questNode ?? FALLBACK_NODE)
    nodeCache.current.set(params.sceneId, params.questNode)
  }, [params.sceneId, params.questNode])

  const fetchNode = async (nodeId: string) => {
    const cached = nodeCache.current.get(nodeId)
    if (cached) return cached

    const client = authenticatedClient()
    const { data, error } = await client.coop.nodes({ id: nodeId }).get()
    if (error) throw error

    const node = (data as any)?.node as CoopQuestNode | null | undefined
    if (node) nodeCache.current.set(nodeId, node)
    return node ?? null
  }

  const markReached = async (nodeId: string) => {
    if (!params.roomCode) return
    const client = authenticatedClient()
    await client.coop.rooms({ code: params.roomCode }).reach.post({ nodeId })
  }

  const advanceLocal = async (nextNodeId?: string) => {
    if (!nextNodeId) return
    const nextNode = await fetchNode(nextNodeId)
    if (!nextNode) return

    loggerRef.current?.(
      'H2',
      'src/features/coop-visual-novel/model/useCoopVNViewModel.ts:advanceLocal',
      'advanceLocal to nextNodeId',
      {
        roomCode: params.roomCode ?? null,
        fromLocalNodeId: localNodeIdRef.current ?? null,
        toLocalNodeId: nextNodeId,
        toInteractionType: (nextNode as any)?.interactionType ?? null,
        willMarkReached: Boolean(isCheckpointNode(nextNode ?? undefined)),
        sceneId: params.sceneId,
      }
    )

    setLocalNodeId(nextNodeId)
    setLocalNode(nextNode)

    if (isCheckpointNode(nextNode)) {
      markReached(nextNodeId).catch(() => {})
    }
  }

  const isCheckpoint = isCheckpointNode(localNode)
  const isAtSharedCheckpoint = isCheckpoint && localNodeId === params.sceneId

  const [localSelections, setLocalSelections] = useState<Record<string, string>>({})

  const myVote =
    params.controlledPlayerId && isAtSharedCheckpoint
      ? params.votes.find((v: any) => v.voterId === params.controlledPlayerId && v.sceneId === params.sceneId)
      : undefined

  const selectedChoiceId = isAtSharedCheckpoint
    ? (myVote?.choiceId as string | undefined)
    : localSelections[localNodeId]

  const isGroupVoteNode =
    (localNode.interactionType === 'vote' || localNode.interactionType === 'contribute') && isAtSharedCheckpoint

  const voteCounts = useMemo<Record<string, number>>(() => {
    if (!isGroupVoteNode) return {}
    const counts: Record<string, number> = {}
    params.votes
      .filter((v: any) => v.sceneId === params.sceneId)
      .forEach((v: any) => {
        counts[v.choiceId] = (counts[v.choiceId] || 0) + 1
      })
    return counts
  }, [isGroupVoteNode, params.sceneId, params.votes])

  const rawChoices = useMemo(
    () =>
      (localNode.choices ?? []).filter(
        (choice: any) => !choice.requiredRole || choice.requiredRole === params.controlledRole
      ) as CoopQuestChoice[],
    [localNode.choices, params.controlledRole]
  )

  const sortedVotes = useMemo(
    () => [...params.votes].sort((a: any, b: any) => (a.createdAt ?? 0) - (b.createdAt ?? 0)),
    [params.votes]
  )

  const backgroundUrl = localNode.background ?? '/images/backgrounds/default_dark.jpg'

  const narrativeChunks = useMemo(() => {
    const chunks: string[] = []
    const base = String(localNode.description ?? '').trim()
    if (base) {
      base
        .split(/\n\s*\n+/g)
        .map((p) => p.trim())
        .filter(Boolean)
        .forEach((p) => chunks.push(p))
    }

    const insight = params.controlledRole
      ? ((localNode.privateText as any)?.[params.controlledRole] as string | undefined)
      : undefined
    if (insight && String(insight).trim().length > 0) {
      chunks.push(`[${String(params.controlledRole).toUpperCase()} INSIGHT]\n${String(insight).trim()}`)
    }

    return chunks.length > 0 ? chunks : ['...']
  }, [localNode.description, localNode.privateText, params.controlledRole])

  const [chunkIndex, setChunkIndex] = useState(0)
  const [isNarrationDone, setNarrationDone] = useState(false)

  useEffect(() => {
    setChunkIndex(0)
    setNarrationDone(false)
  }, [localNodeId])

  const [ephemeralReaction, setEphemeralReaction] = useState<SequentialReaction | null>(null)
  const lastReactionCountRef = useRef<number>(0)

  useEffect(() => {
    if (!params.sequentialBroadcast) {
      lastReactionCountRef.current = 0
      return
    }
    const currentCount = params.sequentialBroadcast.reactions.length
    if (currentCount > lastReactionCountRef.current) {
      const latest = params.sequentialBroadcast.reactions[currentCount - 1]
      setEphemeralReaction(latest)

      const timer = setTimeout(() => {
        setEphemeralReaction((prev) => (prev === latest ? null : prev))
      }, 6000)

      lastReactionCountRef.current = currentCount
      return () => clearTimeout(timer)
    }

    if (lastReactionCountRef.current === 0 && currentCount > 0) {
      lastReactionCountRef.current = currentCount
    }
  }, [params.sequentialBroadcast])

  const isSequentialMode = localNode.interactionType === 'sequential_broadcast'
  const isMyTurnInSequential =
    isSequentialMode && params.sequentialBroadcast?.activePlayerId === params.controlledPlayerId

  const shouldShowChoices =
    isNarrationDone &&
    !ephemeralReaction &&
    ((isCheckpoint && isAtSharedCheckpoint) ||
      localNode.interactionType === 'individual' ||
      isMyTurnInSequential)

  const handleChoiceSelect = async (choiceId: string) => {
    const choice = rawChoices.find((c: any) => c.id === choiceId)
    if (!choice) return

    loggerRef.current?.(
      'H3',
      'src/features/coop-visual-novel/model/useCoopVNViewModel.ts:handleChoiceSelect',
      'choice selected',
      {
        roomCode: params.roomCode ?? null,
        sceneId: params.sceneId,
        localNodeId,
        localInteractionType: (localNode as any)?.interactionType ?? null,
        isCheckpointNode: Boolean(isCheckpointNode(localNode)),
        isAtSharedCheckpoint,
        choiceId,
        nextNodeId: (choice as any)?.nextNodeId ?? null,
        controlledPlayerId: params.controlledPlayerId ?? null,
        controlledRole: params.controlledRole ?? null,
      }
    )

    setLocalSelections((prev) => ({ ...prev, [localNodeId]: choiceId }))

    if (isCheckpointNode(localNode)) {
      if (!isAtSharedCheckpoint) {
        markReached(localNodeId).catch(() => {})
        return
      }
      await params.castVote(choiceId, params.controlledPlayerId ?? undefined)
      return
    }

    if (localNode.interactionType === 'individual') {
      await params.castVote(choiceId, params.controlledPlayerId ?? undefined, localNodeId)
      await advanceLocal((choice as any)?.nextNodeId)
      return
    }

    if (localNode.interactionType === 'sequential_broadcast') {
      await params.castVote(choiceId, params.controlledPlayerId ?? undefined)
      return
    }

    await advanceLocal((choice as any)?.nextNodeId)
  }

  const handleAdvance = async () => {
    if (chunkIndex < narrativeChunks.length - 1) {
      setChunkIndex((v) => v + 1)
      return
    }

    setNarrationDone(true)

    if (!isCheckpoint && rawChoices.length === 1) {
      const singleChoice = rawChoices[0]
      if ((singleChoice as any)?.nextNodeId) {
        await advanceLocal((singleChoice as any)?.nextNodeId)
      }
    }
  }

  const handleSequentialContinue = async () => {
    if (!params.roomCode) return
    const client = authenticatedClient()
    try {
      await client.coop.rooms({ code: params.roomCode }).advance_sequential.post()
    } catch (err: any) {
      console.error('Failed to advance sequential:', err)
    }
  }

  return {
    localNodeId,
    localNode,
    backgroundUrl,
    rawChoices,
    sortedVotes,
    selectedChoiceId,
    isGroupVoteNode,
    voteCounts,
    narrativeChunks,
    chunkIndex,
    isNarrationDone,
    isCheckpoint,
    isAtSharedCheckpoint,
    isSequentialMode,
    isMyTurnInSequential,
    ephemeralReaction,
    shouldShowChoices,
    handleChoiceSelect,
    handleAdvance,
    handleSequentialContinue,
  }
}
