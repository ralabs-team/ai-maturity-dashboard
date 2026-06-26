import { handleGetSurveyLinkRequest } from '../server/survey-api';

type ApiRequest = {
  url?: string;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: Record<string, unknown>) => void;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const result = await handleGetSurveyLinkRequest(req.url ?? '/api/survey-link');
  res.status(result.status).json(result.body as Record<string, unknown>);
}
