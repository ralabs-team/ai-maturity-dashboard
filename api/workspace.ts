import { handleGetWorkspaceRequest } from '../server/survey-api';

type ApiResponse = {
  status: (code: number) => ApiResponse;
  json: (body: Record<string, unknown>) => void;
};

export default async function handler(_: unknown, res: ApiResponse) {
  const result = await handleGetWorkspaceRequest();
  res.status(result.status).json(result.body as Record<string, unknown>);
}
