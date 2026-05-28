import { generateInsights } from './insights';
import { getQuestionsForSurveyType } from './questions';
import { computeScores, type RawResponse } from './scoring';
import { LEVEL_LABELS, TECH_DIMENSIONS, type Individual, type TechDimension } from '../types';

type BenchmarkSummary = {
  label: string;
  respondentCount: number;
  scores: Record<TechDimension, number>;
};

type BuildIndividualAiResearchPackArgs = {
  person: Individual;
  rawResponse: RawResponse;
  orgBenchmark: BenchmarkSummary;
  roleBenchmark: BenchmarkSummary | null;
  teamBenchmark: BenchmarkSummary | null;
  teamNames: string[];
};

function roundToOne(value: number): number {
  return Number(value.toFixed(1));
}

function formatScore(value: number): string {
  return value.toFixed(1);
}

function formatSignedDelta(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}`;
}

function formatDateStamp(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function escapeMarkdownCell(value: string): string {
  return value
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatQuestionScore(score: number | 'SKIP' | undefined): string {
  if (typeof score === 'number') {
    return score.toFixed(1);
  }

  return score ?? 'N/A';
}

function toFileSlug(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'respondent';
}

function anonymizeNarrative(text: string, personName: string): string {
  const trimmedPersonName = personName.trim();

  if (!trimmedPersonName) {
    return text;
  }

  const firstName = trimmedPersonName.split(/\s+/)[0] ?? '';
  let anonymized = text.replace(new RegExp(escapeRegex(trimmedPersonName), 'g'), 'Respondent A');

  if (firstName) {
    anonymized = anonymized.replace(
      new RegExp(`\\b${escapeRegex(firstName)}\\b`, 'g'),
      'Respondent A',
    );
  }

  return anonymized;
}

function createTeamReferenceTable(teamNames: string[]) {
  const uniqueTeamNames = Array.from(
    new Set(teamNames.map((teamName) => teamName.trim()).filter(Boolean)),
  ).sort((left, right) => left.localeCompare(right));
  const aliasByTeam = new Map<string, string>();
  const rows = ['| Team Ref | Alias |', '|---|---|'];

  uniqueTeamNames.forEach((teamName, index) => {
    const alias = `TEAM-${String(index + 1).padStart(2, '0')}`;
    aliasByTeam.set(teamName, alias);
    rows.push(`| ${alias} | ${escapeMarkdownCell(alias)} |`);
  });

  return {
    aliasByTeam,
    rows,
  };
}

export function buildIndividualAiResearchPack({
  person,
  rawResponse,
  orgBenchmark,
  roleBenchmark,
  teamBenchmark,
  teamNames,
}: BuildIndividualAiResearchPackArgs): { filename: string; markdown: string } {
  const exportedAt = new Date();
  const reportDate = exportedAt.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const reportDateStamp = formatDateStamp(exportedAt);
  const questions = getQuestionsForSurveyType(rawResponse.surveyType);
  const scoredResponse = computeScores(rawResponse);
  const insights = generateInsights(person);
  const anonymizedSummary = anonymizeNarrative(insights.summary, person.name);
  const teamReferences = createTeamReferenceTable(teamNames);

  const benchmarkRows = [
    {
      label: 'Respondent A',
      respondentCount: 1,
      scores: person.scores,
    },
    orgBenchmark,
    ...(roleBenchmark ? [roleBenchmark] : []),
    ...(teamBenchmark ? [teamBenchmark] : []),
  ];

  const benchmarkDeltaRows = TECH_DIMENSIONS.map((dimension) => ({
    dimension,
    vsOrg: roundToOne(person.scores[dimension] - orgBenchmark.scores[dimension]),
    vsRole:
      roleBenchmark === null
        ? null
        : roundToOne(person.scores[dimension] - roleBenchmark.scores[dimension]),
    vsTeam:
      teamBenchmark === null
        ? null
        : roundToOne(person.scores[dimension] - teamBenchmark.scores[dimension]),
  }));

  const answerRows = [
    '| Question | Dimension | Answer | Score |',
    '|---|---|---|---|',
  ];

  for (const question of questions) {
    const rawValue = rawResponse[question.id];
    const answer =
      typeof rawValue === 'string' && rawValue.trim()
        ? question.isMulti
          ? rawValue
              .split(';')
              .map((part) => part.trim())
              .filter(Boolean)
              .join(' | ')
          : rawValue.trim()
        : 'No answer';
    const score = scoredResponse.questionScores[question.scoreKey ?? question.number];

    answerRows.push(
      `| ${question.number} ${escapeMarkdownCell(question.text)} | ${question.dimension} | ${escapeMarkdownCell(answer)} | ${formatQuestionScore(score)} |`,
    );
  }

  const lines = [
    '# AI Maturity Research Pack',
    '',
    `Version date: ${reportDate}`,
    'Source: AI Maturity Index',
    'Scope: Single anonymized respondent',
    '',
    '## What This File Is',
    'This file is an anonymized individual research pack exported from the AI Maturity Index dashboard.',
    '',
    'It is designed to help an external AI assistant such as ChatGPT or Claude analyze one respondent in context, compare that respondent against organization and cohort benchmarks, and answer follow-up questions using question-level evidence.',
    '',
    '## Respondent Snapshot',
    `- Alias: Respondent A`,
    `- Role: ${person.role}`,
    `- Department: ${person.department}`,
    `- Seniority: ${person.seniority}`,
    `- Survey type: ${rawResponse.surveyType}`,
    `- Overall score: ${formatScore(person.overallScore)} / 5`,
    `- Maturity level: Level ${person.overallLevel} - ${LEVEL_LABELS[person.overallLevel]}`,
    '',
    '## Team References',
    ...teamReferences.rows,
    '',
    '## Team Scope Included In This Export',
    ...(teamNames.length > 0
      ? teamNames.map((teamName) => `- ${teamReferences.aliasByTeam.get(teamName.trim()) ?? 'TEAM-00'}`)
      : ['- No team assignments available']),
    '',
    '## Dimension Scores',
    '| Dimension | Respondent A |',
    '|---|---|',
    ...TECH_DIMENSIONS.map(
      (dimension) => `| ${dimension} | ${formatScore(person.scores[dimension])} |`,
    ),
    '',
    '## Benchmarks',
    '| Benchmark | Respondents | Usage | Skills | Impact | Culture | Vision |',
    '|---|---:|---:|---:|---:|---:|---:|',
    ...benchmarkRows.map(
      (row) =>
        `| ${row.label} | ${row.respondentCount} | ${formatScore(row.scores.Usage)} | ${formatScore(row.scores.Skills)} | ${formatScore(row.scores.Impact)} | ${formatScore(row.scores.Culture)} | ${formatScore(row.scores.Vision)} |`,
    ),
    '',
    '## Benchmark Deltas',
    '| Dimension | Vs org | Vs same role | Vs current team(s) |',
    '|---|---:|---:|---:|',
    ...benchmarkDeltaRows.map(
      (row) =>
        `| ${row.dimension} | ${formatSignedDelta(row.vsOrg)} | ${row.vsRole === null ? 'N/A' : formatSignedDelta(row.vsRole)} | ${row.vsTeam === null ? 'N/A' : formatSignedDelta(row.vsTeam)} |`,
    ),
    '',
    '## Interpreted Strengths',
    ...insights.strengths.map((strength) => `- ${strength.dimension}: ${strength.note}`),
    ...(insights.strengths.length === 0 ? ['- No standout strengths surfaced above the threshold.'] : []),
    '',
    '## Interpreted Growth Areas',
    ...insights.weaknesses.map((weakness) => `- ${weakness.dimension}: ${weakness.note}`),
    ...(insights.weaknesses.length === 0 ? ['- No major growth areas surfaced below the threshold.'] : []),
    '',
    '## Suggested Actions',
    ...insights.actions.map((action) => `- ${action}`),
    '',
    '## Profile Summary',
    anonymizedSummary.replace(/\*\*/g, ''),
    '',
    '## Question-Level Responses',
    ...answerRows,
    '',
    '## Analysis Instructions For The AI Assistant',
    '- Base conclusions on the numbers and answers in this file.',
    '- Separate observed facts from interpretation.',
    '- Call out where the respondent is below, at, or above the organization, role, and team baselines.',
    '- When recommending actions, tie them to the weakest dimensions or largest negative deltas.',
    '',
    '## Notes On Anonymization',
    '- The respondent is labeled as Respondent A.',
    '- Team names are replaced with generic team references.',
    '- No email address, username, or direct personal identifier is included.',
  ];

  const markdown = `${lines.join('\n')}\n`;

  return {
    filename: `individual-ai-research-pack-${toFileSlug(person.role)}-l${person.overallLevel}-${reportDateStamp}.md`,
    markdown: anonymizeNarrative(markdown, person.name),
  };
}
