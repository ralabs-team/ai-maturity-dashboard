import type { IncomingMessage } from 'node:http'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import packageJson from './package.json'
import { handleAskAiRequest } from './server/ask-ai'
import {
  handleGetDashboardSummaryRequest,
  handleGetGoalRecommendationsRequest,
  handleGetSessionRequest,
  handleGetSurveyDefinitionRequest,
  handleGetSurveyLinkRequest,
  handleGetWorkspaceRequest,
  handleGetTeamInsightsRequest,
  handleListSurveyResponsesRequest,
  handleListSurveysRequest,
  handleCreateSurveyResponseRequest,
  handleUploadSurveyCsvRequest,
} from './server/survey-api'

async function readRequestBody(request: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString('utf-8');
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  process.env.OPENAI_API_KEY = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY
  process.env.OPENAI_MODEL = env.OPENAI_MODEL || process.env.OPENAI_MODEL

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'ask-ai-dev-api',
        configureServer(server) {
          server.middlewares.use(async (request, response, next) => {
            const requestUrl = request.url ?? '';

            if (requestUrl.startsWith('/api/ask-ai')) {
              const result = await handleAskAiRequest({
                method: request.method,
                body: await readRequestBody(request),
              });

              response.statusCode = result.status;

              if (result.status === 204) {
                response.end();
                return;
              }

              response.setHeader('Content-Type', 'application/json');
              response.end(JSON.stringify(result.body));
              return;
            }

            if (requestUrl.startsWith('/api/session')) {
              const result = await handleGetSessionRequest();
              response.statusCode = result.status;
              response.setHeader('Content-Type', 'application/json');
              response.end(JSON.stringify(result.body));
              return;
            }

            if (requestUrl.startsWith('/api/workspace')) {
              const result = await handleGetWorkspaceRequest();
              response.statusCode = result.status;
              response.setHeader('Content-Type', 'application/json');
              response.end(JSON.stringify(result.body));
              return;
            }

            if (requestUrl.startsWith('/api/surveys') && request.method === 'GET') {
              const result = await handleListSurveysRequest();
              response.statusCode = result.status;
              response.setHeader('Content-Type', 'application/json');
              response.end(JSON.stringify(result.body));
              return;
            }

            if (requestUrl.startsWith('/api/surveys/uploads')) {
              const result = await handleUploadSurveyCsvRequest({
                method: request.method,
              });
              response.statusCode = result.status;
              response.setHeader('Content-Type', 'application/json');
              response.end(JSON.stringify(result.body));
              return;
            }

            if (requestUrl.startsWith('/api/surveys/responses')) {
              const result = await handleListSurveyResponsesRequest();
              response.statusCode = result.status;
              response.setHeader('Content-Type', 'application/json');
              response.end(JSON.stringify(result.body));
              return;
            }

            if (requestUrl.startsWith('/api/survey-definition')) {
              const result = await handleGetSurveyDefinitionRequest(requestUrl);
              response.statusCode = result.status;
              response.setHeader('Content-Type', 'application/json');
              response.end(JSON.stringify(result.body));
              return;
            }

            if (requestUrl.startsWith('/api/survey-link')) {
              const result = await handleGetSurveyLinkRequest(requestUrl);
              response.statusCode = result.status;
              response.setHeader('Content-Type', 'application/json');
              response.end(JSON.stringify(result.body));
              return;
            }

            if (requestUrl.startsWith('/api/survey-responses')) {
              const result = await handleCreateSurveyResponseRequest({
                method: request.method,
                body: await readRequestBody(request),
              });
              response.statusCode = result.status;
              response.setHeader('Content-Type', 'application/json');
              response.end(JSON.stringify(result.body));
              return;
            }

            if (requestUrl.startsWith('/api/dashboard/summary')) {
              const result = await handleGetDashboardSummaryRequest();
              response.statusCode = result.status;
              response.setHeader('Content-Type', 'application/json');
              response.end(JSON.stringify(result.body));
              return;
            }

            if (requestUrl.startsWith('/api/dashboard/team-insights')) {
              const result = await handleGetTeamInsightsRequest(requestUrl);
              response.statusCode = result.status;
              response.setHeader('Content-Type', 'application/json');
              response.end(JSON.stringify(result.body));
              return;
            }

            if (requestUrl.startsWith('/api/dashboard/goal-recommendations')) {
              const result = await handleGetGoalRecommendationsRequest(requestUrl);
              response.statusCode = result.status;
              response.setHeader('Content-Type', 'application/json');
              response.end(JSON.stringify(result.body));
              return;
            }

            next();
          });
        },
      },
    ],
    define: {
      __APP_VERSION__: JSON.stringify(packageJson.version),
    },
  }
})
