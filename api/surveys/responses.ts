import { handleListSurveyResponsesRequest } from '../../server/survey-api.js';

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
};

export default async function handler(_: unknown, res: ApiResponse) {
  const result = await handleListSurveyResponsesRequest();
  res.status(result.status).json(result.body);
}
