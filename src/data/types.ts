import type { QuestionScore, SurveyType } from './survey/scoring/shared';

export type RoleType = 'tech' | 'non-tech';

export type TechDimension = 'Usage' | 'Skills' | 'Impact' | 'Culture' | 'Vision';
export type ClientDimension = 'Visibility' | 'Value' | 'Trust' | 'Future';

export type MaturityLevel = 1 | 2 | 3 | 4 | 5;

export const LEVEL_LABELS: Record<MaturityLevel, string> = {
  1: 'Observer',
  2: 'Explorer',
  3: 'Practitioner',
  4: 'Orchestrator',
  5: 'Native',
};

export const BENCHMARK_LABELS = [
  'Significantly Behind',
  'Behind',
  'On Track',
  'Ahead',
  'Significantly Ahead',
] as const;

export const TECH_DIMENSIONS: TechDimension[] = [
  'Usage',
  'Skills',
  'Impact',
  'Culture',
  'Vision',
];

export const CLIENT_DIMENSIONS: ClientDimension[] = [
  'Visibility',
  'Value',
  'Trust',
  'Future',
];

export const MAX_DIMENSION_SCORE = 5;

export interface Individual {
  id: string;
  name: string;
  role: string;
  department: string;
  seniority: string;
  surveyType: SurveyType;
  roleType: RoleType;
  project: string; // primary (first) project for table display
  allProjects: string[]; // all projects this person is on
  overallLevel: MaturityLevel;
  overallScore: number; // 1.0-5.0 weighted average of dimensions
  scores: Record<TechDimension, number>; // 1.0-5.0 (maps to levels 1-5)
  questionScores: Record<string, QuestionScore>;
  lastUpdated: string; // ISO date
  submissionCount: number;
  credibilityWarning?: boolean;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  members: string[]; // individual IDs
  avgScores: Record<TechDimension, number>;
  overallLevel: MaturityLevel;
}

export interface ClientResponse {
  id: string;
  clientName: string;
  scores: Record<ClientDimension, number>;
}

export interface TrendData {
  period: string;
  scores: Record<TechDimension, number>;
  levelDistribution: Record<MaturityLevel, number>;
}

export const COLORS = {
  emerald: '#10b981',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  pink: '#ec4899',
  cyan: '#06b6d4',
  amber: '#f59e0b',
} as const;

export const PROJECT_COLORS = [COLORS.emerald, COLORS.blue, COLORS.purple, COLORS.pink];

// Threshold-based level assignment on a native 1..5 scale.
// 1.0–<1.5 → L1, 1.5–<2.5 → L2, 2.5–<3.5 → L3, 3.5–<4.5 → L4, 4.5–5.0 → L5
export function scoreToLevel(score: number): MaturityLevel {
  if (score < 1.5) return 1;
  if (score < 2.5) return 2;
  if (score < 3.5) return 3;
  if (score < 4.5) return 4;
  return 5;
}

export function levelLabel(level: MaturityLevel): string {
  return LEVEL_LABELS[level];
}
