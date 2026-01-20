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
export declare function signSessionToken(payload: SessionTokenPayload): string;
/**
 * Verify HMAC signature of session token.
 */
export declare function verifySessionToken(payload: SessionTokenPayload, signature: string): boolean;
/**
 * Generate a new session ID.
 */
export declare function generateSessionId(): string;
/**
 * Generate a deterministic RNG seed.
 */
export declare function generateSeed(): number;
/**
 * Calculate hash of player snapshot for integrity check.
 */
export declare function hashSnapshot(snapshot: Record<string, unknown>): string;
/**
 * Get session expiration timestamp.
 */
export declare function getSessionExpiry(): number;
/**
 * Generate commit nonce.
 */
export declare function generateCommitNonce(): string;
