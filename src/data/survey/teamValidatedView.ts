import {
  allDepartmentsList,
  allProjectsList,
  computeScores,
  type QuestionScore,
  type RawResponse,
} from './scoring';
import type { Individual } from '../types';
import {
  scoreBusinessCultureEntries,
  scoreBusinessUsageEntries,
} from '../../shared/survey-domain/scoring/business';
import { scoreCultureEntries } from '../../shared/survey-domain/scoring/culture';
import { scoreUsageEntries } from '../../shared/survey-domain/scoring/usage';

export interface TeamValidatedSignal {
  id: string;
  label: string;
  description: string;
  score: number | null;
  weight: number;
  respondentCount: number;
}

export interface TeamValidatedViewResult {
  selfOverallScore: number;
  peerViewProxyScore: number | null;
  alignmentGap: number | null;
  influenceEvidenceScore: number | null;
  teamClimateValidationScore: number | null;
  influenceAnsweredSignals: number;
  influenceSignalCount: number;
  peerRespondentCount: number;
  influenceSignals: TeamValidatedSignal[];
  teamSignals: TeamValidatedSignal[];
}

export type TeamValidatedScope = 'department' | 'team';

export interface TeamValidatedScopeRow {
  name: string;
  respondents: number;
  validatedRespondents: number;
  avgSelfScore: number;
  avgPeerProxyScore: number;
  avgAlignmentGap: number;
  avgPositiveAlignmentGap: number;
  avgInfluenceEvidence: number;
  avgTeamClimateValidation: number;
  loneExpertCount: number;
  loneExpertShare: number;
  color: string;
}

export type TeamValidatedPersonFlag =
  | 'Not spreading yet'
  | 'Spreading but fragile'
  | 'Aligned'
  | 'Proxy stronger than self';

export interface TeamValidatedPersonRow {
  person: Individual;
  selfOverallScore: number;
  peerViewProxyScore: number | null;
  alignmentGap: number | null;
  influenceEvidenceScore: number | null;
  teamClimateValidationScore: number | null;
  peerRespondentCount: number;
  flag: TeamValidatedPersonFlag;
}

type ScoredResponseMaps = {
  culture: Record<string, QuestionScore>;
  usage: Record<string, QuestionScore>;
};

function toEntryScoreRecord(
  entries: Array<{ qid: string; score: QuestionScore }>,
): Record<string, QuestionScore> {
  return entries.reduce<Record<string, QuestionScore>>((record, entry) => {
    record[entry.qid] = entry.score;
    return record;
  }, {});
}

function buildScoredResponseMaps(response: RawResponse): ScoredResponseMaps {
  const surveyType = response.surveyType ?? 'delivery-engineering';

  return {
    culture:
      surveyType === 'business'
        ? toEntryScoreRecord(scoreBusinessCultureEntries(response))
        : toEntryScoreRecord(scoreCultureEntries(response)),
    usage:
      surveyType === 'business'
        ? toEntryScoreRecord(scoreBusinessUsageEntries(response))
        : toEntryScoreRecord(scoreUsageEntries(response)),
  };
}

function toNumericScore(score: QuestionScore | undefined): number | null {
  return typeof score === 'number' ? score : null;
}

function average(scores: number[]): number | null {
  if (scores.length === 0) {
    return null;
  }

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function weightedAverage(
  weightedScores: Array<{ score: number | null; weight: number }>,
): number | null {
  const validScores = weightedScores.filter(
    (entry): entry is { score: number; weight: number } => typeof entry.score === 'number',
  );

  if (validScores.length === 0) {
    return null;
  }

  const totalWeight = validScores.reduce((sum, entry) => sum + entry.weight, 0);

  if (totalWeight <= 0) {
    return null;
  }

  return (
    validScores.reduce((sum, entry) => sum + entry.score * entry.weight, 0) / totalWeight
  );
}

function roundToOne(value: number | null): number | null {
  return typeof value === 'number' ? Number(value.toFixed(1)) : null;
}

function buildInfluenceSignals(response: RawResponse): TeamValidatedSignal[] {
  const scoredResponse = buildScoredResponseMaps(response);
  const surveyType = response.surveyType ?? 'delivery-engineering';

  return [
    {
      id: 'knowledge-sharing',
      label: 'Knowledge sharing',
      description: 'Whether this person actively shares AI tips, prompts, and discoveries.',
      score: toNumericScore(scoredResponse.culture['4.3']),
      weight: 0.15,
      respondentCount: 1,
    },
    {
      id: 'adoption-lift',
      label: 'Adoption lift',
      description: 'Whether their recommendations actually become part of how teammates work.',
      score: toNumericScore(scoredResponse.culture['4.4']),
      weight: 0.25,
      respondentCount: 1,
    },
    {
      id: 'named-impact',
      label: 'Named examples',
      description: 'Whether they can point to specific people or teams whose AI behavior changed.',
      score: toNumericScore(scoredResponse.culture['4.5']),
      weight: 0.25,
      respondentCount: 1,
    },
    {
      id: 'artifacts',
      label: 'Reusable artifacts',
      description: 'Whether they created guides, notes, or assets that live beyond direct conversations.',
      score:
        surveyType === 'business'
          ? toNumericScore(scoredResponse.culture['4.13'])
          : toNumericScore(scoredResponse.culture['4.6']),
      weight: 0.15,
      respondentCount: 1,
    },
    {
      id: 'shared-workflows',
      label: 'Shared workflows',
      description: 'Whether they helped create workflows or automations that other people now use.',
      score:
        surveyType === 'business'
          ? toNumericScore(scoredResponse.usage['1.11'])
          : toNumericScore(scoredResponse.culture['4.7']),
      weight: 0.1,
      respondentCount: 1,
    },
    {
      id: 'durability',
      label: 'Durability',
      description: 'Whether AI practices would continue even if this person stepped away tomorrow.',
      score:
        surveyType === 'business'
          ? toNumericScore(scoredResponse.culture['4.12'])
          : toNumericScore(scoredResponse.culture['4.14']),
      weight: 0.1,
      respondentCount: 1,
    },
  ];
}

function buildTeamSignal(
  id: string,
  label: string,
  description: string,
  weight: number,
  peerResponses: RawResponse[],
  pickScore: (scoredResponse: ScoredResponseMaps, response: RawResponse) => number | null,
): TeamValidatedSignal {
  const scores = peerResponses
    .map((response) => pickScore(buildScoredResponseMaps(response), response))
    .filter((score): score is number => typeof score === 'number');

  return {
    id,
    label,
    description,
    score: roundToOne(average(scores)),
    weight,
    respondentCount: scores.length,
  };
}

function buildTeamSignals(peerResponses: RawResponse[]): TeamValidatedSignal[] {
  return [
    buildTeamSignal(
      'team-maturity',
      'Team maturity around them',
      'How strong the surrounding team AI capability feels to nearby teammates.',
      0.4,
      peerResponses,
      (scoredResponse, response) =>
        (response.surveyType ?? 'delivery-engineering') === 'business'
          ? toNumericScore(scoredResponse.culture['4.6'])
          : toNumericScore(scoredResponse.culture['4.8']),
    ),
    buildTeamSignal(
      'shared-practices',
      'Shared team practices',
      'Whether teammates report shared norms, tools, or AI guidelines in project work.',
      0.25,
      peerResponses,
      (scoredResponse) => toNumericScore(scoredResponse.usage['1.7']),
    ),
    buildTeamSignal(
      'team-discussion',
      'AI discussed in ceremonies',
      descriptionForTeamDiscussion(),
      0.2,
      peerResponses,
      (scoredResponse, response) =>
        (response.surveyType ?? 'delivery-engineering') === 'business'
          ? toNumericScore(scoredResponse.usage['1.9'])
          : toNumericScore(scoredResponse.usage['1.11']),
    ),
    buildTeamSignal(
      'practice-durability',
      'Practice durability',
      'Whether teammates believe AI practices would continue without depending on one person.',
      0.15,
      peerResponses,
      (scoredResponse, response) =>
        (response.surveyType ?? 'delivery-engineering') === 'business'
          ? toNumericScore(scoredResponse.culture['4.12'])
          : toNumericScore(scoredResponse.culture['4.14']),
    ),
  ];
}

function descriptionForTeamDiscussion(): string {
  return 'Whether teammates say AI shows up in regular planning, meeting, or retrospective rhythms.';
}

function normalizedProjectScopeNames(response: RawResponse): string[] {
  return Array.from(
    new Set(
      allProjectsList(response.projects)
        .map((project) => project.trim())
        .filter((project) => project && project.toLowerCase() !== 'n/a' && project !== 'Unassigned'),
    ),
  );
}

function peerResponsesForProjectScope(
  response: RawResponse,
  allResponses: RawResponse[],
): RawResponse[] {
  const projectNames = normalizedProjectScopeNames(response);

  if (projectNames.length === 0) {
    return [];
  }

  const projectSet = new Set(projectNames);

  return allResponses.filter(
    (candidate) =>
      candidate !== response &&
      normalizedProjectScopeNames(candidate).some((project) => projectSet.has(project)),
  );
}

function scopeNamesForResponse(response: RawResponse, scope: TeamValidatedScope): string[] {
  if (scope === 'department') {
    return allDepartmentsList(response.department).filter(Boolean);
  }

  return normalizedProjectScopeNames(response);
}

function averageOrZero(values: number[]): number {
  return values.length > 0 ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function loneExpertScopeColor(row: Omit<TeamValidatedScopeRow, 'color'>): string {
  if (row.avgPositiveAlignmentGap >= 0.6 && row.loneExpertShare >= 25) {
    return '#dc2626';
  }

  if (row.avgPositiveAlignmentGap >= 0.45 || row.loneExpertShare >= 18) {
    return '#f59e0b';
  }

  if (row.avgPeerProxyScore >= 3.2 && row.avgAlignmentGap <= 0.2) {
    return '#0f766e';
  }

  return '#2563eb';
}

function teamValidatedPersonFlag(
  view: TeamValidatedViewResult,
): TeamValidatedPersonFlag {
  if (view.alignmentGap === null || view.peerViewProxyScore === null) {
    return 'Aligned';
  }

  if (view.alignmentGap > 0.6 && (view.influenceEvidenceScore ?? 5) < 3) {
    return 'Not spreading yet';
  }

  if (view.alignmentGap > 0.35) {
    return 'Spreading but fragile';
  }

  if (view.alignmentGap < -0.35) {
    return 'Proxy stronger than self';
  }

  return 'Aligned';
}

export function buildTeamValidatedView(
  response: RawResponse,
  peerResponses: RawResponse[],
): TeamValidatedViewResult {
  const influenceSignals = buildInfluenceSignals(response);
  const teamSignals = buildTeamSignals(peerResponses);
  const influenceEvidenceScore = roundToOne(
    weightedAverage(
      influenceSignals.map((signal) => ({
        score: signal.score,
        weight: signal.weight,
      })),
    ),
  );
  const teamClimateValidationScore = roundToOne(
    weightedAverage(
      teamSignals.map((signal) => ({
        score: signal.score,
        weight: signal.weight,
      })),
    ),
  );
  const peerViewProxyScore = roundToOne(
    weightedAverage([
      { score: influenceEvidenceScore, weight: 0.65 },
      { score: teamClimateValidationScore, weight: 0.35 },
    ]),
  );
  const selfOverallScore = Number(computeScores(response).overall.score.toFixed(1));
  const alignmentGap =
    typeof peerViewProxyScore === 'number'
      ? Number((selfOverallScore - peerViewProxyScore).toFixed(1))
      : null;

  return {
    selfOverallScore,
    peerViewProxyScore,
    alignmentGap,
    influenceEvidenceScore,
    teamClimateValidationScore,
    influenceAnsweredSignals: influenceSignals.filter((signal) => typeof signal.score === 'number')
      .length,
    influenceSignalCount: influenceSignals.length,
    peerRespondentCount: peerResponses.length,
    influenceSignals,
    teamSignals,
  };
}

export function buildTeamValidatedPersonRows(
  individuals: Individual[],
  responses: RawResponse[],
): TeamValidatedPersonRow[] {
  const responseById = new Map(
    responses.map((response) => [response.username.split('@')[0], response] as const),
  );

  return individuals
    .map((person) => {
      const response = responseById.get(person.id);
      const view = response
        ? buildTeamValidatedView(response, peerResponsesForProjectScope(response, responses))
        : null;

      return {
        person,
        selfOverallScore: view?.selfOverallScore ?? Number(person.overallScore.toFixed(1)),
        peerViewProxyScore: view?.peerViewProxyScore ?? null,
        alignmentGap: view?.alignmentGap ?? null,
        influenceEvidenceScore: view?.influenceEvidenceScore ?? null,
        teamClimateValidationScore: view?.teamClimateValidationScore ?? null,
        peerRespondentCount: view?.peerRespondentCount ?? 0,
        flag: view ? teamValidatedPersonFlag(view) : 'Aligned',
      };
    })
    .sort(
      (left, right) =>
        (right.alignmentGap ?? -999) - (left.alignmentGap ?? -999) ||
        (left.influenceEvidenceScore ?? 5) - (right.influenceEvidenceScore ?? 5) ||
        right.selfOverallScore - left.selfOverallScore ||
        left.person.name.localeCompare(right.person.name),
    );
}

export function buildTeamValidatedScopeRows(
  responses: RawResponse[],
  scope: TeamValidatedScope,
): TeamValidatedScopeRow[] {
  const validatedByResponse = responses.map((response) => ({
    response,
    view: buildTeamValidatedView(response, peerResponsesForProjectScope(response, responses)),
  }));

  const grouped = new Map<
    string,
    Array<{
      response: RawResponse;
      view: TeamValidatedViewResult;
    }>
  >();

  for (const entry of validatedByResponse) {
    for (const scopeName of scopeNamesForResponse(entry.response, scope)) {
      if (!scopeName) continue;
      const existing = grouped.get(scopeName) ?? [];
      existing.push(entry);
      grouped.set(scopeName, existing);
    }
  }

  return Array.from(grouped.entries())
    .map(([name, entries]) => {
      const validatedEntries = entries.filter(
        (entry) => entry.view.peerViewProxyScore !== null && entry.view.alignmentGap !== null,
      );

      if (validatedEntries.length === 0) {
        return null;
      }

      const avgSelfScore = roundToOne(
        averageOrZero(validatedEntries.map((entry) => entry.view.selfOverallScore)),
      ) ?? 0;
      const avgPeerProxyScore = roundToOne(
        averageOrZero(
          validatedEntries.map((entry) => entry.view.peerViewProxyScore ?? 0),
        ),
      ) ?? 0;
      const avgAlignmentGap = roundToOne(
        averageOrZero(validatedEntries.map((entry) => entry.view.alignmentGap ?? 0)),
      ) ?? 0;
      const avgPositiveAlignmentGap = roundToOne(
        averageOrZero(
          validatedEntries.map((entry) => Math.max(entry.view.alignmentGap ?? 0, 0)),
        ),
      ) ?? 0;
      const avgInfluenceEvidence = roundToOne(
        averageOrZero(
          validatedEntries.map((entry) => entry.view.influenceEvidenceScore ?? 0),
        ),
      ) ?? 0;
      const avgTeamClimateValidation = roundToOne(
        averageOrZero(
          validatedEntries.map((entry) => entry.view.teamClimateValidationScore ?? 0),
        ),
      ) ?? 0;
      const loneExpertCount = validatedEntries.filter((entry) => {
        const { selfOverallScore, alignmentGap, influenceEvidenceScore } = entry.view;

        return (
          selfOverallScore >= 3.5 &&
          typeof alignmentGap === 'number' &&
          alignmentGap > 0.6 &&
          typeof influenceEvidenceScore === 'number' &&
          influenceEvidenceScore < 3
        );
      }).length;
      const loneExpertShare = roundToOne(
        (loneExpertCount / Math.max(validatedEntries.length, 1)) * 100,
      ) ?? 0;

      const rowWithoutColor = {
        name,
        respondents: entries.length,
        validatedRespondents: validatedEntries.length,
        avgSelfScore,
        avgPeerProxyScore,
        avgAlignmentGap,
        avgPositiveAlignmentGap,
        avgInfluenceEvidence,
        avgTeamClimateValidation,
        loneExpertCount,
        loneExpertShare,
      };

      return {
        ...rowWithoutColor,
        color: loneExpertScopeColor(rowWithoutColor),
      };
    })
    .filter((row): row is TeamValidatedScopeRow => Boolean(row))
    .sort(
      (left, right) =>
        right.avgPositiveAlignmentGap - left.avgPositiveAlignmentGap ||
        right.loneExpertShare - left.loneExpertShare ||
        right.validatedRespondents - left.validatedRespondents ||
        left.name.localeCompare(right.name),
    );
}
