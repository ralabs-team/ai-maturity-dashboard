import { handleListSurveysRequest } from '../server/survey-api';

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => void;
};

export default async function handler(_: unknown, res: ApiResponse) {
  const result = await handleListSurveysRequest();
  res.status(result.status).json(result.body);
}
