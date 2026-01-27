import { describe, it, expect } from 'vitest'
import { resolveHardlink } from './hardlinks'
import { DETECTIVE_PACK_ID, HARDLINK_IDS } from './constants'

describe('resolveHardlink', () => {
    describe('Valid QR codes', () => {
        it('should resolve valid Freiburg hardlink (CASE01_BRIEFING)', async () => {
            const qr = `gw3:hardlink:${DETECTIVE_PACK_ID}:${HARDLINK_IDS.CASE01_BRIEFING}`
            const payload = await resolveHardlink(qr)

            expect(payload).toBeTruthy()
            expect(payload?.id).toBe(HARDLINK_IDS.CASE01_BRIEFING)
            expect(payload?.packId).toBe(DETECTIVE_PACK_ID)
            expect(payload?.actions).toHaveLength(3)
            expect(payload?.actions[0].type).toBe('start_vn')
        })

        it('should resolve CASE01_BANK hardlink', async () => {
            const qr = `gw3:hardlink:${DETECTIVE_PACK_ID}:${HARDLINK_IDS.CASE01_BANK}`
            const payload = await resolveHardlink(qr)

            expect(payload).toBeTruthy()
            expect(payload?.id).toBe(HARDLINK_IDS.CASE01_BANK)
            expect(payload?.actions).toHaveLength(2)
        })

        it('should resolve TEST_BATTLE hardlink', async () => {
            const qr = `gw3:hardlink:${DETECTIVE_PACK_ID}:${HARDLINK_IDS.TEST_BATTLE}`
            const payload = await resolveHardlink(qr)

            expect(payload).toBeTruthy()
            expect(payload?.actions[0].type).toBe('start_battle')
        })
    })

    describe('Invalid QR codes', () => {
        it('should return null for string without prefix', async () => {
            expect(await resolveHardlink('invalid_qr_code')).toBeNull()
        })

        it('should return null for incomplete QR format (missing parts)', async () => {
            expect(await resolveHardlink('gw3:hardlink')).toBeNull()
            expect(await resolveHardlink('gw3:hardlink:fbg1905')).toBeNull()
        })

        it('should return null for wrong prefix', async () => {
            expect(await resolveHardlink('gw2:hardlink:fbg1905:BRIEFING_01')).toBeNull()
        })

        it('should return null for unknown packId', async () => {
            const qr = 'gw3:hardlink:unknown_pack:BRIEFING_01'
            expect(await resolveHardlink(qr)).toBeNull()
        })

        it('should return null for unknown hardlinkId', async () => {
            const qr = `gw3:hardlink:${DETECTIVE_PACK_ID}:NONEXISTENT_LINK`
            expect(await resolveHardlink(qr)).toBeNull()
        })

        it('should return null for empty string', async () => {
            expect(await resolveHardlink('')).toBeNull()
        })
    })

    describe('All MOCK_HARDLINKS entries', () => {
        it('should be resolvable by their IDs', async () => {
            const testIds = [
                HARDLINK_IDS.CASE01_BRIEFING,
                HARDLINK_IDS.CASE01_BANK,
                HARDLINK_IDS.CASE01_PUB,
                HARDLINK_IDS.CASE01_ARCHIVE,
                HARDLINK_IDS.CASE01_WAREHOUSE,
                HARDLINK_IDS.TEST_BATTLE,
                HARDLINK_IDS.TEST_LINK,
            ]

            testIds.forEach(async (id) => {
                const qr = `gw3:hardlink:${DETECTIVE_PACK_ID}:${id}`
                const payload = await resolveHardlink(qr)

                expect(payload, `Failed to resolve ${id}`).toBeTruthy()
                expect(payload?.id).toBe(id)
                expect(payload?.packId).toBe(DETECTIVE_PACK_ID)
            })
        })
    })

    describe('Action structure validation', () => {
        it('should have valid action types', async () => {
            const qr = `gw3:hardlink:${DETECTIVE_PACK_ID}:${HARDLINK_IDS.CASE01_BRIEFING}`
            const payload = await resolveHardlink(qr)

            payload?.actions.forEach((action: any) => {
                expect(['start_vn', 'grant_evidence', 'unlock_point', 'add_flags', 'start_battle']).toContain(action.type)
            })
        })
    })
})
