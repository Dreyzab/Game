import { describe, expect, test } from 'bun:test'
import { coopGraph } from '../../src/lib/coopGraph'

describe('coopGraph', () => {
  test('has no broken nextNodeId links', () => {
    const { errors } = coopGraph.validate()
    expect(errors).toEqual([])
  })

  test('includes side quest nodes', () => {
    expect(coopGraph.getNode('sq_signal_cache_start')).toBeTruthy()
    expect(coopGraph.getNode('sq_signal_cache_return')).toBeTruthy()
  })
})

