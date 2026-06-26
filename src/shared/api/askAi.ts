import type { SurveyType, TechDimension } from '../survey-domain';

export type AskAiScopeType = 'organization' | 'team' | 'department' | 'individual';

export type AskAiMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export type AskAiScope = {
  type?: AskAiScopeType | string;
  label?: string;
};

export type AskAiMethodologySection = 'overview' | 'levels' | 'surveys';

export type AskAiMethodology = Record<AskAiMethodologySection, string>;

export type AskAiReferenceRow = {
  ref: string;
  value: string;
};

export type AskAiQuestionRow = {
  questionRef: string;
  surveyType: SurveyType;
  surveyTypeLabel: string;
  questionNumber: string;
  dimension: string;
  text: string;
  isOpen: boolean;
};

export type AskAiAnswerRow = {
  answerRef: string;
  answer: string;
};

export type AskAiScopeScoreRow = {
  ref: string;
  respondents: number;
  overall: number;
  level: string;
  scores: Record<TechDimension, number>;
};

export type AskAiIndividualScoreRow = {
  personRef: string;
  surveyTypeRef: string;
  departmentRef: string;
  seniorityRef: string;
  projectRefs: string[];
  overall: number;
  level: string;
  scores: Record<TechDimension, number>;
};

export type AskAiQuestionLevelResponseRow = {
  personRef: string;
  surveyTypeRef: string;
  questionRef: string;
  answerRef: string | null;
  rawAnswer: string | null;
};

export type AskAiSnapshot = {
  overallScore: number;
  maturityLevel: string;
  respondentCount: number;
  totalProjects: number;
  level45PeopleShare: number;
  level45ProjectShare: number;
  dimensionAverages: Record<TechDimension, number>;
  levelDistribution: Array<{
    level: string;
    count: number;
    share: number;
  }>;
};

export type AskAiStructuredContext = {
  version: 'v1';
  scopeType: Exclude<AskAiScopeType, 'individual'> | string;
  scopeLabel: string;
  methodology: AskAiMethodology;
  snapshot: AskAiSnapshot;
  people: AskAiReferenceRow[];
  surveyTypes: AskAiReferenceRow[];
  departments: AskAiReferenceRow[];
  seniorities: AskAiReferenceRow[];
  projects: AskAiReferenceRow[];
  questions: AskAiQuestionRow[];
  answers: AskAiAnswerRow[];
  departmentScores: AskAiScopeScoreRow[];
  projectScores: AskAiScopeScoreRow[];
  individualScores: AskAiIndividualScoreRow[];
  questionLevelResponses: AskAiQuestionLevelResponseRow[];
};

export type AskAiResearchPack = {
  filename: string;
  markdown: string;
  metadata?: {
    projectAliasesByName?: Record<string, string>;
  };
  aiContext?: AskAiStructuredContext;
};

export type AskAiRequestBody = {
  scope?: AskAiScope;
  researchPack?: {
    filename?: string;
    markdown?: string;
  };
  aiContext?: AskAiStructuredContext;
  messages?: AskAiMessage[];
};
