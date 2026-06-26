import { SURVEY_DEFINITIONS, type AuthSession, type SurveyDefinition } from '../src/shared/survey-domain';

type JsonResult = {
  status: number;
  body: unknown;
};

type SurveyLinkRecord = {
  id: string;
  workspaceId: string;
  workspaceName: string;
  surveyId: SurveyDefinition['id'];
  tenantContext: {
    tenantId: string;
    tenantSlug: string;
  };
  title: string;
  description: string;
  status: 'valid' | 'expired' | 'already_submitted';
};

const surveyLinks = new Map<string, SurveyLinkRecord>([
  [
    'delivery-demo',
    {
      id: 'delivery-demo',
      workspaceId: 'workspace-pragmatiq',
      workspaceName: 'Pragmatiq Demo Workspace',
      surveyId: 'delivery-engineering',
      tenantContext: {
        tenantId: 'tenant-pragmatiq',
        tenantSlug: 'pragmatiq',
      },
      title: 'Delivery & Engineering AI Maturity Survey',
      description: 'Measure adoption, confidence, and workflow impact across delivery teams.',
      status: 'valid',
    },
  ],
  [
    'business-demo',
    {
      id: 'business-demo',
      workspaceId: 'workspace-pragmatiq',
      workspaceName: 'Pragmatiq Demo Workspace',
      surveyId: 'business',
      tenantContext: {
        tenantId: 'tenant-pragmatiq',
        tenantSlug: 'pragmatiq',
      },
      title: 'Business AI Maturity Survey',
      description: 'Capture business-side AI usage and readiness across operating teams.',
      status: 'valid',
    },
  ],
  [
    'expired-demo',
    {
      id: 'expired-demo',
      workspaceId: 'workspace-pragmatiq',
      workspaceName: 'Pragmatiq Demo Workspace',
      surveyId: 'delivery-engineering',
      tenantContext: {
        tenantId: 'tenant-pragmatiq',
        tenantSlug: 'pragmatiq',
      },
      title: 'Expired Delivery Survey',
      description: 'This demo link intentionally returns an expired state.',
      status: 'expired',
    },
  ],
  [
    'submitted-demo',
    {
      id: 'submitted-demo',
      workspaceId: 'workspace-pragmatiq',
      workspaceName: 'Pragmatiq Demo Workspace',
      surveyId: 'delivery-engineering',
      tenantContext: {
        tenantId: 'tenant-pragmatiq',
        tenantSlug: 'pragmatiq',
      },
      title: 'Previously Submitted Survey',
      description: 'This demo link intentionally returns an already submitted state.',
      status: 'already_submitted',
    },
  ],
]);

const submittedResponses = new Map<string, Record<string, unknown>>();

function json(status: number, body: unknown): JsonResult {
  return { status, body };
}

function parseJsonBody(body: unknown): Record<string, unknown> | null {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  if (body && typeof body === 'object') {
    return body as Record<string, unknown>;
  }

  return null;
}

function findSurveyDefinition(surveyId: string | null): SurveyDefinition | null {
  if (!surveyId) {
    return null;
  }

  return SURVEY_DEFINITIONS.find((survey) => survey.id === surveyId) ?? null;
}

function parseRequestUrl(requestUrl: string): URL {
  return new URL(requestUrl, 'http://localhost');
}

export async function handleGetSessionRequest(): Promise<JsonResult> {
  const session: AuthSession = {
    status: 'authenticated',
    user: {
      id: 'workspace-owner',
      email: 'owner@pragmatiq.ai',
      displayName: 'Workspace Owner',
    },
    workspace: {
      id: 'workspace-pragmatiq',
      name: 'Pragmatiq Demo Workspace',
      anonymizedDataConsent: true,
    },
  };

  return json(200, session);
}

export async function handleGetWorkspaceRequest(): Promise<JsonResult> {
  return json(200, {
    id: 'workspace-pragmatiq',
    name: 'Pragmatiq Demo Workspace',
    anonymizedDataConsent: true,
  });
}

export async function handleListSurveysRequest(): Promise<JsonResult> {
  return json(200, SURVEY_DEFINITIONS);
}

export async function handleGetSurveyDefinitionRequest(requestUrl: string): Promise<JsonResult> {
  const url = parseRequestUrl(requestUrl);
  const workspaceId = url.searchParams.get('workspaceId');
  const surveyId = url.searchParams.get('surveyId');
  const survey = findSurveyDefinition(surveyId);

  if (!workspaceId || !survey) {
    return json(404, { error: 'Survey definition not found.' });
  }

  return json(200, {
    workspaceId,
    survey,
  });
}

export async function handleGetSurveyLinkRequest(requestUrl: string): Promise<JsonResult> {
  const url = parseRequestUrl(requestUrl);
  const linkId = url.searchParams.get('linkId');

  if (!linkId) {
    return json(400, { status: 'invalid_link', error: 'Missing linkId.' });
  }

  const surveyLink = surveyLinks.get(linkId);

  if (!surveyLink) {
    return json(404, { status: 'invalid_link', error: 'Survey link not found.' });
  }

  if (submittedResponses.has(linkId) || surveyLink.status === 'already_submitted') {
    return json(200, {
      status: 'already_submitted',
      surveyLink: {
        ...surveyLink,
        status: 'already_submitted',
      },
    });
  }

  if (surveyLink.status === 'expired') {
    return json(200, {
      status: 'expired',
      surveyLink,
    });
  }

  return json(200, {
    status: 'ok',
    surveyLink,
  });
}

export async function handleCreateSurveyResponseRequest({
  method,
  body,
}: {
  method?: string;
  body: unknown;
}): Promise<JsonResult> {
  if (method !== 'POST') {
    return json(405, { error: 'Method not allowed.' });
  }

  const parsedBody = parseJsonBody(body);

  if (!parsedBody) {
    return json(400, { error: 'Invalid JSON body.' });
  }

  const linkId = typeof parsedBody.linkId === 'string' ? parsedBody.linkId : '';
  const surveyId = typeof parsedBody.surveyId === 'string' ? parsedBody.surveyId : '';
  const answers = parsedBody.answers;

  if (!linkId || !surveyId || !answers || typeof answers !== 'object') {
    return json(400, { error: 'Missing required submission fields.' });
  }

  const surveyLink = surveyLinks.get(linkId);

  if (!surveyLink) {
    return json(404, { status: 'invalid_link', error: 'Survey link not found.' });
  }

  if (surveyLink.status === 'expired') {
    return json(200, { status: 'expired' });
  }

  if (submittedResponses.has(linkId) || surveyLink.status === 'already_submitted') {
    return json(200, { status: 'already_submitted' });
  }

  submittedResponses.set(linkId, {
    linkId,
    surveyId,
    answers,
    submittedAt: new Date().toISOString(),
  });

  return json(200, {
    status: 'ok',
    submissionId: `${linkId}-${Date.now()}`,
  });
}

export async function handleGetDashboardSummaryRequest(): Promise<JsonResult> {
  return json(200, {
    respondentCount: submittedResponses.size,
    waveCount: SURVEY_DEFINITIONS.length,
  });
}

export async function handleListSurveyResponsesRequest(): Promise<JsonResult> {
  return json(
    200,
    Array.from(submittedResponses.entries()).map(([linkId, submission]) => ({
      id: linkId,
      ...submission,
    })),
  );
}

export async function handleUploadSurveyCsvRequest({
  method,
}: {
  method?: string;
}): Promise<JsonResult> {
  if (method !== 'POST') {
    return json(405, { error: 'Method not allowed.' });
  }

  return json(200, { ok: true });
}

export async function handleGetTeamInsightsRequest(requestUrl: string): Promise<JsonResult> {
  const url = parseRequestUrl(requestUrl);

  return json(200, {
    scope: {
      scopeType: url.searchParams.get('scopeType') ?? 'team',
      scopeId: url.searchParams.get('scopeId') ?? 'unknown',
    },
    summary: 'Team insights endpoint is scaffolded and ready for backend enrichment.',
  });
}

export async function handleGetGoalRecommendationsRequest(requestUrl: string): Promise<JsonResult> {
  const url = parseRequestUrl(requestUrl);
  const scopeId = url.searchParams.get('scopeId') ?? 'unknown';

  return json(200, [
    {
      id: `goal-${scopeId}-usage`,
      audience: 'team',
      title: 'Standardize one AI-assisted workflow',
      description: 'Turn one repeated team task into a documented AI-assisted practice.',
      priorityScore: 82,
    },
  ]);
}
