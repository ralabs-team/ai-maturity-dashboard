import { handleUploadSurveyCsvRequest } from '../../server/survey-api';

type ApiRequest = {
  method?: string;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: Record<string, unknown>) => void;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const result = await handleUploadSurveyCsvRequest({
    method: req.method,
  });
  res.status(result.status).json(result.body as Record<string, unknown>);
}
