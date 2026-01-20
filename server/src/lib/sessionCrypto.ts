import { createHmac, randomBytes, randomUUID } from 'crypto';

const RAW_SESSION_SECRET = process.env.VN_SESSION_SECRET;
if (!RAW_SESSION_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('VN_SESSION_SECRET is required in production.');
    }
    console.warn('[sessionCrypto] VN_SESSION_SECRET is not set; using insecure dev secret.');
}
const SESSION_SECRET = RAW_SESSION_SECRET || 'dev-secret-change-in-production';
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

export interface SessionTokenPayload {
    sessionId: string;
    seed: number;
    snapshotHash: string;
    stateVersion: number;
    expiresAt: number;
    allowedOps: string[];
}

/**
 * Generate HMAC signature for session token.
 */
export function signSessionToken(payload: SessionTokenPayload): string {
    const data = JSON.stringify({
        sessionId: payload.sessionId,
        seed: payload.seed,
        snapshotHash: payload.snapshotHash,
        stateVersion: payload.stateVersion,
        expiresAt: payload.expiresAt,
        allowedOps: payload.allowedOps.sort(),
    });
    return createHmac('sha256', SESSION_SECRET).update(data).digest('hex');
}

/**
 * Verify HMAC signature of session token.
 */
export function verifySessionToken(payload: SessionTokenPayload, signature: string): boolean {
    const expected = signSessionToken(payload);
    // Constant-time comparison
    if (expected.length !== signature.length) return false;
    let result = 0;
    for (let i = 0; i < expected.length; i++) {
        result |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return result === 0;
}

/**
 * Generate a new session ID.
 */
export function generateSessionId(): string {
    return randomUUID();
}

/**
 * Generate a deterministic RNG seed.
 */
export function generateSeed(): number {
    return randomBytes(4).readUInt32BE(0);
}

/**
 * Calculate hash of player snapshot for integrity check.
 */
export function hashSnapshot(snapshot: Record<string, unknown>): string {
    const data = JSON.stringify(snapshot);
    return createHmac('sha256', SESSION_SECRET).update(data).digest('hex').slice(0, 16);
}

/**
 * Get session expiration timestamp.
 */
export function getSessionExpiry(): number {
    return Date.now() + SESSION_TTL_MS;
}

/**
 * Generate commit nonce.
 */
export function generateCommitNonce(): string {
    return randomUUID();
}
