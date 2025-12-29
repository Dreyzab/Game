import type { CoopQuestNode } from '../shared/types/coop'
import { COOP_PROLOGUE_NODES } from './coopContent'
import { COOP_SIDE_QUEST_NODES } from './coopSideQuests'

export type CoopNodeId = string

export type CoopGraphId = string

export interface CoopGraphDefinition {
  id: CoopGraphId
  nodes: Record<CoopNodeId, CoopQuestNode>
}

export interface CoopGraphValidationResult {
  errors: string[]
  warnings: string[]
}

export class CoopGraphEngine {
  private readonly nodes = new Map<CoopNodeId, CoopQuestNode>()
  private readonly nodeToGraph = new Map<CoopNodeId, CoopGraphId>()

  constructor(graphs: CoopGraphDefinition[]) {
    for (const graph of graphs) {
      for (const [nodeId, node] of Object.entries(graph.nodes)) {
        if (this.nodes.has(nodeId)) {
          const existingGraph = this.nodeToGraph.get(nodeId) ?? 'unknown'
          throw new Error(
            `Duplicate coop node id "${nodeId}" (graphs: "${existingGraph}", "${graph.id}")`
          )
        }
        this.nodes.set(nodeId, node)
        this.nodeToGraph.set(nodeId, graph.id)
      }
    }
  }

  getNode(nodeId: CoopNodeId): CoopQuestNode | undefined {
    return this.nodes.get(nodeId)
  }

  requireNode(nodeId: CoopNodeId): CoopQuestNode {
    const node = this.getNode(nodeId)
    if (!node) throw new Error(`Coop node not found: ${nodeId}`)
    return node
  }

  getGraphId(nodeId: CoopNodeId): CoopGraphId | undefined {
    return this.nodeToGraph.get(nodeId)
  }

  listNodeIds(): CoopNodeId[] {
    return Array.from(this.nodes.keys())
  }

  validate(options?: { allowDynamicReturn?: boolean }): CoopGraphValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const allowDynamicReturn = options?.allowDynamicReturn ?? true

    for (const [nodeId, node] of this.nodes.entries()) {
      if (node.id && node.id !== nodeId) {
        warnings.push(`Node key/id mismatch: key="${nodeId}" node.id="${node.id}"`)
      }

      for (const choice of node.choices ?? []) {
        const next = (choice as any).nextNodeId as string | undefined
        const action = (choice as any).action as string | undefined

        if (!next) {
          if (allowDynamicReturn && action === 'return') continue
          continue
        }

        if (!this.nodes.has(next)) {
          errors.push(
            `Missing nextNodeId reference: ${nodeId} -> (${choice.id}) -> ${next}`
          )
        }
      }
    }

    // A soft invariant: the default entry node should exist.
    if (!this.nodes.has('prologue_start')) {
      warnings.push('Missing expected entry node "prologue_start"')
    }

    return { errors, warnings }
  }
}

export const coopGraph = new CoopGraphEngine([
  { id: 'main', nodes: COOP_PROLOGUE_NODES },
  { id: 'sidequests', nodes: COOP_SIDE_QUEST_NODES },
])

