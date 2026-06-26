import { TECH_DIMENSIONS, type TechDimension } from '../types';

export type TeamArchetypeId =
  | 'earlyCamp'
  | 'visioneers'
  | 'individualExperts'
  | 'toolOperators'
  | 'skepticalPerformers'
  | 'outcomeHunters'
  | 'habitBuilders'
  | 'nativeTeams';

export type TeamArchetypeProfile = {
  id: TeamArchetypeId;
  label: string;
  signal: string;
  summary: string;
};

export type TeamArchetypeCatalogEntry = TeamArchetypeProfile & {
  target: Record<TechDimension, number>;
};

const TEAM_ARCHETYPE_DEFINITIONS: TeamArchetypeCatalogEntry[] = [
  {
    id: 'earlyCamp',
    label: 'Early Camp',
    signal: 'Low traction across usage, skill, impact, culture, and vision.',
    summary: 'An early-stage team where AI is still light, uneven, or mostly not yet part of the day-to-day work.',
    target: { Usage: 1.8, Skills: 1.9, Impact: 1.8, Culture: 1.9, Vision: 2.0 },
  },
  {
    id: 'visioneers',
    label: 'Visioneers',
    signal: 'The team can see where AI should go, but practical usage and outcomes are still early.',
    summary: 'Vision and social readiness are ahead of execution, so the shape looks promising even though adoption is still light.',
    target: { Usage: 2.2, Skills: 2.5, Impact: 2.2, Culture: 3.4, Vision: 4.0 },
  },
  {
    id: 'individualExperts',
    label: 'Individual Experts',
    signal: 'Strong AI capability exists, but it is concentrated in people rather than shared as a team habit.',
    summary: 'A few individuals know how to work well with AI, yet the practice is not embedded in the team way of working.',
    target: { Usage: 2.8, Skills: 4.0, Impact: 2.8, Culture: 2.1, Vision: 3.0 },
  },
  {
    id: 'toolOperators',
    label: 'Tool Operators',
    signal: 'AI is used actively and tactically, but shared habits and longer-horizon thinking are still weak.',
    summary: 'The team uses tools often enough for AI to be real, though mostly as an execution aid rather than a durable operating pattern.',
    target: { Usage: 4.0, Skills: 3.7, Impact: 2.9, Culture: 2.2, Vision: 2.5 },
  },
  {
    id: 'skepticalPerformers',
    label: 'Skeptical Performers',
    signal: 'Usage and impact are already strong, but the team still lacks the shared trust or habits to make that success feel embedded.',
    summary: 'AI is clearly working and producing outcomes, yet the practice remains socially thin, fragmented, or not fully embraced as a team norm.',
    target: { Usage: 3.9, Skills: 3.4, Impact: 3.9, Culture: 2.1, Vision: 2.8 },
  },
  {
    id: 'outcomeHunters',
    label: 'Outcome Hunters',
    signal: 'Visible wins exist, but they still depend on a few people rather than resilient team practice.',
    summary: 'The team can point to business or delivery outcomes from AI, yet those outcomes have not fully turned into shared habits.',
    target: { Usage: 3.3, Skills: 3.3, Impact: 4.0, Culture: 2.2, Vision: 2.9 },
  },
  {
    id: 'habitBuilders',
    label: 'Habit Builders',
    signal: 'Capability is spreading into repeatable practice and becoming a stronger team habit.',
    summary: 'Usage, skill, impact, and culture are increasingly reinforcing each other, making AI more teachable and durable.',
    target: { Usage: 3.4, Skills: 3.7, Impact: 3.4, Culture: 3.8, Vision: 3.2 },
  },
  {
    id: 'nativeTeams',
    label: 'Native Teams',
    signal: 'High across usage, skill, impact, culture, and vision.',
    summary: 'A mature AI team where the practice is strong, shared, outcome-producing, and oriented toward what comes next.',
    target: { Usage: 4.3, Skills: 4.3, Impact: 4.2, Culture: 4.2, Vision: 4.2 },
  },
];

export const TEAM_ARCHETYPE_CATALOG: ReadonlyArray<TeamArchetypeCatalogEntry> =
  TEAM_ARCHETYPE_DEFINITIONS;

const TEAM_ARCHETYPE_LOOKUP = Object.fromEntries(
  TEAM_ARCHETYPE_DEFINITIONS.map((definition) => [definition.id, definition]),
) as Record<TeamArchetypeId, TeamArchetypeCatalogEntry>;

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function profileFor(id: TeamArchetypeId): TeamArchetypeProfile {
  const definition = TEAM_ARCHETYPE_LOOKUP[id];
  const { target: _target, ...profile } = definition;
  return profile;
}

function nearestTeamArchetype(scores: Record<TechDimension, number>): TeamArchetypeProfile {
  let bestMatch = TEAM_ARCHETYPE_DEFINITIONS[0];
  let smallestDistance = Number.POSITIVE_INFINITY;

  for (const archetype of TEAM_ARCHETYPE_DEFINITIONS) {
    const distance = TECH_DIMENSIONS.reduce((sum, dimension) => {
      const delta = scores[dimension] - archetype.target[dimension];
      return sum + delta * delta;
    }, 0);

    if (distance < smallestDistance) {
      smallestDistance = distance;
      bestMatch = archetype;
    }
  }

  return profileFor(bestMatch.id);
}

export function resolveTeamArchetype(
  scores: Record<TechDimension, number>,
): TeamArchetypeProfile {
  const values = TECH_DIMENSIONS.map((dimension) => scores[dimension]);
  const overallAverage = average(values);

  if (values.every((value) => value >= 4)) {
    return profileFor('nativeTeams');
  }

  if (values.every((value) => value < 2.5)) {
    return profileFor('earlyCamp');
  }

  if (
    scores.Vision >= 3.4 &&
    scores.Culture >= 3 &&
    scores.Usage < 2.8 &&
    scores.Impact < 2.8
  ) {
    return profileFor('visioneers');
  }

  if (scores.Usage >= 3.0 && scores.Impact >= 2.8 && scores.Culture < 2.8) {
    return profileFor('skepticalPerformers');
  }

  if (scores.Impact >= 3.5 && scores.Culture < 2.8) {
    return profileFor('outcomeHunters');
  }

  if (
    scores.Usage >= 3.5 &&
    scores.Culture < 2.8 &&
    scores.Vision < 3.2 &&
    scores.Impact < 3.5
  ) {
    return profileFor('toolOperators');
  }

  if (scores.Skills >= 3.5 && scores.Culture < 2.8) {
    return profileFor('individualExperts');
  }

  if (
    scores.Culture >= 3.2 &&
    scores.Usage >= 3 &&
    scores.Skills >= 3 &&
    scores.Impact >= 3 &&
    overallAverage >= 3.1
  ) {
    return profileFor('habitBuilders');
  }

  return nearestTeamArchetype(scores);
}
