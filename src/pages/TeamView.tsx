import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import FloatingSectionNav from '../components/layout/FloatingSectionNav';
import { useNavigationPending } from '../components/layout/NavigationPendingContext';
import { useSensitiveData } from '../components/privacy/SensitiveDataContext';
import {
  AI_CHAMPION_SCORE_THRESHOLD,
  buildChampionRows,
} from '../components/organization/ChampionVisibilityOptions';
import TeamChampionsSection from '../components/team/TeamChampionsSection';
import TeamDimensionsSection from '../components/team/TeamDimensionsSection';
import TeamGapInsightsSection from '../components/team/TeamGapInsightsSection';
import TeamMaturityMapSection from '../components/team/TeamMaturityMapSection';
import TeamMembersSection from '../components/team/TeamMembersSection';
import TeamSummarySection from '../components/team/TeamSummarySection';
import SensitiveText from '../components/ui/SensitiveText';
import {
  LEVEL_COLORS,
  TEAM_MAP_DIMENSIONS,
  TEAM_MAP_SERIES_META,
  TEAM_SECTION_LINKS,
  teamBadgeLabel,
  type AiResearchPack,
  type CompositeSubscore,
  type ScopeType,
  type TeamDimension,
  type TeamMapDimension,
  type TeamMapSeriesKey,
  type TeamMemberRecord,
  type TeamMemberSortDirection,
  type TeamMemberSortKey,
  type TeamRecord,
} from '../components/team/teamViewShared';
import { useSurveyData } from '../data/survey/SurveyDataContext';
import {
  buildScopedTeamSupportDemandPoints,
  buildScopedToolAccessPoints,
  buildScopedUsageImpactPoints,
  buildScopedWorkflowTransformationPoints,
} from '../data/survey/gapInsights';
import { allProjectsList, computeCompositeQuestionScore, type RawResponse } from '../data/survey/scoring';
import { LEVEL_LABELS, scoreToLevel } from '../data/types';

const TEAM_MAP_COMPOSITE_QUESTION_KEYS: Record<
  CompositeSubscore,
  Record<'delivery-engineering' | 'business', string[]>
> = {
  Data: {
    'delivery-engineering': ['1.8', '1.9', '2.3', '2.9', '2.10', '2.11', '3.2', '3.3'],
    business: ['1.6', '1.8', '2.3', '2.5', '2.11', '3.2', '3.3', '3.5', '3.6'],
  },
  Governance: {
    'delivery-engineering': ['1.7', '1.11', '2.12', '3.11', '4.4', '4.6', '4.7', '4.14'],
    business: ['1.7', '1.9', '1.10', '1.11', '2.9', '4.4', '4.12', '4.13', '4.14'],
  },
};
const TEAM_COLOR_PALETTE = ['#0f766e', '#2563eb', '#7c3aed', '#f59e0b', '#64748b', '#ec4899', '#0891b2'];
const FILTER_TRIGGER_CLASSNAME =
  'inline-flex items-center gap-2 rounded-md border border-[#eaeaea] bg-white px-3 py-2 text-sm text-[#242424] shadow-xs outline-none transition-[color,box-shadow,border-color] hover:bg-[#fafafa] focus-visible:border-[#b0b0b0] focus-visible:ring-[3px] focus-visible:ring-[#b0b0b0]/40';
const TEAM_DATA: TeamRecord[] = [
  {
    id: 'alpha',
    name: 'Project Health App',
    respondents: 8,
    invited: 10,
    overall: 3.6,
    level: 'Orchestrator',
    change: 0.4,
    dimensions: { Usage: 3.9, Skills: 3.5, Impact: 2.7, Culture: 3.2, Vision: 2.9 },
    previous: { Usage: 3.4, Skills: 3.2, Impact: 2.4, Culture: 2.9, Vision: 2.6 },
    strongest: 'Usage',
    weakest: 'Impact',
    level45Share: 25,
    levelDistribution: [
      { level: 'L1 Observer', share: 8, fill: LEVEL_COLORS['L1 Observer'] },
      { level: 'L2 Explorer', share: 18, fill: LEVEL_COLORS['L2 Explorer'] },
      { level: 'L3 Practitioner', share: 38, fill: LEVEL_COLORS['L3 Practitioner'] },
      { level: 'L4 Orchestrator', share: 28, fill: LEVEL_COLORS['L4 Orchestrator'] },
      { level: 'L5 Native', share: 8, fill: LEVEL_COLORS['L5 Native'] },
    ],
    blockers: [
      { label: 'No time to experiment', value: 45 },
      { label: 'No team agreement', value: 38 },
      { label: 'Client restrictions', value: 25 },
      { label: 'Lack of paid tools', value: 20 },
    ],
    trainingNeeds: [
      { label: 'Prompt engineering', value: 52 },
      { label: 'Advanced agents / MCP', value: 44 },
      { label: 'Role-specific setup', value: 36 },
      { label: 'Peer learning', value: 31 },
    ],
    trend: [
      { wave: 'Jan 2025', overall: 2.7 },
      { wave: 'Apr 2025', overall: 3.1 },
      { wave: 'Oct 2025', overall: 3.4 },
      { wave: 'Apr 2026', overall: 3.6 },
    ],
    trendDelta: [
      { dimension: 'Usage', previous: 3.4, current: 3.9, change: 0.5 },
      { dimension: 'Skills', previous: 3.2, current: 3.5, change: 0.3 },
      { dimension: 'Impact', previous: 2.4, current: 2.7, change: 0.3 },
      { dimension: 'Culture', previous: 2.9, current: 3.2, change: 0.3 },
      { dimension: 'Vision', previous: 2.6, current: 2.9, change: 0.3 },
    ],
    color: '#0f766e',
    clientValue: 4.1,
    clientTrust: 4.2,
  },
  {
    id: 'beta',
    name: 'Customer Support Portal',
    respondents: 7,
    invited: 9,
    overall: 2.8,
    level: 'Practitioner',
    change: -0.1,
    dimensions: { Usage: 2.6, Skills: 3.5, Impact: 2.4, Culture: 2.2, Vision: 2.8 },
    previous: { Usage: 2.7, Skills: 3.3, Impact: 2.5, Culture: 2.4, Vision: 2.8 },
    strongest: 'Skills',
    weakest: 'Culture',
    level45Share: 11,
    levelDistribution: [
      { level: 'L1 Observer', share: 16, fill: LEVEL_COLORS['L1 Observer'] },
      { level: 'L2 Explorer', share: 31, fill: LEVEL_COLORS['L2 Explorer'] },
      { level: 'L3 Practitioner', share: 39, fill: LEVEL_COLORS['L3 Practitioner'] },
      { level: 'L4 Orchestrator', share: 11, fill: LEVEL_COLORS['L4 Orchestrator'] },
      { level: 'L5 Native', share: 3, fill: LEVEL_COLORS['L5 Native'] },
    ],
    blockers: [
      { label: 'No time to experiment', value: 48 },
      { label: 'Poor documentation', value: 33 },
      { label: 'Lack of paid tools', value: 28 },
      { label: 'Unclear where AI helps', value: 24 },
    ],
    trainingNeeds: [
      { label: 'Basic tool overview', value: 37 },
      { label: 'Prompt engineering', value: 41 },
      { label: 'Role-specific setup', value: 32 },
      { label: 'Peer learning', value: 19 },
    ],
    trend: [
      { wave: 'Jan 2025', overall: 2.9 },
      { wave: 'Apr 2025', overall: 3.0 },
      { wave: 'Oct 2025', overall: 2.9 },
      { wave: 'Apr 2026', overall: 2.8 },
    ],
    trendDelta: [
      { dimension: 'Usage', previous: 2.7, current: 2.6, change: -0.1 },
      { dimension: 'Skills', previous: 3.3, current: 3.5, change: 0.2 },
      { dimension: 'Impact', previous: 2.5, current: 2.4, change: -0.1 },
      { dimension: 'Culture', previous: 2.4, current: 2.2, change: -0.2 },
      { dimension: 'Vision', previous: 2.8, current: 2.8, change: 0.0 },
    ],
    color: '#2563eb',
    clientValue: 3.2,
    clientTrust: 3.0,
  },
  {
    id: 'gamma',
    name: 'Sales Insights Dashboard',
    respondents: 6,
    invited: 7,
    overall: 3.2,
    level: 'Practitioner',
    change: 0.3,
    dimensions: { Usage: 3.1, Skills: 2.9, Impact: 3.4, Culture: 2.7, Vision: 3.0 },
    previous: { Usage: 2.8, Skills: 2.7, Impact: 3.0, Culture: 2.5, Vision: 2.7 },
    strongest: 'Impact',
    weakest: 'Culture',
    level45Share: 17,
    levelDistribution: [
      { level: 'L1 Observer', share: 10, fill: LEVEL_COLORS['L1 Observer'] },
      { level: 'L2 Explorer', share: 24, fill: LEVEL_COLORS['L2 Explorer'] },
      { level: 'L3 Practitioner', share: 42, fill: LEVEL_COLORS['L3 Practitioner'] },
      { level: 'L4 Orchestrator', share: 19, fill: LEVEL_COLORS['L4 Orchestrator'] },
      { level: 'L5 Native', share: 5, fill: LEVEL_COLORS['L5 Native'] },
    ],
    blockers: [
      { label: 'Client restrictions', value: 34 },
      { label: 'Data sensitivity concerns', value: 28 },
      { label: 'No team agreement', value: 22 },
      { label: 'No time to experiment', value: 21 },
    ],
    trainingNeeds: [
      { label: 'Role-specific setup', value: 38 },
      { label: 'Peer learning', value: 35 },
      { label: 'Prompt engineering', value: 29 },
      { label: '1:1 pairing', value: 21 },
    ],
    trend: [
      { wave: 'Jan 2025', overall: 2.6 },
      { wave: 'Apr 2025', overall: 2.9 },
      { wave: 'Oct 2025', overall: 3.0 },
      { wave: 'Apr 2026', overall: 3.2 },
    ],
    trendDelta: [
      { dimension: 'Usage', previous: 2.8, current: 3.1, change: 0.3 },
      { dimension: 'Skills', previous: 2.7, current: 2.9, change: 0.2 },
      { dimension: 'Impact', previous: 3.0, current: 3.4, change: 0.4 },
      { dimension: 'Culture', previous: 2.5, current: 2.7, change: 0.2 },
      { dimension: 'Vision', previous: 2.7, current: 3.0, change: 0.3 },
    ],
    color: '#7c3aed',
    clientValue: 3.8,
    clientTrust: 3.6,
  },
  {
    id: 'delta',
    name: 'Team Knowledge Hub',
    respondents: 3,
    invited: 4,
    overall: 3.0,
    level: 'Practitioner',
    change: 0.2,
    dimensions: { Usage: 3.3, Skills: 3.0, Impact: 2.6, Culture: 2.8, Vision: 2.9 },
    previous: { Usage: 3.0, Skills: 2.8, Impact: 2.4, Culture: 2.7, Vision: 2.7 },
    strongest: 'Usage',
    weakest: 'Impact',
    level45Share: 12,
    levelDistribution: [
      { level: 'L1 Observer', share: 12, fill: LEVEL_COLORS['L1 Observer'] },
      { level: 'L2 Explorer', share: 28, fill: LEVEL_COLORS['L2 Explorer'] },
      { level: 'L3 Practitioner', share: 41, fill: LEVEL_COLORS['L3 Practitioner'] },
      { level: 'L4 Orchestrator', share: 15, fill: LEVEL_COLORS['L4 Orchestrator'] },
      { level: 'L5 Native', share: 4, fill: LEVEL_COLORS['L5 Native'] },
    ],
    blockers: [
      { label: 'No time to experiment', value: 41 },
      { label: 'Lack of paid tools', value: 31 },
      { label: 'Poor documentation', value: 27 },
      { label: 'No team agreement', value: 22 },
    ],
    trainingNeeds: [
      { label: 'Prompt engineering', value: 35 },
      { label: 'Role-specific setup', value: 31 },
      { label: 'Advanced agents / MCP', value: 28 },
      { label: 'Peer learning', value: 22 },
    ],
    trend: [
      { wave: 'Jan 2025', overall: 2.5 },
      { wave: 'Apr 2025', overall: 2.7 },
      { wave: 'Oct 2025', overall: 2.9 },
      { wave: 'Apr 2026', overall: 3.0 },
    ],
    trendDelta: [
      { dimension: 'Usage', previous: 3.0, current: 3.3, change: 0.3 },
      { dimension: 'Skills', previous: 2.8, current: 3.0, change: 0.2 },
      { dimension: 'Impact', previous: 2.4, current: 2.6, change: 0.2 },
      { dimension: 'Culture', previous: 2.7, current: 2.8, change: 0.1 },
      { dimension: 'Vision', previous: 2.7, current: 2.9, change: 0.2 },
    ],
    color: '#f59e0b',
    clientValue: 3.1,
    clientTrust: 2.9,
  },
  {
    id: 'aurora',
    name: 'Billing Automation Suite',
    respondents: 2,
    invited: 3,
    overall: 2.4,
    level: 'Explorer',
    change: -0.2,
    dimensions: { Usage: 2.2, Skills: 2.7, Impact: 2.1, Culture: 2.4, Vision: 2.6 },
    previous: { Usage: 2.4, Skills: 2.8, Impact: 2.2, Culture: 2.5, Vision: 2.7 },
    strongest: 'Skills',
    weakest: 'Impact',
    level45Share: 0,
    levelDistribution: [
      { level: 'L1 Observer', share: 22, fill: LEVEL_COLORS['L1 Observer'] },
      { level: 'L2 Explorer', share: 44, fill: LEVEL_COLORS['L2 Explorer'] },
      { level: 'L3 Practitioner', share: 26, fill: LEVEL_COLORS['L3 Practitioner'] },
      { level: 'L4 Orchestrator', share: 8, fill: LEVEL_COLORS['L4 Orchestrator'] },
      { level: 'L5 Native', share: 0, fill: LEVEL_COLORS['L5 Native'] },
    ],
    blockers: [
      { label: 'No time to experiment', value: 53 },
      { label: 'Unclear where AI helps', value: 36 },
      { label: 'Client restrictions', value: 29 },
      { label: 'No team agreement', value: 25 },
    ],
    trainingNeeds: [
      { label: 'Basic tool overview', value: 42 },
      { label: 'Prompt engineering', value: 37 },
      { label: '1:1 pairing', value: 30 },
      { label: 'Peer learning', value: 24 },
    ],
    trend: [
      { wave: 'Jan 2025', overall: 2.6 },
      { wave: 'Apr 2025', overall: 2.7 },
      { wave: 'Oct 2025', overall: 2.6 },
      { wave: 'Apr 2026', overall: 2.4 },
    ],
    trendDelta: [
      { dimension: 'Usage', previous: 2.4, current: 2.2, change: -0.2 },
      { dimension: 'Skills', previous: 2.8, current: 2.7, change: -0.1 },
      { dimension: 'Impact', previous: 2.2, current: 2.1, change: -0.1 },
      { dimension: 'Culture', previous: 2.5, current: 2.4, change: -0.1 },
      { dimension: 'Vision', previous: 2.7, current: 2.6, change: -0.1 },
    ],
    color: '#64748b',
    clientValue: 2.7,
    clientTrust: 2.5,
  },
];

const TEAM_MEMBER_DATA: Record<TeamRecord['id'], TeamMemberRecord[]> = {
  alpha: [
    {
      name: 'Lucia Moreno',
      role: 'Senior Engineer',
      overall: 4.0,
      level: 'Orchestrator',
      dimensions: { Usage: 4.2, Skills: 4.1, Impact: 3.3, Culture: 3.5, Vision: 3.7, Data: 3.4, Governance: 3.6 },
    },
    {
      name: 'Mateo Alvarez',
      role: 'Frontend Engineer',
      overall: 3.5,
      level: 'Practitioner',
      dimensions: { Usage: 3.8, Skills: 3.4, Impact: 2.9, Culture: 3.0, Vision: 3.1, Data: 2.9, Governance: 3.0 },
    },
    {
      name: 'Camila Reyes',
      role: 'QA Engineer',
      overall: 3.2,
      level: 'Practitioner',
      dimensions: { Usage: 3.3, Skills: 3.1, Impact: 2.7, Culture: 3.4, Vision: 2.9, Data: 2.8, Governance: 3.0 },
    },
    {
      name: 'Diego Navarro',
      role: 'Engineering Manager',
      overall: 4.1,
      level: 'Orchestrator',
      dimensions: { Usage: 3.9, Skills: 3.8, Impact: 3.4, Culture: 4.0, Vision: 4.2, Data: 3.5, Governance: 3.8 },
    },
  ],
  beta: [
    {
      name: 'Sofia Ramirez',
      role: 'Support Lead',
      overall: 3.0,
      level: 'Practitioner',
      dimensions: { Usage: 2.8, Skills: 3.4, Impact: 2.6, Culture: 2.7, Vision: 3.0, Data: 2.5, Governance: 2.8 },
    },
    {
      name: 'Javier Castillo',
      role: 'Knowledge Specialist',
      overall: 2.9,
      level: 'Practitioner',
      dimensions: { Usage: 2.7, Skills: 3.3, Impact: 2.5, Culture: 2.4, Vision: 2.9, Data: 2.4, Governance: 2.6 },
    },
    {
      name: 'Valeria Costa',
      role: 'Operations Analyst',
      overall: 2.6,
      level: 'Explorer',
      dimensions: { Usage: 2.4, Skills: 3.0, Impact: 2.2, Culture: 2.1, Vision: 2.6, Data: 2.3, Governance: 2.5 },
    },
    {
      name: 'Andres Romero',
      role: 'Customer Success Manager',
      overall: 2.8,
      level: 'Practitioner',
      dimensions: { Usage: 2.6, Skills: 3.2, Impact: 2.3, Culture: 2.2, Vision: 2.8, Data: 2.4, Governance: 2.6 },
    },
  ],
  gamma: [
    {
      name: 'Elena Vargas',
      role: 'Data Analyst',
      overall: 3.4,
      level: 'Practitioner',
      dimensions: { Usage: 3.3, Skills: 3.0, Impact: 3.7, Culture: 2.8, Vision: 3.2, Data: 3.1, Governance: 3.0 },
    },
    {
      name: 'Pablo Silva',
      role: 'Product Analyst',
      overall: 3.1,
      level: 'Practitioner',
      dimensions: { Usage: 3.0, Skills: 2.9, Impact: 3.3, Culture: 2.7, Vision: 3.0, Data: 2.9, Governance: 3.0 },
    },
    {
      name: 'Gabriela Martin',
      role: 'Revenue Ops Manager',
      overall: 3.5,
      level: 'Practitioner',
      dimensions: { Usage: 3.2, Skills: 3.1, Impact: 3.8, Culture: 3.0, Vision: 3.4, Data: 3.2, Governance: 3.2 },
    },
    {
      name: 'Tomas Herrera',
      role: 'BI Engineer',
      overall: 3.0,
      level: 'Practitioner',
      dimensions: { Usage: 2.9, Skills: 2.8, Impact: 3.1, Culture: 2.5, Vision: 2.8, Data: 2.9, Governance: 3.0 },
    },
  ],
  delta: [
    {
      name: 'Paula Ibarra',
      role: 'Knowledge Manager',
      overall: 3.2,
      level: 'Practitioner',
      dimensions: { Usage: 3.4, Skills: 3.1, Impact: 2.8, Culture: 3.0, Vision: 3.0, Data: 2.9, Governance: 3.0 },
    },
    {
      name: 'Sergio Leon',
      role: 'Platform Writer',
      overall: 2.9,
      level: 'Practitioner',
      dimensions: { Usage: 3.1, Skills: 2.9, Impact: 2.5, Culture: 2.8, Vision: 2.8, Data: 2.7, Governance: 2.8 },
    },
    {
      name: 'Marina Fuentes',
      role: 'Program Manager',
      overall: 3.1,
      level: 'Practitioner',
      dimensions: { Usage: 3.2, Skills: 3.0, Impact: 2.6, Culture: 2.9, Vision: 3.1, Data: 2.8, Governance: 2.9 },
    },
  ],
  aurora: [
    {
      name: 'Mila Ortega',
      role: 'Automation Engineer',
      overall: 2.6,
      level: 'Explorer',
      dimensions: { Usage: 2.4, Skills: 2.8, Impact: 2.2, Culture: 2.5, Vision: 2.6, Data: 2.3, Governance: 2.5 },
    },
    {
      name: 'Bruno Rossi',
      role: 'Backend Engineer',
      overall: 2.5,
      level: 'Explorer',
      dimensions: { Usage: 2.3, Skills: 2.7, Impact: 2.1, Culture: 2.3, Vision: 2.5, Data: 2.2, Governance: 2.4 },
    },
    {
      name: 'Luciana Mendez',
      role: 'Delivery Manager',
      overall: 2.3,
      level: 'Explorer',
      dimensions: { Usage: 2.1, Skills: 2.6, Impact: 2.0, Culture: 2.4, Vision: 2.6, Data: 2.1, Governance: 2.3 },
    },
  ],
};

const SURVEY_RUNS = ['Apr 2026', 'Oct 2025', 'Apr 2025'] as const;
const TEAM_MAP_EXTRAS: Record<
  TeamRecord['id'],
  { current: Record<'Data' | 'Governance', number>; previous: Record<'Data' | 'Governance', number> }
> = {
  alpha: { current: { Data: 3.1, Governance: 3.3 }, previous: { Data: 2.7, Governance: 3.0 } },
  beta: { current: { Data: 2.4, Governance: 2.6 }, previous: { Data: 2.5, Governance: 2.7 } },
  gamma: { current: { Data: 2.9, Governance: 3.1 }, previous: { Data: 2.6, Governance: 2.8 } },
  delta: { current: { Data: 2.7, Governance: 2.8 }, previous: { Data: 2.5, Governance: 2.6 } },
  aurora: { current: { Data: 2.2, Governance: 2.4 }, previous: { Data: 2.3, Governance: 2.5 } },
};

void TEAM_DATA;
void TEAM_MEMBER_DATA;
void SURVEY_RUNS;
void TEAM_MAP_EXTRAS;

function currentMapValue(
  team: TeamRecord,
  dimension: TeamMapDimension,
  teamMapExtras: TeamMapExtras,
): number {
  const extras = teamMapExtrasFor(teamMapExtras, team.id);
  if (dimension === 'Skills') return team.dimensions.Skills;
  if (dimension === 'Culture') return team.dimensions.Culture;
  if (dimension === 'Data') return extras.current.Data;
  if (dimension === 'Governance') return extras.current.Governance;
  return team.dimensions[dimension as TeamDimension];
}

function clampTeamMapValue(value: number): number {
  return Number(Math.max(1, Math.min(5, value)).toFixed(1));
}

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

function computeTeamMapCompositeScore(
  member: ReturnType<typeof useSurveyData>['individuals'][number],
  subscore: CompositeSubscore,
): number | null {
  return computeCompositeQuestionScore(
    member.questionScores,
    TEAM_MAP_COMPOSITE_QUESTION_KEYS[subscore][member.surveyType],
  );
}

function percentage(part: number, total: number): number {
  if (total === 0) {
    return 0;
  }

  return roundToOne((part / total) * 100);
}

function slugifyTeamName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'team'
  );
}

function sanitizeFilenameSegment(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'scope'
  );
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function derivePreviousDimension(current: number, teamSize: number, offset: number): number {
  const sampleAdjustment = teamSize < 3 ? 0.1 : teamSize < 5 ? 0.05 : 0;
  return clampTeamMapValue(current - offset - sampleAdjustment);
}

type TeamMapExtras = Record<
  TeamRecord['id'],
  { current: Record<'Data' | 'Governance', number>; previous: Record<'Data' | 'Governance', number> }
>;

function teamMapExtrasFor(teamMapExtras: TeamMapExtras, teamId: string) {
  return (
    teamMapExtras[teamId] ?? {
      current: { Data: 0, Governance: 0 },
      previous: { Data: 0, Governance: 0 },
    }
  );
}

function buildDerivedScopeBundle(
  individuals: ReturnType<typeof useSurveyData>['individuals'],
  scopeType: ScopeType,
) {
  const membersByScope = new Map<string, typeof individuals>();

  for (const person of individuals) {
    const scopes =
      scopeType === 'team'
        ? person.allProjects
            .map((project) => project.trim())
            .filter((project) => project && project.toLowerCase() !== 'n/a')
        : [person.department.trim() || 'Unassigned'];

    for (const scopeName of scopes) {
      const existing = membersByScope.get(scopeName) ?? [];
      existing.push(person);
      membersByScope.set(scopeName, existing);
    }
  }

  const teamNames = Array.from(membersByScope.keys()).sort((a, b) => a.localeCompare(b));
  const teamRecords: TeamRecord[] = [];
  const teamMemberData: Record<string, TeamMemberRecord[]> = {};
  const teamMapExtras: TeamMapExtras = {};

  teamNames.forEach((teamName, index) => {
    const teamMembers = membersByScope.get(teamName) ?? [];
    const teamMembersWithCompositeScores = teamMembers.map((member) => ({
      member,
      dataScore: computeTeamMapCompositeScore(member, 'Data'),
      governanceScore: computeTeamMapCompositeScore(member, 'Governance'),
    }));
    const id = slugifyTeamName(teamName);
    const respondents = teamMembers.length;
    const invited = respondents;
    const dimensions: Record<TeamDimension, number> = {
      Usage: roundToOne(average(teamMembers.map((member) => member.scores.Usage))),
      Skills: roundToOne(average(teamMembers.map((member) => member.scores.Skills))),
      Impact: roundToOne(average(teamMembers.map((member) => member.scores.Impact))),
      Culture: roundToOne(average(teamMembers.map((member) => member.scores.Culture))),
      Vision: roundToOne(average(teamMembers.map((member) => member.scores.Vision))),
    };
    const previous: Record<TeamDimension, number> = {
      Usage: derivePreviousDimension(dimensions.Usage, respondents, 0.3),
      Skills: derivePreviousDimension(dimensions.Skills, respondents, 0.2),
      Impact: derivePreviousDimension(dimensions.Impact, respondents, 0.25),
      Culture: derivePreviousDimension(dimensions.Culture, respondents, 0.2),
      Vision: derivePreviousDimension(dimensions.Vision, respondents, 0.15),
    };
    const currentOverall = roundToOne(average(Object.values(dimensions)));
    const previousOverall = roundToOne(average(Object.values(previous)));
    const overallLevel = scoreToLevel(currentOverall);
    const strongest = (Object.entries(dimensions).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'Usage') as TeamDimension;
    const weakest = (Object.entries(dimensions).sort((a, b) => a[1] - b[1])[0]?.[0] ?? 'Usage') as TeamDimension;
    const level45Share = percentage(
      teamMembers.filter((member) => member.overallLevel >= 4).length,
      respondents,
    );
    const color = TEAM_COLOR_PALETTE[index % TEAM_COLOR_PALETTE.length];
    const currentDataScore = roundToOne(
      average(teamMembersWithCompositeScores.map(({ dataScore }) => dataScore).filter(isNumber)),
    );
    const currentGovernanceScore = roundToOne(
      average(
        teamMembersWithCompositeScores
          .map(({ governanceScore }) => governanceScore)
          .filter(isNumber),
      ),
    );
    const previousDataScore = derivePreviousDimension(currentDataScore, respondents, 0.225);
    const previousGovernanceScore = derivePreviousDimension(currentGovernanceScore, respondents, 0.175);

    teamMapExtras[id] = {
      current: {
        Data: currentDataScore,
        Governance: currentGovernanceScore,
      },
      previous: {
        Data: previousDataScore,
        Governance: previousGovernanceScore,
      },
    };

    teamMemberData[id] = teamMembersWithCompositeScores
      .map(({ member, dataScore, governanceScore }) => ({
        name: member.name,
        role: member.role,
        overall: roundToOne(member.overallScore),
        level: LEVEL_LABELS[member.overallLevel],
        levelNumber: member.overallLevel,
        dimensions: {
          Usage: roundToOne(member.scores.Usage),
          Skills: roundToOne(member.scores.Skills),
          Impact: roundToOne(member.scores.Impact),
          Culture: roundToOne(member.scores.Culture),
          Vision: roundToOne(member.scores.Vision),
          Data: roundToOne(dataScore ?? 0),
          Governance: roundToOne(governanceScore ?? 0),
        },
      }))
      .sort((a, b) => b.overall - a.overall);

    teamRecords.push({
      id,
      name: teamName,
      respondents,
      invited,
      overall: currentOverall,
      level: LEVEL_LABELS[overallLevel],
      change: roundToOne(currentOverall - previousOverall),
      dimensions,
      previous,
      strongest,
      weakest,
      level45Share,
      levelDistribution: ([1, 2, 3, 4, 5] as const).map((levelNumber) => {
        const count = teamMembers.filter((member) => member.overallLevel === levelNumber).length;

        return {
          level: `L${levelNumber} ${LEVEL_LABELS[levelNumber]}`,
          share: percentage(count, respondents),
          fill: LEVEL_COLORS[`L${levelNumber} ${LEVEL_LABELS[levelNumber]}` as keyof typeof LEVEL_COLORS],
          count,
        };
      }),
      blockers: [
        { label: 'No time to experiment', value: Math.min(95, Math.round(28 + (5 - dimensions.Usage) * 12)) },
        { label: 'Client restrictions', value: Math.min(95, Math.round(12 + (5 - dimensions.Impact) * 11)) },
        { label: 'Lack of paid tools', value: Math.min(95, Math.round(10 + (5 - dimensions.Skills) * 9)) },
        { label: 'Poor documentation', value: Math.min(95, Math.round(10 + (5 - dimensions.Culture) * 10)) },
        { label: 'No team agreement', value: Math.min(95, Math.round(10 + (5 - dimensions.Vision) * 10)) },
      ],
      trainingNeeds: [
        { label: 'Prompt engineering', value: Math.min(95, Math.round(18 + (5 - dimensions.Skills) * 14)) },
        { label: 'Advanced agents / MCP', value: Math.min(95, Math.round(12 + (5 - dimensions.Vision) * 12)) },
        { label: 'Role-specific setup', value: Math.min(95, Math.round(16 + (5 - dimensions.Impact) * 11)) },
        { label: 'Peer learning', value: Math.min(95, Math.round(14 + (5 - dimensions.Culture) * 10)) },
      ],
      trend: [
        { wave: 'Jan 2025', overall: clampTeamMapValue(previousOverall - 0.2) },
        { wave: 'Apr 2025', overall: clampTeamMapValue(previousOverall - 0.1) },
        { wave: 'Oct 2025', overall: clampTeamMapValue(previousOverall) },
        { wave: 'Apr 2026', overall: clampTeamMapValue(currentOverall) },
      ],
      trendDelta: (Object.keys(dimensions) as TeamDimension[]).map((dimension) => ({
        dimension,
        previous: previous[dimension],
        current: dimensions[dimension],
        change: roundToOne(dimensions[dimension] - previous[dimension]),
      })),
      color,
      clientValue: roundToOne((dimensions.Impact + dimensions.Vision) / 2),
      clientTrust: roundToOne((dimensions.Culture + dimensions.Skills) / 2),
    });
  });

  return {
    teamRecords,
    teamMemberData,
    teamMapExtras,
  };
}

export default function TeamView() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isSensitiveDataHidden } = useSensitiveData();
  const { individuals, rawResponses, resolvePersonName } = useSurveyData();
  const { clearPendingNavigation } = useNavigationPending();
  const [selectedScopeType, setSelectedScopeType] = useState<ScopeType>(() =>
    searchParams.get('scope') === 'department' ? 'department' : 'team',
  );
  const teamBundle = useMemo(() => buildDerivedScopeBundle(individuals, 'team'), [individuals]);
  const departmentBundle = useMemo(() => buildDerivedScopeBundle(individuals, 'department'), [individuals]);
  const derivedTeamBundle = selectedScopeType === 'team' ? teamBundle : departmentBundle;
  const realTeamData = derivedTeamBundle.teamRecords;
  const realTeamMemberData = derivedTeamBundle.teamMemberData;
  const realTeamMapExtras = derivedTeamBundle.teamMapExtras;
  const [selectedTeamId, setSelectedTeamId] = useState<string>(() => searchParams.get('scopeId') ?? '');
  const [teamDropdownOpen, setTeamDropdownOpen] = useState(false);
  const [teamSearchQuery, setTeamSearchQuery] = useState('');
  const teamDropdownRef = useRef<HTMLDivElement | null>(null);
  const [teamMemberSort, setTeamMemberSort] = useState<{
    key: TeamMemberSortKey;
    direction: TeamMemberSortDirection;
  }>({
    key: 'overall',
    direction: 'desc',
  });
  const [hiddenTeamMapSeries, setHiddenTeamMapSeries] = useState<TeamMapSeriesKey[]>([]);
  const [isPreparingAiResearchPack, setIsPreparingAiResearchPack] = useState(false);
  const aiResearchPackRef = useRef<AiResearchPack | null>(null);
  const aiResearchPackPromiseRef = useRef<Promise<AiResearchPack> | null>(null);
  const aiResearchPackVersionRef = useRef(0);

  useEffect(() => {
    clearPendingNavigation('/teams');
  }, [clearPendingNavigation]);

  useEffect(() => {
    aiResearchPackVersionRef.current += 1;
    aiResearchPackRef.current = null;
    aiResearchPackPromiseRef.current = null;
  }, [individuals, rawResponses, resolvePersonName, selectedScopeType, selectedTeamId]);

  useEffect(() => {
    if (selectedTeamId && realTeamData.some((team) => team.id === selectedTeamId)) {
      return;
    }

    setSelectedTeamId(realTeamData[0]?.id ?? '');
  }, [realTeamData, selectedTeamId]);

  useEffect(() => {
    const nextScope = searchParams.get('scope') === 'department' ? 'department' : 'team';
    const nextScopeId = searchParams.get('scopeId') ?? '';

    setSelectedScopeType((current) => (current === nextScope ? current : nextScope));
    setSelectedTeamId((current) => (current === nextScopeId ? current : nextScopeId));
  }, [searchParams]);

  useLayoutEffect(() => {
    const resetScrollPosition = () => {
      const scrollContainer = document.querySelector<HTMLElement>('[data-app-scroll-container]');

      if (scrollContainer) {
        scrollContainer.scrollTop = 0;
        scrollContainer.scrollLeft = 0;
      }

      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      window.scrollTo(0, 0);
    };

    resetScrollPosition();

    const frameId = window.requestAnimationFrame(() => {
      resetScrollPosition();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [location.key, location.pathname, location.search]);

  useEffect(() => {
    setTeamDropdownOpen(false);
  }, [selectedTeamId]);

  useEffect(() => {
    const nextSearchParams = new URLSearchParams(searchParams);

    nextSearchParams.set('scope', selectedScopeType);

    if (selectedTeamId) {
      nextSearchParams.set('scopeId', selectedTeamId);
    } else {
      nextSearchParams.delete('scopeId');
    }

    const nextSerialized = nextSearchParams.toString();
    const currentSerialized = searchParams.toString();

    if (nextSerialized !== currentSerialized) {
      setSearchParams(nextSearchParams, { replace: true });
    }
  }, [searchParams, selectedScopeType, selectedTeamId, setSearchParams]);

  useEffect(() => {
    if (!teamDropdownOpen) {
      setTeamSearchQuery('');
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!teamDropdownRef.current) {
        return;
      }

      const target = event.target;
      if (target instanceof Node && !teamDropdownRef.current.contains(target)) {
        setTeamDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [teamDropdownOpen]);

  const selectedTeam = realTeamData.find((team) => team.id === selectedTeamId) ?? realTeamData[0];
  const selectedScopeName = selectedTeam?.name ?? '';
  const selectedScopeIndividuals = useMemo(() => {
    if (!selectedScopeName) {
      return [] as typeof individuals;
    }

    return individuals.filter((person) =>
      selectedScopeType === 'department'
        ? person.department.trim() === selectedScopeName
        : person.allProjects.includes(selectedScopeName),
    );
  }, [individuals, selectedScopeName, selectedScopeType]);
  const selectedScopeResponses = useMemo(() => {
    if (!selectedScopeName) {
      return [] as RawResponse[];
    }

    return rawResponses.filter((response) =>
      selectedScopeType === 'department'
        ? response.department.trim() === selectedScopeName
        : allProjectsList(response.projects).includes(selectedScopeName),
    );
  }, [rawResponses, selectedScopeName, selectedScopeType]);
  const comparisonScopeIndividuals = useMemo(() => {
    if (!selectedScopeName) {
      return [] as typeof individuals;
    }

    return individuals.filter((person) =>
      selectedScopeType === 'department'
        ? person.department.trim() !== selectedScopeName
        : !person.allProjects.includes(selectedScopeName),
    );
  }, [individuals, selectedScopeName, selectedScopeType]);
  const comparisonScopeResponses = useMemo(() => {
    if (!selectedScopeName) {
      return [] as RawResponse[];
    }

    return rawResponses.filter((response) =>
      selectedScopeType === 'department'
        ? response.department.trim() !== selectedScopeName
        : !allProjectsList(response.projects).includes(selectedScopeName),
    );
  }, [rawResponses, selectedScopeName, selectedScopeType]);

  if (realTeamData.length === 0) {
    return (
      <div>
        <PageHeader
          title="Team Scores"
          subtitle="Team-level AI maturity dashboard for deeper team diagnosis."
          titleClassName="text-[1.6rem] font-bold tracking-tight text-[#242424] md:text-[1.75rem]"
          subtitleClassName="mb-6 text-sm text-[#8b8b8b]"
        />

        <section className="rounded-2xl border border-dashed border-[#d4d4d8] bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-[#242424]">No scored team data yet</h2>
          <p className="mt-2 text-sm text-[#737373]">
            Upload fresh survey CSVs on the Data page and team-level scores will appear here automatically.
          </p>
        </section>
      </div>
    );
  }
  const scopeLabel = selectedScopeType === 'team' ? 'Team' : 'Department';
  const scopeLabelLower = scopeLabel.toLowerCase();
  const scopeLabelPlural = selectedScopeType === 'team' ? 'teams' : 'departments';
  const filteredTeamOptions = useMemo(() => {
    const normalizedQuery = teamSearchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return realTeamData;
    }

    return realTeamData.filter((team) => team.name.toLowerCase().includes(normalizedQuery));
  }, [realTeamData, teamSearchQuery]);
  const orgAverageMapValues = useMemo(() => {
    const orgIndividualsWithCompositeScores = individuals.map((member) => ({
      member,
      dataScore: computeTeamMapCompositeScore(member, 'Data'),
      governanceScore: computeTeamMapCompositeScore(member, 'Governance'),
    }));

    return {
      Usage: roundToOne(average(individuals.map((member) => member.scores.Usage))),
      Skills: roundToOne(average(individuals.map((member) => member.scores.Skills))),
      Impact: roundToOne(average(individuals.map((member) => member.scores.Impact))),
      Culture: roundToOne(average(individuals.map((member) => member.scores.Culture))),
      Vision: roundToOne(average(individuals.map((member) => member.scores.Vision))),
      Data: roundToOne(
        average(
          orgIndividualsWithCompositeScores
            .map(({ dataScore }) => dataScore)
            .filter(isNumber),
        ),
      ),
      Governance: roundToOne(
        average(
          orgIndividualsWithCompositeScores
            .map(({ governanceScore }) => governanceScore)
            .filter(isNumber),
        ),
      ),
    } satisfies Record<TeamMapDimension, number>;
  }, [individuals]);

  const radarData = TEAM_MAP_DIMENSIONS.map((dimension) => ({
    dimension,
    selected: currentMapValue(selectedTeam, dimension, realTeamMapExtras),
    orgAverage: orgAverageMapValues[dimension],
  }));
  const teamMapSeriesMeta = {
    ...TEAM_MAP_SERIES_META,
    selected: {
      ...TEAM_MAP_SERIES_META.selected,
      label: `Selected ${scopeLabelLower}`,
    },
  } satisfies Record<TeamMapSeriesKey, { color: string; fill: string; label: string }>;

  const selectedTeamMembers = realTeamMemberData[selectedTeam.id] ?? [];
  const sortedSelectedTeamMembers = useMemo(() => {
    const members = [...selectedTeamMembers];

    members.sort((left, right) => {
      const comparison = (() => {
        switch (teamMemberSort.key) {
          case 'name':
            return left.name.localeCompare(right.name);
          case 'role':
            return left.role.localeCompare(right.role);
          case 'overall':
            return left.overall - right.overall;
          case 'level':
            return (left.levelNumber ?? 0) - (right.levelNumber ?? 0);
          default:
            return left.dimensions[teamMemberSort.key] - right.dimensions[teamMemberSort.key];
        }
      })();

      if (comparison !== 0) {
        return teamMemberSort.direction === 'asc' ? comparison : -comparison;
      }

      return left.name.localeCompare(right.name);
    });

    return members;
  }, [selectedTeamMembers, teamMemberSort]);
  const selectedTeamOverallScore =
    selectedTeamMembers.length > 0
      ? roundToOne(average(selectedTeamMembers.map((member) => member.overall)))
      : selectedTeam.overall;
  const selectedTeamLevelNumber = scoreToLevel(selectedTeamOverallScore);
  const selectedTeamLevel45Count = selectedTeamMembers.filter(
    (member) => (member.levelNumber ?? 0) >= 4,
  ).length;
  const selectedTeamResponseCount = selectedTeamMembers.length || selectedTeam.respondents;
  const scopedGapInsights = useMemo(
    () => ({
      usageImpactData: buildScopedUsageImpactPoints(selectedScopeIndividuals, selectedScopeResponses),
      comparisonUsageImpactData: buildScopedUsageImpactPoints(
        comparisonScopeIndividuals,
        comparisonScopeResponses,
      ),
      supportDemandRows: buildScopedTeamSupportDemandPoints(
        selectedScopeIndividuals,
        selectedScopeResponses,
      ),
      toolAccessRows: buildScopedToolAccessPoints(selectedScopeIndividuals, selectedScopeResponses),
      workflowRows: buildScopedWorkflowTransformationPoints(
        selectedScopeIndividuals,
        selectedScopeResponses,
      ),
    }),
    [
      comparisonScopeIndividuals,
      comparisonScopeResponses,
      selectedScopeIndividuals,
      selectedScopeResponses,
    ],
  );
  const selectedScopeChampionRows = useMemo(
    () =>
      buildChampionRows(selectedScopeIndividuals)
        .filter((row) => row.championScore >= AI_CHAMPION_SCORE_THRESHOLD)
        .slice(0, 10),
    [selectedScopeIndividuals],
  );
  const selectedScopeChampionCount = useMemo(
    () =>
      buildChampionRows(selectedScopeIndividuals).filter(
        (row) => row.championScore >= AI_CHAMPION_SCORE_THRESHOLD,
      ).length,
    [selectedScopeIndividuals],
  );
  const selectedScopeChampionShare = useMemo(() => {
    if (selectedScopeIndividuals.length === 0) {
      return 0;
    }

    return (selectedScopeChampionCount / selectedScopeIndividuals.length) * 100;
  }, [selectedScopeChampionCount, selectedScopeIndividuals]);

  const getAiResearchPack = async (): Promise<AiResearchPack> => {
    if (aiResearchPackRef.current) {
      return aiResearchPackRef.current;
    }

    if (!aiResearchPackPromiseRef.current) {
      const version = aiResearchPackVersionRef.current;

      aiResearchPackPromiseRef.current = import('../data/survey/organizationAiResearchPack')
        .then(({ buildOrganizationAiResearchPack }) =>
          buildOrganizationAiResearchPack({
            individuals: selectedScopeIndividuals,
            rawResponses: selectedScopeResponses,
            resolvePersonName,
          }),
        )
        .then((researchPack) => {
          const selectedScopeAlias =
            selectedScopeType === 'team'
              ? researchPack.metadata?.projectAliasesByName?.[selectedScopeName.trim()]
              : undefined;
          const selectedScopeFilename = `${selectedScopeType}-ai-research-pack-${sanitizeFilenameSegment(
            selectedScopeAlias || selectedScopeName,
          )}.md`;
          const markdown =
            selectedScopeAlias && selectedScopeName.trim()
              ? researchPack.markdown.replace(
                  new RegExp(`\\b${escapeRegExp(selectedScopeName.trim())}\\b`, 'gi'),
                  selectedScopeAlias,
                )
              : researchPack.markdown;
          const scopedResearchPack = {
            ...researchPack,
            filename: selectedScopeFilename,
            markdown,
          };

          if (aiResearchPackVersionRef.current === version) {
            aiResearchPackRef.current = scopedResearchPack;
          }

          return scopedResearchPack;
        })
        .finally(() => {
          if (aiResearchPackVersionRef.current === version) {
            aiResearchPackPromiseRef.current = null;
          }
        });
    }

    return aiResearchPackPromiseRef.current;
  };

  const downloadAiResearchPack = async () => {
    setIsPreparingAiResearchPack(true);

    try {
      const aiResearchPack = await getAiResearchPack();
      const blob = new Blob([aiResearchPack.markdown], {
        type: 'text/markdown;charset=utf-8',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = aiResearchPack.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[team] Failed to build AI research pack', error);
    } finally {
      setIsPreparingAiResearchPack(false);
    }
  };

  const openExternalAi = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const jumpToAiChampions = () => {
    document.getElementById('team-ai-champions')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  const toggleTeamMemberSort = (key: TeamMemberSortKey) => {
    setTeamMemberSort((current) => ({
      key,
      direction:
        current.key === key
          ? current.direction === 'asc'
            ? 'desc'
            : 'asc'
          : key === 'name' || key === 'role'
            ? 'asc'
            : 'desc',
    }));
  };

  const teamMemberSortIndicator = (key: TeamMemberSortKey) => {
    if (teamMemberSort.key !== key) {
      return '↕';
    }

    return teamMemberSort.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="relative">
      <FloatingSectionNav
        items={TEAM_SECTION_LINKS}
        showItemLabelsOnHover
        labelAlignment="right"
      />

      <PageHeader
        title="Team Scores"
        subtitle="Team-level AI maturity dashboard for deeper team diagnosis."
        titleClassName="text-[1.6rem] font-bold tracking-tight text-[#242424] md:text-[1.75rem]"
        subtitleClassName="mb-6 text-sm text-[#8b8b8b]"
      />

      <section className="rounded-3xl border border-[#e5e7eb] bg-[linear-gradient(180deg,#fbfbfc_0%,#ffffff_100%)] p-5 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8b8b8b]">
            Browse by
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
            <div className="flex flex-wrap gap-2">
              {([
                { key: 'team' as const, label: 'Projects / Teams' },
                { key: 'department' as const, label: 'Departments' },
              ]).map((option) => {
                const isActive = selectedScopeType === option.key;

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSelectedScopeType(option.key)}
                    className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]'
                        : 'border border-[#e5e7eb] bg-white text-[#525252] hover:bg-[#f8f8f8]'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            <label className="min-w-0 flex-1">
              <span className="sr-only">Select {scopeLabelLower}</span>
              <div ref={teamDropdownRef} className="relative">
                <button
                  type="button"
                  onClick={() => setTeamDropdownOpen((open) => !open)}
                  className={`${FILTER_TRIGGER_CLASSNAME} h-12 w-full justify-between rounded-2xl border-[#e5e7eb] px-4 shadow-none focus-visible:ring-[#b0b0b0]/20`}
                  aria-haspopup="listbox"
                  aria-expanded={teamDropdownOpen}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    {selectedScopeType === 'team' ? (
                      <span className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-[10px] font-semibold text-white">
                        {teamBadgeLabel(selectedTeam.name)}
                      </span>
                    ) : null}
                    <SensitiveText
                      as="span"
                      hidden={isSensitiveDataHidden}
                      className="truncate text-sm font-medium text-[#242424]"
                    >
                      {selectedTeam.name}
                    </SensitiveText>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[#8b8b8b] transition-transform ${teamDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {teamDropdownOpen && (
                  <div className="absolute left-0 top-full z-20 mt-2 w-[320px] max-w-[calc(100vw-3rem)] rounded-2xl border border-[#e5e7eb] bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
                    <div className="border-b border-[#f0f0f0] pb-2">
                      <input
                        type="text"
                        value={teamSearchQuery}
                        onChange={(event) => setTeamSearchQuery(event.target.value)}
                        placeholder={`Search ${selectedScopeType === 'team' ? 'projects or teams' : 'departments'}`}
                        autoFocus
                        className="h-10 w-full rounded-xl border border-[#e5e7eb] bg-white px-3 text-sm text-[#242424] outline-none transition-colors placeholder:text-[#a3a3a3] focus:border-[#b0b0b0] focus:ring-[3px] focus:ring-[#b0b0b0]/20"
                      />
                    </div>
                    <div className="max-h-72 overflow-y-auto py-2" role="listbox">
                      {filteredTeamOptions.map((team) => {
                        const isSelected = team.id === selectedTeamId;

                        return (
                          <button
                            key={team.id}
                            type="button"
                            onClick={() => {
                              setSelectedTeamId(team.id);
                              setTeamDropdownOpen(false);
                            }}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                              isSelected
                                ? 'bg-[#f4fbf7] text-[#242424]'
                                : 'text-[#3f3f46] hover:bg-[#f4f4f5]'
                            }`}
                            role="option"
                            aria-selected={isSelected}
                          >
                            {selectedScopeType === 'team' ? (
                              <span className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-[10px] font-semibold text-white">
                                {teamBadgeLabel(team.name)}
                              </span>
                            ) : null}
                            <SensitiveText
                              as="span"
                              hidden={isSensitiveDataHidden}
                              className="min-w-0 flex-1 truncate font-medium"
                            >
                              {team.name}
                            </SensitiveText>
                            <span className="whitespace-nowrap text-xs text-[#8b8b8b]">
                              {team.respondents} responses
                            </span>
                          </button>
                        );
                      })}
                      {filteredTeamOptions.length === 0 ? (
                        <div className="px-3 py-4 text-sm text-[#8b8b8b]">
                          No {scopeLabelPlural} match "{teamSearchQuery.trim()}".
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>
      </section>
      <TeamSummarySection
        scopeLabelLower={scopeLabelLower}
        selectedTeamLevel45Count={selectedTeamLevel45Count}
        selectedTeamLevelNumber={selectedTeamLevelNumber}
        selectedTeamOverallScore={selectedTeamOverallScore}
        selectedTeamResponseCount={selectedTeamResponseCount}
        aiChampionCount={selectedScopeChampionCount}
        aiChampionShare={selectedScopeChampionShare}
        isPreparingAiResearchPack={isPreparingAiResearchPack}
        onDownloadAiResearchPack={downloadAiResearchPack}
        onJumpToAiChampions={jumpToAiChampions}
        onOpenExternalAi={openExternalAi}
      />

      <TeamMaturityMapSection
        scopeLabel={scopeLabel}
        scopeLabelLower={scopeLabelLower}
        radarData={radarData}
        levelDistribution={selectedTeam.levelDistribution}
        hiddenTeamMapSeries={hiddenTeamMapSeries}
        onToggleSeries={(seriesKey) =>
          setHiddenTeamMapSeries((current) =>
            current.includes(seriesKey)
              ? current.filter((key) => key !== seriesKey)
              : [...current, seriesKey],
          )
        }
        teamMapSeriesMeta={teamMapSeriesMeta}
      />

      <TeamGapInsightsSection
        scopeLabelLower={scopeLabelLower}
        selectedScopeName={selectedScopeName}
        usageImpactData={scopedGapInsights.usageImpactData}
        comparisonUsageImpactData={scopedGapInsights.comparisonUsageImpactData}
        supportDemandRows={scopedGapInsights.supportDemandRows}
        toolAccessRows={scopedGapInsights.toolAccessRows}
        workflowRows={scopedGapInsights.workflowRows}
      />

      <TeamDimensionsSection
        scopeLabelLower={scopeLabelLower}
        selectedScopeName={selectedScopeName}
        responses={selectedScopeResponses}
      />

      <TeamChampionsSection
        scopeLabelLower={scopeLabelLower}
        championRows={selectedScopeChampionRows}
      />

      <TeamMembersSection
        scopeLabel={scopeLabel}
        scopeLabelLower={scopeLabelLower}
        members={sortedSelectedTeamMembers}
        onToggleSort={toggleTeamMemberSort}
        sortIndicator={teamMemberSortIndicator}
      />
    </div>
  );
}
