/**
 * Consultation feature expects its own `lib/voiceDefinitions`.
 * Canonical voice metadata lives in `@/entities/parliament/lib/voiceDefinitions`.
 *
 * This file is a thin compatibility re-export layer to keep feature-local imports stable.
 */
export * from '@/entities/parliament/lib/voiceDefinitions'


