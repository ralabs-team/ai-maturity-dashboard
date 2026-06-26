import type {
  Individual as DomainIndividual,
  MaturityLevel,
  QuestionScore,
  SurveyType,
  TechDimension,
} from '../shared/survey-domain';
export {
  BENCHMARK_LABELS,
  LEVEL_LABELS,
  MAX_DIMENSION_SCORE,
  TECH_DIMENSIONS,
  levelLabel,
  scoreToLevel,
  type MaturityLevel,
  type RoleType,
  type TechDimension,
} from '../shared/survey-domain';

export type ClientDimension = 'Visibility' | 'Value' | 'Trust' | 'Future';

export const CLIENT_DIMENSIONS: ClientDimension[] = [
  'Visibility',
  'Value',
  'Trust',
  'Future',
];

export type Individual = DomainIndividual & {
  surveyType: SurveyType;
  questionScores: Record<string, QuestionScore>;
};

export interface Project {
  id: string;
  name: string;
  color: string;
  members: string[];
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
