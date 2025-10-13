/**
 * Feature flags for Coach Mode components
 * v1.3.1: Ensure evidence cards are always visible
 */

export const FEATURES = {
  coachProfileTable: true,
  coachFitTable: true,
  coachHeatmap: true,
  coachSources: true,
  coachExplain: true,
} as const;

export type FeatureKey = keyof typeof FEATURES;

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: FeatureKey): boolean {
  return FEATURES[feature];
}

/**
 * Get all enabled features
 */
export function getEnabledFeatures(): Record<FeatureKey, boolean> {
  return { ...FEATURES };
}
