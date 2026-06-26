import { handleCreateSurveyResponseRequest } from '../server/survey-api';

type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: Record<string, unknown>) => void;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const result = await handleCreateSurveyResponseRequest({
    method: req.method,
    body: req.body,
  });
  res.status(result.status).json(result.body as Record<string, unknown>);
}
