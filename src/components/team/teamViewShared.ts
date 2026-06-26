import type { IndividualArchetypeProfile } from '../../data/survey/individualArchetypes';
import type { TeamArchetypeProfile } from '../../data/survey/teamArchetypes';
import type { AskAiResearchPack } from '../../shared/api/askAi';

export type TeamDimension = 'Usage' | 'Skills' | 'Impact' | 'Culture' | 'Vision';
export type TeamMapDimension =
  | 'Usage'
  | 'Skills'
  | 'Impact'
  | 'Culture'
  | 'Vision'
  | 'Data'
  | 'Governance';
export type CompositeSubscore = Extract<TeamMapDimension, 'Data' | 'Governance'>;

export type LevelDistributionItem = {
  level: string;
  share: number;
  fill: string;
  count?: number;
};

export type TeamRecord = {
  id: string;
  name: string;
  respondents: number;
  invited: number;
  overall: number;
  level: string;
  change: number;
  dimensions: Record<TeamDimension, number>;
  previous: Record<TeamDimension, number>;
  strongest: TeamDimension;
  weakest: TeamDimension;
  level45Share: number;
  levelDistribution: LevelDistributionItem[];
  blockers: { label: string; value: number }[];
  trainingNeeds: { label: string; value: number }[];
  trend: { wave: string; overall: number }[];
  trendDelta: { dimension: TeamDimension; previous: number; current: number; change: number }[];
  color: string;
  clientValue: number;
  clientTrust: number;
  archetype?: TeamArchetypeProfile;
};

export type TeamMemberRecord = {
  name: string;
  role: string;
  overall: number;
  level: string;
  levelNumber?: number;
  archetype?: IndividualArchetypeProfile;
  dimensions: Record<TeamMapDimension, number>;
};

export type ScopeType = 'team' | 'department';
export type TeamMemberSortKey =
  | 'name'
  | 'role'
  | 'overall'
  | 'level'
  | 'archetype'
  | TeamMapDimension;
export type TeamMemberSortDirection = 'asc' | 'desc';
export type AiResearchPack = AskAiResearchPack;
export type TeamMapSeriesKey = 'selected' | 'orgAverage';

export const TEAM_MAP_DIMENSIONS: TeamMapDimension[] = [
  'Usage',
  'Skills',
  'Impact',
  'Culture',
  'Vision',
  'Data',
  'Governance',
];

export const INDIVIDUAL_MEMBER_DIMENSIONS: TeamDimension[] = [
  'Usage',
  'Skills',
  'Impact',
  'Culture',
  'Vision',
];

export const TEAM_MAP_DIMENSION_LABELS: Record<TeamMapDimension, string> = {
  Usage: 'Dim1: Usage',
  Skills: 'Dim2: Skills',
  Impact: 'Dim3: Impact',
  Culture: 'Dim4: Culture',
  Vision: 'Dim5: Vision',
  Data: 'Dim6: Data',
  Governance: 'Dim7: Governance',
};

export const TEAM_DEEP_ANALYSIS_SECTION_LINKS = [
  { id: 'team-top-summary', label: 'Top summary' },
  {
    id: 'team-maturity-map',
    label: 'Where are we now?',
    children: [{ id: 'team-missing-archetypes', label: 'Missing archetypes' }],
  },
  { id: 'team-gap-signals', label: 'Where are the gaps?' },
  {
    id: 'team-dimensions',
    label: 'Dimensions',
    children: [
      { id: 'team-dimension-impact', label: 'Impact' },
      { id: 'team-dimension-culture', label: 'Culture' },
      { id: 'team-dimension-vision', label: 'Vision' },
    ],
  },
  { id: 'team-ai-champions', label: 'AI champions' },
  { id: 'team-members', label: 'Team members' },
  { id: 'team-suggested-goals', label: 'Where should we invest?' },
] as const;

export const TEAM_MUST_KNOW_SECTION_LINKS = [
  { id: 'team-top-summary', label: 'Top summary' },
  {
    id: 'team-maturity-map',
    label: 'Where are we now?',
    children: [{ id: 'team-missing-archetypes', label: 'Missing archetypes' }],
  },
  {
    id: 'team-gap-signals',
    label: 'Where are the gaps?',
    children: [
      { id: 'team-usage-impact', label: 'Usage vs Impact' },
      { id: 'team-top-deviating', label: 'Top deviating people' },
      { id: 'team-maturity-not-spreading', label: 'Maturity not spreading' },
    ],
  },
  { id: 'team-ai-champions', label: 'AI champions' },
  { id: 'team-members', label: 'Team members' },
  { id: 'team-suggested-goals', label: 'Suggested goals' },
] as const;

export const LEVEL_COLORS = {
  'L1 Observer': '#e5e7eb',
  'L2 Explorer': '#cbd5e1',
  'L3 Practitioner': '#94a3b8',
  'L4 Orchestrator': '#64748b',
  'L5 Native': '#334155',
} as const;

export const LEVEL_SCORE_RANGES: Record<LevelDistributionItem['level'], string> = {
  'L1 Observer': '1.0-1.4 / 5',
  'L2 Explorer': '1.5-2.4 / 5',
  'L3 Practitioner': '2.5-3.4 / 5',
  'L4 Orchestrator': '3.5-4.4 / 5',
  'L5 Native': '4.5-5.0 / 5',
};

export const TEAM_MAP_SERIES_META: Record<
  TeamMapSeriesKey,
  { color: string; fill: string; label: string }
> = {
  selected: {
    color: '#14b8a6',
    fill: '#14b8a6',
    label: 'Selected team',
  },
  orgAverage: {
    color: '#2563eb',
    fill: '#2563eb',
    label: 'Org average',
  },
};

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export function formatScore(value: number): string {
  return `${value.toFixed(1)} / 5`;
}

export function formatLevelLabel(level: string): string {
  const levelNumberMap: Record<string, number> = {
    Observer: 1,
    Explorer: 2,
    Practitioner: 3,
    Orchestrator: 4,
    Native: 5,
  };

  const levelNumber = levelNumberMap[level];
  return levelNumber ? `Level ${levelNumber} ${level}` : level;
}

export function teamBadgeLabel(name: string): string {
  const digits = name.match(/\d+/g)?.join('') ?? '';
  return digits ? `T${digits}` : name.slice(0, 2).toUpperCase();
}

export function initialsLabel(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function lowScoreBadgeTone(value: number): string {
  if (value < 2.5) return 'bg-[#f3f4f6] text-[#334155] ring-1 ring-inset ring-[#d1d5db]';
  if (value < 3) return 'bg-[#f8fafc] text-[#475569] ring-1 ring-inset ring-[#e2e8f0]';
  return 'text-[#242424]';
}
