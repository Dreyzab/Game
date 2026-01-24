
/**
 * diminishingReturns
 * 
 * Applies a soft cap to stat scaling.
 * - Linear growth up to `softCap` (default 20).
 * - Logarithmic growth beyond `softCap`.
 * 
 * @param statValue The raw attribute value (e.g., 50 Force)
 * @param factor The multiplier per point (e.g., 0.02 for 2%)
 * @param softCap The point where diminishing returns start (default 20)
 */
export function getScalingBonus(statValue: number, factor: number, softCap = 20): number {
    if (statValue <= softCap) {
        return statValue * factor
    }

    // Calculate base bonus from the linear portion
    const baseBonus = softCap * factor

    // Logarithmic growth for the excess
    // Formula: Base + log10(Excess + 1) * ScaledFactor
    // We use (statValue - (softCap - 1)) inside log to smooth the transition at cap.
    return baseBonus + Math.log10(statValue - (softCap - 1)) * (factor * 5)
}
