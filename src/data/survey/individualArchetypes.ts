import { TECH_DIMENSIONS, type TechDimension } from '../types';

export type IndividualArchetypeId =
  | 'earlyExplorer'
  | 'visioneer'
  | 'individualExpert'
  | 'toolOperator'
  | 'skepticalPerformer'
  | 'outcomeHunter'
  | 'habitBuilder'
  | 'aiNative';

export type IndividualArchetypeProfile = {
  id: IndividualArchetypeId;
  label: string;
  signal: string;
  summary: string;
};

export type IndividualArchetypeCatalogEntry = IndividualArchetypeProfile & {
  target: Record<TechDimension, number>;
};

const INDIVIDUAL_ARCHETYPE_DEFINITIONS: IndividualArchetypeCatalogEntry[] = [
  {
    id: 'earlyExplorer',
    label: 'Early Explorer',
    signal: 'AI use is still light across usage, skill, impact, culture, and vision.',
    summary:
      'This person is still early in their AI journey, with limited practice, low confidence, and only a light sense of where AI could matter most.',
    target: { Usage: 1.8, Skills: 1.9, Impact: 1.8, Culture: 1.9, Vision: 2.0 },
  },
  {
    id: 'visioneer',
    label: 'Visioneer',
    signal: 'They can see where AI should go, but hands-on usage and outcomes are still early.',
    summary:
      'This person has strong forward-looking intent and social openness, yet their day-to-day AI execution is still catching up.',
    target: { Usage: 2.2, Skills: 2.5, Impact: 2.2, Culture: 3.4, Vision: 4.0 },
  },
  {
    id: 'individualExpert',
    label: 'Individual Expert',
    signal: 'Strong AI capability exists, but it is still personal rather than embedded in the surrounding team habit.',
    summary:
      'This person knows how to work well with AI, though their practice appears more individual than shared or systematized around them.',
    target: { Usage: 2.8, Skills: 4.0, Impact: 2.8, Culture: 2.1, Vision: 3.0 },
  },
  {
    id: 'toolOperator',
    label: 'Tool Operator',
    signal: 'AI is used actively and tactically, but shared habits and longer-horizon thinking are still weak.',
    summary:
      'This person uses AI regularly and productively, though mostly as an execution aid rather than a durable working model.',
    target: { Usage: 4.0, Skills: 3.7, Impact: 2.9, Culture: 2.2, Vision: 2.5 },
  },
  {
    id: 'skepticalPerformer',
    label: 'Skeptical Performer',
    signal: 'Usage and impact are already strong, but shared trust or habits around the work are still weak.',
    summary:
      'AI is clearly working for this person and producing outcomes, yet the surrounding practice still feels fragmented, thin, or not fully embraced.',
    target: { Usage: 3.9, Skills: 3.4, Impact: 3.9, Culture: 2.1, Vision: 2.8 },
  },
  {
    id: 'outcomeHunter',
    label: 'Outcome Hunter',
    signal: 'They can point to outcomes from AI, but the practice still depends more on the individual than on durable shared habits.',
    summary:
      'This person is already getting visible value from AI, though that value has not yet turned into a resilient, socially embedded way of working.',
    target: { Usage: 3.3, Skills: 3.3, Impact: 4.0, Culture: 2.2, Vision: 2.9 },
  },
  {
    id: 'habitBuilder',
    label: 'Habit Builder',
    signal: 'Capability is becoming repeatable, teachable, and more embedded in a stronger working rhythm.',
    summary:
      'This person is building sustainable AI habits, with usage, skill, impact, and culture increasingly reinforcing each other.',
    target: { Usage: 3.4, Skills: 3.7, Impact: 3.4, Culture: 3.8, Vision: 3.2 },
  },
  {
    id: 'aiNative',
    label: 'AI Native',
    signal: 'High across usage, skill, impact, culture, and vision.',
    summary:
      'This person shows mature AI practice: strong execution, visible value, embedded habits, and a clear sense of what comes next.',
    target: { Usage: 4.3, Skills: 4.3, Impact: 4.2, Culture: 4.2, Vision: 4.2 },
  },
];

export const INDIVIDUAL_ARCHETYPE_CATALOG: ReadonlyArray<IndividualArchetypeCatalogEntry> =
  INDIVIDUAL_ARCHETYPE_DEFINITIONS;

const INDIVIDUAL_ARCHETYPE_LOOKUP = Object.fromEntries(
  INDIVIDUAL_ARCHETYPE_DEFINITIONS.map((definition) => [definition.id, definition]),
) as Record<IndividualArchetypeId, IndividualArchetypeCatalogEntry>;

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function profileFor(id: IndividualArchetypeId): IndividualArchetypeProfile {
  const definition = INDIVIDUAL_ARCHETYPE_LOOKUP[id];
  const { target: _target, ...profile } = definition;
  return profile;
}

function nearestIndividualArchetype(
  scores: Record<TechDimension, number>,
): IndividualArchetypeProfile {
  let bestMatch = INDIVIDUAL_ARCHETYPE_DEFINITIONS[0];
  let smallestDistance = Number.POSITIVE_INFINITY;

  for (const archetype of INDIVIDUAL_ARCHETYPE_DEFINITIONS) {
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

export function resolveIndividualArchetype(
  scores: Record<TechDimension, number>,
): IndividualArchetypeProfile {
  const values = TECH_DIMENSIONS.map((dimension) => scores[dimension]);
  const overallAverage = average(values);

  if (values.every((value) => value >= 4)) {
    return profileFor('aiNative');
  }

  if (values.every((value) => value < 2.5)) {
    return profileFor('earlyExplorer');
  }

  if (
    scores.Vision >= 3.4 &&
    scores.Culture >= 3 &&
    scores.Usage < 2.8 &&
    scores.Impact < 2.8
  ) {
    return profileFor('visioneer');
  }

  if (scores.Usage >= 3.0 && scores.Impact >= 2.8 && scores.Culture < 2.8) {
    return profileFor('skepticalPerformer');
  }

  if (scores.Impact >= 3.5 && scores.Culture < 2.8) {
    return profileFor('outcomeHunter');
  }

  if (
    scores.Usage >= 3.5 &&
    scores.Culture < 2.8 &&
    scores.Vision < 3.2 &&
    scores.Impact < 3.5
  ) {
    return profileFor('toolOperator');
  }

  if (scores.Skills >= 3.5 && scores.Culture < 2.8) {
    return profileFor('individualExpert');
  }

  if (
    scores.Culture >= 3.2 &&
    scores.Usage >= 3 &&
    scores.Skills >= 3 &&
    scores.Impact >= 3 &&
    overallAverage >= 3.1
  ) {
    return profileFor('habitBuilder');
  }

  return nearestIndividualArchetype(scores);
}
