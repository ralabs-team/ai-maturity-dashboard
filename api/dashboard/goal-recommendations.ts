import { handleGetGoalRecommendationsRequest } from '../../server/survey-api';

type ApiRequest = {
  url?: string;
};

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const result = await handleGetGoalRecommendationsRequest(
    req.url ?? '/api/dashboard/goal-recommendations',
  );
  res.status(result.status).json(result.body);
}
