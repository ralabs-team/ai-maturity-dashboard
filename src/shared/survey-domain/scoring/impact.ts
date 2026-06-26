import {
  normalize,
  rawSingleSelectScore,
  type QEntry,
  type QuestionScore,
  type RawResponse,
  type ScoreMap,
  weightedEntry,
} from './shared';

const SINGLE_SCORES: Record<string, ScoreMap> = {
  '3.1': [
    ['transformative', 5],
    ["couldn't imagine working without it", 4],
    ['noticeable improvement', 3],
    ['slight improvement', 2],
    ['no change', 1],
  ],
  '3.2': [
    ['inseparable from how i estimate', 5],
    ['fundamentally changed how i scope and plan', 4],
    ['explicitly adjust estimates', 3],
    ['factor ai in informally', 2],
    ['estimate and plan the same way as before', 1],
  ],
  '3.3': [
    ["introduced a new process or capability that didn't exist", 5],
    ['redesigned or eliminated a process entirely', 4],
    ['meaningfully changed how one workflow operates', 3],
    ['tweaked how i do a few tasks', 2],
    ['use ai to do the same tasks faster', 1],
  ],
  '3.4': [
    ['more than 5 hours', 5],
    ['3-5 hours', 4],
    ['1-3 hours', 3],
    ['less than 1 hour', 2],
    ['0 hours', 1],
  ],
  '3.5': [
    ['measured ai impact formally', 5],
    ["concrete metrics that i've tracked", 4],
    ['describe a specific improvement with rough numbers', 3],
    ['anecdotal evidence', 2],
    ["can't quantify it", 1],
  ],
  '3.8': [
    ['major disruption', 5],
    ['significant impact', 4],
    ['noticeable setback', 3],
    ['minor inconvenience', 2],
    ['no real impact', 1],
  ],
};

function verificationScore(raw: string): QuestionScore {
  if (!raw || raw.trim() === '') return 'SKIP';

  const norm = normalize(raw);
  const clear = [
    'staging environment',
    'test on staging',
    'run it in staging',
    'review the logic',
    'check edge cases',
    'against your schema',
  ];
  const partial = [
    'review',
    'test it',
    'tests',
    'check the logic',
    'check syntax',
    'validate',
    'edge cases',
    'schema',
  ];

  if (clear.some((needle) => norm.includes(needle))) return 5;
  if (partial.some((needle) => norm.includes(needle))) return 3;
  return 1;
}

export function scoreImpactEntries(r: RawResponse): QEntry[] {
  return [
    weightedEntry('3.1', rawSingleSelectScore('3.1', SINGLE_SCORES['3.1'], r.q3_1)),
    weightedEntry('3.2', rawSingleSelectScore('3.2', SINGLE_SCORES['3.2'], r.q3_2)),
    weightedEntry('3.3', rawSingleSelectScore('3.3', SINGLE_SCORES['3.3'], r.q3_3)),
    weightedEntry('3.4', rawSingleSelectScore('3.4', SINGLE_SCORES['3.4'], r.q3_4)),
    weightedEntry('3.5', rawSingleSelectScore('3.5', SINGLE_SCORES['3.5'], r.q3_5)),
    weightedEntry('3.8', rawSingleSelectScore('3.8', SINGLE_SCORES['3.8'], r.q3_8)),
    weightedEntry('3.11', verificationScore(r.q3_11)),
  ];
}
