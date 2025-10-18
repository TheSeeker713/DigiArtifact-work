/**
 * Detect low-end hardware conditions based on available metrics.
 * Returns true if we should enable low-end mode optimizations.
 */
export function detectLowEndDevice(): boolean {
  if (typeof navigator === 'undefined') {
    return false
  }

  // Check logical cores; <= 4 suggests constrained hardware
  const cores = navigator.hardwareConcurrency ?? 0
  if (cores > 0 && cores <= 4) {
    return true
  }

  // Additional heuristics (optional):
  // - Check memory (navigator.deviceMemory < 4)
  // - Check connection type (navigator.connection.effectiveType)
  // - For now we rely on cores only

  return false
}
