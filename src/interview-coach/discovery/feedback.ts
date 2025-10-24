export type Dimension = 'specificity' | 'role' | 'outcome' | 'clarity' | 'structure';

/**
 * Generate dimension-specific rationales for score deltas
 */
export function generateDeltaRationales(
  oldSubscores: Record<Dimension, number>,
  newSubscores: Record<Dimension, number>,
  flags: string[]
): string[] {
  const rationales: string[] = [];
  const delta = newSubscores.specificity - oldSubscores.specificity;
  
  // Calculate deltas for each dimension
  const deltas = Object.keys(newSubscores).map(dim => ({
    dimension: dim as Dimension,
    oldScore: oldSubscores[dim as Dimension],
    newScore: newSubscores[dim as Dimension],
    delta: newSubscores[dim as Dimension] - oldSubscores[dim as Dimension]
  }));
  
  // Sort by delta (lowest first)
  const sortedDeltas = deltas.sort((a, b) => a.delta - b.delta);
  
  // Generate rationales for the lowest scoring dimensions
  for (const { dimension, oldScore, newScore, delta } of sortedDeltas.slice(0, 2)) {
    if (delta <= 0) {
      switch (dimension) {
        case 'specificity':
          if (flags.includes('NO_METRIC')) {
            rationales.push('Still missing a before/after KPI (time/cost/users). Add a number or timeframe.');
          } else {
            rationales.push('Specificity score unchanged. Add concrete metrics and measurable outcomes.');
          }
          break;
          
        case 'role':
          if (flags.includes('WEAK_OWNERSHIP')) {
            rationales.push('Reads like team-wide effort; add a first-person decision you made.');
          } else {
            rationales.push('Role clarity unchanged. Specify your personal contribution and decision-making authority.');
          }
          break;
          
        case 'outcome':
          if (flags.includes('VAGUE_OUTCOME')) {
            rationales.push('States actions, not results; add the effect on users/revenue/latency.');
          } else {
            rationales.push('Outcome impact unchanged. Add specific results and business impact.');
          }
          break;
          
        case 'clarity':
          rationales.push('Clarity score unchanged. Improve sentence structure and flow.');
          break;
          
        case 'structure':
          rationales.push('Structure score unchanged. Better organize with clear sections and transitions.');
          break;
      }
    }
  }
  
  return rationales;
}
