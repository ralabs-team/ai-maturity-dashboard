import { handleAskAiRequest } from '../server/ask-ai';

type ApiRequest = {
  method?: string;
  body?: unknown;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: Record<string, unknown>) => void;
  end: () => void;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const result = await handleAskAiRequest({
    method: req.method,
    body: req.body,
  });

  if (result.status === 204) {
    res.status(204).end();
    return;
  }

  res.status(result.status).json(result.body);
}
