import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { ChevronDown, Sparkles } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
  ZAxis,
} from '../components/charts/recharts';
import PageHeader from '../components/layout/PageHeader';
import FloatingSectionNav from '../components/layout/FloatingSectionNav';
import { useNavigationPending } from '../components/layout/NavigationPendingContext';
import { Tooltip as InfoTooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip';
import { useSurveyData } from '../data/survey/SurveyDataContext';
import { SUPPORT_DEMAND_SERIES, type SupportDemandSeriesKey } from '../data/survey/supportDemand';
import { allProjectsList, computeCompositeQuestionScore, type RawResponse } from '../data/survey/scoring';
import { LEVEL_LABELS, scoreToLevel } from '../data/types';

type TeamDimension = 'Usage' | 'Skills' | 'Impact' | 'Culture' | 'Vision';
type TeamMapDimension =
  | 'Usage'
  | 'Skills'
  | 'Impact'
  | 'Culture'
  | 'Vision'
  | 'Data'
  | 'Governance';
type CompositeSubscore = Extract<TeamMapDimension, 'Data' | 'Governance'>;

type LevelDistributionItem = {
  level: string;
  share: number;
  fill: string;
  count?: number;
};

type TeamRecord = {
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
};

type TeamMemberRecord = {
  name: string;
  role: string;
  overall: number;
  level: string;
  levelNumber?: number;
  dimensions: Record<TeamMapDimension, number>;
};
type ScopeType = 'team' | 'department';
type TeamMemberSortKey = 'name' | 'role' | 'overall' | 'level' | TeamMapDimension;
type TeamMemberSortDirection = 'asc' | 'desc';
type TeamSupportDemandRow = {
  cohort: string;
  respondents: number;
} & Record<SupportDemandSeriesKey, number>;
type TeamStandardizationKey = 'standardized' | 'partial' | 'fragmented';
type TeamStandardizationRow = Record<TeamStandardizationKey, number> & {
  label: string;
  respondents: number;
};

const TEAM_MAP_DIMENSIONS: TeamMapDimension[] = [
  'Usage',
  'Skills',
  'Impact',
  'Culture',
  'Vision',
  'Data',
  'Governance',
];

const TEAM_MAP_DIMENSION_LABELS: Record<TeamMapDimension, string> = {
  Usage: 'Dim1: Usage',
  Skills: 'Dim2: Skills',
  Impact: 'Dim3: Impact',
  Culture: 'Dim4: Culture',
  Vision: 'Dim5: Vision',
  Data: 'Dim6: Data',
  Governance: 'Dim7: Governance',
};

const TEAM_SECTION_LINKS = [
  { id: 'team-top-summary', label: 'Top summary' },
  { id: 'team-maturity-map', label: 'Team maturity map' },
  { id: 'team-members', label: 'Team members' },
  { id: 'team-client-view', label: 'Client view' },
  { id: 'team-comparison-signals', label: 'Comparison signals' },
  { id: 'team-blockers-training', label: 'Blockers and training needs' },
] as const;

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
const SKILLS_SELF_ASSESSMENT_QUESTION_KEYS = [
  '2.1',
  '2.2',
  '2.3',
  '2.4',
  '2.5',
  '2.7',
  '2.10',
  '2.11',
  '2.12',
] as const;
const SKILLS_VERIFICATION_QUESTION_KEYS = ['2.14', '2.15'] as const;

const LEVEL_COLORS = {
  'L1 Observer': '#e5e7eb',
  'L2 Explorer': '#cbd5e1',
  'L3 Practitioner': '#94a3b8',
  'L4 Orchestrator': '#64748b',
  'L5 Native': '#334155',
} as const;
const TEAM_COLOR_PALETTE = ['#0f766e', '#2563eb', '#7c3aed', '#f59e0b', '#64748b', '#ec4899', '#0891b2'];
const FILTER_TRIGGER_CLASSNAME =
  'inline-flex items-center gap-2 rounded-md border border-[#eaeaea] bg-white px-3 py-2 text-sm text-[#242424] shadow-xs outline-none transition-[color,box-shadow,border-color] hover:bg-[#fafafa] focus-visible:border-[#b0b0b0] focus-visible:ring-[3px] focus-visible:ring-[#b0b0b0]/40';
const TEAM_STANDARDIZATION_SERIES: Array<{
  key: TeamStandardizationKey;
  label: string;
  color: string;
}> = [
  { key: 'standardized', label: 'Shared guidelines / agreed tools', color: '#0f766e' },
  { key: 'partial', label: 'Informal norms', color: '#60a5fa' },
  { key: 'fragmented', label: 'Individual / inconsistent', color: '#d1d5db' },
];
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

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-[1.4rem] font-semibold tracking-tight text-[#242424] md:text-[1.5rem]">
        {title}
      </h2>
      <p className="mt-1 text-sm text-[#7a7a7a]">{subtitle}</p>
    </div>
  );
}

function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

function formatScore(value: number): string {
  return `${value.toFixed(1)} / 5`;
}

function formatFivePointValue(value: unknown): string {
  return formatScore(Number(value));
}

function formatLevelLabel(level: string): string {
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

function teamBadgeLabel(name: string): string {
  const digits = name.match(/\d+/g)?.join('') ?? '';
  return digits ? `T${digits}` : name.slice(0, 2).toUpperCase();
}

function initialsLabel(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

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

function previousMapValue(
  team: TeamRecord,
  dimension: TeamMapDimension,
  teamMapExtras: TeamMapExtras,
): number {
  const extras = teamMapExtrasFor(teamMapExtras, team.id);
  if (dimension === 'Skills') return team.previous.Skills;
  if (dimension === 'Culture') return team.previous.Culture;
  if (dimension === 'Data') return extras.previous.Data;
  if (dimension === 'Governance') return extras.previous.Governance;
  return team.previous[dimension as TeamDimension];
}

function clampTeamMapValue(value: number): number {
  return Number(Math.max(1, Math.min(5, value)).toFixed(1));
}

function roundToOne(value: number): number {
  return Number(value.toFixed(1));
}

function lowScoreBadgeTone(value: number): string {
  if (value < 2.5) return 'bg-[#f3f4f6] text-[#334155] ring-1 ring-inset ring-[#d1d5db]';
  if (value < 3) return 'bg-[#f8fafc] text-[#475569] ring-1 ring-inset ring-[#e2e8f0]';
  return 'text-[#242424]';
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

function hasSkillsVerificationData(
  member: ReturnType<typeof useSurveyData>['individuals'][number],
): boolean {
  return SKILLS_VERIFICATION_QUESTION_KEYS.some(
    (questionKey) => typeof member.questionScores[questionKey] === 'number',
  );
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

function derivePreviousDimension(current: number, teamSize: number, offset: number): number {
  const sampleAdjustment = teamSize < 3 ? 0.1 : teamSize < 5 ? 0.05 : 0;
  return clampTeamMapValue(current - offset - sampleAdjustment);
}

function normalizeSurveyAnswer(rawValue: string | undefined): string {
  return rawValue?.trim().toLowerCase().replace(/\s+/g, ' ') ?? '';
}

function splitSurveyMultiValue(rawValue: string | undefined): string[] {
  if (!rawValue) {
    return [];
  }

  return rawValue
    .split(';')
    .map((part) => part.trim().replace(/\s+/g, ' '))
    .filter((part) => part && part.toLowerCase() !== 'n/a');
}

function classifySharedGuidelines(rawAnswer: string | undefined): TeamStandardizationKey | null {
  const normalized = normalizeSurveyAnswer(rawAnswer);

  if (!normalized) {
    return null;
  }

  if (
    normalized.includes('documented guidelines') ||
    normalized.includes('documented standards') ||
    normalized.includes('guidelines or expectations') ||
    normalized.includes('guidelines or standards')
  ) {
    return 'standardized';
  }

  if (normalized.includes('loose team norms') || normalized.includes('informally')) {
    return 'partial';
  }

  if (
    normalized.includes('fully individual') ||
    normalized.includes('everyone uses whatever they want')
  ) {
    return 'fragmented';
  }

  return null;
}

function classifyAgreedTools(rawAnswer: string | undefined): TeamStandardizationKey | null {
  const normalized = normalizeSurveyAnswer(rawAnswer);

  if (!normalized) {
    return null;
  }

  if (
    normalized.includes('shared configuration') ||
    normalized.includes('shared prompts') ||
    normalized.includes('templates') ||
    normalized.includes('explicitly agreed on tools')
  ) {
    return 'standardized';
  }

  if (normalized.includes('informally settled on one or two tools')) {
    return 'partial';
  }

  if (normalized.includes('everyone uses whatever they want')) {
    return 'fragmented';
  }

  return null;
}

function teamStandardizationRank(key: TeamStandardizationKey | null): number {
  if (key === 'fragmented') return 1;
  if (key === 'partial') return 2;
  if (key === 'standardized') return 3;
  return 0;
}

function classifyTeamStandardization(response: RawResponse): TeamStandardizationKey | null {
  const sharedGuidelines = classifySharedGuidelines(response.q1_7);
  const agreedTools =
    response.surveyType === 'business' ? classifyAgreedTools(response.q1_10) : null;

  return [sharedGuidelines, agreedTools].reduce<TeamStandardizationKey | null>(
    (best, current) =>
      teamStandardizationRank(current) > teamStandardizationRank(best) ? current : best,
    null,
  );
}

function supportDemandAnswerKey(rawAnswer: string): SupportDemandSeriesKey | null {
  const answer = rawAnswer.trim().toLowerCase();

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

  if (answer.includes('overview of available ai tools')) {
    return 'overview';
  }

  if (answer.includes('prompt engineering')) {
    return 'prompting';
  }

  if (answer.includes('setting up ai tools')) {
    return 'setup';
  }

  if (answer.includes('peer learning')) {
    return 'peer';
  }

  return null;
}

function wantsHandsOnTraining(rawAnswer: string | undefined): boolean {
  return rawAnswer?.trim().toLowerCase().startsWith('yes') ?? false;
}

function wantsOneToOnePairing(rawAnswer: string | undefined): boolean {
  return rawAnswer?.trim().toLowerCase().includes('1:1 pairing') ?? false;
}

function supportDemandSortWeight(label: string): number {
  const normalized = label.trim().toLowerCase();

  if (normalized.includes('intern')) return 0;
  if (normalized.includes('junior')) return 1;
  if (normalized.includes('middle')) return 2;
  if (normalized.includes('senior')) return 3;
  if (normalized.includes('lead')) return 4;
  if (normalized.includes('head')) return 5;
  if (normalized.includes('director')) return 6;
  if (normalized.includes('chief') || normalized.includes('c-level')) return 7;

  return 100;
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

function LevelDistributionTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: LevelDistributionItem }>;
}) {
  const slice = payload?.[0]?.payload;

  if (!active || !slice) {
    return null;
  }

  return (
    <div className="rounded-md bg-[#242424] px-3 py-2 text-xs text-white shadow-lg">
      <p className="font-semibold">{slice.level}</p>
      <p className="mt-1">Share: {slice.share}%</p>
      <p>Replies: {slice.count ?? 0}</p>
    </div>
  );
}

function TeamSkillsGapTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload?: {
      department?: string;
      respondents?: number;
      self?: number;
      verification?: number | null;
    };
  }>;
}) {
  const point = payload?.[0]?.payload;

  if (!active || !point) {
    return null;
  }

  return (
    <div className="rounded-md bg-[#242424] px-4 py-3 text-sm text-white shadow-lg">
      <div className="mb-2 font-semibold text-white">
        Department: {point.department ?? 'Unknown'}
      </div>
      <div className="space-y-1">
        <div>Self-rated skills: {formatFivePointValue(point.self)}</div>
        <div>
          Verification score:{' '}
          {typeof point.verification === 'number'
            ? formatFivePointValue(point.verification)
            : 'N/A'}
        </div>
        <div>Cohort size: {point.respondents ?? 0} respondents</div>
      </div>
    </div>
  );
}

function TeamStandardizationTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    color?: string;
    dataKey?: string;
    value?: number;
    payload?: TeamStandardizationRow;
  }>;
}) {
  const row = payload?.[0]?.payload;
  const visibleSegments = (payload ?? []).filter(
    (item): item is { color?: string; dataKey?: string; value: number; payload?: TeamStandardizationRow } =>
      typeof item.value === 'number' && item.value > 0,
  );

  if (!active || !row || visibleSegments.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md bg-[#242424] px-4 py-3 text-sm text-white shadow-lg">
      <div className="mb-2 font-semibold text-white">{row.label}</div>
      <div className="space-y-1">
        {visibleSegments.map((segment) => {
          const series = TEAM_STANDARDIZATION_SERIES.find(
            (item) => item.key === segment.dataKey,
          );
          const share = row.respondents > 0 ? (segment.value / row.respondents) * 100 : 0;

          return (
            <div key={segment.dataKey ?? series?.label ?? 'segment'} className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: segment.color ?? series?.color ?? '#fff' }}
              />
              <span>
                {series?.label ?? segment.dataKey}: {segment.value} ({share.toFixed(0)}%)
              </span>
            </div>
          );
        })}
        <div className="pt-1 text-white/75">{row.respondents} respondents</div>
      </div>
    </div>
  );
}

export default function TeamView() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { individuals, rawResponses } = useSurveyData();
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
  const [hiddenSupportDemandSeries, setHiddenSupportDemandSeries] = useState<SupportDemandSeriesKey[]>([]);

  useEffect(() => {
    clearPendingNavigation('/teams');
  }, [clearPendingNavigation]);

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
  const selectedScopeSupportResponses = useMemo(() => {
    if (!selectedScopeName) {
      return [] as RawResponse[];
    }

    return rawResponses.filter((response) =>
      selectedScopeType === 'department'
        ? response.department.trim() === selectedScopeName
        : allProjectsList(response.projects).includes(selectedScopeName),
    );
  }, [rawResponses, selectedScopeName, selectedScopeType]);
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
  const selectedScopeStandardization = useMemo(() => {
    const counts: Record<TeamStandardizationKey, number> = {
      standardized: 0,
      partial: 0,
      fragmented: 0,
    };

    for (const response of selectedScopeSupportResponses) {
      const classification = classifyTeamStandardization(response);

      if (!classification) {
        continue;
      }

      counts[classification] += 1;
    }

    const respondents = counts.standardized + counts.partial + counts.fragmented;

    return {
      respondents,
      counts,
      data: [
        {
          label: 'Standardization',
          respondents,
          standardized: counts.standardized,
          partial: counts.partial,
          fragmented: counts.fragmented,
        },
      ] satisfies TeamStandardizationRow[],
    };
  }, [selectedScopeSupportResponses]);

  const selectedScopeSupportDemand = useMemo<TeamSupportDemandRow[]>(() => {
    const responsesBySeniority = new Map<string, RawResponse[]>();

    for (const response of selectedScopeSupportResponses) {
      const seniority = response.seniority.trim() || 'Unspecified';
      const existing = responsesBySeniority.get(seniority) ?? [];
      existing.push(response);
      responsesBySeniority.set(seniority, existing);
    }

    return Array.from(responsesBySeniority.entries())
      .map(([cohort, responses]) => {
        const counts = {
          advanced: 0,
          overview: 0,
          prompting: 0,
          setup: 0,
          peer: 0,
          pairing: 0,
          handsOn: 0,
        } satisfies Record<SupportDemandSeriesKey, number>;

        for (const response of responses) {
          const supportAnswer =
            response.surveyType === 'business' ? response.q4_10 : response.q4_12;
          const trainingAnswer =
            response.surveyType === 'business' ? response.q4_11 : response.q4_13;
          const selectedSupportTypes = new Set<SupportDemandSeriesKey>();

          for (const answer of splitSurveyMultiValue(supportAnswer)) {
            const key = supportDemandAnswerKey(answer);
            if (key) {
              selectedSupportTypes.add(key);
            }
          }

          for (const key of selectedSupportTypes) {
            counts[key] += 1;
          }

          if (wantsHandsOnTraining(trainingAnswer)) {
            counts.handsOn += 1;
          }

          if (wantsOneToOnePairing(trainingAnswer)) {
            counts.pairing += 1;
          }
        }

        const respondents = responses.length;

        return {
          cohort,
          respondents,
          advanced: roundToOne((counts.advanced / respondents) * 100),
          overview: roundToOne((counts.overview / respondents) * 100),
          prompting: roundToOne((counts.prompting / respondents) * 100),
          setup: roundToOne((counts.setup / respondents) * 100),
          peer: roundToOne((counts.peer / respondents) * 100),
          pairing: roundToOne((counts.pairing / respondents) * 100),
          handsOn: roundToOne((counts.handsOn / respondents) * 100),
        };
      })
      .sort((left, right) => {
        const leftWeight = supportDemandSortWeight(left.cohort);
        const rightWeight = supportDemandSortWeight(right.cohort);

        if (leftWeight !== rightWeight) {
          return leftWeight - rightWeight;
        }

        return left.cohort.localeCompare(right.cohort);
      });
  }, [selectedScopeSupportResponses]);

  const selectedTeamSkillsGapData = useMemo(() => {
    if (selectedScopeType !== 'team') {
      return [];
    }

    const departmentScores = new Map<
      string,
      Array<{ self: number; verification: number | null }>
    >();

    for (const person of selectedScopeIndividuals) {
      const department = person.department.trim();

      if (!department) {
        continue;
      }

      const selfScore = computeCompositeQuestionScore(
        person.questionScores,
        [...SKILLS_SELF_ASSESSMENT_QUESTION_KEYS],
      );
      const verificationScore = computeCompositeQuestionScore(
        person.questionScores,
        [...SKILLS_VERIFICATION_QUESTION_KEYS],
      );

      if (selfScore === null) {
        continue;
      }

      const existing = departmentScores.get(department) ?? [];
      existing.push({
        self: selfScore,
        verification: hasSkillsVerificationData(person) ? verificationScore : null,
      });
      departmentScores.set(department, existing);
    }

    return Array.from(departmentScores.entries())
      .map(([department, scores]) => {
        const verificationScores = scores
          .map((score) => score.verification)
          .filter((score): score is number => typeof score === 'number');

        return {
          department,
          respondents: scores.length,
          self: roundToOne(average(scores.map((score) => score.self))),
          verification:
            verificationScores.length > 0
              ? roundToOne(average(verificationScores))
              : null,
        };
      })
      .sort(
        (left, right) =>
          left.department.localeCompare(right.department) ||
          right.respondents - left.respondents,
      );
  }, [selectedScopeIndividuals, selectedScopeType]);

  const visibleSupportDemandSeries = useMemo(
    () => SUPPORT_DEMAND_SERIES.filter((series) => !hiddenSupportDemandSeries.includes(series.key)),
    [hiddenSupportDemandSeries],
  );

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
  const highestImpactTeamId = useMemo(
    () =>
      realTeamData.reduce((best, team) =>
        team.dimensions.Impact > best.dimensions.Impact ? team : best,
      realTeamData[0]).id,
    [realTeamData],
  );

  const teamHeatmap = realTeamData;

  const radarData = TEAM_MAP_DIMENSIONS.map((dimension) => ({
    dimension,
    selected: currentMapValue(selectedTeam, dimension, realTeamMapExtras),
    previous: previousMapValue(selectedTeam, dimension, realTeamMapExtras),
  }));

  const blockersHeatmap = teamHeatmap.map((team) => ({
    team: team.name,
    'No time': team.blockers.find((item) => item.label === 'No time to experiment')?.value ?? 0,
    'Client restrictions': team.blockers.find((item) => item.label === 'Client restrictions')?.value ?? 0,
    'Tool access': team.blockers.find((item) => item.label === 'Lack of paid tools')?.value ?? 0,
    'Poor docs': team.blockers.find((item) => item.label === 'Poor documentation')?.value ?? 0,
    'No agreement': team.blockers.find((item) => item.label === 'No team agreement')?.value ?? 0,
  }));

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
      <FloatingSectionNav items={TEAM_SECTION_LINKS} />

      <PageHeader
        title="Team Scores"
        subtitle="Team-level AI maturity dashboard for deeper team diagnosis."
        titleClassName="text-[1.6rem] font-bold tracking-tight text-[#242424] md:text-[1.75rem]"
        subtitleClassName="mb-6 text-sm text-[#8b8b8b]"
      />

      <section className="rounded-2xl border border-[#eaeaea] bg-white p-5 shadow-sm">
        <div className="grid gap-3 md:grid-cols-1">
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
          <label className="flex flex-col items-start gap-2 pr-4">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-[#8b8b8b]">
              {scopeLabel} selector
            </span>
            <div ref={teamDropdownRef} className="relative inline-block min-w-[280px]">
              <button
                type="button"
                onClick={() => setTeamDropdownOpen((open) => !open)}
                className={`${FILTER_TRIGGER_CLASSNAME} h-10 justify-between rounded-xl`}
                aria-haspopup="listbox"
                aria-expanded={teamDropdownOpen}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <span className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-[10px] font-semibold text-white">
                    {teamBadgeLabel(selectedTeam.name)}
                  </span>
                  <span className="truncate">{selectedTeam.name}</span>
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-[#8b8b8b]" />
              </button>
              {teamDropdownOpen && (
                  <div className="absolute left-0 top-full z-20 mt-1 min-w-full rounded-md border border-[#eaeaea] bg-white shadow-lg">
                    <div className="border-b border-[#f0f0f0] p-2">
                      <input
                        type="text"
                        value={teamSearchQuery}
                        onChange={(event) => setTeamSearchQuery(event.target.value)}
                        placeholder={`Search ${scopeLabelLower} by name`}
                        autoFocus
                        className="h-9 w-full rounded-lg border border-[#e5e7eb] bg-white px-3 text-sm text-[#242424] outline-none transition-colors focus:border-[#b0b0b0] focus:ring-[3px] focus:ring-[#b0b0b0]/20"
                      />
                    </div>
                    <div className="max-h-72 overflow-y-auto py-1">
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
                          className={`mx-1 flex w-[calc(100%-0.5rem)] items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                            isSelected
                              ? 'border-[#d4d4d8] bg-[#f1f1f3] text-[#242424]'
                              : 'border-transparent text-[#3f3f46] hover:bg-[#f4f4f5]'
                          }`}
                          role="option"
                          aria-selected={isSelected}
                        >
                          <span className="flex h-7 w-7 shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500 text-[10px] font-semibold text-white">
                            {teamBadgeLabel(team.name)}
                          </span>
                          <span className="truncate">{team.name}</span>
                          <span className="ml-auto whitespace-nowrap text-xs text-[#8b8b8b]">
                            {team.respondents} responses
                          </span>
                        </button>
                      );
                    })}
                    {filteredTeamOptions.length === 0 ? (
                      <div className="px-3 py-3 text-sm text-[#8b8b8b]">
                        No {scopeLabelPlural} match "{teamSearchQuery.trim()}".
                      </div>
                    ) : null}
                    </div>
                  </div>
              )}
            </div>
          </label>
        </div>

      </section>

      <section id="team-top-summary" className="mt-8 scroll-mt-24">
        <SectionHeader
          title="Top summary"
          subtitle={`Fast-read ${scopeLabelLower} signals for maturity, movement, participation, and concentration of stronger adopters.`}
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
            {[
              {
                title: 'Overall maturity',
                value: formatScore(selectedTeamOverallScore),
                detail: formatLevelLabel(LEVEL_LABELS[selectedTeamLevelNumber]),
              },
              {
                title: 'Responses',
                value: String(selectedTeamResponseCount),
                detail: 'Survey responses',
              },
              {
                title: 'Level 4–5 people',
                value: String(selectedTeamLevel45Count),
                detail: `${formatPercent(percentage(selectedTeamLevel45Count, selectedTeamResponseCount))} of team at advanced maturity`,
              },
            ].map((card, index) => (
              <div
                key={card.title}
                className={`rounded-2xl px-4 py-4 shadow-sm ${
                  index === 0
                    ? 'border border-[#1d4ed8]/20 bg-[linear-gradient(135deg,#0f766e_0%,#1d4ed8_100%)] text-white'
                    : 'border border-[#eaeaea] bg-white'
                }`}
              >
                <div
                  className={`text-[11px] font-medium uppercase tracking-[0.14em] ${
                    index === 0 ? 'text-white/75' : 'text-[#8b8b8b]'
                  }`}
                >
                  {card.title}
                </div>
                <div className={`mt-6 text-2xl font-semibold tracking-tight ${index === 0 ? 'text-white' : 'text-[#242424]'}`}>
                  {card.value}
                </div>
                <div className={`mt-3 text-sm ${index === 0 ? 'text-white/85' : 'text-[#7a7a7a]'}`}>
                  {card.detail}
                </div>
              </div>
            ))}
          </div>
      </section>

      <section id="team-maturity-map" className="mt-8 scroll-mt-24">
        <SectionHeader
          title={`${scopeLabel} maturity map`}
          subtitle={`A dimension-level view of the selected ${scopeLabelLower} against the previous survey baseline.`}
        />

        <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#f4f4f5] px-3 py-1.5 text-sm text-[#242424]">
              <span className="h-2.5 w-2.5 rounded-full bg-[#14b8a6]" />
              Current wave
            </div>

            <div className="mt-6 h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} outerRadius="72%">
                  <PolarGrid stroke="rgb(229,229,229)" />
                  <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12, fill: '#737373' }} />
                  <PolarRadiusAxis
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tick={{ fontSize: 9, fill: '#b0b0b0' }}
                    axisLine={false}
                  />
                  <RechartsTooltip
                    isAnimationActive={false}
                    cursor={{ stroke: '#14b8a6', strokeWidth: 1, strokeDasharray: '3 3' }}
                    contentStyle={{
                      backgroundColor: '#242424',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      color: '#ffffff',
                      fontSize: '12px',
                    }}
                    labelStyle={{ color: '#ffffff', fontWeight: 600 }}
                    itemStyle={{ color: '#ffffff' }}
                    formatter={(value, name) => {
                      const num = Number(value);
                      return [`${num.toFixed(1)} / 5`, name];
                    }}
                  />
                  <Legend
                    layout="vertical"
                    align="right"
                    verticalAlign="middle"
                    wrapperStyle={{ fontSize: '12px', paddingLeft: '16px' }}
                    iconType="circle"
                  />
                  <Radar
                    name="Current wave"
                    dataKey="selected"
                    stroke="#14b8a6"
                    fill="#14b8a6"
                    fillOpacity={0.12}
                    strokeWidth={2}
                    isAnimationActive={false}
                    dot={
                      ((props: { cx?: number; cy?: number }) => {
                        const { cx = 0, cy = 0 } = props;
                        const size = 10;
                        return (
                          <rect
                            x={cx - size / 2}
                            y={cy - size / 2}
                            width={size}
                            height={size}
                            fill="#14b8a6"
                          />
                        );
                      }) as unknown as never
                    }
                    label={
                      ((props: {
                        x?: number;
                        y?: number;
                        value?: number;
                        viewBox?: { cx?: number; cy?: number };
                      }) => {
                        const { x = 0, y = 0, value = 0, viewBox } = props;
                        const cx = viewBox?.cx ?? 0;
                        const cy = viewBox?.cy ?? 0;
                        const dx = x - cx;
                        const dy = y - cy;
                        const length = Math.sqrt(dx * dx + dy * dy) || 1;
                        const offset = 16;
                        const lx = x + (dx / length) * offset;
                        const ly = y + (dy / length) * offset;
                        let textAnchor: 'start' | 'middle' | 'end' = 'middle';
                        if (dx > 8) textAnchor = 'start';
                        else if (dx < -8) textAnchor = 'end';

                        let baseline: 'auto' | 'middle' | 'hanging' = 'middle';
                        if (dy > 10) baseline = 'hanging';
                        else if (dy < -10) baseline = 'auto';

                        return (
                          <text
                            x={lx}
                            y={ly}
                            fill="#14b8a6"
                            fontSize={13}
                            fontWeight={600}
                            textAnchor={textAnchor}
                            dominantBaseline={baseline}
                          >
                            {Number(value).toFixed(1)}
                          </text>
                        );
                      }) as unknown as never
                    }
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
              Level distribution inside selected {scopeLabelLower}
            </h3>
            <p className="mt-1 text-sm text-[#7a7a7a]">
              Real distribution based on current selected {scopeLabelLower} respondents across Levels 1–5.
            </p>
            <div className="mt-6 h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={selectedTeam.levelDistribution}
                    dataKey="share"
                    nameKey="level"
                    cx="50%"
                    cy="56%"
                    innerRadius={68}
                    outerRadius={132}
                    paddingAngle={2}
                    stroke="white"
                    strokeWidth={2}
                    label={({ percent }) => `${Math.round((percent ?? 0) * 100)}%`}
                    labelLine={false}
                  >
                    {selectedTeam.levelDistribution.map((item) => (
                      <Cell key={item.level} fill={item.fill} />
                    ))}
                  </Pie>
                  <Tooltip isAnimationActive={false} content={<LevelDistributionTooltip />} />
                  <Legend
                    layout="horizontal"
                    align="center"
                    verticalAlign="top"
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px', paddingBottom: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </section>

      <section id="team-members" className="mt-8 scroll-mt-24">
        <SectionHeader
          title={`${scopeLabel} members`}
          subtitle={`An employee-level view for the currently selected ${scopeLabelLower}, showing individual maturity patterns beneath the aggregate.`}
        />

        <section className="rounded-2xl border border-[#eaeaea] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1280px]">
              <thead>
                <tr className="border-b border-[#eaeaea] text-left text-xs text-[#8b8b8b]">
                  {[
                    { key: 'name' as const, label: 'Employee' },
                    { key: 'role' as const, label: 'Role' },
                    { key: 'overall' as const, label: 'Overall' },
                    { key: 'level' as const, label: 'Level' },
                    ...TEAM_MAP_DIMENSIONS.map((dimension) => ({
                      key: dimension,
                      label: TEAM_MAP_DIMENSION_LABELS[dimension],
                    })),
                  ].map((header) => (
                    <th key={header.key} className="px-4 py-3 font-medium">
                      <button
                        type="button"
                        onClick={() => toggleTeamMemberSort(header.key)}
                        className="inline-flex items-center gap-1 transition-colors hover:text-[#525252]"
                      >
                        <span>{header.label}</span>
                        <span className="text-[11px]">{teamMemberSortIndicator(header.key)}</span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedSelectedTeamMembers.map((member) => (
                  <tr key={member.name} className="border-b border-[#eaeaea] last:border-b-0">
                    <td className="px-4 py-3 font-medium text-[#242424]">
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex h-8 w-8 shrink-0 items-center justify-center select-none text-[11px] font-semibold text-white">
                          {initialsLabel(member.name)}
                        </div>
                        <span>{member.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#5b5b5b]">{member.role}</td>
                    <td className="px-4 py-3 text-sm text-[#242424]">{formatScore(member.overall)}</td>
                    <td className="px-4 py-3 text-sm text-[#242424]">{formatLevelLabel(member.level)}</td>
                    {TEAM_MAP_DIMENSIONS.map((dimension) => (
                      <td key={`${member.name}-${dimension}`} className="px-4 py-3 text-sm text-[#242424]">
                        <span
                          className={`inline-flex min-w-[3rem] items-center justify-center rounded-md px-2 py-1 font-medium ${lowScoreBadgeTone(member.dimensions[dimension])}`}
                        >
                          {member.dimensions[dimension].toFixed(1)}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <section id="team-client-view" className="mt-8 scroll-mt-24">
        <SectionHeader
          title="Client view"
          subtitle={`A synthetic client-perception overlay derived from the current ${scopeLabelLower} maturity profile.`}
        />

        <section className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
          <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
                Internal maturity vs client value and trust
              </h3>
              <div className="mt-6 h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 10, right: 12, left: 0, bottom: 18 }}>
                    <CartesianGrid stroke="#ececec" strokeDasharray="3 3" />
                    <XAxis
                      type="number"
                      dataKey="maturity"
                      domain={[1, 5]}
                      ticks={[1, 2, 3, 4, 5]}
                      tick={{ fontSize: 12, fill: '#737373' }}
                      axisLine={false}
                      tickLine={false}
                      name="Internal maturity"
                      label={{
                        value: 'Internal maturity',
                        position: 'bottom',
                        offset: 6,
                        fill: '#525252',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    />
                    <YAxis
                      type="number"
                      dataKey="clientTrust"
                      domain={[1, 5]}
                      ticks={[1, 2, 3, 4, 5]}
                      tick={{ fontSize: 12, fill: '#737373' }}
                      axisLine={false}
                      tickLine={false}
                      name="Client trust"
                      label={{
                        value: 'Client trust',
                        angle: -90,
                        position: 'insideLeft',
                        fill: '#525252',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    />
                    <ZAxis type="number" dataKey="respondents" range={[120, 900]} />
                    <Tooltip
                      isAnimationActive={false}
                      formatter={(value, name) =>
                        name === 'respondents' ? [`${value} respondents`, 'Survey size'] : [formatFivePointValue(value), name]
                      }
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ''}
                    />
                    <ReferenceLine x={3} stroke="#d4d4d8" strokeDasharray="4 4" />
                    <ReferenceLine y={3} stroke="#d4d4d8" strokeDasharray="4 4" />
                    <Scatter
                      data={realTeamData.map((team) => ({
                        name: team.name,
                        maturity: team.overall,
                        clientTrust: team.clientTrust,
                        respondents: team.respondents,
                      }))}
                    >
                      {realTeamData.map((team) => (
                        <Cell
                          key={team.id}
                          fill={team.id === selectedTeam.id ? '#14b8a6' : '#94a3b8'}
                          stroke={team.id === selectedTeam.id ? '#0f766e' : '#64748b'}
                          strokeWidth={1.5}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-[#ececec] bg-[#fbfbfb] p-5">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[#8b8b8b]">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f766e_0%,#1d4ed8_100%)] text-white">
                  <Sparkles className="h-3.5 w-3.5" />
                </span>
                Insights
              </div>

              <div className="mt-4 space-y-3">
                {[
                  'Teams with higher internal maturity are also showing stronger client trust, which suggests the current workflows are visible externally rather than staying internal only.',
                  'The strongest teams right now are the ones pairing stronger internal maturity with visible client trust, which makes them good reference cases for the rest of the org.',
                  'Lower-trust, lower-maturity teams usually still need clearer use cases, stronger examples, and better client-facing evidence of value.',
                  'The middle cluster is crowded, which suggests several teams are progressing, but their value story to clients is still not meaningfully differentiated yet.',
                  'The gap between internal maturity and client trust is still modest overall, so even small workflow wins could move multiple teams into a stronger client-perception zone.',
                ].map((insight) => (
                  <div key={insight} className="rounded-xl border border-[#ececec] bg-white px-4 py-3 text-sm leading-6 text-[#5b5b5b]">
                    {insight}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </section>

      <section id="team-comparison-signals" className="mt-8 scroll-mt-24">
        <SectionHeader
          title={`${scopeLabel} comparison signals`}
          subtitle={`The quadrant shows which ${scopeLabelPlural} are using AI broadly versus translating that usage into measurable impact.`}
        />

        <div className="grid gap-5">
          <section className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
              Usage vs Impact quadrant
            </h3>
            <div className="mt-6 h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 12, left: 0, bottom: 18 }}>
                  <CartesianGrid stroke="#ececec" strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    dataKey="Usage"
                    name="Usage"
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tick={{ fontSize: 12, fill: '#737373' }}
                    axisLine={false}
                    tickLine={false}
                    label={{
                      value: 'Usage',
                      position: 'bottom',
                      offset: 6,
                      fill: '#525252',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  />
                  <YAxis
                    type="number"
                    dataKey="Impact"
                    name="Impact"
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    tick={{ fontSize: 12, fill: '#737373' }}
                    axisLine={false}
                    tickLine={false}
                    label={{
                      value: 'Impact',
                      angle: -90,
                      position: 'insideLeft',
                      fill: '#525252',
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  />
                  <ZAxis type="number" dataKey="respondents" range={[120, 1000]} />
                  <Tooltip
                    isAnimationActive={false}
                    formatter={(value, name) => (name === 'respondents' ? [`${value} respondents`, 'Team size'] : [formatScore(Number(value)), name])}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.name ?? ''}
                  />
                  <ReferenceLine x={3} stroke="#d4d4d8" strokeDasharray="4 4" />
                  <ReferenceLine y={3} stroke="#d4d4d8" strokeDasharray="4 4" />
                    <Scatter
                    data={realTeamData.map((team) => ({
                      name: team.name,
                      Usage: team.dimensions.Usage,
                      Impact: team.dimensions.Impact,
                      respondents: team.respondents,
                    }))}
                  >
                    {realTeamData.map((team) => (
                      <Cell
                        key={team.id}
                        fill={team.id === highestImpactTeamId ? '#14b8a6' : '#94a3b8'}
                        stroke={team.id === highestImpactTeamId ? '#0f766e' : '#64748b'}
                        strokeWidth={1.5}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </section>

      <section id="team-blockers-training" className="mt-8 scroll-mt-24">
        <SectionHeader
          title="Blockers and training needs"
          subtitle="This is the most actionable layer for delivery leadership, PMO, and L&D."
        />

        <div className="grid gap-5">
          <section className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
              {scopeLabel} standardization
            </h3>
            <p className="mt-1 text-sm text-[#7a7a7a]">
              Shows whether the selected {scopeLabelLower} is operating with shared AI guidance and agreed tools, or still relying on informal and individual practice.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-[#8b8b8b]">
              <div>{selectedScopeStandardization.respondents} responses with a usable standardization signal</div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[#eaeaea] bg-[#fafafa] p-3">
                <div className="text-xs font-medium uppercase tracking-[0.14em] text-[#8b8b8b]">
                  Shared standards
                </div>
                <div className="mt-2 text-2xl font-semibold text-[#242424]">
                  {selectedScopeStandardization.respondents > 0
                    ? `${Math.round(
                        (selectedScopeStandardization.counts.standardized /
                          selectedScopeStandardization.respondents) *
                          100,
                      )}%`
                    : '0%'}
                </div>
                <p className="mt-1 text-sm text-[#7a7a7a]">
                  responses pointing to documented guidance or agreed-tool setup
                </p>
              </div>
              <div className="rounded-xl border border-[#eaeaea] bg-[#fafafa] p-3">
                <div className="text-xs font-medium uppercase tracking-[0.14em] text-[#8b8b8b]">
                  Informal norms
                </div>
                <div className="mt-2 text-2xl font-semibold text-[#242424]">
                  {selectedScopeStandardization.counts.partial}
                </div>
                <p className="mt-1 text-sm text-[#7a7a7a]">
                  responses showing some shared practice, but not a strong standard yet
                </p>
              </div>
              <div className="rounded-xl border border-[#eaeaea] bg-[#fafafa] p-3">
                <div className="text-xs font-medium uppercase tracking-[0.14em] text-[#8b8b8b]">
                  Fragmented
                </div>
                <div className="mt-2 text-2xl font-semibold text-[#242424]">
                  {selectedScopeStandardization.counts.fragmented}
                </div>
                <p className="mt-1 text-sm text-[#7a7a7a]">
                  responses saying usage is mostly individual or inconsistent
                </p>
              </div>
            </div>

            <div className="mt-6 h-[240px]">
              {selectedScopeStandardization.respondents > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={selectedScopeStandardization.data}
                    layout="vertical"
                    margin={{ top: 10, right: 12, left: 24, bottom: 0 }}
                  >
                    <CartesianGrid stroke="#ececec" strokeDasharray="3 3" horizontal={false} />
                    <XAxis
                      type="number"
                      allowDecimals={false}
                      tick={{ fontSize: 12, fill: '#737373' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={120}
                      tick={{ fontSize: 12, fill: '#525252' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip isAnimationActive={false} content={<TeamStandardizationTooltip />} />
                    {TEAM_STANDARDIZATION_SERIES.map((series, index) => (
                      <Bar
                        key={series.key}
                        dataKey={series.key}
                        stackId="team-standardization"
                        fill={series.color}
                        radius={index === TEAM_STANDARDIZATION_SERIES.length - 1 ? [0, 8, 8, 0] : undefined}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[#d4d4d8] bg-[#fafafa] px-6 text-center text-sm text-[#7a7a7a]">
                  No comparable standardization responses are available for the selected {scopeLabelLower} yet.
                </div>
              )}
            </div>
          </section>

          {selectedScopeType === 'team' ? (
            <section className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
                Skills confidence vs verification gap by department
              </h3>
              <p className="mt-1 text-sm text-[#7a7a7a]">
                Inside the selected team, this compares each department&apos;s self-rated AI skills against verification-question performance to surface uneven confidence or capability gaps.
              </p>

              <div className="mt-6 h-[280px]">
                {selectedTeamSkillsGapData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={selectedTeamSkillsGapData} margin={{ top: 10, right: 12, left: 0, bottom: 16 }}>
                      <CartesianGrid stroke="#ececec" vertical={false} strokeDasharray="3 3" />
                      <XAxis
                        dataKey="department"
                        interval={0}
                        angle={-45}
                        textAnchor="end"
                        height={92}
                        tick={{ fontSize: 12, fill: '#737373' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        domain={[1, 5]}
                        ticks={[1, 2, 3, 4, 5]}
                        tick={{ fontSize: 12, fill: '#737373' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        isAnimationActive={false}
                        cursor={{ fill: 'rgba(15, 118, 110, 0.06)' }}
                        content={<TeamSkillsGapTooltip />}
                      />
                      <Legend iconType="circle" />
                      <Bar dataKey="self" name="Self-rated skills" fill="#14b8a6" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="verification" name="Verification score" fill="#94a3b8" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[#d4d4d8] bg-[#fafafa] px-6 text-center text-sm text-[#7a7a7a]">
                    No department-level skills responses are available for the selected team yet.
                  </div>
                )}
              </div>
            </section>
          ) : null}

          <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
            <section className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
                Top blockers in selected {scopeLabelLower}
              </h3>
              <div className="mt-6 h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={selectedTeam.blockers} layout="vertical" margin={{ top: 10, right: 12, left: 40, bottom: 0 }}>
                    <CartesianGrid stroke="#ececec" horizontal={false} />
                    <XAxis type="number" domain={[0, 60]} tickFormatter={(value) => `${value}%`} tick={{ fontSize: 12, fill: '#737373' }} axisLine={false} tickLine={false} />
                    <YAxis dataKey="label" type="category" width={150} tick={{ fontSize: 11, fill: '#737373' }} axisLine={false} tickLine={false} />
                    <Tooltip isAnimationActive={false} formatter={(value) => `${value}%`} />
                    <Bar dataKey="value" fill="#0f766e" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
                Skill gap vs demand for support
              </h3>
              <p className="mt-1 text-sm text-[#7a7a7a]">
                See which seniority groups inside the selected {scopeLabelLower} want the most support, and what kind of help they are asking for.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <div className="text-sm text-[#8b8b8b]">
                  {selectedScopeSupportResponses.length} responses in current {scopeLabelLower}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {SUPPORT_DEMAND_SERIES.map((series) => {
                  const isHidden = hiddenSupportDemandSeries.includes(series.key);

                  return (
                    <InfoTooltip key={series.key}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() =>
                            setHiddenSupportDemandSeries((current) =>
                              current.includes(series.key)
                                ? current.filter((key) => key !== series.key)
                                : [...current, series.key],
                            )
                          }
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            isHidden
                              ? 'border-[#e5e7eb] bg-white text-[#9ca3af]'
                              : 'border-[#e5e7eb] bg-[#fafafa] text-[#374151] hover:bg-[#f5f5f5]'
                          }`}
                          aria-pressed={!isHidden}
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: series.color, opacity: isHidden ? 0.35 : 1 }}
                          />
                          <span className={isHidden ? 'line-through' : ''}>{series.label}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={8} className="max-w-[280px] px-3 py-2 text-[11px] leading-relaxed">
                        <div className="font-medium text-white">{series.label}</div>
                        <div className="mt-1 text-white/80">{series.detail}</div>
                      </TooltipContent>
                    </InfoTooltip>
                  );
                })}
              </div>

              <div className="mt-6 h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={selectedScopeSupportDemand} margin={{ top: 10, right: 12, left: 0, bottom: 24 }}>
                    <CartesianGrid stroke="#ececec" vertical={false} strokeDasharray="3 3" />
                    <XAxis
                      dataKey="cohort"
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={82}
                      tick={{ fontSize: 12, fill: '#737373' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tickFormatter={(value) => `${value}%`}
                      tick={{ fontSize: 12, fill: '#737373' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      isAnimationActive={false}
                      contentStyle={{
                        backgroundColor: '#242424',
                        border: 'none',
                        borderRadius: '10px',
                        padding: '10px 12px',
                        color: '#ffffff',
                        fontSize: '12px',
                      }}
                      labelStyle={{ color: '#ffffff', fontWeight: 600, marginBottom: 4 }}
                      itemStyle={{ color: '#ffffff' }}
                      labelFormatter={(label, payload) => {
                        const respondents = payload?.[0]?.payload?.respondents;
                        return `Seniority: ${label}${respondents ? ` (${respondents} respondents)` : ''}`;
                      }}
                      formatter={(value, name, item) => {
                        const respondents = item?.payload?.respondents ?? 0;
                        const count = Math.round((Number(value) / 100) * respondents);
                        return [`${value}% (${count} people)`, name];
                      }}
                    />
                    {visibleSupportDemandSeries.map((series) => (
                      <Bar
                        key={series.key}
                        dataKey={series.key}
                        name={series.label}
                        fill={series.color}
                        radius={[6, 6, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <p className="mt-3 text-xs text-[#8b8b8b]">
                Percent of respondents in each seniority cohort who selected each support type. Support needs are multi-select, so totals can exceed 100%.
              </p>
            </section>
          </div>

          <section className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
              Blockers heatmap across {scopeLabelPlural}
            </h3>
            <div className="mt-5 overflow-x-auto">
              <div className="min-w-[720px]">
                <div className="grid grid-cols-[180px_repeat(5,minmax(0,1fr))] gap-2">
                  {['Team', 'No time', 'Client restrictions', 'Tool access', 'Poor docs', 'No agreement'].map((header) => (
                    <div key={header} className="px-3 py-2 text-xs font-medium uppercase tracking-[0.14em] text-[#8b8b8b]">
                      {header}
                    </div>
                  ))}
                </div>
                <div className="mt-2 space-y-2">
                  {blockersHeatmap.map((row) => (
                    <div key={row.team} className="grid grid-cols-[180px_repeat(5,minmax(0,1fr))] gap-2">
                      <div className="flex h-24 items-center gap-3 rounded-xl border border-[#ededed] bg-[#fbfbfb] px-3 py-3 text-sm font-medium text-[#242424]">
                        <div className="rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex h-8 w-8 shrink-0 items-center justify-center select-none text-[11px] font-semibold text-white">
                          {teamBadgeLabel(row.team)}
                        </div>
                        <span className="line-clamp-2 leading-6">{row.team}</span>
                      </div>
                      {(['No time', 'Client restrictions', 'Tool access', 'Poor docs', 'No agreement'] as const).map((key) => (
                        <div
                          key={`${row.team}-${key}`}
                          className={`flex h-24 items-center justify-center rounded-xl px-3 py-3 text-center text-sm font-semibold ${
                            row[key] >= 40
                              ? 'bg-[#334155] text-white'
                              : row[key] >= 28
                              ? 'bg-[#64748b] text-white'
                              : row[key] >= 20
                              ? 'bg-[#94a3b8] text-[#0f172a]'
                              : 'bg-[#e5e7eb] text-[#475569]'
                          }`}
                        >
                          {row[key]}%
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
