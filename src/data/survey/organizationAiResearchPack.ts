import { LEVEL_LABELS, scoreToLevel, TECH_DIMENSIONS, type Individual } from '../types';
import type {
  AskAiIndividualScoreRow,
  AskAiQuestionLevelResponseRow,
  AskAiQuestionRow,
  AskAiResearchPack,
  AskAiStructuredContext,
} from '../../shared/api/askAi';
import { getOpenQuestionsForSurveyType, getQuestionsForSurveyType } from './questions';
import type { RawResponse } from './scoring';

const REPORT_DATE = 'May 27, 2026';
const REPORT_DATE_STAMP = '2026-05-27';
const REPORT_WEBSITE = 'https://ai-maturity-index.ralabs.org/';

type ScopeScoresRow = {
  name: string;
  respondents: number;
  overall: number;
  level: string;
  scores: Record<(typeof TECH_DIMENSIONS)[number], number>;
};

type BuildOrganizationAiResearchPackArgs = {
  individuals: Individual[];
  rawResponses: RawResponse[];
  resolvePersonName: (username: string) => string;
  scopeType?: Exclude<AskAiStructuredContext['scopeType'], 'individual'>;
  scopeLabel?: string;
};

type AliasMaps = {
  people: Map<string, string>;
  projects: Map<string, string>;
};

type ReferenceTable = {
  idsByValue: Map<string, string>;
  entries: Array<{ ref: string; value: string }>;
  rows: string[];
};

type QuestionReference = {
  refId: string;
  surveyType: RawResponse['surveyType'];
  surveyTypeLabel: string;
  questionNumber: string;
  dimension: string;
  text: string;
  isOpen: boolean;
};

type QuestionReferenceTable = {
  refsByKey: Map<string, QuestionReference>;
  entries: QuestionReference[];
  rows: string[];
};

function roundToOne(value: number): number {
  return Number(value.toFixed(1));
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatScore(value: number): string {
  return value.toFixed(1);
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function formatLevel(level: number | string): string {
  if (typeof level === 'number') {
    return `Level ${level} - ${LEVEL_LABELS[level as keyof typeof LEVEL_LABELS]}`;
  }

  const levelNumberMap: Record<string, number> = {
    Observer: 1,
    Explorer: 2,
    Practitioner: 3,
    Orchestrator: 4,
    Native: 5,
  };
  const levelNumber = levelNumberMap[level];

  return levelNumber ? `Level ${levelNumber} - ${level}` : level;
}

function sanitizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeMarkdownCell(value: string): string {
  return value
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function questionReferenceKey(
  surveyType: RawResponse['surveyType'],
  questionId: string,
): string {
  return `${surveyType ?? 'delivery-engineering'}::${questionId}`;
}

function createReferenceTable(
  values: string[],
  prefix: string,
  valueLabel: string,
): ReferenceTable {
  const uniqueValues = Array.from(
    new Set(values.map((value) => sanitizeWhitespace(value)).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right));
  const idsByValue = new Map<string, string>();
  const entries: Array<{ ref: string; value: string }> = [];
  const rows = [
    `| ${prefix} ID | ${valueLabel} |`,
    '|---|---|',
  ];

  uniqueValues.forEach((value, index) => {
    const refId = `${prefix}${String(index + 1).padStart(2, '0')}`;
    idsByValue.set(value, refId);
    entries.push({ ref: refId, value });
    rows.push(`| ${refId} | ${escapeMarkdownCell(value)} |`);
  });

  return {
    idsByValue,
    entries,
    rows,
  };
}

function createFixedReferenceTable(
  entries: Array<{ id: string; value: string }>,
  idLabel: string,
  valueLabel: string,
): ReferenceTable {
  const idsByValue = new Map<string, string>();
  const referenceEntries: Array<{ ref: string; value: string }> = [];
  const rows = [
    `| ${idLabel} | ${valueLabel} |`,
    '|---|---|',
  ];

  for (const entry of entries) {
    const normalizedValue = sanitizeWhitespace(entry.value);
    idsByValue.set(normalizedValue, entry.id);
    referenceEntries.push({ ref: entry.id, value: normalizedValue });
    rows.push(`| ${entry.id} | ${escapeMarkdownCell(normalizedValue)} |`);
  }

  return {
    idsByValue,
    entries: referenceEntries,
    rows,
  };
}

function allProjectsList(rawProjects: string): string[] {
  return rawProjects
    .split(';')
    .map((part) => sanitizeWhitespace(part))
    .filter((part) => part && part.toLowerCase() !== 'n/a');
}

function buildPersonBaseAlias(fullName: string): string {
  const parts = sanitizeWhitespace(fullName).split(' ').filter(Boolean);

  if (parts.length === 0) {
    return 'Anonymous';
  }

  if (parts.length === 1) {
    return parts[0];
  }

  const first = parts[0];
  const last = parts[parts.length - 1];

  return `${first} ${last.charAt(0).toUpperCase()}`;
}

function buildPersonFallbackAlias(fullName: string, attempt: number): string {
  const parts = sanitizeWhitespace(fullName).split(' ').filter(Boolean);

  if (parts.length < 2) {
    return `${parts[0] ?? 'Anonymous'} ${attempt + 1}`;
  }

  const first = parts[0];
  const last = parts[parts.length - 1];
  const sliceLength = Math.min(last.length, attempt + 1);

  return `${first} ${last.slice(0, sliceLength)}`;
}

function buildProjectBaseAlias(projectName: string): string {
  const words = sanitizeWhitespace(projectName)
    .split(/[^A-Za-z0-9]+/)
    .map((word) => word.toUpperCase())
    .filter(Boolean);

  if (words.length === 0) {
    return 'PRJX';
  }

  if (words.length > 1) {
    const initials = words.map((word) => word.charAt(0)).join('');
    let alias = initials.slice(0, 4);

    if (alias.length < 4) {
      const joined = words.join('');
      for (const char of joined) {
        if (alias.length >= 4) {
          break;
        }
        if (!alias.includes(char)) {
          alias += char;
        }
      }
    }

    return alias.padEnd(4, 'X').slice(0, 4);
  }

  const word = words[0];
  let alias = word.charAt(0);
  const consonants = word
    .slice(1)
    .replace(/[AEIOU]/g, '');

  for (const char of consonants) {
    if (alias.length >= 4) {
      break;
    }
    alias += char;
  }

  for (const char of word.slice(1)) {
    if (alias.length >= 4) {
      break;
    }
    alias += char;
  }

  return alias.padEnd(4, 'X').slice(0, 4);
}

function createUniqueAliasMap(
  sourceValues: string[],
  buildBaseAlias: (value: string) => string,
  buildFallbackAlias: (value: string, attempt: number) => string,
): Map<string, string> {
  const uniqueValues = Array.from(new Set(sourceValues.map((value) => sanitizeWhitespace(value)).filter(Boolean)))
    .sort((left, right) => left.localeCompare(right));
  const aliasToSource = new Map<string, string>();
  const sourceToAlias = new Map<string, string>();

  for (const sourceValue of uniqueValues) {
    let alias = buildBaseAlias(sourceValue);
    let attempt = 1;

    while (aliasToSource.has(alias) && aliasToSource.get(alias) !== sourceValue) {
      alias = buildFallbackAlias(sourceValue, attempt);
      attempt += 1;
    }

    aliasToSource.set(alias, sourceValue);
    sourceToAlias.set(sourceValue, alias);
  }

  return sourceToAlias;
}

function createAliasMaps(
  individuals: Individual[],
  rawResponses: RawResponse[],
  resolvePersonName: (username: string) => string,
): AliasMaps {
  const personNames = [
    ...individuals.map((person) => person.name),
    ...rawResponses.map((response) => resolvePersonName(response.username)),
  ];
  const projectNames = [
    ...individuals.flatMap((person) => person.allProjects),
    ...rawResponses.flatMap((response) => allProjectsList(response.projects)),
  ];

  return {
    people: createUniqueAliasMap(personNames, buildPersonBaseAlias, buildPersonFallbackAlias),
    projects: createUniqueAliasMap(
      projectNames,
      buildProjectBaseAlias,
      (projectName, attempt) => {
        const baseAlias = buildProjectBaseAlias(projectName);
        const suffix = String(attempt + 1);
        return `${baseAlias.slice(0, Math.max(1, 4 - suffix.length))}${suffix}`;
      },
    ),
  };
}

function anonymizePersonName(name: string, peopleAliases: Map<string, string>): string {
  const normalized = sanitizeWhitespace(name);
  return peopleAliases.get(normalized) ?? buildPersonBaseAlias(normalized);
}

function anonymizeProjectName(name: string, projectAliases: Map<string, string>): string {
  const normalized = sanitizeWhitespace(name);
  return projectAliases.get(normalized) ?? buildProjectBaseAlias(normalized);
}

function redactAnswerText(value: string, aliasMaps: AliasMaps): string {
  let result = sanitizeWhitespace(value);

  result = result.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[redacted-email]');

  const replacements = [
    ...Array.from(aliasMaps.people.entries()),
    ...Array.from(aliasMaps.projects.entries()),
  ].sort((left, right) => right[0].length - left[0].length);

  for (const [original, alias] of replacements) {
    const pattern = new RegExp(`\\b${escapeRegExp(original)}\\b`, 'gi');
    result = result.replace(pattern, alias);
  }

  return result;
}

function averageDimensionScores(members: Individual[]): Record<(typeof TECH_DIMENSIONS)[number], number> {
  return TECH_DIMENSIONS.reduce(
    (acc, dimension) => ({
      ...acc,
      [dimension]: roundToOne(average(members.map((member) => member.scores[dimension]))),
    }),
    {} as Record<(typeof TECH_DIMENSIONS)[number], number>,
  );
}

function buildDepartmentRows(individuals: Individual[]): ScopeScoresRow[] {
  const membersByDepartment = new Map<string, Individual[]>();

  for (const person of individuals) {
    const department = sanitizeWhitespace(person.department);

    if (!department) {
      continue;
    }

    const existing = membersByDepartment.get(department) ?? [];
    existing.push(person);
    membersByDepartment.set(department, existing);
  }

  return Array.from(membersByDepartment.entries())
    .map(([department, members]) => {
      const scores = averageDimensionScores(members);
      const overall = roundToOne(average(TECH_DIMENSIONS.map((dimension) => scores[dimension])));

      return {
        name: department,
        respondents: members.length,
        overall,
        level: LEVEL_LABELS[scoreToLevel(overall)],
        scores,
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

function buildProjectRows(individuals: Individual[]): ScopeScoresRow[] {
  const membersByProject = new Map<string, Individual[]>();

  for (const person of individuals) {
    for (const rawProject of person.allProjects) {
      const project = sanitizeWhitespace(rawProject);

      if (!project || project.toLowerCase() === 'n/a') {
        continue;
      }

      const existing = membersByProject.get(project) ?? [];
      existing.push(person);
      membersByProject.set(project, existing);
    }
  }

  return Array.from(membersByProject.entries())
    .map(([project, members]) => {
      const scores = averageDimensionScores(members);
      const overall = roundToOne(average(TECH_DIMENSIONS.map((dimension) => scores[dimension])));

      return {
        name: project,
        respondents: members.length,
        overall,
        level: LEVEL_LABELS[scoreToLevel(overall)],
        scores,
      };
    })
    .sort((left, right) => right.overall - left.overall || left.name.localeCompare(right.name));
}

function buildQuestionReferenceTable(): QuestionReferenceTable {
  const refsByKey = new Map<string, QuestionReference>();
  const entries: QuestionReference[] = [];
  const rows = [
    '| Question Ref | Survey Type | Question Number | Dimension | Question |',
    '|---|---|---|---|---|',
  ];
  const surveyDefinitions = [
    {
      surveyType: 'business' as const,
      surveyTypeLabel: 'Business',
      questions: [...getQuestionsForSurveyType('business'), ...getOpenQuestionsForSurveyType('business')],
    },
    {
      surveyType: 'delivery-engineering' as const,
      surveyTypeLabel: 'Delivery & engineering',
      questions: [
        ...getQuestionsForSurveyType('delivery-engineering'),
        ...getOpenQuestionsForSurveyType('delivery-engineering'),
      ],
    },
  ];

  for (const definition of surveyDefinitions) {
    definition.questions.forEach((question, index) => {
      const refId = `${definition.surveyType === 'business' ? 'QB' : 'QD'}${String(index + 1).padStart(2, '0')}`;
      const dimension =
        'dimension' in question && typeof question.dimension === 'string'
          ? question.dimension
          : 'Open';
      const ref = {
        refId,
        surveyType: definition.surveyType,
        surveyTypeLabel: definition.surveyTypeLabel,
        questionNumber: question.number,
        dimension,
        text: question.text,
        isOpen: !('dimension' in question),
      };

      refsByKey.set(questionReferenceKey(definition.surveyType, String(question.id)), ref);
      entries.push(ref);
      rows.push(
        `| ${refId} | ${definition.surveyTypeLabel} | ${escapeMarkdownCell(question.number)} | ${escapeMarkdownCell(ref.dimension)} | ${escapeMarkdownCell(question.text)} |`,
      );
    });
  }

  return {
    entries,
    refsByKey,
    rows,
  };
}

function buildAnswerReferenceTable(
  rawResponses: RawResponse[],
  aliasMaps: AliasMaps,
  questionReferences: QuestionReferenceTable,
): ReferenceTable {
  const answerValues: string[] = [];

  for (const response of rawResponses) {
    const questions = [
      ...getQuestionsForSurveyType(response.surveyType),
      ...getOpenQuestionsForSurveyType(response.surveyType),
    ];

    for (const question of questions) {
      const answer = response[question.id as keyof RawResponse];

      if (typeof answer !== 'string' || sanitizeWhitespace(answer) === '') {
        continue;
      }

      const questionRef = questionReferences.refsByKey.get(
        questionReferenceKey(response.surveyType, String(question.id)),
      );

      if (!questionRef || questionRef.isOpen) {
        continue;
      }

      answerValues.push(redactAnswerText(answer, aliasMaps));
    }
  }

  return createReferenceTable(answerValues, 'A', 'Answer');
}

function buildQuestionRows(
  rawResponses: RawResponse[],
  resolvePersonName: (username: string) => string,
  aliasMaps: AliasMaps,
  questionReferences: QuestionReferenceTable,
  peopleReferences: ReferenceTable,
  surveyTypeReferences: ReferenceTable,
  answerReferences: ReferenceTable,
): string[] {
  const rows: string[] = [
    '| Person Ref | Survey Type Ref | Question Ref | Answer Ref | Raw Answer |',
    '|---|---|---|---|---|',
  ];

  for (const response of rawResponses) {
    const questions = [
      ...getQuestionsForSurveyType(response.surveyType),
      ...getOpenQuestionsForSurveyType(response.surveyType),
    ];
    const personAlias = anonymizePersonName(resolvePersonName(response.username), aliasMaps.people);
    const surveyTypeLabel =
      response.surveyType === 'business' ? 'Business' : 'Delivery & engineering';
    const personRef = peopleReferences.idsByValue.get(personAlias) ?? '-';
    const surveyTypeRef = surveyTypeReferences.idsByValue.get(surveyTypeLabel) ?? '-';

    for (const question of questions) {
      const answer = response[question.id as keyof RawResponse];

      if (typeof answer !== 'string' || sanitizeWhitespace(answer) === '') {
        continue;
      }

      const questionRef = questionReferences.refsByKey.get(
        questionReferenceKey(response.surveyType, String(question.id)),
      );

      if (!questionRef) {
        continue;
      }

      const redactedAnswer = redactAnswerText(answer, aliasMaps);
      const answerRef = questionRef.isOpen
        ? '-'
        : answerReferences.idsByValue.get(redactedAnswer) ?? '-';
      const rawAnswer = questionRef.isOpen ? redactedAnswer : '-';

      rows.push(
        `| ${personRef} | ${surveyTypeRef} | ${questionRef.refId} | ${answerRef} | ${escapeMarkdownCell(rawAnswer)} |`,
      );
    }
  }

  return rows;
}

function buildDistributionRows(individuals: Individual[]): string[] {
  const counts = new Map<number, number>([
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [5, 0],
  ]);

  for (const person of individuals) {
    counts.set(person.overallLevel, (counts.get(person.overallLevel) ?? 0) + 1);
  }

  const total = individuals.length || 1;
  const rows = [
    '| Level | Count | Share |',
    '|---|---:|---:|',
  ];

  for (const level of [1, 2, 3, 4, 5]) {
    const count = counts.get(level) ?? 0;
    rows.push(`| ${formatLevel(level)} | ${count} | ${formatPercent((count / total) * 100)} |`);
  }

  return rows;
}

function buildDimensionAverageRows(individuals: Individual[]): string[] {
  const rows = [
    '| Dimension | Average Score |',
    '|---|---:|',
  ];

  for (const dimension of TECH_DIMENSIONS) {
    rows.push(
      `| ${dimension} | ${formatScore(average(individuals.map((person) => person.scores[dimension])))} |`,
    );
  }

  return rows;
}

function buildIndividualRows(
  individuals: Individual[],
  aliasMaps: AliasMaps,
  departmentReferences: ReferenceTable,
  seniorityReferences: ReferenceTable,
  projectReferences: ReferenceTable,
): string[] {
  const rows = [
    '| Person | Survey Type | Department Ref | Seniority Ref | Project Refs | Overall | Level | Usage | Skills | Impact | Culture | Vision |',
    '|---|---|---|---|---|---:|---|---:|---:|---:|---:|---:|',
  ];

  const sortedIndividuals = [...individuals].sort(
    (left, right) => left.name.localeCompare(right.name) || left.department.localeCompare(right.department),
  );

  for (const person of sortedIndividuals) {
    const departmentRef =
      departmentReferences.idsByValue.get(sanitizeWhitespace(person.department)) ?? '-';
    const seniorityRef =
      seniorityReferences.idsByValue.get(sanitizeWhitespace(person.seniority)) ?? '-';
    const projectRefs = person.allProjects
      .map((project) => projectReferences.idsByValue.get(anonymizeProjectName(project, aliasMaps.projects)) ?? '-')
      .join(', ');

    rows.push(
      `| ${escapeMarkdownCell(anonymizePersonName(person.name, aliasMaps.people))} | ${person.surveyType === 'business' ? 'Business' : 'Delivery & engineering'} | ${departmentRef} | ${seniorityRef} | ${escapeMarkdownCell(projectRefs)} | ${formatScore(person.overallScore)} | ${formatLevel(person.overallLevel)} | ${formatScore(person.scores.Usage)} | ${formatScore(person.scores.Skills)} | ${formatScore(person.scores.Impact)} | ${formatScore(person.scores.Culture)} | ${formatScore(person.scores.Vision)} |`,
    );
  }

  return rows;
}

function buildScopeRows(
  title: string,
  rowsData: ScopeScoresRow[],
  referenceLabel: string,
  resolveRef: (row: ScopeScoresRow) => string,
): string[] {
  const rows = [
    `## ${title}`,
    '',
    `| ${referenceLabel} | Respondents | Overall | Level | Usage | Skills | Impact | Culture | Vision |`,
    '|---|---:|---:|---|---:|---:|---:|---:|---:|',
  ];

  for (const row of rowsData) {
    rows.push(
      `| ${escapeMarkdownCell(resolveRef(row))} | ${row.respondents} | ${formatScore(row.overall)} | ${formatLevel(row.level)} | ${formatScore(row.scores.Usage)} | ${formatScore(row.scores.Skills)} | ${formatScore(row.scores.Impact)} | ${formatScore(row.scores.Culture)} | ${formatScore(row.scores.Vision)} |`,
    );
  }

  return rows;
}

function buildMethodology(): AskAiStructuredContext['methodology'] {
  const businessQuestionCount =
    getQuestionsForSurveyType('business').length + getOpenQuestionsForSurveyType('business').length;
  const deliveryQuestionCount =
    getQuestionsForSurveyType('delivery-engineering').length +
    getOpenQuestionsForSurveyType('delivery-engineering').length;

  return {
    overview: [
      'The AI Maturity Index is a survey-based assessment of how AI is being adopted across a selected scope.',
      'It measures five core dimensions: Usage, Skills, Impact, Culture, and Vision.',
      'Scores are reported on a 1.0 to 5.0 scale, with higher values indicating stronger maturity.',
      'The exported context is anonymized and is intended to support evidence-based analysis rather than narrative-only interpretation.',
      'The data includes scored respondents, aggregate department and project views, and question-level responses.',
    ].join('\n'),
    levels: [
      'Level 1 - Observer: score range 1.0-1.4. AI exposure is minimal, inconsistent, and not yet part of normal work.',
      'Level 2 - Explorer: score range 1.5-2.4. People are experimenting, but adoption is still fragmented and opportunistic.',
      'Level 3 - Practitioner: score range 2.5-3.4. AI is producing repeatable value in real work, but it is not yet broadly embedded.',
      'Level 4 - Orchestrator: score range 3.5-4.4. AI is integrated into workflows, shared practices, and team-level operating habits.',
      'Level 5 - Native: score range 4.5-5.0. AI is deeply embedded in how work is designed, delivered, and improved.',
    ].join('\n'),
    surveys: [
      `Business survey: ${businessQuestionCount} total questions, covering non-engineering and business-facing roles.`,
      `Delivery & engineering survey: ${deliveryQuestionCount} total questions, covering product, delivery, and technical roles.`,
      'Both surveys roll up into the same five maturity dimensions so cross-scope comparisons stay consistent.',
      'Question references identify the survey type, question number, dimension, and prompt text for each response row.',
    ].join('\n'),
  };
}

function buildStructuredScopeScores(
  rowsData: ScopeScoresRow[],
  resolveRef: (row: ScopeScoresRow) => string,
): AskAiStructuredContext['departmentScores'] {
  return rowsData.map((row) => ({
    ref: resolveRef(row),
    respondents: row.respondents,
    overall: row.overall,
    level: formatLevel(row.level),
    scores: row.scores,
  }));
}

function buildStructuredIndividualScores(
  individuals: Individual[],
  aliasMaps: AliasMaps,
  peopleReferences: ReferenceTable,
  departmentReferences: ReferenceTable,
  seniorityReferences: ReferenceTable,
  projectReferences: ReferenceTable,
  surveyTypeReferences: ReferenceTable,
): AskAiIndividualScoreRow[] {
  return [...individuals]
    .sort(
      (left, right) =>
        left.name.localeCompare(right.name) || left.department.localeCompare(right.department),
    )
    .map((person) => ({
      personRef:
        peopleReferences.idsByValue.get(anonymizePersonName(person.name, aliasMaps.people)) ?? '-',
      surveyTypeRef:
        surveyTypeReferences.idsByValue.get(
          person.surveyType === 'business' ? 'Business' : 'Delivery & engineering',
        ) ?? '-',
      departmentRef:
        departmentReferences.idsByValue.get(sanitizeWhitespace(person.department)) ?? '-',
      seniorityRef:
        seniorityReferences.idsByValue.get(sanitizeWhitespace(person.seniority)) ?? '-',
      projectRefs: person.allProjects
        .map(
          (project) =>
            projectReferences.idsByValue.get(anonymizeProjectName(project, aliasMaps.projects)) ?? '-',
        )
        .filter((projectRef) => projectRef !== '-'),
      overall: person.overallScore,
      level: formatLevel(person.overallLevel),
      scores: person.scores,
    }));
}

function buildStructuredQuestionLevelResponses(
  rawResponses: RawResponse[],
  resolvePersonName: (username: string) => string,
  aliasMaps: AliasMaps,
  questionReferences: QuestionReferenceTable,
  peopleReferences: ReferenceTable,
  surveyTypeReferences: ReferenceTable,
  answerReferences: ReferenceTable,
): AskAiQuestionLevelResponseRow[] {
  const rows: AskAiQuestionLevelResponseRow[] = [];

  for (const response of rawResponses) {
    const questions = [
      ...getQuestionsForSurveyType(response.surveyType),
      ...getOpenQuestionsForSurveyType(response.surveyType),
    ];
    const personAlias = anonymizePersonName(resolvePersonName(response.username), aliasMaps.people);
    const surveyTypeLabel =
      response.surveyType === 'business' ? 'Business' : 'Delivery & engineering';
    const personRef = peopleReferences.idsByValue.get(personAlias) ?? '-';
    const surveyTypeRef = surveyTypeReferences.idsByValue.get(surveyTypeLabel) ?? '-';

    for (const question of questions) {
      const answer = response[question.id as keyof RawResponse];

      if (typeof answer !== 'string' || sanitizeWhitespace(answer) === '') {
        continue;
      }

      const questionRef = questionReferences.refsByKey.get(
        questionReferenceKey(response.surveyType, String(question.id)),
      );

      if (!questionRef) {
        continue;
      }

      const redactedAnswer = redactAnswerText(answer, aliasMaps);

      rows.push({
        personRef,
        surveyTypeRef,
        questionRef: questionRef.refId,
        answerRef: questionRef.isOpen
          ? null
          : answerReferences.idsByValue.get(redactedAnswer) ?? null,
        rawAnswer: questionRef.isOpen ? redactedAnswer : null,
      });
    }
  }

  return rows;
}

export function buildOrganizationAiResearchPack({
  individuals,
  rawResponses,
  resolvePersonName,
  scopeType = 'organization',
  scopeLabel = 'Current scope',
}: BuildOrganizationAiResearchPackArgs): AskAiResearchPack {
  const aliasMaps = createAliasMaps(individuals, rawResponses, resolvePersonName);
  const departmentRows = buildDepartmentRows(individuals);
  const projectRows = buildProjectRows(individuals);
  const departmentReferences = createReferenceTable(
    individuals.map((person) => person.department),
    'D',
    'Department',
  );
  const peopleReferences = createReferenceTable(
    Array.from(aliasMaps.people.values()),
    'U',
    'Person Alias',
  );
  const seniorityReferences = createReferenceTable(
    individuals.map((person) => person.seniority),
    'S',
    'Seniority',
  );
  const surveyTypeReferences = createFixedReferenceTable(
    [
      { id: 'T01', value: 'Business' },
      { id: 'T02', value: 'Delivery & engineering' },
    ],
    'Survey Type Ref',
    'Survey Type',
  );
  const projectReferences = createReferenceTable(
    Array.from(aliasMaps.projects.values()),
    'P',
    'Project Alias',
  );
  const questionReferences = buildQuestionReferenceTable();
  const answerReferences = buildAnswerReferenceTable(
    rawResponses,
    aliasMaps,
    questionReferences,
  );
  const respondentCount = individuals.length;
  const overallScore =
    respondentCount > 0
      ? average(individuals.map((person) => person.overallScore))
      : 0;
  const overallLevel = scoreToLevel(overallScore);
  const level45PeopleCount = individuals.filter((person) => person.overallLevel >= 4).length;
  const level45PeopleShare =
    respondentCount > 0 ? (level45PeopleCount / respondentCount) * 100 : 0;
  const level45ProjectCount = projectRows.filter((project) => scoreToLevel(project.overall) >= 4).length;
  const level45ProjectShare =
    projectRows.length > 0 ? (level45ProjectCount / projectRows.length) * 100 : 0;
  const levelDistributionCounts = new Map<number, number>([
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [5, 0],
  ]);

  for (const person of individuals) {
    levelDistributionCounts.set(
      person.overallLevel,
      (levelDistributionCounts.get(person.overallLevel) ?? 0) + 1,
    );
  }

  const aiContext: AskAiStructuredContext = {
    version: 'v1',
    scopeType,
    scopeLabel,
    methodology: buildMethodology(),
    snapshot: {
      overallScore: roundToOne(overallScore),
      maturityLevel: formatLevel(overallLevel),
      respondentCount,
      totalProjects: projectRows.length,
      level45PeopleShare: roundToOne(level45PeopleShare),
      level45ProjectShare: roundToOne(level45ProjectShare),
      dimensionAverages: TECH_DIMENSIONS.reduce(
        (acc, dimension) => ({
          ...acc,
          [dimension]: roundToOne(average(individuals.map((person) => person.scores[dimension]))),
        }),
        {} as AskAiStructuredContext['snapshot']['dimensionAverages'],
      ),
      levelDistribution: [1, 2, 3, 4, 5].map((level) => {
        const count = levelDistributionCounts.get(level) ?? 0;
        return {
          level: formatLevel(level),
          count,
          share: roundToOne(respondentCount > 0 ? (count / respondentCount) * 100 : 0),
        };
      }),
    },
    people: peopleReferences.entries,
    surveyTypes: surveyTypeReferences.entries,
    departments: departmentReferences.entries,
    seniorities: seniorityReferences.entries,
    projects: projectReferences.entries,
    questions: questionReferences.entries.map<AskAiQuestionRow>((question) => ({
      questionRef: question.refId,
      surveyType: question.surveyType ?? 'delivery-engineering',
      surveyTypeLabel: question.surveyTypeLabel,
      questionNumber: question.questionNumber,
      dimension: question.dimension,
      text: question.text,
      isOpen: question.isOpen,
    })),
    answers: answerReferences.entries.map(({ ref, value }) => ({
      answerRef: ref,
      answer: value,
    })),
    departmentScores: buildStructuredScopeScores(
      departmentRows,
      (row) => departmentReferences.idsByValue.get(sanitizeWhitespace(row.name)) ?? '-',
    ),
    projectScores: buildStructuredScopeScores(
      projectRows,
      (row) =>
        projectReferences.idsByValue.get(
          anonymizeProjectName(row.name, aliasMaps.projects),
        ) ?? '-',
    ),
    individualScores: buildStructuredIndividualScores(
      individuals,
      aliasMaps,
      peopleReferences,
      departmentReferences,
      seniorityReferences,
      projectReferences,
      surveyTypeReferences,
    ),
    questionLevelResponses: buildStructuredQuestionLevelResponses(
      rawResponses,
      resolvePersonName,
      aliasMaps,
      questionReferences,
      peopleReferences,
      surveyTypeReferences,
      answerReferences,
    ),
  };

  const lines = [
    '# AI Maturity Research Pack',
    '',
    `Version date: ${REPORT_DATE}`,
    'Source: AI Maturity Index',
    `Website: ${REPORT_WEBSITE}`,
    '',
    '## About The Survey',
    'This research pack was exported from the AI Maturity Index, a survey-based assessment designed to measure AI maturity across an organization.',
    '',
    'The survey helps teams understand how AI is being adopted in day-to-day work, how strong underlying skills are, whether AI is creating measurable impact, how well practices are shared across teams, and how clearly people see future opportunities for AI.',
    '',
    'More information about the survey and methodology is available at:',
    REPORT_WEBSITE,
    '',
    '## What This File Is',
    'This file is an anonymized research pack exported from the AI Maturity Index dashboard.',
    '',
    'It is intended to provide enough structured data and context for an external AI assistant, such as ChatGPT or Claude, to analyze the results, answer follow-up questions, and generate custom insights based on the research data.',
    '',
    'This file is designed to preserve analytical usefulness while reducing direct identifiers for people and projects.',
    '',
    '## How To Read This File',
    '- Scores are shown on a 1.0-5.0 scale unless noted otherwise.',
    '- Higher scores indicate stronger AI maturity.',
    '- The file may contain organization, team, individual, and project-level views of the data.',
    '- Organization insights describe overall maturity patterns across all respondents.',
    '- Team insights describe grouped results for a specific department, project, or cohort when available.',
    '- Individual insights describe the dimension scores and maturity level of a single anonymized respondent.',
    '- Each organization, team, individual, and project can have scores across multiple maturity dimensions.',
    '- The core dimensions are Usage, Skills, Impact, Culture, and Vision.',
    '- Overall maturity levels are represented as Level 1 - Observer, Level 2 - Explorer, Level 3 - Practitioner, Level 4 - Orchestrator, and Level 5 - Native.',
    '- People and projects are anonymized.',
    '- This file contains raw values and structured summaries, not AI-generated conclusions.',
    '',
    '## Analysis Instructions For The AI Assistant',
    '- Base conclusions on the values contained in this file.',
    '- Clearly separate observed facts from inferred interpretations.',
    '- Highlight uncertainty where the data is limited or uneven.',
    '- Avoid assuming hidden context that is not present in the dataset.',
    '- Prefer evidence-based reasoning tied directly to scores, distributions, and responses.',
    '',
    '## Organization Snapshot',
    `- Organization overall score: ${formatScore(overallScore)} / 5`,
    `- Organization maturity level: ${formatLevel(overallLevel)}`,
    `- Total respondents: ${respondentCount}`,
    `- Total projects: ${projectRows.length}`,
    `- Level 4-5 people share: ${formatPercent(level45PeopleShare)}`,
    `- Level 4-5 project share: ${formatPercent(level45ProjectShare)}`,
    '',
    '## Organization Dimension Averages',
    ...buildDimensionAverageRows(individuals),
    '',
    '## Organization Maturity Distribution',
    ...buildDistributionRows(individuals),
    '',
    '## Raw People',
    ...peopleReferences.rows,
    '',
    '## Raw Survey Types',
    ...surveyTypeReferences.rows,
    '',
    '## Raw Departments',
    ...departmentReferences.rows,
    '',
    '## Raw Seniorities',
    ...seniorityReferences.rows,
    '',
    '## Raw Projects',
    ...projectReferences.rows,
    '',
    '## Raw Questions',
    ...questionReferences.rows,
    '',
    '## Raw Answers',
    ...answerReferences.rows,
    '',
    '## Raw Individual Scores',
    ...buildIndividualRows(
      individuals,
      aliasMaps,
      departmentReferences,
      seniorityReferences,
      projectReferences,
    ),
    '',
    ...buildScopeRows(
      'Raw Department Scores',
      departmentRows,
      'Department Ref',
      (row) => departmentReferences.idsByValue.get(sanitizeWhitespace(row.name)) ?? '-',
    ),
    '',
    ...buildScopeRows(
      'Raw Project Scores',
      projectRows,
      'Project Ref',
      (row) =>
        projectReferences.idsByValue.get(
          anonymizeProjectName(row.name, aliasMaps.projects),
        ) ?? '-',
    ),
    '',
    '## Raw Question-Level Responses',
    ...buildQuestionRows(
      rawResponses,
      resolvePersonName,
      aliasMaps,
      questionReferences,
      peopleReferences,
      surveyTypeReferences,
      answerReferences,
    ),
    '',
    '## Notes On Anonymization',
    '- Individual names are shortened, for example: `Ivanka Romanova` becomes `Ivanka R`.',
    '- Project names are converted into anonymized aliases, for example: `Google` may become `GGLE`.',
    '- Project aliases are stable within a single export.',
    '- Direct identifiers such as emails and usernames are excluded from this file.',
    '- Free-text answers are lightly redacted to replace known person and project names when detected.',
  ];

  return {
    filename: `organization-ai-research-pack-${REPORT_DATE_STAMP}.md`,
    markdown: `${lines.join('\n')}\n`,
    metadata: {
      projectAliasesByName: Object.fromEntries(aliasMaps.projects),
    },
    aiContext,
  };
}
