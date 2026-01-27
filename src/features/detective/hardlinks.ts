import { Routes } from '@/shared/lib/utils/navigation'
import { useDossierStore } from '@/features/detective/dossier'
import { createFallbackEvidence, getDetectiveEvidenceById } from '@/features/detective/evidence'
import { DETECTIVE_PACK_ID, HARDLINK_IDS, POINT_IDS, SCENE_IDS } from './constants'
import i18n from '@/shared/lib/i18n'
import { scanDetectiveQR } from '@/shared/api/detective'

export type HardlinkAction =
    | { type: 'start_vn'; sceneId: string }
    | { type: 'grant_evidence'; evidenceId: string }
    | { type: 'unlock_point'; pointId: string }
    | { type: 'add_flags'; flags: Record<string, boolean | number> }
    | { type: 'start_battle'; scenarioId: string; deckType?: 'detective' }

export type HardlinkPayload = {
    id: string
    packId: string
    actions: HardlinkAction[]
}

// MOCK TABLE for Case #1 "Münsterplatz Heist"
const MOCK_HARDLINKS: Record<string, HardlinkPayload> = {
    [HARDLINK_IDS.CASE01_BRIEFING]: {
        id: HARDLINK_IDS.CASE01_BRIEFING,
        packId: DETECTIVE_PACK_ID,
        actions: [
            { type: 'start_vn', sceneId: SCENE_IDS.BRIEFING },
            { type: 'unlock_point', pointId: POINT_IDS.STATION },
            { type: 'add_flags', flags: { 'det:case01:started': true } }
        ]
    },
    [HARDLINK_IDS.CASE01_BANK]: {
        id: HARDLINK_IDS.CASE01_BANK,
        packId: DETECTIVE_PACK_ID,
        actions: [
            { type: 'start_vn', sceneId: SCENE_IDS.BANK_ARRIVAL },
            { type: 'unlock_point', pointId: POINT_IDS.BANK }
        ]
    },
    [HARDLINK_IDS.CASE01_PUB]: {
        id: HARDLINK_IDS.CASE01_PUB,
        packId: DETECTIVE_PACK_ID,
        actions: [
            { type: 'start_vn', sceneId: SCENE_IDS.PUB_INTEL },
            { type: 'unlock_point', pointId: POINT_IDS.PUB }
        ]
    },
    [HARDLINK_IDS.CASE01_ARCHIVE]: {
        id: HARDLINK_IDS.CASE01_ARCHIVE,
        packId: DETECTIVE_PACK_ID,
        actions: [
            { type: 'start_vn', sceneId: SCENE_IDS.ARCHIVES },
            { type: 'unlock_point', pointId: POINT_IDS.ARCHIVE }
        ]
    },
    [HARDLINK_IDS.CASE01_WAREHOUSE]: {
        id: HARDLINK_IDS.CASE01_WAREHOUSE,
        packId: DETECTIVE_PACK_ID,
        actions: [
            { type: 'start_vn', sceneId: SCENE_IDS.WAREHOUSE_STING },
            { type: 'unlock_point', pointId: POINT_IDS.WAREHOUSE }
        ]
    },
    [HARDLINK_IDS.TEST_BATTLE]: {
        id: HARDLINK_IDS.TEST_BATTLE,
        packId: DETECTIVE_PACK_ID,
        actions: [
            { type: 'start_battle', scenarioId: 'detective_skirmish', deckType: 'detective' }
        ]
    },
    [HARDLINK_IDS.TEST_LINK]: {
        id: HARDLINK_IDS.TEST_LINK,
        packId: DETECTIVE_PACK_ID,
        actions: [
            { type: 'add_flags', flags: { 'test_link_scanned': true } }
        ]
    }
}

/**
 * Resolve detective hardlink QR code (Server-side)
 * 
 * Calls server API to validate and resolve hardlink.
 * Falls back to local MOCK_HARDLINKS if server unavailable (dev fallback).
 */
export const resolveHardlink = async (qrData: string): Promise<HardlinkPayload | null> => {
    if (!qrData.startsWith('gw3:hardlink:')) return null

    // Try server-side resolution first
    const response = await scanDetectiveQR(qrData)

    if (!response.success) {
        // Handle specific error codes
        if (response.code === 'ALREADY_SCANNED') {
            console.warn('QR already scanned:', response.error)
            // Could show toast here, but let caller handle it
        }

        // Fallback to local MOCK_HARDLINKS for dev/offline mode
        console.warn('Server scan failed, falling back to local table:', response.error)
        const parts = qrData.split(':')
        if (parts.length >= 4) {
            const packId = parts[2]
            const id = parts[3]
            if (packId === DETECTIVE_PACK_ID) {
                return MOCK_HARDLINKS[id] || null
            }
        }
        return null
    }

    // Server success - return payload
    return {
        id: response.hardlinkId!,
        packId: response.packId!,
        actions: response.actions as HardlinkAction[],
    }
}

export const executeHardlinkActions = (
    actions: HardlinkAction[],
    navigate: (path: string) => void,
    toast: (msg: string) => void
) => {
    // Client-side progress is tracked via the Dossier store (prototype).
    actions.forEach(action => {
        switch (action.type) {
            case 'start_vn':
                navigate(`${Routes.VISUAL_NOVEL}/${action.sceneId}`)
                break;
            case 'grant_evidence':
                {
                    const evidence = getDetectiveEvidenceById(action.evidenceId) ?? createFallbackEvidence(action.evidenceId)
                    useDossierStore.getState().addEvidence(evidence)
                    toast(i18n.t('detective:messages.new_evidence', { name: evidence.label }))
                }
                break;
            case 'unlock_point':
                useDossierStore.getState().unlockPoint(action.pointId)
                toast(i18n.t('detective:messages.point_discovered', { name: action.pointId }))
                break;
            case 'add_flags':
                useDossierStore.getState().addFlags(action.flags)
                toast(i18n.t('detective:messages.intel_updated', { items: Object.keys(action.flags).join(', ') }))
                break;
            case 'start_battle':
                // Redirect to battle page with query params to override deck / scenario
                {
                    const qs = new URLSearchParams()
                    qs.set('scenarioId', action.scenarioId)
                    if (action.deckType) qs.set('deckType', action.deckType)
                    navigate(`${Routes.TUTORIAL_BATTLE}?${qs.toString()}`)
                }
                break;
        }
    })
}
