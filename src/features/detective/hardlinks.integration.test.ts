import { describe, it, expect, vi, beforeEach } from 'vitest'
import { resolveHardlink, executeHardlinkActions } from './hardlinks'
import { useDossierStore } from './dossier'
import { DETECTIVE_PACK_ID, HARDLINK_IDS, POINT_IDS, SCENE_IDS } from './constants'

describe('Hardlink → VN Flow (Integration)', () => {
    const mockNavigate = vi.fn()
    const mockToast = vi.fn()

    beforeEach(() => {
        // Reset store and mocks before each test
        useDossierStore.getState().resetDossier()
        mockNavigate.mockClear()
        mockToast.mockClear()
    })

    describe('Complete flow: QR scan → Actions execution', () => {
        it('should execute full CASE01_BRIEFING flow', async () => {
            // 1. Simulate QR code scan
            const qrData = `gw3:hardlink:${DETECTIVE_PACK_ID}:${HARDLINK_IDS.CASE01_BRIEFING}`
            const payload = await resolveHardlink(qrData)

            expect(payload).toBeTruthy()
            expect(payload?.actions).toHaveLength(3)

            // 2. Execute all actions
            executeHardlinkActions(payload!.actions, mockNavigate, mockToast)

            // 3. Verify navigation to VN scene
            expect(mockNavigate).toHaveBeenCalledTimes(1)
            expect(mockNavigate).toHaveBeenCalledWith(
                expect.stringContaining(SCENE_IDS.BRIEFING)
            )

            // 4. Verify point unlocked
            const pointState = useDossierStore.getState().pointStates[POINT_IDS.STATION]
            expect(pointState).toBe('discovered')

            // 5. Verify flags set
            const flags = useDossierStore.getState().flags
            expect(flags['det:case01:started']).toBe(true)

            // 6. Verify toast notifications
            expect(mockToast).toHaveBeenCalled()
        })

        it('should handle CASE01_BANK flow (unlock point + navigate)', async () => {
            const qrData = `gw3:hardlink:${DETECTIVE_PACK_ID}:${HARDLINK_IDS.CASE01_BANK}`
            const payload = await resolveHardlink(qrData)

            executeHardlinkActions(payload!.actions, mockNavigate, mockToast)

            // Verify navigation
            expect(mockNavigate).toHaveBeenCalledWith(
                expect.stringContaining(SCENE_IDS.BANK_ARRIVAL)
            )

            // Verify bank point unlocked
            expect(useDossierStore.getState().pointStates[POINT_IDS.BANK]).toBe('discovered')
        })

        it('should handle TEST_BATTLE flow (navigate to battle)', async () => {
            const qrData = `gw3:hardlink:${DETECTIVE_PACK_ID}:${HARDLINK_IDS.TEST_BATTLE}`
            const payload = await resolveHardlink(qrData)

            executeHardlinkActions(payload!.actions, mockNavigate, mockToast)

            // Verify navigation to battle with query params
            expect(mockNavigate).toHaveBeenCalledWith(
                expect.stringContaining('tutorial-battle')
            )
            expect(mockNavigate).toHaveBeenCalledWith(
                expect.stringContaining('detective_skirmish')
            )
        })
    })

    describe('Grant evidence action', () => {
        it('should add evidence to dossier', () => {
            // Create a custom payload with grant_evidence action
            const customPayload = {
                id: 'test_evidence_link',
                packId: DETECTIVE_PACK_ID,
                actions: [
                    { type: 'grant_evidence' as const, evidenceId: 'lime_footprints' }
                ]
            }

            executeHardlinkActions(customPayload.actions, mockNavigate, mockToast)

            // Verify evidence added
            const evidence = useDossierStore.getState().evidence
            expect(evidence).toHaveLength(1)
            expect(evidence[0].id).toBe('lime_footprints')
            expect(evidence[0].label).toBeTruthy()

            // Toast notification called (message uses i18n with label)
            expect(mockToast).toHaveBeenCalled()
        })

        it('should handle unknown evidence IDs with fallback', () => {
            const customPayload = {
                id: 'test',
                packId: DETECTIVE_PACK_ID,
                actions: [
                    { type: 'grant_evidence' as const, evidenceId: 'unknown_evidence_id' }
                ]
            }

            executeHardlinkActions(customPayload.actions, mockNavigate, mockToast)

            const evidence = useDossierStore.getState().evidence
            expect(evidence).toHaveLength(1)
            expect(evidence[0].id).toBe('unknown_evidence_id')
            expect(evidence[0].label).toContain('unknown_evidence_id') // Fallback label
        })
    })

    describe('Multiple actions in sequence', () => {
        it('should execute all actions in order', () => {
            const multiActionPayload = {
                id: 'test_multi',
                packId: DETECTIVE_PACK_ID,
                actions: [
                    { type: 'unlock_point' as const, pointId: POINT_IDS.BANK },
                    { type: 'add_flags' as const, flags: { 'test_flag': true } },
                    { type: 'grant_evidence' as const, evidenceId: 'lime_footprints' },
                ]
            }

            executeHardlinkActions(multiActionPayload.actions, mockNavigate, mockToast)

            // All actions should execute
            expect(useDossierStore.getState().pointStates[POINT_IDS.BANK]).toBe('discovered')
            expect(useDossierStore.getState().flags['test_flag']).toBe(true)
            expect(useDossierStore.getState().evidence).toHaveLength(1)
            expect(mockToast).toHaveBeenCalledTimes(3) // 3 toasts
        })
    })

    describe('Invalid scenarios', () => {
        it('should handle null payload gracefully', async () => {
            const invalidQr = 'invalid:qr:code'
            const payload = await resolveHardlink(invalidQr)

            expect(payload).toBeNull()
            // executeHardlinkActions should not be called with null
        })

        it('should handle empty actions array', () => {
            const emptyPayload = {
                id: 'test',
                packId: DETECTIVE_PACK_ID,
                actions: []
            }

            // Should not throw
            expect(() => {
                executeHardlinkActions(emptyPayload.actions, mockNavigate, mockToast)
            }).not.toThrow()

            expect(mockNavigate).not.toHaveBeenCalled()
            expect(mockToast).not.toHaveBeenCalled()
        })
    })

    describe('State persistence', () => {
        it('should accumulate state across multiple scans', async () => {
            // First scan: unlock bank
            const qr1 = `gw3:hardlink:${DETECTIVE_PACK_ID}:${HARDLINK_IDS.CASE01_BANK}`
            executeHardlinkActions((await resolveHardlink(qr1))!.actions, mockNavigate, mockToast)

            // Second scan: unlock pub
            const qr2 = `gw3:hardlink:${DETECTIVE_PACK_ID}:${HARDLINK_IDS.CASE01_PUB}`
            executeHardlinkActions((await resolveHardlink(qr2))!.actions, mockNavigate, mockToast)

            // Both points should be unlocked
            const pointStates = useDossierStore.getState().pointStates
            expect(pointStates[POINT_IDS.BANK]).toBe('discovered')
            expect(pointStates[POINT_IDS.PUB]).toBe('discovered')
        })
    })
})
