import type { TechDimension } from './types';
import { TECH_DIMENSIONS } from './types';
import { individuals } from './individuals';

export function deriveOrgAverageScores(
  sourceIndividuals: typeof individuals,
): Record<TechDimension, number> {
  const avg = {} as Record<TechDimension, number>;

  if (sourceIndividuals.length === 0) {
    for (const dim of TECH_DIMENSIONS) {
      avg[dim] = 0;
    }
    return avg;
  }

  for (const dim of TECH_DIMENSIONS) {
    avg[dim] =
      sourceIndividuals.reduce((sum, individual) => sum + individual.scores[dim], 0) /
      sourceIndividuals.length;
  }
  return avg;
}

// Org-level dimension averages, computed from real survey individuals.
export const orgAvgScores: Record<TechDimension, number> = deriveOrgAverageScores(individuals);
