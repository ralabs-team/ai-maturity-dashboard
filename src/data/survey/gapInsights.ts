import type { Individual } from '../types';
import { LEVEL_LABELS, scoreToLevel } from '../types';
import { allProjectsList, type RawResponse } from './scoring';
import type { SurveyType } from './scoring/shared';

export type GapScope = 'department' | 'team';
export type UsageImpactQuadrantKey = 'highHigh' | 'highLow' | 'lowHigh' | 'lowLow';

export type UsageImpactPoint = {
  name: string;
  usage: number;
  impact: number;
  respondents: number;
  level: string;
  color: string;
};

export type UsageImpactSummaryItem = {
  key: UsageImpactQuadrantKey;
  title: string;
  note: string;
  count: number;
  share: number;
};

export type SupportDemandSkillsGapRow = {
  name: string;
  respondents: number;
  baselineSkills: number;
  supportDemand: number;
  color: string;
};

export type ToolAccessConstraintRow = {
  name: string;
  respondents: number;
  access: number;
  costMaturity: number;
  companyFundedShare: number;
  color: string;
};

export type WorkflowTransformationGapRow = {
  name: string;
  respondents: number;
  hoursSaved: number;
  transformation: number;
  color: string;
};

export type CultureSpreadGapRow = {
  name: string;
  respondents: number;
  socialSpread: number;
  artifacts: number;
  color: string;
};

export type RiskGovernanceHotspotRow = {
  name: string;
  respondents: number;
  safetyScore: number;
  governanceBlockerShare: number;
  color: string;
};

export type TeamGapMemberBase = {
  name: string;
  role: string;
  overall: number;
  level: string;
  color: string;
  size: number;
};

export type TeamUsageImpactPoint = TeamGapMemberBase & {
  usage: number;
  impact: number;
};

export type TeamSupportDemandPoint = TeamGapMemberBase & {
  baselineSkills: number;
  supportDemand: number;
  supportSignals: number;
};

export type TeamToolAccessPoint = TeamGapMemberBase & {
  access: number;
  costMaturity: number;
  fundedAccess: boolean;
};

export type TeamWorkflowTransformationPoint = TeamGapMemberBase & {
  hoursSaved: number;
  transformation: number;
};

export type TeamRiskGovernancePoint = TeamGapMemberBase & {
  safetyScore: number;
  governancePressure: number;
  blockerLabel: string | null;
};

const ORG_QUADRANT_COLORS = {
  highHigh: '#0f766e',
  highLow: '#2563eb',
  lowHigh: '#7c3aed',
  lowLow: '#94a3b8',
} as const;

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

function groupIndividualsByGapScope(
  members: Individual[],
  scope: GapScope,
): Array<[string, Individual[]]> {
  const grouped = new Map<string, Individual[]>();

  for (const member of members) {
    const scopeNames =
      scope === 'department'
        ? [member.department.trim()]
        : Array.from(
            new Set(
              member.allProjects
                .map((project) => project.trim())
                .filter((project) => project && project.toLowerCase() !== 'n/a'),
            ),
          );

    for (const scopeName of scopeNames) {
      if (!scopeName) continue;
      const existing = grouped.get(scopeName) ?? [];
      existing.push(member);
      grouped.set(scopeName, existing);
    }
  }

  return Array.from(grouped.entries()).sort(([left], [right]) => left.localeCompare(right));
}

function groupResponsesByGapScope(
  responses: RawResponse[],
  scope: GapScope,
): Array<[string, RawResponse[]]> {
  const grouped = new Map<string, RawResponse[]>();

  for (const response of responses) {
    const scopeNames =
      scope === 'department'
        ? [response.department.trim()]
        : Array.from(
            new Set(
              allProjectsList(response.projects)
                .map((project) => project.trim())
                .filter(Boolean),
            ),
          );

    for (const scopeName of scopeNames) {
      if (!scopeName) continue;
      const existing = grouped.get(scopeName) ?? [];
      existing.push(response);
      grouped.set(scopeName, existing);
    }
  }

  return Array.from(grouped.entries()).sort(([left], [right]) => left.localeCompare(right));
}

export function usageImpactQuadrantColor(usage: number, impact: number): string {
  const highUsage = usage >= 3;
  const highImpact = impact >= 3;

  if (highUsage && highImpact) return ORG_QUADRANT_COLORS.highHigh;
  if (highUsage) return ORG_QUADRANT_COLORS.highLow;
  if (highImpact) return ORG_QUADRANT_COLORS.lowHigh;
  return ORG_QUADRANT_COLORS.lowLow;
}

export function usageImpactQuadrantKey(
  usage: number,
  impact: number,
): UsageImpactQuadrantKey {
  const highUsage = usage >= 3;
  const highImpact = impact >= 3;

  if (highUsage && highImpact) return 'highHigh';
  if (highUsage) return 'highLow';
  if (highImpact) return 'lowHigh';
  return 'lowLow';
}

function normalizeSkillsBaselineAnswer(
  surveyType: SurveyType,
  rawValue: string | undefined,
): 'unfamiliar' | 'foundational' | 'working' | 'advanced' | 'expert' | null {
  const value = normalizeValue(rawValue);

  if (!value) return null;

  if (surveyType === 'business') {
    if (value.includes('no idea') || value.includes("heard of them but never used them")) {
      return 'unfamiliar';
    }
    if (value.includes('know the basics')) return 'foundational';
    if (value.includes('strengths and limitations well')) return 'working';
    if (value.includes('explain to a colleague when to use ai and when not to')) return 'advanced';
    return null;
  }

  if (value.includes("haven't explored this yet")) return 'unfamiliar';
  if (value.includes("they're neural networks but not the details")) return 'foundational';
  if (value.includes('understand the high-level architecture')) return 'working';
  if (value.includes('explain how inference works')) return 'advanced';
  if (value.includes('teach someone else') || value.includes('make technical decisions')) {
    return 'expert';
  }

  return null;
}

function skillsBaselineScore(
  surveyType: SurveyType,
  rawValue: string | undefined,
): number | null {
  const key = normalizeSkillsBaselineAnswer(surveyType, rawValue);
  if (!key) return null;

  switch (key) {
    case 'unfamiliar':
      return 1;
    case 'foundational':
      return 2;
    case 'working':
      return 3;
    case 'advanced':
      return 4;
    case 'expert':
      return 5;
  }
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

function normalizeHandsOnHelpLabel(rawValue: string | undefined): string | null {
  const value = normalizeValue(rawValue);

  if (!value) return null;
  if (value.startsWith('no hands-on help needed')) return 'No hands-on help needed';
  if (value.includes('yes, a workshop with my team')) return 'Workshop';
  if (value.includes('yes, 1:1 pairing')) return '1:1 pairing';
  if (value.includes('yes, recorded examples')) return 'Recorded examples';
  return null;
}

function hasAnySupportDemand(response: RawResponse): boolean {
  const supportAnswer = response.surveyType === 'business' ? response.q4_10 : response.q4_12;
  const trainingAnswer = response.surveyType === 'business' ? response.q4_11 : response.q4_13;
  const supportRequested = splitSurveyMultiValue(supportAnswer).some(
    (answer) => supportDemandAnswerKey(answer) !== null,
  );
  const handsOnLabel = normalizeHandsOnHelpLabel(trainingAnswer);

  return supportRequested || (handsOnLabel !== null && handsOnLabel !== 'No hands-on help needed');
}

function normalizeWorkflowTransformationAnswer(
  surveyType: SurveyType,
  rawValue: string | undefined,
): 'sameTasksFaster' | 'tweakedTasks' | 'oneWorkflowChanged' | 'redesignedProcess' | 'newAiEnabledProcess' | null {
  const value = normalizeValue(rawValue);

  if (!value) return null;
  if (value.includes('same tasks faster')) return 'sameTasksFaster';
  if (value.includes("tweaked how i do a few tasks")) return 'tweakedTasks';
  if (value.includes('meaningfully changed how one workflow operates')) return 'oneWorkflowChanged';
  if (value.includes('redesigned or eliminated a process entirely')) return 'redesignedProcess';
  if (value.includes('introduced a new process') || value.includes('introduced a new process or capability')) {
    return 'newAiEnabledProcess';
  }
  if (surveyType === 'business' && value.includes('only possible because of ai')) {
    return 'newAiEnabledProcess';
  }
  return null;
}

function workflowTransformationScore(
  surveyType: SurveyType,
  rawValue: string | undefined,
): number | null {
  const key = normalizeWorkflowTransformationAnswer(surveyType, rawValue);
  if (!key) return null;

  switch (key) {
    case 'sameTasksFaster':
      return 1;
    case 'tweakedTasks':
      return 2;
    case 'oneWorkflowChanged':
      return 3;
    case 'redesignedProcess':
      return 4;
    case 'newAiEnabledProcess':
      return 5;
  }
}

function normalizeHoursSavedLabel(rawValue: string | undefined): string | null {
  const normalized = rawValue?.trim().replace(/\s+/g, ' ');
  if (!normalized) return null;
  return normalized;
}

function hoursSavedEstimate(rawValue: string | undefined): number | null {
  const label = normalizeHoursSavedLabel(rawValue);

  if (!label) return null;
  if (label === '0 hours') return 0;
  if (label === 'Less than 1 hour') return 0.5;
  if (label === '1–3 hours') return 2;
  if (label === '3-5 hours' || label === '3–5 hours') return 4;
  if (label === 'More than 5 hours') return 6;
  return null;
}

function normalizeAccessLicensingAnswer(rawValue: string | undefined): string | null {
  const value = normalizeValue(rawValue);

  if (!value) return null;
  if (value.includes('have everything i need')) return 'haveEverything';
  if (value.includes('paid tier of a tool i currently use for free')) return 'needPaidTier';
  if (value.includes("there's a specific tool i'd like but don't have access to")) return 'wantSpecificTool';
  if (value.includes("don't know what's available") || value.includes('could request')) return 'dontKnowAvailable';
  if (value.includes("haven't thought about it")) return 'haventThought';
  return null;
}

function accessLicensingScore(rawValue: string | undefined): number | null {
  const key = normalizeAccessLicensingAnswer(rawValue);
  if (!key) return null;

  switch (key) {
    case 'haventThought':
      return 1;
    case 'dontKnowAvailable':
      return 2;
    case 'wantSpecificTool':
      return 3;
    case 'needPaidTier':
      return 4;
    case 'haveEverything':
      return 5;
  }

  return null;
}

function pricingUnderstandingScore(rawValue: string | undefined): number | null {
  const value = normalizeValue(rawValue);

  if (!value) return null;
  if (value.includes('no idea how pricing works')) return 1;
  if (value.includes('some tools are free and some are paid')) return 2;
  if (value.includes('understand the basics')) return 3;
  if (value.includes('understand token-based pricing')) return 4;
  if (value.includes('make informed decisions about which model/tool to use based on cost vs quality tradeoffs')) {
    return 5;
  }
  return null;
}

function costConsiderationScore(rawValue: string | undefined): number | null {
  const value = normalizeValue(rawValue);

  if (!value) return null;
  if (value.includes("don't think about cost at all")) return 1;
  if (value.includes("use whatever's available without comparing")) return 2;
  if (value.includes("aware of cost differences but it doesn't change my behavior")) return 3;
  if (value.includes('sometimes choose a cheaper')) return 4;
  if (value.includes('actively optimize')) return 5;
  return null;
}

function normalizeWhoPaysLabel(rawValue: string | undefined): string | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ');

  if (!value) return null;
  if (value === 'I only use free tiers') return 'Only free tiers';
  if (value === 'I pay out of my own pocket') return 'Out of pocket';
  if (value === 'The company provides a subscription') return 'Company subscription';
  if (value === 'The client provides or pays for AI tools') return 'Client pays';
  if (value === 'The company provides it, and I also pay for additional tools myself') {
    return 'Company + self-paid extras';
  }
  if (value === "I'm not sure") return 'Not sure';
  return null;
}

function companyOrClientFunded(rawValue: string | undefined): boolean {
  const label = normalizeWhoPaysLabel(rawValue);
  return (
    label === 'Company subscription' ||
    label === 'Client pays' ||
    label === 'Company + self-paid extras'
  );
}

function normalizeKnowledgeSharingAnswer(rawValue: string | undefined): string | null {
  const value = normalizeValue(rawValue);

  if (!value) return null;
  if (value.includes('never')) return 'never';
  if (value.includes('rarely')) return 'rarely';
  if (value.includes('occasionally')) return 'occasionally';
  if (value.includes('actively share') || value.includes('regularly')) return 'regularlyShare';
  if (value.includes('go-to')) return 'goToResource';
  return null;
}

function knowledgeSharingScore(rawValue: string | undefined): number | null {
  const key = normalizeKnowledgeSharingAnswer(rawValue);
  if (!key) return null;

  switch (key) {
    case 'never':
      return 1;
    case 'rarely':
      return 2;
    case 'occasionally':
      return 3;
    case 'regularlyShare':
      return 4;
    case 'goToResource':
      return 5;
  }

  return null;
}

function cultureInfluenceQ4_4Score(rawValue: string | undefined): number | null {
  const value = normalizeValue(rawValue);

  if (!value) return null;
  if (value.includes('other teams') || value.includes('other projects')) return 5;
  if (value.includes('became part of how my team works') || value.includes('team practice')) return 4;
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
  if (value.includes("i've given advice") || value.includes("i've given examples")) return 2;
  if (value.includes("haven't directly helped") || value.includes("can't think of anyone")) return 1;
  return null;
}

function normalizeKnowledgeArtifactAnswer(rawValue: string | undefined): string | null {
  const value = normalizeValue(rawValue);

  if (!value) return null;
  if (value === 'no') return 'noArtifact';
  if (value.includes('slack thread') || value.includes('informal notes')) return 'informalNotes';
  if (value.includes('short how-to') || value.includes('shared prompt collection')) {
    return 'shortReusableArtifact';
  }
  if (value.includes('substantial guide') || value.includes('training material')) {
    return 'substantialGuide';
  }
  if (value.includes('multiple artifacts') || value.includes('maintained set of artifacts')) {
    return 'multipleArtifacts';
  }
  return null;
}

function knowledgeArtifactScore(rawValue: string | undefined): number | null {
  const key = normalizeKnowledgeArtifactAnswer(rawValue);
  if (!key) return null;

  switch (key) {
    case 'noArtifact':
      return 1;
    case 'informalNotes':
      return 2;
    case 'shortReusableArtifact':
      return 3;
    case 'substantialGuide':
      return 4;
    case 'multipleArtifacts':
      return 5;
  }

  return null;
}

function normalizeSensitiveDataAnswer(rawValue: string | undefined): string | null {
  const value = normalizeValue(rawValue);

  if (!value) return null;
  if (value.includes("don't think about it") || value.includes('paste whatever i need')) return 'risky';
  if (value.includes("i'm cautious but not sure where the line is")) return 'uncertain';
  if (value.includes('know the basics')) return 'basic';
  if (value.includes('clear mental checklist')) return 'checklist';
  if (value.includes('follow documented guidelines') || value.includes('enterprise/soc2 compliance')) {
    return 'governed';
  }
  return null;
}

function sensitiveDataScore(rawValue: string | undefined): number | null {
  const key = normalizeSensitiveDataAnswer(rawValue);
  if (!key) return null;

  switch (key) {
    case 'risky':
      return 1;
    case 'uncertain':
      return 2;
    case 'basic':
      return 3;
    case 'checklist':
      return 4;
    case 'governed':
      return 5;
  }

  return null;
}

function normalizeBlockerLabel(
  surveyType: SurveyType,
  rawValue: string | undefined,
): string | null {
  const lower = normalizeValue(rawValue);

  if (!lower) return null;
  if (lower.includes('nothing') || lower.includes('no blockers')) {
    return BLOCKER_LABEL_BY_KEY.nothingMostlySkills;
  }
  if (lower.includes('no team agreement') || lower.includes('align the team on our process')) {
    return BLOCKER_LABEL_BY_KEY.noTeamAgreement;
  }
  if (lower.includes('no time to experiment')) {
    return BLOCKER_LABEL_BY_KEY.noTimeToExperiment;
  }
  if (lower.includes('lack of access to the right ai tools') || lower.includes('cost, licensing, approval')) {
    return BLOCKER_LABEL_BY_KEY.accessLicensingLimits;
  }
  if (lower.includes('data sensitivity') || lower.includes('confidentiality concerns') || lower.includes('client restrictions')) {
    return BLOCKER_LABEL_BY_KEY.dataSensitivityOrClient;
  }
  if (lower.includes('unclear or undocumented processes') || lower.includes('unclear system boundaries') || lower.includes('hard to give ai the right context')) {
    return BLOCKER_LABEL_BY_KEY.unclearProcessesOrSystem;
  }
  if (lower.includes('missing or outdated documentation') || lower.includes('no templates') || lower.includes('reference materials')) {
    return BLOCKER_LABEL_BY_KEY.missingDocsOrReference;
  }
  if (lower.includes('legacy code') || lower.includes('tech debt') || lower.includes('ci/cd') || lower.includes('dev environment') || lower.includes('integration between tools')) {
    return BLOCKER_LABEL_BY_KEY.technicalEnvironment;
  }
  if (surveyType === 'business' && lower.includes('unclear what ai can actually help with in my role')) {
    return BLOCKER_LABEL_BY_KEY.unclearRoleFit;
  }
  return BLOCKER_LABEL_BY_KEY.other;
}

function blockerIsGovernanceHotspot(label: string | null): boolean {
  return (
    label === BLOCKER_LABEL_BY_KEY.noTeamAgreement ||
    label === BLOCKER_LABEL_BY_KEY.dataSensitivityOrClient ||
    label === BLOCKER_LABEL_BY_KEY.unclearProcessesOrSystem ||
    label === BLOCKER_LABEL_BY_KEY.missingDocsOrReference
  );
}

function riskGovernanceHotspotColor(
  safetyScore: number,
  governanceBlockerShare: number,
): string {
  if (safetyScore < 3 && governanceBlockerShare >= 35) return '#dc2626';
  if (safetyScore < 3.5 || governanceBlockerShare >= 25) return '#d97706';
  return '#0f766e';
}

function memberBubbleSize(overall: number): number {
  return Math.round(260 + overall * 110);
}

function zipScopedMembers(
  individuals: Individual[],
  responses: RawResponse[],
): Array<{ individual: Individual; response: RawResponse }> {
  const pairCount = Math.min(individuals.length, responses.length);

  return Array.from({ length: pairCount }, (_, index) => ({
    individual: individuals[index],
    response: responses[index],
  }));
}

function supportDemandSignalCount(response: RawResponse): number {
  const supportAnswer = response.surveyType === 'business' ? response.q4_10 : response.q4_12;
  const trainingAnswer = response.surveyType === 'business' ? response.q4_11 : response.q4_13;
  const supportSignals = new Set(
    splitSurveyMultiValue(supportAnswer)
      .map((answer) => supportDemandAnswerKey(answer))
      .filter((value): value is string => Boolean(value)),
  );
  const handsOnLabel = normalizeHandsOnHelpLabel(trainingAnswer);
  const handsOnSignal = handsOnLabel && handsOnLabel !== 'No hands-on help needed' ? 1 : 0;

  return supportSignals.size + handsOnSignal;
}

function supportDemandIntensity(response: RawResponse): number {
  return roundToOne((supportDemandSignalCount(response) / 6) * 100);
}

function governancePressureFromBlocker(
  surveyType: SurveyType,
  rawValue: string | undefined,
): number {
  const blockerLabel = normalizeBlockerLabel(surveyType, rawValue);

  if (!blockerLabel || blockerLabel === BLOCKER_LABEL_BY_KEY.nothingMostlySkills) {
    return 0;
  }

  if (blockerIsGovernanceHotspot(blockerLabel)) {
    return 100;
  }

  return 45;
}

export function buildUsageImpactQuadrant(
  members: Individual[],
  scope: GapScope,
): UsageImpactPoint[] {
  return groupIndividualsByGapScope(members, scope)
    .map(([scopeName, scopedMembers]) => {
      const overall = average(scopedMembers.map((member) => member.overallScore));
      const usage = roundToOne(average(scopedMembers.map((member) => member.scores.Usage)));
      const impact = roundToOne(average(scopedMembers.map((member) => member.scores.Impact)));

      return {
        name: scopeName,
        usage,
        impact,
        respondents: scopedMembers.length,
        level: LEVEL_LABELS[scoreToLevel(overall)],
        color: usageImpactQuadrantColor(usage, impact),
      };
    });
}

export function buildUsageImpactQuadrantSummary(
  data: UsageImpactPoint[],
): UsageImpactSummaryItem[] {
  const totals = {
    highHigh: 0,
    highLow: 0,
    lowHigh: 0,
    lowLow: 0,
  } satisfies Record<UsageImpactQuadrantKey, number>;

  for (const point of data) {
    totals[usageImpactQuadrantKey(point.usage, point.impact)] += 1;
  }

  const totalCohorts = data.length || 1;

  const summarySeed: Array<{
    key: UsageImpactQuadrantKey;
    title: string;
    note: string;
  }> = [
    {
      key: 'highHigh',
      title: 'High usage + high impact',
      note: 'Role models and case-study candidates.',
    },
    {
      key: 'highLow',
      title: 'High usage + low impact',
      note: 'Adoption is real, but workflow depth is still shallow.',
    },
    {
      key: 'lowHigh',
      title: 'Low usage + high impact',
      note: 'Strong champions exist, but bus-factor risk is growing.',
    },
    {
      key: 'lowLow',
      title: 'Low usage + low impact',
      note: 'Clear enablement and training need.',
    },
  ];

  return summarySeed.map((item) => ({
    ...item,
    count: totals[item.key],
    share: Math.round((totals[item.key] / totalCohorts) * 100),
  }));
}

export function buildSupportDemandSkillsGapRows(
  responses: RawResponse[],
  scope: GapScope,
): SupportDemandSkillsGapRow[] {
  return groupResponsesByGapScope(responses, scope)
    .map(([name, scopedResponses]) => {
      const baselineScores = scopedResponses
        .map((response) =>
          skillsBaselineScore(response.surveyType ?? 'delivery-engineering', response.q2_1),
        )
        .filter(isNumber);

      if (baselineScores.length === 0) return null;

      const supportDemand =
        (scopedResponses.filter((response) => hasAnySupportDemand(response)).length /
          scopedResponses.length) *
        100;

      return {
        name,
        respondents: scopedResponses.length,
        baselineSkills: roundToOne(average(baselineScores)),
        supportDemand: roundToOne(supportDemand),
        color:
          supportDemand >= 50 && average(baselineScores) < 3
            ? '#dc2626'
            : supportDemand >= 50
              ? '#f59e0b'
              : average(baselineScores) < 3
                ? '#2563eb'
                : '#0f766e',
      };
    })
    .filter((row): row is SupportDemandSkillsGapRow => Boolean(row))
    .sort(
      (left, right) =>
        right.supportDemand - left.supportDemand ||
        left.baselineSkills - right.baselineSkills,
    );
}

export function buildToolAccessConstraintRows(
  responses: RawResponse[],
  scope: GapScope,
): ToolAccessConstraintRow[] {
  return groupResponsesByGapScope(responses, scope)
    .map(([name, scopedResponses]) => {
      const accessScores = scopedResponses
        .map((response) =>
          accessLicensingScore(
            response.surveyType === 'business' ? response.q3_10 : response.q3_7,
          ),
        )
        .filter(isNumber);
      const costScores = scopedResponses
        .map((response) => {
          const pricingScore = pricingUnderstandingScore(
            response.surveyType === 'business' ? response.q3_9 : response.q3_6,
          );
          const considerationScore = costConsiderationScore(
            response.surveyType === 'business' ? response.q3_12 : response.q3_10,
          );
          const scores = [pricingScore, considerationScore].filter(isNumber);
          return scores.length > 0 ? average(scores) : null;
        })
        .filter(isNumber);

      if (accessScores.length === 0 || costScores.length === 0) return null;

      const fundedShare = roundToOne(
        (scopedResponses.filter((response) =>
          companyOrClientFunded(
            response.surveyType === 'business' ? response.q3_11 : response.q3_9,
          ),
        ).length /
          scopedResponses.length) *
          100,
      );

      const access = roundToOne(average(accessScores));
      const costMaturity = roundToOne(average(costScores));

      return {
        name,
        respondents: scopedResponses.length,
        access,
        costMaturity,
        companyFundedShare: fundedShare,
        color: usageImpactQuadrantColor(access, costMaturity),
      };
    })
    .filter((row): row is ToolAccessConstraintRow => Boolean(row))
    .sort(
      (left, right) =>
        left.access + left.costMaturity - (right.access + right.costMaturity) ||
        left.name.localeCompare(right.name),
    );
}

export function buildWorkflowTransformationGapRows(
  responses: RawResponse[],
  scope: GapScope,
): WorkflowTransformationGapRow[] {
  return groupResponsesByGapScope(responses, scope)
    .map(([name, scopedResponses]) => {
      const hoursScores = scopedResponses
        .map((response) =>
          hoursSavedEstimate(
            response.surveyType === 'business' ? response.q3_7 : response.q3_4,
          ),
        )
        .filter(isNumber);
      const transformationScores = scopedResponses
        .map((response) =>
          workflowTransformationScore(
            response.surveyType ?? 'delivery-engineering',
            response.surveyType === 'business' ? response.q3_5 : response.q3_3,
          ),
        )
        .filter(isNumber);

      if (hoursScores.length === 0 || transformationScores.length === 0) return null;

      const hoursSaved = roundToOne(average(hoursScores));
      const transformation = roundToOne(average(transformationScores));

      return {
        name,
        respondents: scopedResponses.length,
        hoursSaved,
        transformation,
        color:
          hoursSaved >= 3 && transformation < 3
            ? '#f59e0b'
            : hoursSaved >= 3 && transformation >= 3
              ? '#0f766e'
              : transformation >= 3
                ? '#2563eb'
                : '#94a3b8',
      };
    })
    .filter((row): row is WorkflowTransformationGapRow => Boolean(row));
}

export function buildCultureSpreadGapRows(
  responses: RawResponse[],
  scope: GapScope,
): CultureSpreadGapRow[] {
  return groupResponsesByGapScope(responses, scope)
    .map(([name, scopedResponses]) => {
      const socialSpreadScores = scopedResponses
        .map((response) => {
          const influenceScores = [
            cultureInfluenceQ4_4Score(response.q4_4),
            cultureInfluenceQ4_5Score(response.q4_5),
          ].filter(isNumber);
          const parts = [
            knowledgeSharingScore(response.q4_3),
            influenceScores.length > 0 ? average(influenceScores) : null,
          ].filter(isNumber);

          return parts.length > 0 ? average(parts) : null;
        })
        .filter(isNumber);
      const artifactScores = scopedResponses
        .map((response) =>
          knowledgeArtifactScore(
            response.surveyType === 'business' ? response.q4_13 : response.q4_6,
          ),
        )
        .filter(isNumber);

      if (socialSpreadScores.length === 0 || artifactScores.length === 0) return null;

      const socialSpread = roundToOne(average(socialSpreadScores));
      const artifacts = roundToOne(average(artifactScores));

      return {
        name,
        respondents: scopedResponses.length,
        socialSpread,
        artifacts,
        color:
          socialSpread >= 3 && artifacts < 3
            ? '#dc2626'
            : socialSpread >= 3 && artifacts >= 3
              ? '#0f766e'
              : socialSpread < 3 && artifacts >= 3
                ? '#2563eb'
                : '#94a3b8',
      };
    })
    .filter((row): row is CultureSpreadGapRow => Boolean(row));
}

export function buildRiskGovernanceHotspotRows(
  responses: RawResponse[],
  scope: GapScope,
): RiskGovernanceHotspotRow[] {
  return groupResponsesByGapScope(responses, scope)
    .map(([name, scopedResponses]) => {
      const safetyScores = scopedResponses
        .map((response) =>
          sensitiveDataScore(
            response.surveyType === 'business' ? response.q2_3 : response.q2_4,
          ),
        )
        .filter(isNumber);

      if (safetyScores.length === 0) return null;

      const governanceBlockerCount = scopedResponses.filter((response) =>
        blockerIsGovernanceHotspot(
          normalizeBlockerLabel(
            response.surveyType ?? 'delivery-engineering',
            response.surveyType === 'business' ? response.q3_blocker : response.q3_12,
          ),
        ),
      ).length;

      const safetyScore = roundToOne(average(safetyScores));
      const governanceBlockerShare = roundToOne(
        (governanceBlockerCount / Math.max(scopedResponses.length, 1)) * 100,
      );

      return {
        name,
        respondents: scopedResponses.length,
        safetyScore,
        governanceBlockerShare,
        color: riskGovernanceHotspotColor(safetyScore, governanceBlockerShare),
      };
    })
    .filter((row): row is RiskGovernanceHotspotRow => Boolean(row))
    .sort(
      (left, right) =>
        left.safetyScore - right.safetyScore ||
        right.governanceBlockerShare - left.governanceBlockerShare ||
        left.name.localeCompare(right.name),
    );
}

export function buildScopedUsageImpactPoints(
  individuals: Individual[],
  responses: RawResponse[],
): TeamUsageImpactPoint[] {
  return zipScopedMembers(individuals, responses)
    .map(({ individual }) => ({
      name: individual.name,
      role: individual.role,
      overall: roundToOne(individual.overallScore),
      level: LEVEL_LABELS[scoreToLevel(individual.overallScore)],
      usage: roundToOne(individual.scores.Usage),
      impact: roundToOne(individual.scores.Impact),
      color: usageImpactQuadrantColor(individual.scores.Usage, individual.scores.Impact),
      size: memberBubbleSize(individual.overallScore),
    }))
    .sort((left, right) => right.overall - left.overall || left.name.localeCompare(right.name));
}

export function buildScopedTeamSupportDemandPoints(
  individuals: Individual[],
  responses: RawResponse[],
): TeamSupportDemandPoint[] {
  return zipScopedMembers(individuals, responses)
    .map(({ individual, response }) => {
      const baselineSkills = skillsBaselineScore(
        response.surveyType ?? 'delivery-engineering',
        response.q2_1,
      );

      if (baselineSkills === null) {
        return null;
      }

      const supportDemand = supportDemandIntensity(response);

      return {
        name: individual.name,
        role: individual.role,
        overall: roundToOne(individual.overallScore),
        level: LEVEL_LABELS[scoreToLevel(individual.overallScore)],
        baselineSkills,
        supportDemand,
        supportSignals: supportDemandSignalCount(response),
        color:
          supportDemand >= 50 && baselineSkills < 3
            ? '#dc2626'
            : supportDemand >= 50
              ? '#f59e0b'
              : baselineSkills < 3
                ? '#2563eb'
                : '#0f766e',
        size: memberBubbleSize(individual.overallScore),
      };
    })
    .filter((row): row is TeamSupportDemandPoint => Boolean(row))
    .sort(
      (left, right) =>
        right.supportDemand - left.supportDemand ||
        left.baselineSkills - right.baselineSkills ||
        left.name.localeCompare(right.name),
    );
}

export function buildScopedToolAccessPoints(
  individuals: Individual[],
  responses: RawResponse[],
): TeamToolAccessPoint[] {
  return zipScopedMembers(individuals, responses)
    .map(({ individual, response }) => {
      const access = accessLicensingScore(
        response.surveyType === 'business' ? response.q3_10 : response.q3_7,
      );
      const pricingScore = pricingUnderstandingScore(
        response.surveyType === 'business' ? response.q3_9 : response.q3_6,
      );
      const considerationScore = costConsiderationScore(
        response.surveyType === 'business' ? response.q3_12 : response.q3_10,
      );
      const costScores = [pricingScore, considerationScore].filter(isNumber);

      if (access === null || costScores.length === 0) {
        return null;
      }

      const costMaturity = roundToOne(average(costScores));

      return {
        name: individual.name,
        role: individual.role,
        overall: roundToOne(individual.overallScore),
        level: LEVEL_LABELS[scoreToLevel(individual.overallScore)],
        access,
        costMaturity,
        fundedAccess: companyOrClientFunded(
          response.surveyType === 'business' ? response.q3_11 : response.q3_9,
        ),
        color: usageImpactQuadrantColor(access, costMaturity),
        size: memberBubbleSize(individual.overallScore),
      };
    })
    .filter((row): row is TeamToolAccessPoint => Boolean(row))
    .sort(
      (left, right) =>
        left.access + left.costMaturity - (right.access + right.costMaturity) ||
        left.name.localeCompare(right.name),
    );
}

export function buildScopedWorkflowTransformationPoints(
  individuals: Individual[],
  responses: RawResponse[],
): TeamWorkflowTransformationPoint[] {
  return zipScopedMembers(individuals, responses)
    .map(({ individual, response }) => {
      const hoursSaved = hoursSavedEstimate(
        response.surveyType === 'business' ? response.q3_7 : response.q3_4,
      );
      const transformation = workflowTransformationScore(
        response.surveyType ?? 'delivery-engineering',
        response.surveyType === 'business' ? response.q3_5 : response.q3_3,
      );

      if (hoursSaved === null || transformation === null) {
        return null;
      }

      return {
        name: individual.name,
        role: individual.role,
        overall: roundToOne(individual.overallScore),
        level: LEVEL_LABELS[scoreToLevel(individual.overallScore)],
        hoursSaved: roundToOne(hoursSaved),
        transformation,
        color:
          hoursSaved >= 3 && transformation < 3
            ? '#f59e0b'
            : hoursSaved >= 3 && transformation >= 3
              ? '#0f766e'
              : transformation >= 3
                ? '#2563eb'
                : '#94a3b8',
        size: memberBubbleSize(individual.overallScore),
      };
    })
    .filter((row): row is TeamWorkflowTransformationPoint => Boolean(row))
    .sort(
      (left, right) =>
        right.transformation - left.transformation ||
        right.hoursSaved - left.hoursSaved ||
        left.name.localeCompare(right.name),
    );
}

export function buildScopedRiskGovernancePoints(
  individuals: Individual[],
  responses: RawResponse[],
): TeamRiskGovernancePoint[] {
  return zipScopedMembers(individuals, responses)
    .map(({ individual, response }) => {
      const safetyScore = sensitiveDataScore(
        response.surveyType === 'business' ? response.q2_3 : response.q2_4,
      );

      if (safetyScore === null) {
        return null;
      }

      const blockerLabel = normalizeBlockerLabel(
        response.surveyType ?? 'delivery-engineering',
        response.surveyType === 'business' ? response.q3_blocker : response.q3_12,
      );
      const governancePressure = governancePressureFromBlocker(
        response.surveyType ?? 'delivery-engineering',
        response.surveyType === 'business' ? response.q3_blocker : response.q3_12,
      );

      return {
        name: individual.name,
        role: individual.role,
        overall: roundToOne(individual.overallScore),
        level: LEVEL_LABELS[scoreToLevel(individual.overallScore)],
        safetyScore,
        governancePressure,
        blockerLabel,
        color: riskGovernanceHotspotColor(safetyScore, governancePressure),
        size: memberBubbleSize(individual.overallScore),
      };
    })
    .filter((row): row is TeamRiskGovernancePoint => Boolean(row))
    .sort(
      (left, right) =>
        left.safetyScore - right.safetyScore ||
        right.governancePressure - left.governancePressure ||
        left.name.localeCompare(right.name),
    );
}
