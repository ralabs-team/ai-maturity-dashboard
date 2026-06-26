import type { QuestionScore, SurveyType } from './scoring/shared';

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
  allDepartments: string[];
  seniority: string;
  surveyType: SurveyType;
  roleType: RoleType;
  project: string;
  allProjects: string[];
  overallLevel: MaturityLevel;
  overallScore: number;
  scores: Record<TechDimension, number>;
  questionScores: Record<string, QuestionScore>;
  lastUpdated: string;
  submissionCount: number;
  credibilityWarning?: boolean;
}

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
