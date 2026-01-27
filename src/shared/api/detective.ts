/**
 * Detective API Client
 * 
 * Simple fetch-based wrapper for detective endpoints.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export type DetectiveScanResponse = {
    success: boolean
    packId?: string
    hardlinkId?: string
    isRepeatable?: boolean
    actions?: Array<any>
    scannedAt?: number
    error?: string
    code?: string
    status?: number
}

export async function scanDetectiveQR(qrData: string): Promise<DetectiveScanResponse> {
    try {
        const response = await fetch(`${API_BASE_URL}/detective/scan`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // For auth cookies/headers
            body: JSON.stringify({ qrData }),
        })

        const data = await response.json()
        return data as DetectiveScanResponse
    } catch (error) {
        console.error('Detective QR scan failed:', error)
        return {
            success: false,
            error: 'Network error',
            status: 500,
        }
    }
}
