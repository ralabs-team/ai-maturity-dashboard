import type {
  AuthSession,
  DashboardSummary,
  GoalRecommendation,
  SurveyDefinition,
  SurveyResponse,
  SurveyUpload,
  TeamInsightsResponse,
  TeamInsightsScope,
  Workspace,
} from '../survey-domain';

export interface ApiClient {
  getSession(): Promise<AuthSession>;
  getWorkspace(): Promise<Workspace>;
  listSurveys(): Promise<SurveyDefinition[]>;
  uploadSurveyCsv(upload: SurveyUpload): Promise<{ ok: true }>;
  listSurveyResponses(): Promise<SurveyResponse[]>;
  getDashboardSummary(): Promise<DashboardSummary>;
  getTeamInsights(scope: TeamInsightsScope): Promise<TeamInsightsResponse>;
  getGoalRecommendations(scope: TeamInsightsScope): Promise<GoalRecommendation[]>;
}

type RequestOptions = {
  baseUrl?: string;
  fetcher?: typeof fetch;
};

async function requestJson<TResponse>(
  fetcher: typeof fetch,
  url: string,
  init?: RequestInit,
): Promise<TResponse> {
  const response = await fetcher(url, init);

  if (!response.ok) {
    throw new Error(`Request failed for ${url} with status ${response.status}.`);
  }

  return response.json() as Promise<TResponse>;
}

export function createApiClient({
  baseUrl = '/api',
  fetcher = fetch,
}: RequestOptions = {}): ApiClient {
  return {
    getSession() {
      return requestJson<AuthSession>(fetcher, `${baseUrl}/session`);
    },
    getWorkspace() {
      return requestJson<Workspace>(fetcher, `${baseUrl}/workspace`);
    },
    listSurveys() {
      return requestJson<SurveyDefinition[]>(fetcher, `${baseUrl}/surveys`);
    },
    uploadSurveyCsv(upload) {
      return requestJson<{ ok: true }>(fetcher, `${baseUrl}/surveys/uploads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(upload),
      });
    },
    listSurveyResponses() {
      return requestJson<SurveyResponse[]>(fetcher, `${baseUrl}/surveys/responses`);
    },
    getDashboardSummary() {
      return requestJson<DashboardSummary>(fetcher, `${baseUrl}/dashboard/summary`);
    },
    getTeamInsights(scope) {
      const searchParams = new URLSearchParams({
        scopeType: scope.scopeType,
        scopeId: scope.scopeId,
      });

      return requestJson<TeamInsightsResponse>(fetcher, `${baseUrl}/dashboard/team-insights?${searchParams.toString()}`);
    },
    getGoalRecommendations(scope) {
      const searchParams = new URLSearchParams({
        scopeType: scope.scopeType,
        scopeId: scope.scopeId,
      });

      return requestJson<GoalRecommendation[]>(
        fetcher,
        `${baseUrl}/dashboard/goal-recommendations?${searchParams.toString()}`,
      );
    },
  };
}

export const apiClient = createApiClient();
