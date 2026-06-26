import type {
  AskAiMessage,
  AskAiQuestionLevelResponseRow,
  AskAiReferenceRow,
  AskAiRequestBody,
  AskAiScope,
  AskAiStructuredContext,
} from '../src/shared/api/askAi';

type AskAiHandlerResult = {
  status: number;
  body: Record<string, unknown>;
};

type OpenAiErrorPayload = {
  error?: {
    message?: string;
  };
};

type OpenAiOutputTextContent = {
  type?: string;
  text?: string;
};

type OpenAiFunctionCallItem = {
  type?: string;
  name?: string;
  arguments?: string;
  call_id?: string;
};

type OpenAiOutputItem = {
  type?: string;
  content?: OpenAiOutputTextContent[];
  name?: string;
  arguments?: string;
  call_id?: string;
};

type OpenAiResponsePayload = OpenAiErrorPayload & {
  model?: string;
  output_text?: string;
  output?: OpenAiOutputItem[];
};

type OpenAiInputItem =
  | {
      role: 'user';
      content: Array<{
        type: 'input_text';
        text: string;
      }>;
    }
  | {
      role: 'assistant';
      phase: 'final_answer';
      content: Array<{
        type: 'output_text';
        text: string;
      }>;
    }
  | Record<string, unknown>;

type OpenAiTool = {
  type: 'function';
  name: string;
  description: string;
  strict: true;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
    required: string[];
    additionalProperties: false;
  };
};

type ToolRuntime = ReturnType<typeof createToolRuntime>;

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const FALLBACK_OPENAI_MODEL = 'gpt-5.4-mini';
const MAX_MESSAGES = 12;
const MAX_MESSAGE_CHARS = 8_000;
const MAX_RESEARCH_PACK_CHARS = 120_000;
const MAX_TOOL_LIMIT = 50;
const MAX_TOOL_ITERATIONS = 6;

function json(status: number, body: Record<string, unknown>): AskAiHandlerResult {
  return { status, body };
}

function parseRequestBody(body: unknown): AskAiRequestBody | null {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body) as AskAiRequestBody;
    } catch {
      return null;
    }
  }

  if (body && typeof body === 'object') {
    return body as AskAiRequestBody;
  }

  return null;
}

function sanitizeText(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().slice(0, maxLength);
}

function sanitizeStructuredContext(value: unknown): AskAiStructuredContext | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as AskAiStructuredContext;

  if (
    candidate.version !== 'v1' ||
    !candidate.snapshot ||
    !candidate.methodology ||
    !Array.isArray(candidate.people) ||
    !Array.isArray(candidate.projects) ||
    !Array.isArray(candidate.questions) ||
    !Array.isArray(candidate.answers) ||
    !Array.isArray(candidate.departmentScores) ||
    !Array.isArray(candidate.projectScores) ||
    !Array.isArray(candidate.individualScores) ||
    !Array.isArray(candidate.questionLevelResponses)
  ) {
    return null;
  }

  return candidate;
}

function resolveOpenAiApiKey(): string {
  const rawValue = process.env.OPENAI_API_KEY?.trim();

  if (!rawValue || rawValue === 'undefined' || rawValue === 'null') {
    return '';
  }

  return rawValue;
}

function resolveOpenAiModel(): string {
  const rawValue = process.env.OPENAI_MODEL?.trim();

  if (!rawValue || rawValue === 'undefined' || rawValue === 'null') {
    return FALLBACK_OPENAI_MODEL;
  }

  return rawValue;
}

function normalizeMessages(messages: unknown): AskAiMessage[] {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .map((message) => {
      if (!message || typeof message !== 'object') {
        return null;
      }

      const role = (message as AskAiMessage).role;
      const content = sanitizeText((message as AskAiMessage).content, MAX_MESSAGE_CHARS);

      if ((role !== 'user' && role !== 'assistant') || !content) {
        return null;
      }

      return { role, content };
    })
    .filter((message): message is AskAiMessage => message !== null)
    .slice(-MAX_MESSAGES);
}

function buildMarkdownInstructions(scope: AskAiScope | undefined, contextWasTruncated: boolean): string {
  const scopeType = scope?.type?.trim() || 'dashboard';
  const scopeLabel = scope?.label?.trim() || 'the current selection';

  return [
    'You are the built-in Ask AI assistant inside the AI Maturity Index dashboard.',
    `The user is asking about the ${scopeType} scope: ${scopeLabel}.`,
    'Answer only from the supplied research pack and the chat history.',
    'Do not invent numbers, people, comparisons, or trends that are not in the supplied context.',
    'If the context does not contain enough evidence, say that clearly and suggest a narrower follow-up question.',
    'When you reference findings, cite the relevant dimension, benchmark, team/project alias, or question section in plain language.',
    'Prefer concise, decision-useful answers with direct evidence.',
    contextWasTruncated
      ? 'Important: the research pack was truncated before it reached you, so be explicit when you may not have the full dataset.'
      : 'You have the full research pack payload that was supplied to the backend.',
  ].join('\n');
}

function buildToolInstructions(scope: AskAiScope | undefined): string {
  const scopeType = scope?.type?.trim() || 'dashboard';
  const scopeLabel = scope?.label?.trim() || 'the current selection';

  return [
    'You are the built-in Ask AI assistant inside the AI Maturity Index dashboard.',
    `The user is asking about the ${scopeType} scope: ${scopeLabel}.`,
    'Answer only from the supplied tool results and the chat history.',
    'A structured AI context is available through functions. Use functions whenever you need evidence, counts, rows, references, or methodology details.',
    'Keep answers grounded in returned values. Do not invent missing numbers, trends, or respondents.',
    'If you do not have enough evidence yet, call another function or say that the data is insufficient.',
    'When you reference findings, cite the relevant dimension, question ref, person alias, department, or project alias in plain language.',
    'Prefer concise, decision-useful answers with direct evidence.',
    'Tiny methodology summary: the AI Maturity Index is a survey-based assessment across Usage, Skills, Impact, Culture, and Vision, scored on a 1.0-5.0 scale with levels 1 through 5.',
    'For overview questions, start with get_scope_snapshot.',
    'For methodology questions, use get_methodology_details.',
    'For respondent-level evidence, use get_raw_individual_scores or get_raw_question_level_responses.',
  ].join('\n');
}

function extractOutputText(payload: OpenAiResponsePayload | null): string {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  if (Array.isArray(payload?.output)) {
    const text = payload.output
      .flatMap((item) => (Array.isArray(item?.content) ? item.content : []))
      .filter(
        (content): content is OpenAiOutputTextContent & { text: string } =>
          content?.type === 'output_text' && typeof content?.text === 'string',
      )
      .map((content) => content.text.trim())
      .filter(Boolean)
      .join('\n\n');

    if (text) {
      return text;
    }
  }

  return '';
}

function extractFunctionCalls(payload: OpenAiResponsePayload | null): OpenAiFunctionCallItem[] {
  if (!Array.isArray(payload?.output)) {
    return [];
  }

  return payload.output.filter(
    (item): item is OpenAiFunctionCallItem =>
      item?.type === 'function_call' &&
      typeof item?.name === 'string' &&
      typeof item?.call_id === 'string',
  );
}

function toStatelessFunctionCallItems(
  functionCalls: OpenAiFunctionCallItem[],
): Array<{
  type: 'function_call';
  call_id: string;
  name: string;
  arguments: string;
}> {
  return functionCalls
    .filter(
      (call): call is OpenAiFunctionCallItem & { call_id: string; name: string } =>
        typeof call.call_id === 'string' && typeof call.name === 'string',
    )
    .map((call) => ({
      type: 'function_call' as const,
      call_id: call.call_id,
      name: call.name,
      arguments: typeof call.arguments === 'string' ? call.arguments : '',
    }));
}

function toOpenAiInput(messages: AskAiMessage[]): OpenAiInputItem[] {
  return messages.map((message) =>
    message.role === 'assistant'
      ? {
          role: 'assistant' as const,
          phase: 'final_answer' as const,
          content: [
            {
              type: 'output_text' as const,
              text: message.content,
            },
          ],
        }
      : {
          role: 'user' as const,
          content: [
            {
              type: 'input_text' as const,
              text: message.content,
            },
          ],
        },
  );
}

function clampLimit(limit: unknown, fallback: number): number {
  if (typeof limit !== 'number' || !Number.isFinite(limit)) {
    return fallback;
  }

  return Math.max(1, Math.min(MAX_TOOL_LIMIT, Math.floor(limit)));
}

function clampOffset(offset: unknown): number {
  if (typeof offset !== 'number' || !Number.isFinite(offset)) {
    return 0;
  }

  return Math.max(0, Math.floor(offset));
}

function buildRefMap(rows: AskAiReferenceRow[]): Map<string, string> {
  return new Map(rows.map((row) => [row.ref, row.value]));
}

function buildStructuredContextSummary(aiContext: AskAiStructuredContext): string {
  const topDimensions = Object.entries(aiContext.snapshot.dimensionAverages)
    .map(([dimension, score]) => `${dimension}: ${score.toFixed(1)}`)
    .join(', ');

  return [
    `Structured AI context is available for the ${aiContext.scopeType} scope: ${aiContext.scopeLabel}.`,
    `Current snapshot: overall score ${aiContext.snapshot.overallScore.toFixed(1)} / 5, maturity ${aiContext.snapshot.maturityLevel}, respondents ${aiContext.snapshot.respondentCount}, projects ${aiContext.snapshot.totalProjects}.`,
    `Dimension averages: ${topDimensions}.`,
    'Use functions to inspect methodology, references, scores, and question-level responses as needed.',
  ].join('\n');
}

function paginate<T>(rows: T[], limit: number, offset: number) {
  return {
    totalCount: rows.length,
    offset,
    limit,
    returnedCount: Math.max(0, Math.min(limit, rows.length - offset)),
    hasMore: offset + limit < rows.length,
    items: rows.slice(offset, offset + limit),
  };
}

function filterByRefs(value: string, filters: string[] | undefined): boolean {
  return !filters || filters.length === 0 || filters.includes(value);
}

function intersectsRefs(values: string[], filters: string[] | undefined): boolean {
  return !filters || filters.length === 0 || values.some((value) => filters.includes(value));
}

function createToolRuntime(aiContext: AskAiStructuredContext) {
  const peopleByRef = buildRefMap(aiContext.people);
  const surveyTypesByRef = buildRefMap(aiContext.surveyTypes);
  const departmentsByRef = buildRefMap(aiContext.departments);
  const senioritiesByRef = buildRefMap(aiContext.seniorities);
  const projectsByRef = buildRefMap(aiContext.projects);
  const surveyTypeRefsByValue = new Map(aiContext.surveyTypes.map((row) => [row.value, row.ref]));
  const answersByRef = new Map(aiContext.answers.map((row) => [row.answerRef, row.answer]));
  const questionsByRef = new Map(aiContext.questions.map((row) => [row.questionRef, row]));
  const individualScoresByRef = new Map(
    aiContext.individualScores.map((row) => [row.personRef, row]),
  );

  const getHydratedPerson = (personRef: string) => {
    const row = individualScoresByRef.get(personRef);

    if (!row) {
      return null;
    }

    return {
      personRef,
      personAlias: peopleByRef.get(personRef) ?? personRef,
      surveyTypeRef: row.surveyTypeRef,
      surveyType: surveyTypesByRef.get(row.surveyTypeRef) ?? row.surveyTypeRef,
      departmentRef: row.departmentRef,
      department: departmentsByRef.get(row.departmentRef) ?? row.departmentRef,
      seniorityRef: row.seniorityRef,
      seniority: senioritiesByRef.get(row.seniorityRef) ?? row.seniorityRef,
      projectRefs: row.projectRefs,
      projectAliases: row.projectRefs.map((ref) => projectsByRef.get(ref) ?? ref),
    };
  };

  return {
    get_methodology_details(args: Record<string, unknown>) {
      const section = typeof args.section === 'string' ? args.section : 'overview';

      if (!(section in aiContext.methodology)) {
        return {
          error: 'Unknown methodology section.',
          availableSections: Object.keys(aiContext.methodology),
        };
      }

      return {
        section,
        text: aiContext.methodology[section as keyof AskAiStructuredContext['methodology']],
      };
    },

    get_scope_snapshot() {
      return {
        scopeType: aiContext.scopeType,
        scopeLabel: aiContext.scopeLabel,
        snapshot: aiContext.snapshot,
      };
    },

    get_raw_people(args: Record<string, unknown>) {
      const personRefs = Array.isArray(args.personRefs) ? args.personRefs.filter((value): value is string => typeof value === 'string') : undefined;
      const projectRefs = Array.isArray(args.projectRefs) ? args.projectRefs.filter((value): value is string => typeof value === 'string') : undefined;
      const departmentRefs = Array.isArray(args.departmentRefs) ? args.departmentRefs.filter((value): value is string => typeof value === 'string') : undefined;
      const seniorityRefs = Array.isArray(args.seniorityRefs) ? args.seniorityRefs.filter((value): value is string => typeof value === 'string') : undefined;
      const surveyTypeRefs = Array.isArray(args.surveyTypeRefs) ? args.surveyTypeRefs.filter((value): value is string => typeof value === 'string') : undefined;
      const limit = clampLimit(args.limit, 25);
      const offset = clampOffset(args.offset);

      const rows = aiContext.individualScores
        .filter((row) => filterByRefs(row.personRef, personRefs))
        .filter((row) => intersectsRefs(row.projectRefs, projectRefs))
        .filter((row) => filterByRefs(row.departmentRef, departmentRefs))
        .filter((row) => filterByRefs(row.seniorityRef, seniorityRefs))
        .filter((row) => filterByRefs(row.surveyTypeRef, surveyTypeRefs))
        .map((row) => getHydratedPerson(row.personRef))
        .filter((row): row is NonNullable<typeof row> => row !== null)
        .sort((left, right) => left.personAlias.localeCompare(right.personAlias));

      return paginate(rows, limit, offset);
    },

    get_raw_departments(args: Record<string, unknown>) {
      const departmentRefs = Array.isArray(args.departmentRefs) ? args.departmentRefs.filter((value): value is string => typeof value === 'string') : undefined;
      const limit = clampLimit(args.limit, 25);
      const offset = clampOffset(args.offset);

      const rows = aiContext.departmentScores
        .filter((row) => filterByRefs(row.ref, departmentRefs))
        .map((row) => ({
          departmentRef: row.ref,
          department: departmentsByRef.get(row.ref) ?? row.ref,
          respondents: row.respondents,
          overall: row.overall,
          level: row.level,
          scores: row.scores,
        }))
        .sort((left, right) => right.overall - left.overall || left.department.localeCompare(right.department));

      return paginate(rows, limit, offset);
    },

    get_raw_projects(args: Record<string, unknown>) {
      const projectRefs = Array.isArray(args.projectRefs) ? args.projectRefs.filter((value): value is string => typeof value === 'string') : undefined;
      const personRefs = Array.isArray(args.personRefs) ? args.personRefs.filter((value): value is string => typeof value === 'string') : undefined;
      const minRespondents = typeof args.minRespondents === 'number' ? Math.max(0, Math.floor(args.minRespondents)) : 0;
      const sortBy = args.sortBy === 'respondents' || args.sortBy === 'projectRef' ? args.sortBy : 'overall';
      const sortDirection = args.sortDirection === 'asc' ? 'asc' : 'desc';
      const limit = clampLimit(args.limit, 25);
      const offset = clampOffset(args.offset);
      const allowedProjectRefs =
        personRefs && personRefs.length > 0
          ? new Set(
              aiContext.individualScores
                .filter((row) => personRefs.includes(row.personRef))
                .flatMap((row) => row.projectRefs),
            )
          : null;

      const rows = aiContext.projectScores
        .filter((row) => filterByRefs(row.ref, projectRefs))
        .filter((row) => row.respondents >= minRespondents)
        .filter((row) => (allowedProjectRefs ? allowedProjectRefs.has(row.ref) : true))
        .map((row) => ({
          projectRef: row.ref,
          projectAlias: projectsByRef.get(row.ref) ?? row.ref,
          respondents: row.respondents,
          overall: row.overall,
          level: row.level,
          scores: row.scores,
        }))
        .sort((left, right) => {
          const direction = sortDirection === 'asc' ? 1 : -1;

          if (sortBy === 'respondents') {
            return (left.respondents - right.respondents) * direction || left.projectAlias.localeCompare(right.projectAlias);
          }

          if (sortBy === 'projectRef') {
            return left.projectRef.localeCompare(right.projectRef) * direction;
          }

          return (left.overall - right.overall) * direction || left.projectAlias.localeCompare(right.projectAlias);
        });

      return paginate(rows, limit, offset);
    },

    get_raw_questions(args: Record<string, unknown>) {
      const questionRefs = Array.isArray(args.questionRefs) ? args.questionRefs.filter((value): value is string => typeof value === 'string') : undefined;
      const surveyTypeRefs = Array.isArray(args.surveyTypeRefs) ? args.surveyTypeRefs.filter((value): value is string => typeof value === 'string') : undefined;
      const dimensions = Array.isArray(args.dimensions) ? args.dimensions.filter((value): value is string => typeof value === 'string') : undefined;
      const isOpen = typeof args.isOpen === 'boolean' ? args.isOpen : undefined;
      const limit = clampLimit(args.limit, 25);
      const offset = clampOffset(args.offset);

      const rows = aiContext.questions
        .filter((row) => filterByRefs(row.questionRef, questionRefs))
        .filter((row) =>
          !surveyTypeRefs || surveyTypeRefs.length === 0
            ? true
            : surveyTypeRefs.includes(surveyTypeRefsByValue.get(row.surveyTypeLabel) ?? ''),
        )
        .filter((row) => (typeof isOpen === 'boolean' ? row.isOpen === isOpen : true))
        .filter((row) => (!dimensions || dimensions.length === 0 ? true : dimensions.includes(row.dimension)))
        .sort((left, right) => left.questionRef.localeCompare(right.questionRef));

      return paginate(rows, limit, offset);
    },

    get_raw_answers(args: Record<string, unknown>) {
      const answerRefs = Array.isArray(args.answerRefs) ? args.answerRefs.filter((value): value is string => typeof value === 'string') : undefined;
      const limit = clampLimit(args.limit, 25);
      const offset = clampOffset(args.offset);

      const rows = aiContext.answers
        .filter((row) => filterByRefs(row.answerRef, answerRefs))
        .sort((left, right) => left.answerRef.localeCompare(right.answerRef));

      return paginate(rows, limit, offset);
    },

    get_raw_individual_scores(args: Record<string, unknown>) {
      const personRefs = Array.isArray(args.personRefs) ? args.personRefs.filter((value): value is string => typeof value === 'string') : undefined;
      const projectRefs = Array.isArray(args.projectRefs) ? args.projectRefs.filter((value): value is string => typeof value === 'string') : undefined;
      const departmentRefs = Array.isArray(args.departmentRefs) ? args.departmentRefs.filter((value): value is string => typeof value === 'string') : undefined;
      const seniorityRefs = Array.isArray(args.seniorityRefs) ? args.seniorityRefs.filter((value): value is string => typeof value === 'string') : undefined;
      const surveyTypeRefs = Array.isArray(args.surveyTypeRefs) ? args.surveyTypeRefs.filter((value): value is string => typeof value === 'string') : undefined;
      const limit = clampLimit(args.limit, 25);
      const offset = clampOffset(args.offset);

      const rows = aiContext.individualScores
        .filter((row) => filterByRefs(row.personRef, personRefs))
        .filter((row) => intersectsRefs(row.projectRefs, projectRefs))
        .filter((row) => filterByRefs(row.departmentRef, departmentRefs))
        .filter((row) => filterByRefs(row.seniorityRef, seniorityRefs))
        .filter((row) => filterByRefs(row.surveyTypeRef, surveyTypeRefs))
        .map((row) => {
          const person = getHydratedPerson(row.personRef);

          if (!person) {
            return null;
          }

          return {
            ...person,
            overall: row.overall,
            level: row.level,
            scores: row.scores,
          };
        })
        .filter((row): row is NonNullable<typeof row> => row !== null)
        .sort((left, right) => right.overall - left.overall || left.personAlias.localeCompare(right.personAlias));

      return paginate(rows, limit, offset);
    },

    get_raw_question_level_responses(args: Record<string, unknown>) {
      const personRefs = Array.isArray(args.personRefs) ? args.personRefs.filter((value): value is string => typeof value === 'string') : undefined;
      const projectRefs = Array.isArray(args.projectRefs) ? args.projectRefs.filter((value): value is string => typeof value === 'string') : undefined;
      const departmentRefs = Array.isArray(args.departmentRefs) ? args.departmentRefs.filter((value): value is string => typeof value === 'string') : undefined;
      const questionRefs = Array.isArray(args.questionRefs) ? args.questionRefs.filter((value): value is string => typeof value === 'string') : undefined;
      const surveyTypeRefs = Array.isArray(args.surveyTypeRefs) ? args.surveyTypeRefs.filter((value): value is string => typeof value === 'string') : undefined;
      const includeAnswerText = args.includeAnswerText === true;
      const limit = clampLimit(args.limit, 20);
      const offset = clampOffset(args.offset);

      if (
        (!personRefs || personRefs.length === 0) &&
        (!projectRefs || projectRefs.length === 0) &&
        (!departmentRefs || departmentRefs.length === 0) &&
        (!questionRefs || questionRefs.length === 0) &&
        (!surveyTypeRefs || surveyTypeRefs.length === 0)
      ) {
        return {
          error:
            'get_raw_question_level_responses requires at least one narrowing filter: personRefs, projectRefs, departmentRefs, questionRefs, or surveyTypeRefs.',
        };
      }

      const rows = aiContext.questionLevelResponses
        .filter((row) => filterByRefs(row.personRef, personRefs))
        .filter((row) => filterByRefs(row.questionRef, questionRefs))
        .filter((row) => filterByRefs(row.surveyTypeRef, surveyTypeRefs))
        .filter((row) => {
          const person = individualScoresByRef.get(row.personRef);
          return person ? intersectsRefs(person.projectRefs, projectRefs) : false;
        })
        .filter((row) => {
          const person = individualScoresByRef.get(row.personRef);
          return person ? filterByRefs(person.departmentRef, departmentRefs) : false;
        })
        .map((row) => hydrateQuestionLevelResponse(row, {
          includeAnswerText,
          peopleByRef,
          surveyTypesByRef,
          questionsByRef,
          answersByRef,
          individualScoresByRef,
          departmentsByRef,
          senioritiesByRef,
          projectsByRef,
        }))
        .sort((left, right) => left.questionRef.localeCompare(right.questionRef) || left.personAlias.localeCompare(right.personAlias));

      return paginate(rows, limit, offset);
    },
  };
}

function hydrateQuestionLevelResponse(
  row: AskAiQuestionLevelResponseRow,
  lookups: {
    includeAnswerText: boolean;
    peopleByRef: Map<string, string>;
    surveyTypesByRef: Map<string, string>;
    questionsByRef: Map<string, AskAiStructuredContext['questions'][number]>;
    answersByRef: Map<string, string>;
    individualScoresByRef: Map<string, AskAiStructuredContext['individualScores'][number]>;
    departmentsByRef: Map<string, string>;
    senioritiesByRef: Map<string, string>;
    projectsByRef: Map<string, string>;
  },
) {
  const question = lookups.questionsByRef.get(row.questionRef);
  const person = lookups.individualScoresByRef.get(row.personRef);

  return {
    personRef: row.personRef,
    personAlias: lookups.peopleByRef.get(row.personRef) ?? row.personRef,
    surveyTypeRef: row.surveyTypeRef,
    surveyType: lookups.surveyTypesByRef.get(row.surveyTypeRef) ?? row.surveyTypeRef,
    departmentRef: person?.departmentRef ?? '-',
    department: person ? lookups.departmentsByRef.get(person.departmentRef) ?? person.departmentRef : '-',
    seniorityRef: person?.seniorityRef ?? '-',
    seniority: person ? lookups.senioritiesByRef.get(person.seniorityRef) ?? person.seniorityRef : '-',
    projectRefs: person?.projectRefs ?? [],
    projectAliases: (person?.projectRefs ?? []).map(
      (projectRef) => lookups.projectsByRef.get(projectRef) ?? projectRef,
    ),
    questionRef: row.questionRef,
    questionNumber: question?.questionNumber ?? '',
    questionText: question?.text ?? '',
    dimension: question?.dimension ?? '',
    isOpen: question?.isOpen ?? false,
    answerRef: row.answerRef,
    answerText: lookups.includeAnswerText
      ? row.rawAnswer ?? (row.answerRef ? lookups.answersByRef.get(row.answerRef) ?? null : null)
      : undefined,
  };
}

function buildTools(): OpenAiTool[] {
  const stringArray = {
    type: 'array',
    items: {
      type: 'string',
    },
  };

  return [
    {
      type: 'function',
      name: 'get_methodology_details',
      description: 'Return a deeper explanation of the AI Maturity Index methodology for one section.',
      strict: true,
      parameters: {
        type: 'object',
        properties: {
          section: {
            type: 'string',
            enum: ['overview', 'levels', 'surveys'],
          },
        },
        required: ['section'],
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      name: 'get_scope_snapshot',
      description: 'Return the current scope summary including overall score, maturity level, respondent count, project count, and dimension averages.',
      strict: true,
      parameters: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      name: 'get_raw_people',
      description: 'Return anonymized people references and metadata, filterable by person, project, department, seniority, or survey type.',
      strict: true,
      parameters: {
        type: 'object',
        properties: {
          personRefs: stringArray,
          projectRefs: stringArray,
          departmentRefs: stringArray,
          seniorityRefs: stringArray,
          surveyTypeRefs: stringArray,
          limit: { type: 'number' },
          offset: { type: 'number' },
        },
        required: [
          'personRefs',
          'projectRefs',
          'departmentRefs',
          'seniorityRefs',
          'surveyTypeRefs',
          'limit',
          'offset',
        ],
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      name: 'get_raw_departments',
      description: 'Return aggregate department score rows for the current scope.',
      strict: true,
      parameters: {
        type: 'object',
        properties: {
          departmentRefs: stringArray,
          limit: { type: 'number' },
          offset: { type: 'number' },
        },
        required: ['departmentRefs', 'limit', 'offset'],
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      name: 'get_raw_projects',
      description: 'Return aggregate project score rows for the current scope.',
      strict: true,
      parameters: {
        type: 'object',
        properties: {
          projectRefs: stringArray,
          personRefs: stringArray,
          minRespondents: { type: 'number' },
          sortBy: {
            type: 'string',
            enum: ['overall', 'respondents', 'projectRef'],
          },
          sortDirection: {
            type: 'string',
            enum: ['asc', 'desc'],
          },
          limit: { type: 'number' },
          offset: { type: 'number' },
        },
        required: [
          'projectRefs',
          'personRefs',
          'minRespondents',
          'sortBy',
          'sortDirection',
          'limit',
          'offset',
        ],
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      name: 'get_raw_questions',
      description: 'Return question reference rows including survey type, question number, dimension, and prompt text.',
      strict: true,
      parameters: {
        type: 'object',
        properties: {
          questionRefs: stringArray,
          surveyTypeRefs: stringArray,
          dimensions: stringArray,
          isOpen: { type: 'boolean' },
          limit: { type: 'number' },
          offset: { type: 'number' },
        },
        required: ['questionRefs', 'surveyTypeRefs', 'dimensions', 'isOpen', 'limit', 'offset'],
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      name: 'get_raw_answers',
      description: 'Return answer reference rows that map answer refs to normalized answer text.',
      strict: true,
      parameters: {
        type: 'object',
        properties: {
          answerRefs: stringArray,
          limit: { type: 'number' },
          offset: { type: 'number' },
        },
        required: ['answerRefs', 'limit', 'offset'],
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      name: 'get_raw_individual_scores',
      description: 'Return individual score rows with filters for person, project, department, seniority, or survey type.',
      strict: true,
      parameters: {
        type: 'object',
        properties: {
          personRefs: stringArray,
          projectRefs: stringArray,
          departmentRefs: stringArray,
          seniorityRefs: stringArray,
          surveyTypeRefs: stringArray,
          limit: { type: 'number' },
          offset: { type: 'number' },
        },
        required: [
          'personRefs',
          'projectRefs',
          'departmentRefs',
          'seniorityRefs',
          'surveyTypeRefs',
          'limit',
          'offset',
        ],
        additionalProperties: false,
      },
    },
    {
      type: 'function',
      name: 'get_raw_question_level_responses',
      description: 'Return question-level response rows. Requires at least one narrowing filter and can optionally hydrate answer text.',
      strict: true,
      parameters: {
        type: 'object',
        properties: {
          personRefs: stringArray,
          projectRefs: stringArray,
          departmentRefs: stringArray,
          questionRefs: stringArray,
          surveyTypeRefs: stringArray,
          includeAnswerText: { type: 'boolean' },
          limit: { type: 'number' },
          offset: { type: 'number' },
        },
        required: [
          'personRefs',
          'projectRefs',
          'departmentRefs',
          'questionRefs',
          'surveyTypeRefs',
          'includeAnswerText',
          'limit',
          'offset',
        ],
        additionalProperties: false,
      },
    },
  ];
}

async function createOpenAiResponse({
  openAiApiKey,
  signal,
  payload,
}: {
  openAiApiKey: string;
  signal: AbortSignal;
  payload: Record<string, unknown>;
}) {
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
    signal,
  });
  const data = (await response.json().catch(() => null)) as OpenAiResponsePayload | null;

  return { response, payload: data };
}

async function answerWithMarkdownContext({
  openAiApiKey,
  scope,
  researchPackFilename,
  researchPackMarkdown,
  normalizedMessages,
  signal,
}: {
  openAiApiKey: string;
  scope: AskAiScope | undefined;
  researchPackFilename: string;
  researchPackMarkdown: string;
  normalizedMessages: AskAiMessage[];
  signal: AbortSignal;
}): Promise<AskAiHandlerResult> {
  const requestPayload = {
    model: resolveOpenAiModel(),
    instructions: buildMarkdownInstructions(
      scope,
      researchPackMarkdown.length >= MAX_RESEARCH_PACK_CHARS,
    ),
    reasoning: {
      effort: 'low',
    },
    max_output_tokens: 900,
    store: false,
    text: {
      format: {
        type: 'text',
      },
    },
    input: [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: `Research pack (${researchPackFilename}):\n\n${researchPackMarkdown}`,
          },
        ],
      },
      ...toOpenAiInput(normalizedMessages),
    ],
  };

  const { response, payload } = await createOpenAiResponse({
    openAiApiKey,
    signal,
    payload: requestPayload,
  });

  if (!response.ok) {
    return json(502, {
      error:
        payload?.error?.message ||
        `The AI provider returned an error (${response.status}).`,
    });
  }

  const answer = extractOutputText(payload);

  if (!answer) {
    return json(502, {
      error: 'The AI provider returned an empty response.',
    });
  }

  return json(200, {
    answer,
    model: payload?.model ?? resolveOpenAiModel(),
    researchPackTruncated: researchPackMarkdown.length >= MAX_RESEARCH_PACK_CHARS,
  });
}

async function answerWithStructuredContext({
  openAiApiKey,
  scope,
  aiContext,
  normalizedMessages,
  signal,
}: {
  openAiApiKey: string;
  scope: AskAiScope | undefined;
  aiContext: AskAiStructuredContext;
  normalizedMessages: AskAiMessage[];
  signal: AbortSignal;
}): Promise<AskAiHandlerResult> {
  const tools = buildTools();
  const runtime = createToolRuntime(aiContext);
  let conversationInput: OpenAiInputItem[] = [
    {
      role: 'user',
      content: [
        {
          type: 'input_text',
          text: buildStructuredContextSummary(aiContext),
        },
      ],
    },
    ...toOpenAiInput(normalizedMessages),
  ];
  let lastPayload: OpenAiResponsePayload | null = null;

  for (let iteration = 0; iteration < MAX_TOOL_ITERATIONS; iteration += 1) {
    const { response, payload } = await createOpenAiResponse({
      openAiApiKey,
      signal,
      payload: {
        model: resolveOpenAiModel(),
        instructions: buildToolInstructions(scope),
        reasoning: {
          effort: 'low',
        },
        max_output_tokens: 900,
        store: false,
        text: {
          format: {
            type: 'text',
          },
        },
        tools,
        input: conversationInput,
      },
    });

    if (!response.ok) {
      return json(502, {
        error:
          payload?.error?.message ||
          `The AI provider returned an error (${response.status}).`,
      });
    }

    lastPayload = payload;
    const functionCalls = extractFunctionCalls(payload);

    if (functionCalls.length === 0) {
      const answer = extractOutputText(payload);

      if (!answer) {
        return json(502, {
          error: 'The AI provider returned an empty response.',
        });
      }

      return json(200, {
        answer,
        model: payload?.model ?? resolveOpenAiModel(),
        researchPackTruncated: false,
      });
    }

    const toolOutputs = functionCalls.map((call) => {
      let args: Record<string, unknown> = {};

      if (typeof call.arguments === 'string' && call.arguments.trim()) {
        try {
          args = JSON.parse(call.arguments) as Record<string, unknown>;
        } catch {
          args = {};
        }
      }

      console.log('[ask-ai] Function call', {
        scopeType: aiContext.scopeType,
        scopeLabel: aiContext.scopeLabel,
        functionName: call.name ?? 'unknown',
        callId: call.call_id,
        arguments: args,
      });

      const tool = runtime[call.name as keyof ToolRuntime];
      const output =
        typeof tool === 'function'
          ? tool(args)
          : { error: `Unknown tool "${call.name ?? 'unknown'}".` };

      return {
        type: 'function_call_output',
        call_id: call.call_id,
        output: JSON.stringify(output),
      };
    });

    conversationInput = [
      ...conversationInput,
      ...toStatelessFunctionCallItems(functionCalls),
      ...toolOutputs,
    ];
  }

  return json(502, {
    error:
      extractOutputText(lastPayload) ||
      'Ask AI exhausted its tool-calling budget before producing a final answer.',
  });
}

export async function handleAskAiRequest({
  method,
  body,
}: {
  method?: string;
  body: unknown;
}): Promise<AskAiHandlerResult> {
  if (method === 'OPTIONS') {
    return json(204, {});
  }

  if (method !== 'POST') {
    return json(405, { error: 'Method not allowed.' });
  }

  const openAiApiKey = resolveOpenAiApiKey();

  if (!openAiApiKey) {
    return json(503, {
      error: 'Ask AI is not configured yet. Add OPENAI_API_KEY on the backend to enable chat.',
    });
  }

  const parsedBody = parseRequestBody(body);

  if (!parsedBody) {
    return json(400, { error: 'Invalid JSON body.' });
  }

  const normalizedMessages = normalizeMessages(parsedBody.messages);
  const researchPackMarkdown = sanitizeText(
    parsedBody.researchPack?.markdown,
    MAX_RESEARCH_PACK_CHARS,
  );
  const researchPackFilename =
    sanitizeText(parsedBody.researchPack?.filename, 160) || 'ai-research-pack.md';
  const aiContext = sanitizeStructuredContext(parsedBody.aiContext);

  if (!aiContext && !researchPackMarkdown) {
    return json(400, { error: 'Missing research pack context.' });
  }

  if (normalizedMessages.length === 0 || normalizedMessages.at(-1)?.role !== 'user') {
    return json(400, { error: 'The latest message must be a user question.' });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000);

  try {
    if (aiContext) {
      return await answerWithStructuredContext({
        openAiApiKey,
        scope: parsedBody.scope,
        aiContext,
        normalizedMessages,
        signal: controller.signal,
      });
    }

    return await answerWithMarkdownContext({
      openAiApiKey,
      scope: parsedBody.scope,
      researchPackFilename,
      researchPackMarkdown,
      normalizedMessages,
      signal: controller.signal,
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      return json(504, {
        error: 'The Ask AI request timed out. Please try a shorter question.',
      });
    }

    return json(500, {
      error: 'Ask AI failed before a response was generated.',
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
