import { describe, it, expect, beforeEach } from 'vitest'
import { useDossierStore } from './store'
import type { DossierEntry, EvidenceItem } from './store'

describe('DossierStore', () => {
    beforeEach(() => {
        // Reset store before each test
        useDossierStore.getState().resetDossier()
    })

    describe('Initial state', () => {
        it('should have correct initial values', () => {
            const state = useDossierStore.getState()

            expect(state.entries).toEqual([])
            expect(state.evidence).toEqual([])
            expect(state.flags).toEqual({})
            expect(state.detectiveName).toBeNull()
            expect(state.isOpen).toBe(false)
        })

        it('should have bureau and hauptbahnhof as discovered', () => {
            const state = useDossierStore.getState()

            expect(state.pointStates['bureau_office']).toBe('discovered')
            expect(state.pointStates['hauptbahnhof']).toBe('discovered')
        })

        it('should have other points as locked', () => {
            const state = useDossierStore.getState()

            expect(state.pointStates['munsterplatz_bank']).toBe('locked')
            expect(state.pointStates['ganter_brauerei']).toBe('locked')
        })
    })

    describe('addEntry', () => {
        it('should add new entry with timestamp and isRead=false', () => {
            const entry: Omit<DossierEntry, 'unlockedAt' | 'isRead'> = {
                id: 'test_entry',
                type: 'intel',
                title: 'Test Intel',
                description: 'Test description',
            }

            useDossierStore.getState().addEntry(entry)
            const state = useDossierStore.getState()

            expect(state.entries).toHaveLength(1)
            expect(state.entries[0].id).toBe('test_entry')
            expect(state.entries[0].type).toBe('intel')
            expect(state.entries[0].title).toBe('Test Intel')
            expect(state.entries[0].unlockedAt).toBeGreaterThan(0)
            expect(state.entries[0].isRead).toBe(false)
        })

        it('should not add duplicate entries', () => {
            const entry: Omit<DossierEntry, 'unlockedAt' | 'isRead'> = {
                id: 'duplicate',
                type: 'profile',
                title: 'A',
                description: 'B',
            }

            useDossierStore.getState().addEntry(entry)
            useDossierStore.getState().addEntry(entry)

            expect(useDossierStore.getState().entries).toHaveLength(1)
        })

        it('should prepend new entries (most recent first)', () => {
            const entry1: Omit<DossierEntry, 'unlockedAt' | 'isRead'> = {
                id: 'first',
                type: 'clue',
                title: 'First',
                description: 'A',
            }
            const entry2: Omit<DossierEntry, 'unlockedAt' | 'isRead'> = {
                id: 'second',
                type: 'clue',
                title: 'Second',
                description: 'B',
            }

            useDossierStore.getState().addEntry(entry1)
            useDossierStore.getState().addEntry(entry2)

            const entries = useDossierStore.getState().entries
            expect(entries[0].id).toBe('second')
            expect(entries[1].id).toBe('first')
        })
    })

    describe('addEvidence', () => {
        it('should add new evidence with timestamp', () => {
            const evidence: Omit<EvidenceItem, 'timestamp'> = {
                id: 'test_evidence',
                label: 'Test Evidence',
                description: 'Found at scene',
                source: 'Test Location',
            }

            useDossierStore.getState().addEvidence(evidence)
            const state = useDossierStore.getState()

            expect(state.evidence).toHaveLength(1)
            expect(state.evidence[0].id).toBe('test_evidence')
            expect(state.evidence[0].timestamp).toBeGreaterThan(0)
        })

        it('should not add duplicate evidence', () => {
            const evidence: Omit<EvidenceItem, 'timestamp'> = {
                id: 'dup_evidence',
                label: 'Duplicate',
                description: 'X',
                source: 'Y',
            }

            useDossierStore.getState().addEvidence(evidence)
            useDossierStore.getState().addEvidence(evidence)

            expect(useDossierStore.getState().evidence).toHaveLength(1)
        })
    })

    describe('setPointState', () => {
        it('should update point state', () => {
            useDossierStore.getState().setPointState('munsterplatz_bank', 'active')

            expect(useDossierStore.getState().pointStates['munsterplatz_bank']).toBe('active')
        })

        it('should overwrite existing state', () => {
            useDossierStore.getState().setPointState('bureau_office', 'cleared')

            expect(useDossierStore.getState().pointStates['bureau_office']).toBe('cleared')
        })
    })

    describe('unlockPoint', () => {
        it('should unlock locked point to discovered', () => {
            useDossierStore.getState().unlockPoint('munsterplatz_bank')

            expect(useDossierStore.getState().pointStates['munsterplatz_bank']).toBe('discovered')
        })

        it('should not downgrade active point', () => {
            useDossierStore.getState().setPointState('munsterplatz_bank', 'active')
            useDossierStore.getState().unlockPoint('munsterplatz_bank')

            expect(useDossierStore.getState().pointStates['munsterplatz_bank']).toBe('active')
        })

        it('should not downgrade cleared point', () => {
            useDossierStore.getState().setPointState('munsterplatz_bank', 'cleared')
            useDossierStore.getState().unlockPoint('munsterplatz_bank')

            expect(useDossierStore.getState().pointStates['munsterplatz_bank']).toBe('cleared')
        })

        it('should upgrade discovered to discovered (no-op)', () => {
            useDossierStore.getState().setPointState('munsterplatz_bank', 'discovered')
            useDossierStore.getState().unlockPoint('munsterplatz_bank')

            expect(useDossierStore.getState().pointStates['munsterplatz_bank']).toBe('discovered')
        })
    })

    describe('flags management', () => {
        it('setFlag should set boolean flag', () => {
            useDossierStore.getState().setFlag('test_flag', true)

            expect(useDossierStore.getState().flags['test_flag']).toBe(true)
        })

        it('addFlags should merge multiple flags', () => {
            useDossierStore.getState().addFlags({ flag1: true, flag2: 1 })

            const flags = useDossierStore.getState().flags
            expect(flags['flag1']).toBe(true)
            expect(flags['flag2']).toBe(true) // Number coerced to boolean
        })

        it('addFlags should not overwrite existing flags', () => {
            useDossierStore.getState().setFlag('existing', true)
            useDossierStore.getState().addFlags({ new_flag: true })

            const flags = useDossierStore.getState().flags
            expect(flags['existing']).toBe(true)
            expect(flags['new_flag']).toBe(true)
        })
    })

    describe('detectiveName', () => {
        it('should set detective name', () => {
            useDossierStore.getState().setDetectiveName('Inspector Müller')

            expect(useDossierStore.getState().detectiveName).toBe('Inspector Müller')
        })
    })

    describe('markAsRead', () => {
        it('should mark entry as read', () => {
            const entry: Omit<DossierEntry, 'unlockedAt' | 'isRead'> = {
                id: 'readable',
                type: 'profile',
                title: 'NPC',
                description: 'Details',
            }

            useDossierStore.getState().addEntry(entry)
            useDossierStore.getState().markAsRead('readable')

            expect(useDossierStore.getState().entries[0].isRead).toBe(true)
        })

        it('should not affect other entries', () => {
            const entry1: Omit<DossierEntry, 'unlockedAt' | 'isRead'> = {
                id: 'e1',
                type: 'intel',
                title: 'A',
                description: 'X',
            }
            const entry2: Omit<DossierEntry, 'unlockedAt' | 'isRead'> = {
                id: 'e2',
                type: 'intel',
                title: 'B',
                description: 'Y',
            }

            useDossierStore.getState().addEntry(entry1)
            useDossierStore.getState().addEntry(entry2)
            useDossierStore.getState().markAsRead('e1')

            const entries = useDossierStore.getState().entries
            const e1 = entries.find((e) => e.id === 'e1')
            const e2 = entries.find((e) => e.id === 'e2')

            expect(e1?.isRead).toBe(true)
            expect(e2?.isRead).toBe(false)
        })
    })

    describe('UI state', () => {
        it('toggleOpen should toggle isOpen', () => {
            expect(useDossierStore.getState().isOpen).toBe(false)

            useDossierStore.getState().toggleOpen()
            expect(useDossierStore.getState().isOpen).toBe(true)

            useDossierStore.getState().toggleOpen()
            expect(useDossierStore.getState().isOpen).toBe(false)
        })

        it('setOpen should set isOpen directly', () => {
            useDossierStore.getState().setOpen(true)
            expect(useDossierStore.getState().isOpen).toBe(true)

            useDossierStore.getState().setOpen(false)
            expect(useDossierStore.getState().isOpen).toBe(false)
        })
    })

    describe('resetDossier', () => {
        it('should clear all data and restore defaults', () => {
            // Add some data
            useDossierStore.getState().addEntry({
                id: 'test',
                type: 'clue',
                title: 'X',
                description: 'Y',
            })
            useDossierStore.getState().addEvidence({
                id: 'ev',
                label: 'E',
                description: 'D',
                source: 'S',
            })
            useDossierStore.getState().setFlag('flag', true)
            useDossierStore.getState().setDetectiveName('Name')

            // Reset
            useDossierStore.getState().resetDossier()

            const state = useDossierStore.getState()
            expect(state.entries).toEqual([])
            expect(state.evidence).toEqual([])
            expect(state.flags).toEqual({})
            expect(state.detectiveName).toBeNull()
            expect(state.pointStates['bureau_office']).toBe('discovered')
        })
    })
})
