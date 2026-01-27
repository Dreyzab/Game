import { useNavigate } from 'react-router-dom'
import { resolveHardlink, executeHardlinkActions, type HardlinkPayload } from '../hardlinks'

export interface HardlinkResult {
    success: boolean
    message: string
    payload?: HardlinkPayload
}

/**
 * Service to parse and execute 'gw3:hardlink:...' codes.
 * Acts as the bridge between QR/Sim and Game Logic.
 */
export const useHardlinkService = () => {
    const navigate = useNavigate()

    /**
     * Parse a string and execute its actions if valid.
     * @param input Raw QR string or hardlink ID
     */
    const parseAndExecute = async (input: string): Promise<HardlinkResult> => {
        // 1. Resolve Payload
        // If input doesn't start with gw3:hardlink:, we assume it might be a raw ID in Simulation Mode?
        // But resolveHardlink expects full format.
        // Let's support both for dev ease if wanted, but strictly resolveHardlink checks prefix.

        // Auto-fix for manual simulation buttons sending full string.
        const payload = await resolveHardlink(input)

        if (!payload) {
            return { success: false, message: 'Invalid Hardlink format or unknown ID.' }
        }

        // 2. Execute Actions
        // Pass a toast-like callback. For now console/alert, or we can pipe it out.
        let lastMessage = 'Hardlink activated.'

        executeHardlinkActions(
            payload.actions,
            navigate,
            (msg) => {
                console.log('[Hardlink]', msg)
                lastMessage = msg
            }
        )

        return {
            success: true,
            message: lastMessage,
            payload
        }
    }

    return { parseAndExecute }
}
