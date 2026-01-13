export function clampNumber(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value))
}

export function toClampedPercent(value: number, max: number): number {
    if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0
    return clampNumber((value / max) * 100, 0, 100)
}
