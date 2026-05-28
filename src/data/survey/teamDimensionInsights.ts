import type { RawResponse } from './scoring';
import type { SurveyType } from './scoring/shared';

export type TeamSeriesItem<K extends string = string> = {
  key: K;
  label: string;
  color: string;
};

export type TeamStackedDistributionRow = {
  cohort: string;
  respondents: number;
  [key: string]: string | number;
};

export type TeamBarDistributionRow = {
  label: string;
  count: number;
  share: number;
};

type DependencyImpactKey = 'noImpact' | 'minor' | 'noticeable' | 'significant' | 'major';
type CostMaturityKey =
  | 'unaware'
  | 'basicAwareness'
  | 'awareButPassive'
  | 'selectiveOptimization'
  | 'activeOptimization';
type PlanningImpactKey =
  | 'samePlanning'
  | 'informalFactor'
  | 'explicitlyAdjust'
  | 'planningChanged'
  | 'inseparable';
type KnowledgeSharingKey = 'never' | 'rarely' | 'occasionally' | 'regularlyShare' | 'goToResource';
type InfluenceScoreKey =
  | 'noInfluenceYet'
  | 'adviceWithoutAdoption'
  | 'oneAdoptionExample'
  | 'teamLevelInfluence'
  | 'crossTeamInfluence';
type TeamAiMaturityKey = 'veryLow' | 'belowAverage' | 'average' | 'aboveAverage' | 'veryHigh';
type OrganizationalSupportKey =
  | 'notSupportedAtAll'
  | 'minimallySupported'
  | 'somewhatSupported'
  | 'wellSupported'
  | 'veryWellSupported';
type ToolSatisfactionKey =
  | 'veryDissatisfied'
  | 'dissatisfied'
  | 'neutral'
  | 'satisfied'
  | 'verySatisfied';
type EnjoyabilityKey =
  | 'muchLessEnjoyable'
  | 'slightlyLessEnjoyable'
  | 'noChange'
  | 'moreEnjoyable'
  | 'muchMoreEnjoyable';
type WorkChangeImaginationKey =
  | 'stillExploring'
  | 'speedUpSmallTasks'
  | 'improvePartsOfWorkflow'
  | 'workflowCouldDiffer'
  | 'futureAiAssistedModel';
type BusinessValueConnectionKey =
  | 'stillLearningBroaderValue'
  | 'personalProductivity'
  | 'internalEfficiency'
  | 'deliveryQualityCommunication'
  | 'businessModelClientAdvantage';

const BLOCKER_LABEL_BY_KEY = {
  nothingMostlySkills: 'Nothing / mainly AI skills',
  noTeamAgreement: 'No team agreement on AI usage',
  noTimeToExperiment: 'No time to experiment',
  accessLicensingLimits: 'Access / licensing limits',
  dataSensitivityOrClient: 'Data sensitivity / client restrictions',
  unclearProcessesOrSystem: 'Unclear processes / system context',
  missingDocsOrReference: 'Missing docs / templates / reference material',
  technicalEnvironment: 'Technical environment / tech debt',
  unclearRoleFit: 'Unclear role fit',
  other: 'Other',
} as const;

export const DEPENDENCY_IMPACT_SERIES = [
  { key: 'noImpact', label: 'No real impact', color: '#d4d4d8' },
  { key: 'minor', label: 'Minor inconvenience', color: '#bfdbfe' },
  { key: 'noticeable', label: 'Noticeable setback', color: '#60a5fa' },
  { key: 'significant', label: 'Significant impact', color: '#2563eb' },
  { key: 'major', label: 'Major disruption', color: '#0f766e' },
] as const satisfies ReadonlyArray<TeamSeriesItem<DependencyImpactKey>>;

export const COST_MATURITY_SERIES = [
  { key: 'unaware', label: 'Unaware', color: '#d4d4d8' },
  { key: 'basicAwareness', label: 'Basic awareness', color: '#bfdbfe' },
  { key: 'awareButPassive', label: 'Aware but passive', color: '#60a5fa' },
  { key: 'selectiveOptimization', label: 'Selective optimization', color: '#2563eb' },
  { key: 'activeOptimization', label: 'Active cost optimization', color: '#0f766e' },
] as const satisfies ReadonlyArray<TeamSeriesItem<CostMaturityKey>>;

export const PLANNING_IMPACT_SERIES = [
  { key: 'samePlanning', label: 'Same planning approach', color: '#d4d4d8' },
  { key: 'informalFactor', label: 'Informally factor AI in', color: '#bfdbfe' },
  { key: 'explicitlyAdjust', label: 'Explicitly adjust estimates', color: '#60a5fa' },
  { key: 'planningChanged', label: 'Planning fundamentally changed', color: '#2563eb' },
  { key: 'inseparable', label: 'AI inseparable from estimation', color: '#0f766e' },
] as const satisfies ReadonlyArray<TeamSeriesItem<PlanningImpactKey>>;

export const KNOWLEDGE_SHARING_SERIES = [
  { key: 'never', label: 'Never', color: '#d4d4d8' },
  { key: 'rarely', label: 'Rarely', color: '#cbd5e1' },
  { key: 'occasionally', label: 'Occasionally', color: '#93c5fd' },
  { key: 'regularlyShare', label: 'Regularly share', color: '#2563eb' },
  { key: 'goToResource', label: 'Go-to resource', color: '#0f766e' },
] as const satisfies ReadonlyArray<TeamSeriesItem<KnowledgeSharingKey>>;

export const INFLUENCE_SCORE_SERIES = [
  { key: 'noInfluenceYet', label: 'No influence yet', color: '#d4d4d8' },
  { key: 'adviceWithoutAdoption', label: 'Advice without clear adoption', color: '#cbd5e1' },
  { key: 'oneAdoptionExample', label: 'One adoption example', color: '#93c5fd' },
  { key: 'teamLevelInfluence', label: 'Team-level influence', color: '#2563eb' },
  { key: 'crossTeamInfluence', label: 'Cross-team influence', color: '#0f766e' },
] as const satisfies ReadonlyArray<TeamSeriesItem<InfluenceScoreKey>>;

export const TEAM_AI_MATURITY_SERIES = [
  { key: 'veryLow', label: 'Very low', color: '#d4d4d8' },
  { key: 'belowAverage', label: 'Below average', color: '#cbd5e1' },
  { key: 'average', label: 'Average', color: '#93c5fd' },
  { key: 'aboveAverage', label: 'Above average', color: '#2563eb' },
  { key: 'veryHigh', label: 'Very high', color: '#0f766e' },
] as const satisfies ReadonlyArray<TeamSeriesItem<TeamAiMaturityKey>>;

export const ORGANIZATIONAL_SUPPORT_SERIES = [
  { key: 'notSupportedAtAll', label: 'Not supported at all', color: '#d4d4d8' },
  { key: 'minimallySupported', label: 'Minimally supported', color: '#cbd5e1' },
  { key: 'somewhatSupported', label: 'Somewhat supported', color: '#93c5fd' },
  { key: 'wellSupported', label: 'Well supported', color: '#2563eb' },
  { key: 'veryWellSupported', label: 'Very well supported', color: '#0f766e' },
] as const satisfies ReadonlyArray<TeamSeriesItem<OrganizationalSupportKey>>;

export const TOOL_SATISFACTION_SERIES = [
  { key: 'veryDissatisfied', label: 'Very dissatisfied', color: '#d4d4d8' },
  { key: 'dissatisfied', label: 'Dissatisfied', color: '#cbd5e1' },
  { key: 'neutral', label: 'Neutral', color: '#93c5fd' },
  { key: 'satisfied', label: 'Satisfied', color: '#2563eb' },
  { key: 'verySatisfied', label: 'Very satisfied', color: '#0f766e' },
] as const satisfies ReadonlyArray<TeamSeriesItem<ToolSatisfactionKey>>;

export const ENJOYABILITY_SERIES = [
  { key: 'muchLessEnjoyable', label: 'Much less enjoyable', color: '#d4d4d8' },
  { key: 'slightlyLessEnjoyable', label: 'Slightly less enjoyable', color: '#cbd5e1' },
  { key: 'noChange', label: 'No change', color: '#93c5fd' },
  { key: 'moreEnjoyable', label: 'More enjoyable', color: '#2563eb' },
  { key: 'muchMoreEnjoyable', label: 'Much more enjoyable', color: '#0f766e' },
] as const satisfies ReadonlyArray<TeamSeriesItem<EnjoyabilityKey>>;

export const WORK_CHANGE_IMAGINATION_SERIES = [
  { key: 'stillExploring', label: 'Still exploring', color: '#d4d4d8' },
  { key: 'speedUpSmallTasks', label: 'Speed up small tasks', color: '#cbd5e1' },
  { key: 'improvePartsOfWorkflow', label: 'Improve parts of workflow', color: '#93c5fd' },
  {
    key: 'workflowCouldDiffer',
    label: 'At least one workflow could work differently',
    color: '#2563eb',
  },
  {
    key: 'futureAiAssistedModel',
    label: 'Future AI-assisted working model',
    color: '#0f766e',
  },
] as const satisfies ReadonlyArray<TeamSeriesItem<WorkChangeImaginationKey>>;

export const BUSINESS_VALUE_CONNECTION_SERIES = [
  {
    key: 'stillLearningBroaderValue',
    label: 'Still learning broader value',
    color: '#d4d4d8',
  },
  { key: 'personalProductivity', label: 'Personal productivity', color: '#cbd5e1' },
  { key: 'internalEfficiency', label: 'Internal efficiency', color: '#93c5fd' },
  {
    key: 'deliveryQualityCommunication',
    label: 'Delivery / quality / communication / decisions',
    color: '#2563eb',
  },
  {
    key: 'businessModelClientAdvantage',
    label: 'Business model / pricing / client / competitive advantage',
    color: '#0f766e',
  },
] as const satisfies ReadonlyArray<TeamSeriesItem<BusinessValueConnectionKey>>;

const CULTURE_SUPPORT_NEEDED_LABELS = [
  'Advanced workflows',
  'Tool overview',
  'Prompt engineering',
  'Task setup',
  'Peer learning',
] as const;

function roundToOne(value: number): number {
  return Number(value.toFixed(1));
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isNumber(value: number | null): value is number {
  return typeof value === 'number';
}

function normalizeValue(rawValue: string | undefined): string {
  return rawValue?.trim().replace(/\s+/g, ' ').toLowerCase() ?? '';
}

function splitSurveyMultiValue(rawValue: string | undefined): string[] {
  return (rawValue ?? '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);
}

function buildSingleScopeStackedDistribution<K extends string>(
  responses: RawResponse[],
  cohortLabel: string,
  series: ReadonlyArray<TeamSeriesItem<K>>,
  getKey: (response: RawResponse) => K | null,
): TeamStackedDistributionRow[] {
  const respondents = responses.length;
  const counts = series.reduce(
    (acc, entry) => ({ ...acc, [entry.key]: 0 }),
    {} as Record<K, number>,
  );

  for (const response of responses) {
    const key = getKey(response);
    if (key) {
      counts[key] += 1;
    }
  }

  const row: TeamStackedDistributionRow = {
    cohort: cohortLabel,
    respondents,
  };

  for (const entry of series) {
    const count = counts[entry.key];
    row[entry.key] = respondents > 0 ? roundToOne((count / respondents) * 100) : 0;
    row[`${entry.key}Count`] = count;
  }

  return [row];
}

function buildSingleScopeBarRows(
  responses: RawResponse[],
  labels: readonly string[],
  getLabels: (response: RawResponse) => string[],
): TeamBarDistributionRow[] {
  const respondents = responses.length;
  const counts = new Map<string, number>();

  for (const response of responses) {
    const uniqueLabels = new Set(getLabels(response));

    for (const label of uniqueLabels) {
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
  }

  return labels
    .map((label) => {
      const count = counts.get(label) ?? 0;

      return {
        label,
        count,
        share: respondents > 0 ? roundToOne((count / respondents) * 100) : 0,
      };
    })
    .filter((row) => row.count > 0)
    .sort((left, right) => right.share - left.share || left.label.localeCompare(right.label));
}

function normalizeDependencyImpactAnswer(rawValue: string | undefined): DependencyImpactKey | null {
  const value = normalizeValue(rawValue);

  if (!value) return null;
  if (value.includes('no real impact')) return 'noImpact';
  if (value.includes('minor inconvenience')) return 'minor';
  if (value.includes('noticeable setback')) return 'noticeable';
  if (value.includes('significant impact')) return 'significant';
  if (value.includes('major disruption')) return 'major';
  return null;
}

function pricingUnderstandingScore(rawValue: string | undefined): number | null {
  const value = normalizeValue(rawValue);

  if (!value) return null;
  if (value.includes('no idea how pricing works')) return 1;
  if (value.includes('some tools are free and some are paid')) return 2;
  if (value.includes('understand the basics')) return 3;
  if (value.includes('understand token-based pricing')) return 4;
  if (
    value.includes(
      'make informed decisions about which model/tool to use based on cost vs quality tradeoffs',
    )
  ) {
    return 5;
  }
  return null;
}

function costConsiderationScore(rawValue: string | undefined): number | null {
  const value = normalizeValue(rawValue);

  if (!value) return null;
  if (value.includes("don't think about cost at all")) return 1;
  if (value.includes("use whatever's available without comparing")) return 2;
  if (
    value.includes("aware of cost differences but it doesn't change my behavior")
  ) {
    return 3;
  }
  if (value.includes('sometimes choose a cheaper')) return 4;
  if (value.includes('actively optimize')) return 5;
  return null;
}

function costMaturityBucket(score: number | null): CostMaturityKey | null {
  if (score === null) return null;

  const rounded = Math.max(1, Math.min(5, Math.round(score)));
  if (rounded === 1) return 'unaware';
  if (rounded === 2) return 'basicAwareness';
  if (rounded === 3) return 'awareButPassive';
  if (rounded === 4) return 'selectiveOptimization';
  return 'activeOptimization';
}

function normalizePlanningImpactAnswer(rawValue: string | undefined): PlanningImpactKey | null {
  const value = normalizeValue(rawValue);

  if (!value) return null;
  if (value.includes('estimate and plan the same way as before')) return 'samePlanning';
  if (value.includes('factor ai in informally')) return 'informalFactor';
  if (value.includes('explicitly adjust estimates')) return 'explicitlyAdjust';
  if (value.includes('fundamentally changed how i scope and plan work')) {
    return 'planningChanged';
  }
  if (value.includes('inseparable from how i estimate')) return 'inseparable';
  return null;
}

function normalizeBlockerLabel(
  surveyType: SurveyType,
  rawValue: string | undefined,
): string | null {
  const value = normalizeValue(rawValue);

  if (!value) return null;
  if (value.includes('nothing') || value.includes('no blockers')) {
    return BLOCKER_LABEL_BY_KEY.nothingMostlySkills;
  }
  if (value.includes('no team agreement') || value.includes('align the team on our process')) {
    return BLOCKER_LABEL_BY_KEY.noTeamAgreement;
  }
  if (value.includes('no time to experiment')) {
    return BLOCKER_LABEL_BY_KEY.noTimeToExperiment;
  }
  if (
    value.includes('lack of access to the right ai tools') ||
    value.includes('cost, licensing, approval')
  ) {
    return BLOCKER_LABEL_BY_KEY.accessLicensingLimits;
  }
  if (
    value.includes('data sensitivity') ||
    value.includes('confidentiality concerns') ||
    value.includes('client restrictions')
  ) {
    return BLOCKER_LABEL_BY_KEY.dataSensitivityOrClient;
  }
  if (
    value.includes('unclear or undocumented processes') ||
    value.includes('unclear system boundaries') ||
    value.includes('hard to give ai the right context')
  ) {
    return BLOCKER_LABEL_BY_KEY.unclearProcessesOrSystem;
  }
  if (
    value.includes('missing or outdated documentation') ||
    value.includes('no templates') ||
    value.includes('reference materials')
  ) {
    return BLOCKER_LABEL_BY_KEY.missingDocsOrReference;
  }
  if (
    value.includes('legacy code') ||
    value.includes('tech debt') ||
    value.includes('ci/cd') ||
    value.includes('dev environment') ||
    value.includes('integration between tools')
  ) {
    return BLOCKER_LABEL_BY_KEY.technicalEnvironment;
  }
  if (
    surveyType === 'business' &&
    value.includes('unclear what ai can actually help with in my role')
  ) {
    return BLOCKER_LABEL_BY_KEY.unclearRoleFit;
  }
  return BLOCKER_LABEL_BY_KEY.other;
}

function normalizeKnowledgeSharingAnswer(
  rawValue: string | undefined,
): KnowledgeSharingKey | null {
  const value = normalizeValue(rawValue);

  if (!value) return null;
  if (value.includes('never')) return 'never';
  if (value.includes('rarely')) return 'rarely';
  if (value.includes('occasionally')) return 'occasionally';
  if (value.includes('actively share') || value.includes('regularly')) {
    return 'regularlyShare';
  }
  if (value.includes('go-to')) return 'goToResource';
  return null;
}

function cultureInfluenceQ4_4Score(rawValue: string | undefined): number | null {
  const value = normalizeValue(rawValue);

  if (!value) return null;
  if (value.includes('other teams') || value.includes('other projects')) return 5;
  if (value.includes('became part of how my team works') || value.includes('team practice')) {
    return 4;
  }
  if (value.includes('at least one person adopted')) return 3;
  if (value.includes("suggested something, but it didn't really stick")) return 2;
  if (value === 'no') return 1;
  return null;
}

function cultureInfluenceQ4_5Score(rawValue: string | undefined): number | null {
  const value = normalizeValue(rawValue);

  if (!value) return null;
  if (value.includes('other teams') || value.includes('other projects')) return 5;
  if (value.includes('multiple people on my team')) return 4;
  if (value.includes('at least one person changed')) return 3;
  if (value.includes("i've given advice") || value.includes("i've given examples")) {
    return 2;
  }
  if (
    value.includes("haven't directly helped") ||
    value.includes("can't think of anyone")
  ) {
    return 1;
  }
  return null;
}

function influenceScoreBucket(score: number): InfluenceScoreKey {
  const rounded = Math.max(1, Math.min(5, Math.round(score)));

  switch (rounded) {
    case 1:
      return 'noInfluenceYet';
    case 2:
      return 'adviceWithoutAdoption';
    case 3:
      return 'oneAdoptionExample';
    case 4:
      return 'teamLevelInfluence';
    default:
      return 'crossTeamInfluence';
  }
}

function normalizeTeamAiMaturityAnswer(rawValue: string | undefined): TeamAiMaturityKey | null {
  const value = normalizeValue(rawValue);

  if (!value) return null;
  if (value.includes('very low')) return 'veryLow';
  if (value.includes('below average')) return 'belowAverage';
  if (value === 'average') return 'average';
  if (value.includes('above average')) return 'aboveAverage';
  if (value.includes('very high')) return 'veryHigh';
  return null;
}

function normalizeOrganizationalSupportAnswer(
  rawValue: string | undefined,
): OrganizationalSupportKey | null {
  const value = normalizeValue(rawValue);

  if (!value) return null;
  if (value.includes('not at all')) return 'notSupportedAtAll';
  if (value.includes('minimally')) return 'minimallySupported';
  if (value.includes('somewhat')) return 'somewhatSupported';
  if (value.includes('well supported')) return 'wellSupported';
  if (value.includes('very well supported')) return 'veryWellSupported';
  return null;
}

function normalizeToolSatisfactionAnswer(
  rawValue: string | undefined,
): ToolSatisfactionKey | null {
  const value = normalizeValue(rawValue);

  if (!value) return null;
  if (value.includes('very dissatisfied')) return 'veryDissatisfied';
  if (value === 'dissatisfied') return 'dissatisfied';
  if (value === 'neutral') return 'neutral';
  if (value === 'satisfied') return 'satisfied';
  if (value.includes('very satisfied')) return 'verySatisfied';
  return null;
}

function normalizeEnjoyabilityAnswer(rawValue: string | undefined): EnjoyabilityKey | null {
  const value = normalizeValue(rawValue);

  if (!value) return null;
  if (value.includes('much less enjoyable')) return 'muchLessEnjoyable';
  if (value.includes('slightly less enjoyable')) return 'slightlyLessEnjoyable';
  if (value.includes('no change')) return 'noChange';
  if (value === 'more enjoyable') return 'moreEnjoyable';
  if (value.includes('much more enjoyable')) return 'muchMoreEnjoyable';
  return null;
}

function supportDemandAnswerKey(rawAnswer: string): string | null {
  const answer = normalizeValue(rawAnswer);

  if (!answer || answer.includes("don't need any support right now")) {
    return null;
  }
  if (
    answer.includes('advanced session') ||
    answer.includes('agents') ||
    answer.includes('automation') ||
    answer.includes('mcp')
  ) {
    return 'advanced';
  }
  if (answer.includes('overview of available ai tools')) return 'overview';
  if (answer.includes('prompt engineering')) return 'prompting';
  if (answer.includes('setting up ai tools')) return 'setup';
  if (answer.includes('peer learning')) return 'peer';
  return null;
}

function normalizeWorkChangeImaginationAnswer(
  rawValue: string | undefined,
): WorkChangeImaginationKey | null {
  const value = normalizeValue(rawValue);

  if (!value) return null;
  if (value.includes('still exploring this')) return 'stillExploring';
  if (value.includes('speed up small tasks')) return 'speedUpSmallTasks';
  if (value.includes('improve some parts of my daily workflow')) {
    return 'improvePartsOfWorkflow';
  }
  if (value.includes('at least one workflow that could work differently')) {
    return 'workflowCouldDiffer';
  }
  if (value.includes('future ai-assisted working model')) {
    return 'futureAiAssistedModel';
  }
  return null;
}

function normalizeBusinessValueConnectionAnswer(
  rawValue: string | undefined,
): BusinessValueConnectionKey | null {
  const value = normalizeValue(rawValue);

  if (!value) return null;
  if (value.includes('still learning how ai connects to broader value')) {
    return 'stillLearningBroaderValue';
  }
  if (value.includes('personal productivity help')) return 'personalProductivity';
  if (value.includes('improve internal efficiency')) return 'internalEfficiency';
  if (
    value.includes('improve delivery speed, quality, communication, or decision-making')
  ) {
    return 'deliveryQualityCommunication';
  }
  if (
    value.includes(
      'change delivery models, staffing, pricing, client experience, or competitive advantage',
    )
  ) {
    return 'businessModelClientAdvantage';
  }
  return null;
}

export function buildScopedDependencyImpactDistribution(
  responses: RawResponse[],
  cohortLabel: string,
): TeamStackedDistributionRow[] {
  return buildSingleScopeStackedDistribution(
    responses,
    cohortLabel,
    DEPENDENCY_IMPACT_SERIES,
    (response) => normalizeDependencyImpactAnswer(response.q3_8),
  );
}

export function buildScopedCostMaturityDistribution(
  responses: RawResponse[],
  cohortLabel: string,
): TeamStackedDistributionRow[] {
  return buildSingleScopeStackedDistribution(
    responses,
    cohortLabel,
    COST_MATURITY_SERIES,
    (response) => {
      const pricingScore = pricingUnderstandingScore(
        response.surveyType === 'business' ? response.q3_9 : response.q3_6,
      );
      const considerationScore = costConsiderationScore(
        response.surveyType === 'business' ? response.q3_12 : response.q3_10,
      );

      if (pricingScore === null || considerationScore === null) {
        return null;
      }

      return costMaturityBucket((pricingScore + considerationScore) / 2);
    },
  );
}

export function buildScopedDeliveryPlanningImpactDistribution(
  responses: RawResponse[],
  cohortLabel: string,
): TeamStackedDistributionRow[] {
  const deliveryResponses = responses.filter(
    (response) => response.surveyType === 'delivery-engineering',
  );

  return buildSingleScopeStackedDistribution(
    deliveryResponses,
    cohortLabel,
    PLANNING_IMPACT_SERIES,
    (response) => normalizePlanningImpactAnswer(response.q3_2),
  );
}

export function buildScopedNonAiBlockerRows(
  responses: RawResponse[],
): TeamBarDistributionRow[] {
  return buildSingleScopeBarRows(
    responses,
    Object.values(BLOCKER_LABEL_BY_KEY),
    (response) => {
      if (!response.surveyType) {
        return [];
      }

      const label = normalizeBlockerLabel(
        response.surveyType,
        response.surveyType === 'business' ? response.q3_blocker : response.q3_12,
      );

      return label ? [label] : [];
    },
  );
}

export function buildScopedKnowledgeSharingDistribution(
  responses: RawResponse[],
  cohortLabel: string,
): TeamStackedDistributionRow[] {
  return buildSingleScopeStackedDistribution(
    responses,
    cohortLabel,
    KNOWLEDGE_SHARING_SERIES,
    (response) => normalizeKnowledgeSharingAnswer(response.q4_3),
  );
}

export function buildScopedInfluenceScoreDistribution(
  responses: RawResponse[],
  cohortLabel: string,
): TeamStackedDistributionRow[] {
  return buildSingleScopeStackedDistribution(
    responses,
    cohortLabel,
    INFLUENCE_SCORE_SERIES,
    (response) => {
      const scores = [
        cultureInfluenceQ4_4Score(response.q4_4),
        cultureInfluenceQ4_5Score(response.q4_5),
      ].filter(isNumber);

      if (scores.length === 0) {
        return null;
      }

      return influenceScoreBucket(average(scores));
    },
  );
}

export function buildScopedTeamAiMaturityDistribution(
  responses: RawResponse[],
  cohortLabel: string,
): TeamStackedDistributionRow[] {
  return buildSingleScopeStackedDistribution(
    responses,
    cohortLabel,
    TEAM_AI_MATURITY_SERIES,
    (response) =>
      normalizeTeamAiMaturityAnswer(
        response.surveyType === 'business' ? response.q4_6 : response.q4_8,
      ),
  );
}

export function buildScopedOrganizationalSupportDistribution(
  responses: RawResponse[],
  cohortLabel: string,
): TeamStackedDistributionRow[] {
  return buildSingleScopeStackedDistribution(
    responses,
    cohortLabel,
    ORGANIZATIONAL_SUPPORT_SERIES,
    (response) =>
      normalizeOrganizationalSupportAnswer(
        response.surveyType === 'business' ? response.q4_9 : response.q4_11,
      ),
  );
}

export function buildScopedToolSatisfactionDistribution(
  responses: RawResponse[],
  cohortLabel: string,
): TeamStackedDistributionRow[] {
  return buildSingleScopeStackedDistribution(
    responses,
    cohortLabel,
    TOOL_SATISFACTION_SERIES,
    (response) =>
      normalizeToolSatisfactionAnswer(
        response.surveyType === 'business' ? response.q4_7 : response.q4_9,
      ),
  );
}

export function buildScopedEnjoyabilityDistribution(
  responses: RawResponse[],
  cohortLabel: string,
): TeamStackedDistributionRow[] {
  return buildSingleScopeStackedDistribution(
    responses,
    cohortLabel,
    ENJOYABILITY_SERIES,
    (response) =>
      normalizeEnjoyabilityAnswer(
        response.surveyType === 'business' ? response.q4_8 : response.q4_10,
      ),
  );
}

export function buildScopedSupportNeededRows(
  responses: RawResponse[],
): TeamBarDistributionRow[] {
  const labelByKey = {
    advanced: 'Advanced workflows',
    overview: 'Tool overview',
    prompting: 'Prompt engineering',
    setup: 'Task setup',
    peer: 'Peer learning',
  } as const;

  return buildSingleScopeBarRows(
    responses,
    CULTURE_SUPPORT_NEEDED_LABELS,
    (response) => {
      const answer =
        response.surveyType === 'business' ? response.q4_10 : response.q4_12;

      return Array.from(
        new Set(
          splitSurveyMultiValue(answer)
            .map((item) => supportDemandAnswerKey(item))
            .filter((key): key is keyof typeof labelByKey => Boolean(key))
            .map((key) => labelByKey[key]),
        ),
      );
    },
  );
}

export function buildScopedWorkChangeImaginationDistribution(
  responses: RawResponse[],
  cohortLabel: string,
): TeamStackedDistributionRow[] {
  return buildSingleScopeStackedDistribution(
    responses,
    cohortLabel,
    WORK_CHANGE_IMAGINATION_SERIES,
    (response) => normalizeWorkChangeImaginationAnswer(response.q5_3),
  );
}

export function buildScopedBusinessValueConnectionDistribution(
  responses: RawResponse[],
  cohortLabel: string,
): TeamStackedDistributionRow[] {
  return buildSingleScopeStackedDistribution(
    responses,
    cohortLabel,
    BUSINESS_VALUE_CONNECTION_SERIES,
    (response) => normalizeBusinessValueConnectionAnswer(response.q5_5),
  );
}
