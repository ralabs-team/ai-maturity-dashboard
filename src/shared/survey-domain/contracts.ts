export type SurveyAudience = 'delivery-engineering' | 'business';

export interface Workspace {
  id: string;
  name: string;
  anonymizedDataConsent: boolean;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
}

export interface AuthSession {
  status: 'authenticated' | 'unauthenticated';
  user: User | null;
  workspace: Workspace | null;
}

export interface SurveyDefinition {
  id: SurveyAudience;
  name: string;
  description: string;
}

export interface SurveyWave {
  id: string;
  surveyId: SurveyDefinition['id'];
  label: string;
  collectedAt: string;
}

export interface SurveyUpload {
  surveyId: SurveyDefinition['id'];
  filename: string;
  csvText: string;
}

export interface SurveyResponse {
  id: string;
  surveyId: SurveyDefinition['id'];
  username: string;
  submittedAt: string;
  department: string;
  seniority: string;
  projects: string[];
  answers: Record<string, string>;
}

export interface Team {
  id: string;
  name: string;
  projectIds: string[];
  departmentIds: string[];
}

export interface Department {
  id: string;
  name: string;
}

export interface GoalRecommendation {
  id: string;
  audience: 'individual' | 'team';
  title: string;
  description: string;
  priorityScore: number;
}

export interface DashboardSummary {
  respondentCount: number;
  waveCount: number;
}

export interface TeamInsightsScope {
  scopeType: 'team' | 'department';
  scopeId: string;
}

export interface TeamInsightsResponse {
  scope: TeamInsightsScope;
  summary: string;
}
