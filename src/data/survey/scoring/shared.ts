import type { TechDimension } from '../../types';
import { MAX_DIMENSION_SCORE, scoreToLevel as levelFromScore } from '../../types';
export const LEVEL_LABELS_INDEX: Record<number, string> = {
  1: 'Observer',
  2: 'Explorer',
  3: 'Practitioner',
  4: 'Orchestrator',
  5: 'Native',
};

// Explicit dimension weights for the overall maturity score.
export const DIMENSION_WEIGHTS: Record<TechDimension, number> = {
  'Usage': 1,
  'Skills': 1,
  'Impact': 1,
  'Culture': 1,
  'Vision': 1,
};

// Explicit per-question weights. All equal for now.
export const QUESTION_WEIGHTS: Record<string, number> = {
  '1.1': 1,
  '1.2': 1,
  '1.3': 1,
  '1.4': 1,
  '1.5': 1,
  '1.6': 1,
  '1.7': 1,
  '1.8': 1,
  '1.9': 1,
  '1.10': 1,
  '1.11': 1,
  '2.1': 1,
  '2.2': 1,
  '2.3': 1,
  '2.4': 1,
  '2.5': 1,
  '2.6': 1,
  '2.7': 1,
  '2.8': 1,
  '2.9': 1,
  '2.10': 1,
  '2.11': 1,
  '2.12': 1,
  '2.14': 1,
  '2.15': 1,
  '3.1': 1,
  '3.2': 1,
  '3.3': 1,
  '3.4': 1,
  '3.5': 1,
  '3.8': 1,
  '3.11': 1,
  '3.11_cost': 1,
  '3.12': 1,
  '4.1': 1,
  '4.2': 1,
  '4.3': 1,
  '4.4': 1,
  '4.5': 1,
  '4.6': 1,
  '4.7': 1,
  '4.8': 1,
  '4.14': 1,
  '5.1': 1,
  '5.2': 1,
  '5.3': 1,
  '5.4': 1,
  '5.5': 1,
  '5.6': 1,
};

export type ScoreMap = Array<[string, number]>;
export type QuestionScore = number | 'SKIP';
export type SurveyType = 'delivery-engineering' | 'business';

export interface RawResponse {
  surveyType?: SurveyType;
  timestamp: string;
  username: string;
  consent?: string;
  department: string;
  seniority: string;
  projects: string;
  q1_1: string;
  q1_2?: string;
  q1_3?: string;
  q1_4: string;
  q1_5: string;
  q1_6: string;
  q1_7: string;
  q1_8: string;
  q1_9: string;
  q1_10: string;
  q1_11: string;
  q2_1: string;
  q2_2: string;
  q2_3: string;
  q2_4: string;
  q2_5: string;
  q2_6: string;
  q2_7: string;
  q2_8: string;
  q2_9?: string;
  q2_10: string;
  q2_11: string;
  q2_12: string;
  q2_13?: string;
  q2_14: string;
  q2_15: string;
  q3_1: string;
  q3_2: string;
  q3_3: string;
  q3_4: string;
  q3_5: string;
  q3_6?: string;
  q3_7?: string;
  q3_8: string;
  q3_9?: string;
  q3_10?: string;
  q3_11: string;
  q3_12?: string;
  q3_blocker?: string;
  q4_1: string;
  q4_2: string;
  q4_3: string;
  q4_4: string;
  q4_5: string;
  q4_6: string;
  q4_7: string;
  q4_8: string;
  q4_9?: string;
  q4_10?: string;
  q4_11?: string;
  q4_12?: string;
  q4_13?: string;
  q4_14: string;
  q5_1?: string;
  q5_2?: string;
  q5_3?: string;
  q5_4?: string;
  q5_5?: string;
  q5_6?: string;
  q4_open?: string;
  q_open_final?: string;
}

export interface DimensionDetail {
  score: number;
  level: 1 | 2 | 3 | 4 | 5;
  questionsScored: number;
  questionsSkipped: number;
}

export interface ScoringResult {
  dimensions: Record<TechDimension, DimensionDetail>;
  overall: {
    score: number;
    level: 1 | 2 | 3 | 4 | 5;
  };
  credibilityWarning: boolean;
  questionScores: Record<string, QuestionScore>;
}

export interface QEntry {
  qid: string;
  score: QuestionScore;
  weight: number;
}

export function normalize(s: string): string {
  return s
    .trim()
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function splitMulti(raw: string): string[] {
  return raw.split(';').map((part) => part.trim()).filter(Boolean);
}

export function sortScoreMap(map: ScoreMap): ScoreMap {
  return [...map].sort((a, b) => b[0].length - a[0].length);
}

export function finalizeQuestionScore(score: QuestionScore): QuestionScore {
  if (score === 'SKIP') return 'SKIP';
  return Math.min(MAX_DIMENSION_SCORE, Math.max(1, Math.round(score)));
}

export function rawSingleSelectScore(qid: string, map: ScoreMap, raw: string | undefined): QuestionScore {
  if (!raw || raw.trim() === '') return 'SKIP';
  if (raw.trim().toLowerCase().startsWith('n/a')) return 'SKIP';

  const norm = normalize(raw);
  const sorted = sortScoreMap(map);

  for (const [needle, score] of sorted) {
    if (norm.includes(normalize(needle))) return score;
  }

  if (raw.includes(';')) {
    const scores = splitMulti(raw)
      .map((part) => rawSingleSelectScore(qid, map, part))
      .filter((score): score is number => typeof score === 'number');
    if (scores.length > 0) return Math.max(...scores);
  }

  console.warn(`[scoring] Unmatched Q${qid}: "${raw}"`);
  return 'SKIP';
}

export function weightedEntry(qid: string, score: QuestionScore): QEntry {
  return {
    qid,
    score,
    weight: QUESTION_WEIGHTS[qid] ?? 1,
  };
}

export function aggregate(entries: QEntry[]): DimensionDetail {
  const valid = entries.filter((entry): entry is { qid: string; score: number; weight: number } =>
    typeof entry.score === 'number',
  );
  const skipped = entries.length - valid.length;

  if (valid.length === 0) {
    return { score: 0, level: 1, questionsScored: 0, questionsSkipped: skipped };
  }

  const totalWeight = valid.reduce((sum, entry) => sum + entry.weight, 0);
  const weightedSum = valid.reduce((sum, entry) => sum + entry.score * entry.weight, 0);
  const avg = totalWeight > 0 ? weightedSum / totalWeight : 0;

  return {
    score: avg,
    level: levelFromScore(avg),
    questionsScored: valid.length,
    questionsSkipped: skipped,
  };
}

export function computeOverallScoreFromDimensionScores(
  scores: Record<TechDimension, number>,
  weights: Record<TechDimension, number> = DIMENSION_WEIGHTS,
): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const dimension of Object.keys(scores) as TechDimension[]) {
    const weight = weights[dimension] ?? 0;
    weightedSum += scores[dimension] * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? weightedSum / totalWeight : 0;
}

export function levelAllowedByLowestDimension(lowestDimensionScore: number): 1 | 2 | 3 | 4 | 5 {
  if (lowestDimensionScore <= 0) return 1;

  const normalizedPercent =
    ((lowestDimensionScore - 1) / (MAX_DIMENSION_SCORE - 1)) * 100;

  if (normalizedPercent < 25) return 1;
  if (normalizedPercent < 45) return 2;
  if (normalizedPercent < 65) return 3;
  if (normalizedPercent < 80) return 4;
  return 5;
}

export function computeGuardrailedOverallLevel(
  overallScore: number,
  dimensionScores: Record<TechDimension, number>,
): 1 | 2 | 3 | 4 | 5 {
  const levelFromTotalScore = levelFromScore(overallScore);
  const lowestDimensionScore = Math.min(...Object.values(dimensionScores));
  const levelFromLowestDimension = levelAllowedByLowestDimension(lowestDimensionScore);
  return Math.min(levelFromTotalScore, levelFromLowestDimension) as 1 | 2 | 3 | 4 | 5;
}

const FAKE_CONFIG_NEEDLES = [
  '.aicontext',
  '.llmconfig.yaml',
  '.prompt-rules',
];

export function checkCredibility(q2_9: string | undefined): boolean {
  if (!q2_9) return false;
  const norm = normalize(q2_9);
  return FAKE_CONFIG_NEEDLES.some((needle) => norm.includes(normalize(needle)));
}
