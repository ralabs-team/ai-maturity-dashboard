import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, CircleHelp, Loader2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import AskAiSidebar, { AskAiTriggerButton } from '../components/ai/AskAiSidebar';
import {

  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from '../components/charts/recharts';
import ChartFeedback from '../components/analytics/ChartFeedback';
import SuggestedGoalCard from '../components/goals/SuggestedGoalCard';
import PageHeader from '../components/layout/PageHeader';
import FloatingSectionNav from '../components/layout/FloatingSectionNav';
import { useNavigationPending } from '../components/layout/NavigationPendingContext';
import { useSensitiveData } from '../components/privacy/SensitiveDataContext';
import ProjectAvatar from '../components/ui/ProjectAvatar';
import SensitiveText from '../components/ui/SensitiveText';
import UsageImpactQuadrantCard from '../components/charts/organization/UsageImpactQuadrantCard';
import SkillsConfidenceGapCard from '../components/charts/organization/SkillsConfidenceGapCard';
import ToolAccessConstraintMapCard from '../components/charts/organization/ToolAccessConstraintMapCard';
import EmbeddednessSharedPracticesGapCard from '../components/charts/organization/EmbeddednessSharedPracticesGapCard';
import ImpactWithoutResilienceCard from '../components/charts/organization/ImpactWithoutResilienceCard';
import SupportDemandSkillsGapCard from '../components/charts/organization/SupportDemandSkillsGapCard';
import SensitiveDataRiskPocketsCard from '../components/charts/organization/SensitiveDataRiskPocketsCard';
import WorkflowTransformationGapCard from '../components/charts/organization/WorkflowTransformationGapCard';
import VisionToActionGapCard from '../components/charts/organization/VisionToActionGapCard';
import CultureSpreadGapCard from '../components/charts/organization/CultureSpreadGapCard';
import RiskGovernanceHotspotsCard from '../components/charts/organization/RiskGovernanceHotspotsCard';
import MaturityVisibilityGapCard from '../components/charts/organization/MaturityVisibilityGapCard';
import ResistanceByScopeCard, {
  buildResistanceByScopeRows,
} from '../components/charts/organization/ResistanceByScopeCard';
import ResistanceReasonsCard, {
  buildResistanceSummary,
  RESISTANCE_SCORE_HELP_TEXT,
} from '../components/charts/organization/ResistanceReasonsCard';
import {
  AI_CHAMPION_SCORE_THRESHOLD,
  buildChampionRows,
  buildTopChampionRows,
} from '../components/organization/ChampionVisibilityOptions';
import { buildExperienceReviewCohorts } from '../components/organization/ExperienceReviewOptions';
import CompactUsageMultiSelect from '../components/organization/CompactUsageMultiSelect';
import OrganizationDimensionCultureSection from '../components/organization/OrganizationDimensionCultureSection';
import OrganizationDimensionImpactSection from '../components/organization/OrganizationDimensionImpactSection';
import TopDeviatingPeopleCard from '../components/organization/TopDeviatingPeopleCard';
import OrganizationDimensionVisionSection from '../components/organization/OrganizationDimensionVisionSection';
import SectionHeader from '../components/organization/OrganizationSectionHeader';
import ProjectArchetypeBubbleChart, {
  type ArchetypeBubbleRow,
} from '../components/charts/organization/ProjectArchetypeBubbleChart';
import { Tooltip as InfoTooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip';
import { buildDeviatingPeopleRows } from '../data/survey/deviationInsights';
import { buildTeamSuggestedGoals } from '../data/survey/goals';
import {
  resolveIndividualArchetype,
  type IndividualArchetypeProfile,
} from '../data/survey/individualArchetypes';
import {
  resolveTeamArchetype,
  type TeamArchetypeProfile,
} from '../data/survey/teamArchetypes';
import { useSurveyData } from '../data/survey/SurveyDataContext';
import type { SupportDemandSeriesKey } from '../data/survey/supportDemand';
import { buildTeamValidatedScopeRows } from '../data/survey/teamValidatedView';
import { useTableSortPending } from '../hooks/useTableSortPending';
import type { AskAiResearchPack } from '../shared/api/askAi';
import {
  allDepartmentsList,
  allProjectsList,
  computeCompositeQuestionScore,
  computeScores,
  type RawResponse,
} from '../data/survey/scoring';
import { LEVEL_LABELS, scoreToLevel, TECH_DIMENSIONS, type Individual, type MaturityLevel, type TechDimension } from '../data/types';

type CompositeDimension = 'Data' | 'Governance';
type OrgDimension = TechDimension | CompositeDimension;
type UsageImpactScope = 'department' | 'team';
type UsageImpactQuadrantKey = 'highHigh' | 'highLow' | 'lowHigh' | 'lowLow';
type HeatmapRow = Record<OrgDimension, number> & {
  id: string;
  department: string;
  respondents: number;
  overall: number;
  level: string;
  archetype: TeamArchetypeProfile;
};
type HeatmapSortKey = 'department' | 'overall' | 'level' | 'archetype' | 'respondents' | OrgDimension;
type HeatmapSortDirection = 'asc' | 'desc';
type ProjectRankingRow = {
  id: string;
  name: string;
  respondents: number;
  overall: number;
  level: string;
  archetype: TeamArchetypeProfile;
  dimensions: Record<OrgDimension, number>;
};
type ProjectRankingSortKey = 'name' | 'overall' | 'level' | 'archetype' | 'respondents' | OrgDimension;
type ProjectRankingSortDirection = 'asc' | 'desc';
type UsageFrequencyRow = {
  label: string;
  count: number;
};
type MentionCloudEntry = {
  label: string;
  count: number;
};
type OrganizationAiResearchPack = AskAiResearchPack;
type UsageCategoryRow = {
  label: string;
  count: number;
  share: number;
};
type UsageCategoryInsight = {
  respondents: number;
  averageSelections: number;
  rows: UsageCategoryRow[];
};
type UsageCategoryMode = 'needle' | 'group';
type EmbeddednessCategoryKey =
  | 'separate'
  | 'occasional'
  | 'standard'
  | 'deep'
  | 'inseparable'
  | 'notActive'
  | 'notYet';
type SharedPracticesCategoryKey = 'fragmented' | 'partial' | 'standardized';
type SkillsBaselineCategoryKey =
  | 'unfamiliar'
  | 'foundational'
  | 'working'
  | 'advanced'
  | 'expert';
type SensitiveDataCategoryKey =
  | 'risky'
  | 'uncertain'
  | 'basic'
  | 'checklist'
  | 'governed';
type ImpactFilterKey =
  | 'personalOutputImpact'
  | 'workflowTransformation'
  | 'hoursSaved'
  | 'dependencyOnAi'
  | 'accessLicensing'
  | 'whoPays'
  | 'costMaturity'
  | 'planningImpact'
  | 'nonAiBlocker';
type PersonalOutputImpactKey =
  | 'noChange'
  | 'slight'
  | 'noticeable'
  | 'significant'
  | 'transformative';
type WorkflowTransformationKey =
  | 'sameTasksFaster'
  | 'tweakedTasks'
  | 'oneWorkflowChanged'
  | 'redesignedProcess'
  | 'newAiEnabledProcess';
type DependencyImpactKey =
  | 'noImpact'
  | 'minor'
  | 'noticeable'
  | 'significant'
  | 'major';
type AccessLicensingKey =
  | 'haveEverything'
  | 'needPaidTier'
  | 'wantSpecificTool'
  | 'dontKnowAvailable'
  | 'haventThought';
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
type BlockerCategoryKey =
  | 'nothingMostlySkills'
  | 'noTeamAgreement'
  | 'noTimeToExperiment'
  | 'accessLicensingLimits'
  | 'dataSensitivityOrClient'
  | 'unclearProcessesOrSystem'
  | 'missingDocsOrReference'
  | 'technicalEnvironment'
  | 'unclearRoleFit'
  | 'other';
type CultureFilterKey =
  | 'growthMomentum'
  | 'experimentationInitiative'
  | 'knowledgeSharing'
  | 'teamAiMaturity'
  | 'organizationalSupport'
  | 'toolSatisfaction'
  | 'enjoyability'
  | 'practiceResilience'
  | 'knowledgeArtifacts'
  | 'influenceScore'
  | 'supportNeeded'
  | 'handsOnHelp'
  | 'businessOnboarding';
type GrowthMomentumKey =
  | 'notDeveloping'
  | 'reactiveLearning'
  | 'steadyLearning'
  | 'activelySeeking'
  | 'teachingOthers';
type ExperimentationInitiativeKey =
  | 'no'
  | 'thoughtButDidnt'
  | 'yesOnce'
  | 'yesMultiple'
  | 'regularlyExperimentAndShare';
type KnowledgeSharingKey =
  | 'never'
  | 'rarely'
  | 'occasionally'
  | 'regularlyShare'
  | 'goToResource';
type TeamAiMaturityKey =
  | 'veryLow'
  | 'belowAverage'
  | 'average'
  | 'aboveAverage'
  | 'veryHigh';
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
type PracticeResilienceKey =
  | 'noPractices'
  | 'championDependent'
  | 'partiallyResilient'
  | 'teamOwned'
  | 'documentedOnboarded';
type KnowledgeArtifactKey =
  | 'noArtifact'
  | 'informalNotes'
  | 'shortReusableArtifact'
  | 'substantialGuide'
  | 'multipleArtifacts';
type InfluenceScoreKey =
  | 'noInfluenceYet'
  | 'adviceWithoutAdoption'
  | 'oneAdoptionExample'
  | 'teamLevelInfluence'
  | 'crossTeamInfluence';
type BusinessOnboardingKey =
  | 'noOnboarding'
  | 'informalOnboarding'
  | 'partOfOnboarding';
type VisionFilterKey =
  | 'opportunityClarity'
  | 'actionPriorities'
  | 'workChangeImagination'
  | 'opportunitySelectionMaturity'
  | 'businessValueConnection'
  | 'personalDevelopmentDirection'
  | 'visionReadiness'
  | 'visionActionMix';
type OpportunityClarityKey =
  | 'stillExploring'
  | 'generalOpportunities'
  | 'oneToTwoTasks'
  | 'specificWorkflows'
  | 'prioritizedValueFeasibility';
type WorkChangeImaginationKey =
  | 'stillExploring'
  | 'speedUpSmallTasks'
  | 'improvePartsOfWorkflow'
  | 'workflowCouldDiffer'
  | 'futureAiAssistedModel';
type OpportunitySelectionKey =
  | 'generalTrends'
  | 'someoneElseSuggests'
  | 'usefulForMyTasks'
  | 'solvesRealProblem'
  | 'evaluatedByValueAndImpact';
type BusinessValueConnectionKey =
  | 'stillLearningBroaderValue'
  | 'personalProductivity'
  | 'internalEfficiency'
  | 'deliveryQualityCommunication'
  | 'businessModelClientAdvantage';
type PersonalDevelopmentDirectionKey =
  | 'stillFiguringOut'
  | 'generalAiBasics'
  | 'oneSpecificSkill'
  | 'roleStrengtheningCapability'
  | 'clearRoleLinkedDirection';
type VisionReadinessKey =
  | 'emerging'
  | 'earlyFraming'
  | 'structuredThinking'
  | 'strategicVision'
  | 'forwardLeading';
type EmbeddednessDistributionRow = {
  cohort: string;
  respondents: number;
} & Record<EmbeddednessCategoryKey, number>;
type SharedPracticesDistributionRow = {
  cohort: string;
  respondents: number;
} & Record<SharedPracticesCategoryKey, number>;
type SkillsBaselineDistributionRow = {
  cohort: string;
  respondents: number;
} & Record<SkillsBaselineCategoryKey, number>;
type SensitiveDataDistributionRow = {
  cohort: string;
  respondents: number;
} & Record<SensitiveDataCategoryKey, number>;
type PersonalOutputImpactDistributionRow = {
  cohort: string;
  respondents: number;
} & Record<PersonalOutputImpactKey, number>;
type WorkflowTransformationDistributionRow = {
  cohort: string;
  respondents: number;
} & Record<WorkflowTransformationKey, number>;
type DependencyImpactDistributionRow = {
  cohort: string;
  respondents: number;
} & Record<DependencyImpactKey, number>;
type AccessLicensingDistributionRow = {
  cohort: string;
  respondents: number;
} & Record<AccessLicensingKey, number>;
type CostMaturityDistributionRow = {
  cohort: string;
  respondents: number;
} & Record<CostMaturityKey, number>;
type PlanningImpactDistributionRow = {
  cohort: string;
  respondents: number;
} & Record<PlanningImpactKey, number>;
type GrowthMomentumDistributionRow = {
  cohort: string;
  respondents: number;
} & Record<GrowthMomentumKey, number>;
type ExperimentationInitiativeDistributionRow = {
  cohort: string;
  respondents: number;
} & Record<ExperimentationInitiativeKey, number>;
type KnowledgeSharingDistributionRow = {
  cohort: string;
  respondents: number;
} & Record<KnowledgeSharingKey, number>;
type TeamAiMaturityDistributionRow = {
  cohort: string;
  respondents: number;
} & Record<TeamAiMaturityKey, number>;
type OrganizationalSupportDistributionRow = {
  cohort: string;
  respondents: number;
} & Record<OrganizationalSupportKey, number>;
type ToolSatisfactionDistributionRow = {
  cohort: string;
  respondents: number;
} & Record<ToolSatisfactionKey, number>;
type EnjoyabilityDistributionRow = {
  cohort: string;
  respondents: number;
} & Record<EnjoyabilityKey, number>;
type PracticeResilienceDistributionRow = {
  cohort: string;
  respondents: number;
} & Record<PracticeResilienceKey, number>;
type KnowledgeArtifactDistributionRow = {
  cohort: string;
  respondents: number;
} & Record<KnowledgeArtifactKey, number>;
type InfluenceScoreDistributionRow = {
  cohort: string;
  respondents: number;
} & Record<InfluenceScoreKey, number>;
type BusinessOnboardingDistributionRow = {
  cohort: string;
  respondents: number;
} & Record<BusinessOnboardingKey, number>;
type OpportunityClarityDistributionRow = {
  cohort: string;
  respondents: number;
} & Record<OpportunityClarityKey, number>;
type WorkChangeImaginationDistributionRow = {
  cohort: string;
  respondents: number;
} & Record<WorkChangeImaginationKey, number>;
type OpportunitySelectionDistributionRow = {
  cohort: string;
  respondents: number;
} & Record<OpportunitySelectionKey, number>;
type BusinessValueConnectionDistributionRow = {
  cohort: string;
  respondents: number;
} & Record<BusinessValueConnectionKey, number>;
type PersonalDevelopmentDirectionDistributionRow = {
  cohort: string;
  respondents: number;
} & Record<PersonalDevelopmentDirectionKey, number>;
type VisionReadinessDistributionRow = {
  cohort: string;
  respondents: number;
} & Record<VisionReadinessKey, number>;
type VisionActionMixComparisonRow = {
  label: string;
  businessCount: number;
  businessShare: number;
  deliveryCount: number;
  deliveryShare: number;
};
type VisionReadinessAverageRow = {
  cohort: string;
  color: string;
  averageScore: number | null;
};
type PromptTechniqueComparisonRow = {
  label: string;
  businessCount: number;
  businessShare: number;
  deliveryCount: number;
  deliveryShare: number;
};
type ImpactComparisonRow = {
  label: string;
  businessCount: number;
  businessShare: number;
  deliveryCount: number;
  deliveryShare: number;
};
type SummaryCard = {
  title: string;
  value: string;
  detail: string;
  accent?: boolean;
  delta?: string;
  deltaDetail?: string;
  helpText?: string;
  hoverValue?: string;
  onClick?: () => void;
};

type SurveyType = NonNullable<RawResponse['surveyType']>;
type GapScope = 'department' | 'team';
type MaturityMapPoint = {
  dimension: TechDimension;
  current: number;
  previous: number;
};
type MaturityMapSnapshot = {
  data: MaturityMapPoint[];
  detail: string;
};
type MaturityDistributionLevelKey =
  | 'L1 Observer'
  | 'L2 Explorer'
  | 'L3 Practitioner'
  | 'L4 Orchestrator'
  | 'L5 Native';
type MaturityDistributionRow = {
  level: MaturityDistributionLevelKey;
  count: number;
  share: number;
  fill: string;
  scoreRange: string;
};

const LEVEL_COLORS = {
  Observer: '#e5e7eb',
  Explorer: '#cbd5e1',
  Practitioner: '#94a3b8',
  Orchestrator: '#64748b',
  Native: '#334155',
} as const;

const MATURITY_DISTRIBUTION_SERIES = [
  { key: 'L1 Observer', color: LEVEL_COLORS.Observer, scoreRange: '1.0-1.4 / 5' },
  { key: 'L2 Explorer', color: LEVEL_COLORS.Explorer, scoreRange: '1.5-2.4 / 5' },
  { key: 'L3 Practitioner', color: LEVEL_COLORS.Practitioner, scoreRange: '2.5-3.4 / 5' },
  { key: 'L4 Orchestrator', color: LEVEL_COLORS.Orchestrator, scoreRange: '3.5-4.4 / 5' },
  { key: 'L5 Native', color: LEVEL_COLORS.Native, scoreRange: '4.5-5.0 / 5' },
] as const satisfies ReadonlyArray<{
  key: MaturityDistributionLevelKey;
  color: string;
  scoreRange: string;
}>;

const DIMENSION_KEYS: OrgDimension[] = [...TECH_DIMENSIONS, 'Data', 'Governance'];
const DIMENSION_LABELS: Record<OrgDimension, string> = {
  Usage: 'Dim1: Usage',
  Skills: 'Dim2: Skills',
  Impact: 'Dim3: Impact',
  Culture: 'Dim4: Culture',
  Vision: 'Dim5: Vision',
  Data: 'Dim6: Data',
  Governance: 'Dim7: Governance',
};
const COMPOSITE_QUESTION_KEYS: Record<
  CompositeDimension,
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

const MATURITY_LEVELS: MaturityLevel[] = [1, 2, 3, 4, 5];

const ORG_QUADRANT_COLORS = {
  highHigh: '#0f766e',
  highLow: '#2563eb',
  lowHigh: '#7c3aed',
  lowLow: '#94a3b8',
} as const;

const INDIVIDUAL_ARCHETYPE_BUBBLE_COLORS: Record<string, string> = {
  earlyExplorer: '#94a3b8',
  visioneer: '#2563eb',
  individualExpert: '#d97706',
  toolOperator: '#0891b2',
  skepticalPerformer: '#7c3aed',
  outcomeHunter: '#dc2626',
  habitBuilder: '#059669',
  aiNative: '#4338ca',
};

const DELIVERY_USAGE_ACTIVITY_OPTIONS = [
  'Writing / editing / communication',
  'Research & summarization',
  'Planning, estimation & structuring ideas',
  'Code generation',
  'Code review (using AI to review PRs or assist review)',
  'Debugging and troubleshooting',
  'Refactoring or improving existing code',
  'Writing tests (unit, integration, e2e)',
  'Technical design or architecture decisions',
  'Visual tasks (diagrams, mockups, screenshot analysis, UI generation).',
  'Documentation (READMEs, ADRs, API docs)',
  'DevOps / infrastructure / CI-CD',
  'Learning, upskilling, or understanding unfamiliar codebases',
  "I don't use AI in any workflow",
] as const;
const BUSINESS_USAGE_WORKFLOW_OPTIONS = [
  'Writing / editing',
  'Communication (emails, messages, client comms)',
  'Research & summarization',
  'Planning & structuring ideas',
  'Presentations & slide creation',
  'Data analysis or reporting',
  'Design or visual content',
  'Hiring, sourcing, or screening',
  'Learning or upskilling (e.g. understanding a new topic, preparing for a certification, learning a new domain)',
  "I don't use AI in any workflow",
] as const;
const DELIVERY_USAGE_ACTIVITY_MAP = new Map(
  DELIVERY_USAGE_ACTIVITY_OPTIONS.map((label) => [label.toLowerCase(), label]),
);
const BUSINESS_USAGE_WORKFLOW_MAP = new Map(
  BUSINESS_USAGE_WORKFLOW_OPTIONS.map((label) => [label.toLowerCase(), label]),
);
const DELIVERY_USAGE_GROUP_LABELS = {
  knowledge_work: 'Knowledge work',
  engineering_execution: 'Engineering execution',
  high_leverage: 'High leverage',
  other_custom: 'Other / custom',
} as const;
const BUSINESS_USAGE_GROUP_LABELS = {
  communication: 'Communication',
  research: 'Research',
  planning: 'Planning',
  execution: 'Execution',
  enablement: 'Enablement',
  other_custom: 'Other / custom',
} as const;
const DELIVERY_USAGE_GROUP_MAP = new Map<string, keyof typeof DELIVERY_USAGE_GROUP_LABELS>([
  ['writing / editing / communication', 'knowledge_work'],
  ['research & summarization', 'knowledge_work'],
  ['planning, estimation & structuring ideas', 'knowledge_work'],
  ['code generation', 'engineering_execution'],
  ['code review (using ai to review prs or assist review)', 'engineering_execution'],
  ['debugging and troubleshooting', 'engineering_execution'],
  ['refactoring or improving existing code', 'engineering_execution'],
  ['writing tests (unit, integration, e2e)', 'engineering_execution'],
  ['technical design or architecture decisions', 'high_leverage'],
  ['visual tasks (diagrams, mockups, screenshot analysis, ui generation).', 'knowledge_work'],
  ['documentation (readmes, adrs, api docs)', 'knowledge_work'],
  ['devops / infrastructure / ci-cd', 'high_leverage'],
  ['learning, upskilling, or understanding unfamiliar codebases', 'knowledge_work'],
]);
const BUSINESS_USAGE_GROUP_MAP = new Map<string, keyof typeof BUSINESS_USAGE_GROUP_LABELS>([
  ['writing / editing', 'communication'],
  ['communication (emails, messages, client comms)', 'communication'],
  ['research & summarization', 'research'],
  ['planning & structuring ideas', 'planning'],
  ['presentations & slide creation', 'communication'],
  ['data analysis or reporting', 'execution'],
  ['design or visual content', 'execution'],
  ['hiring, sourcing, or screening', 'execution'],
  ['learning or upskilling (e.g. understanding a new topic, preparing for a certification, learning a new domain)', 'enablement'],
  ['transcribing - chatgpt\'s dictating function & translation.', 'communication'],
  ['call summarizing', 'communication'],
]);
const USAGE_MODE_OPTIONS: Array<{ key: UsageCategoryMode; label: string }> = [
  { key: 'needle', label: 'Needles' },
  { key: 'group', label: 'Groups' },
];
const EMBEDDEDNESS_SERIES = [
  { key: 'separate', label: 'Separate from work', color: '#cbd5e1' },
  { key: 'occasional', label: 'Occasional use', color: '#93c5fd' },
  { key: 'standard', label: 'Standard workflow', color: '#60a5fa' },
  { key: 'deep', label: 'Deeply integrated', color: '#2563eb' },
  { key: 'inseparable', label: 'Inseparable', color: '#0f766e' },
  { key: 'notActive', label: 'Not currently active', color: '#d4d4d8' },
  { key: 'notYet', label: 'Not figured out yet', color: '#f59e0b' },
] as const satisfies ReadonlyArray<{
  key: EmbeddednessCategoryKey;
  label: string;
  color: string;
}>;
const SHARED_PRACTICES_SERIES = [
  { key: 'standardized', label: 'Shared guidelines / agreed tools', color: '#0f766e' },
  { key: 'partial', label: 'Informal norms', color: '#60a5fa' },
  { key: 'fragmented', label: 'Individual / inconsistent', color: '#d1d5db' },
] as const satisfies ReadonlyArray<{
  key: SharedPracticesCategoryKey;
  label: string;
  color: string;
}>;
const SKILLS_BASELINE_SERIES = [
  { key: 'unfamiliar', label: 'Unfamiliar / not explored', color: '#d4d4d8' },
  { key: 'foundational', label: 'Foundational awareness', color: '#93c5fd' },
  { key: 'working', label: 'Working understanding', color: '#60a5fa' },
  { key: 'advanced', label: 'Can explain and guide', color: '#2563eb' },
  { key: 'expert', label: 'Can teach or make technical decisions', color: '#0f766e' },
] as const satisfies ReadonlyArray<{
  key: SkillsBaselineCategoryKey;
  label: string;
  color: string;
}>;
const SENSITIVE_DATA_SERIES = [
  { key: 'risky', label: 'Risky handling', color: '#fca5a5' },
  { key: 'uncertain', label: 'Cautious but unclear', color: '#fdba74' },
  { key: 'basic', label: 'Basic hygiene', color: '#93c5fd' },
  { key: 'checklist', label: 'Clear personal checklist', color: '#2563eb' },
  { key: 'governed', label: 'Policy-driven / compliant', color: '#0f766e' },
] as const satisfies ReadonlyArray<{
  key: SensitiveDataCategoryKey;
  label: string;
  color: string;
}>;
const PROMPT_TECHNIQUE_OPTIONS = [
  'System prompts or custom instructions',
  'Role or persona assignment (e.g. "act as a senior PM")',
  'Examples in the prompt (few-shot)',
  'Structured output formatting (JSON, markdown, tables, etc.)',
  'Chain-of-thought or step-by-step instructions',
  'Explicit constraints or boundaries (e.g. "do not include X", "keep under 200 words")',
  'Providing reference documents or files as context',
  'Asking AI to critique or review its own output',
  'Multi-turn iteration (building on previous responses)',
  'Negative examples ("here\'s what I don\'t want")',
  'Task decomposition (breaking one task into sequential prompts)',
] as const;
const PROMPT_TECHNIQUE_MAP = new Map(
  PROMPT_TECHNIQUE_OPTIONS.map((label) => [label.toLowerCase(), label]),
);
const IMPACT_COHORT_COLORS = {
  business: '#2563eb',
  delivery: '#14b8a6',
} as const;
const IMPACT_FILTER_KEYS: ImpactFilterKey[] = [
  'personalOutputImpact',
  'workflowTransformation',
  'hoursSaved',
  'dependencyOnAi',
  'accessLicensing',
  'whoPays',
  'costMaturity',
  'planningImpact',
  'nonAiBlocker',
];
const PERSONAL_OUTPUT_IMPACT_SERIES = [
  { key: 'noChange', label: 'No change', color: '#d4d4d8' },
  { key: 'slight', label: 'Slight improvement', color: '#bfdbfe' },
  { key: 'noticeable', label: 'Noticeable improvement', color: '#60a5fa' },
  { key: 'significant', label: 'Significant improvement', color: '#2563eb' },
  { key: 'transformative', label: 'Transformative', color: '#0f766e' },
] as const satisfies ReadonlyArray<{
  key: PersonalOutputImpactKey;
  label: string;
  color: string;
}>;
const WORKFLOW_TRANSFORMATION_SERIES = [
  { key: 'sameTasksFaster', label: 'Same tasks faster', color: '#d4d4d8' },
  { key: 'tweakedTasks', label: 'Tweaked a few tasks', color: '#bfdbfe' },
  { key: 'oneWorkflowChanged', label: 'One workflow meaningfully changed', color: '#60a5fa' },
  { key: 'redesignedProcess', label: 'Redesigned / eliminated a process', color: '#2563eb' },
  { key: 'newAiEnabledProcess', label: 'Introduced a new AI-enabled process', color: '#0f766e' },
] as const satisfies ReadonlyArray<{
  key: WorkflowTransformationKey;
  label: string;
  color: string;
}>;
const HOURS_SAVED_LABELS = [
  '0 hours',
  'Less than 1 hour',
  '1–3 hours',
  '3–5 hours',
  'More than 5 hours',
] as const;
const DEPENDENCY_IMPACT_SERIES = [
  { key: 'noImpact', label: 'No real impact', color: '#d4d4d8' },
  { key: 'minor', label: 'Minor inconvenience', color: '#bfdbfe' },
  { key: 'noticeable', label: 'Noticeable setback', color: '#60a5fa' },
  { key: 'significant', label: 'Significant impact', color: '#2563eb' },
  { key: 'major', label: 'Major disruption', color: '#0f766e' },
] as const satisfies ReadonlyArray<{
  key: DependencyImpactKey;
  label: string;
  color: string;
}>;
const ACCESS_LICENSING_SERIES = [
  { key: 'haveEverything', label: 'Have everything needed', color: '#0f766e' },
  { key: 'needPaidTier', label: 'Need paid tier of current tool', color: '#60a5fa' },
  { key: 'wantSpecificTool', label: 'Want a specific tool not available', color: '#2563eb' },
  { key: 'dontKnowAvailable', label: 'Don’t know what’s available/requestable', color: '#fdba74' },
  { key: 'haventThought', label: 'Haven’t thought about it', color: '#d4d4d8' },
] as const satisfies ReadonlyArray<{
  key: AccessLicensingKey;
  label: string;
  color: string;
}>;
const WHO_PAYS_LABELS = [
  'Only free tiers',
  'Out of pocket',
  'Company subscription',
  'Client pays',
  'Company + self-paid extras',
  'Not sure',
] as const;
const COST_MATURITY_SERIES = [
  { key: 'unaware', label: 'Unaware', color: '#d4d4d8' },
  { key: 'basicAwareness', label: 'Basic awareness', color: '#bfdbfe' },
  { key: 'awareButPassive', label: 'Aware but passive', color: '#60a5fa' },
  { key: 'selectiveOptimization', label: 'Selective optimization', color: '#2563eb' },
  { key: 'activeOptimization', label: 'Active cost optimization', color: '#0f766e' },
] as const satisfies ReadonlyArray<{
  key: CostMaturityKey;
  label: string;
  color: string;
}>;
const PLANNING_IMPACT_SERIES = [
  { key: 'samePlanning', label: 'Same planning approach', color: '#d4d4d8' },
  { key: 'informalFactor', label: 'Informally factor AI in', color: '#bfdbfe' },
  { key: 'explicitlyAdjust', label: 'Explicitly adjust estimates', color: '#60a5fa' },
  { key: 'planningChanged', label: 'Planning fundamentally changed', color: '#2563eb' },
  { key: 'inseparable', label: 'AI inseparable from estimation', color: '#0f766e' },
] as const satisfies ReadonlyArray<{
  key: PlanningImpactKey;
  label: string;
  color: string;
}>;
const BLOCKER_LABELS = [
  'Nothing / mainly AI skills',
  'No team agreement on AI usage',
  'No time to experiment',
  'Access / licensing limits',
  'Data sensitivity / client restrictions',
  'Unclear processes / system context',
  'Missing docs / templates / reference material',
  'Technical environment / tech debt',
  'Unclear role fit',
  'Other',
] as const;
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
} as const satisfies Record<BlockerCategoryKey, (typeof BLOCKER_LABELS)[number]>;
const CULTURE_FILTER_KEYS: CultureFilterKey[] = [
  'growthMomentum',
  'experimentationInitiative',
  'knowledgeSharing',
  'teamAiMaturity',
  'organizationalSupport',
  'toolSatisfaction',
  'enjoyability',
  'practiceResilience',
  'knowledgeArtifacts',
  'influenceScore',
  'supportNeeded',
  'handsOnHelp',
  'businessOnboarding',
];
const GROWTH_MOMENTUM_SERIES = [
  { key: 'notDeveloping', label: 'Not developing', color: '#d4d4d8' },
  { key: 'reactiveLearning', label: 'Reactive learning', color: '#cbd5e1' },
  { key: 'steadyLearning', label: 'Steady learning', color: '#93c5fd' },
  { key: 'activelySeeking', label: 'Actively seeking', color: '#2563eb' },
  { key: 'teachingOthers', label: 'Teaching others', color: '#0f766e' },
] as const satisfies ReadonlyArray<{ key: GrowthMomentumKey; label: string; color: string }>;
const EXPERIMENTATION_INITIATIVE_SERIES = [
  { key: 'no', label: 'No', color: '#d4d4d8' },
  { key: 'thoughtButDidnt', label: "Thought about it but didn't", color: '#cbd5e1' },
  { key: 'yesOnce', label: 'Yes, once', color: '#93c5fd' },
  { key: 'yesMultiple', label: 'Yes, multiple times', color: '#2563eb' },
  {
    key: 'regularlyExperimentAndShare',
    label: 'Regularly experiment and share',
    color: '#0f766e',
  },
] as const satisfies ReadonlyArray<{
  key: ExperimentationInitiativeKey;
  label: string;
  color: string;
}>;
const KNOWLEDGE_SHARING_SERIES = [
  { key: 'never', label: 'Never', color: '#d4d4d8' },
  { key: 'rarely', label: 'Rarely', color: '#cbd5e1' },
  { key: 'occasionally', label: 'Occasionally', color: '#93c5fd' },
  { key: 'regularlyShare', label: 'Regularly share', color: '#2563eb' },
  { key: 'goToResource', label: 'Go-to resource', color: '#0f766e' },
] as const satisfies ReadonlyArray<{ key: KnowledgeSharingKey; label: string; color: string }>;
const TEAM_AI_MATURITY_SERIES = [
  { key: 'veryLow', label: 'Very low', color: '#d4d4d8' },
  { key: 'belowAverage', label: 'Below average', color: '#cbd5e1' },
  { key: 'average', label: 'Average', color: '#93c5fd' },
  { key: 'aboveAverage', label: 'Above average', color: '#2563eb' },
  { key: 'veryHigh', label: 'Very high', color: '#0f766e' },
] as const satisfies ReadonlyArray<{ key: TeamAiMaturityKey; label: string; color: string }>;
const ORGANIZATIONAL_SUPPORT_SERIES = [
  { key: 'notSupportedAtAll', label: 'Not supported at all', color: '#d4d4d8' },
  { key: 'minimallySupported', label: 'Minimally supported', color: '#cbd5e1' },
  { key: 'somewhatSupported', label: 'Somewhat supported', color: '#93c5fd' },
  { key: 'wellSupported', label: 'Well supported', color: '#2563eb' },
  { key: 'veryWellSupported', label: 'Very well supported', color: '#0f766e' },
] as const satisfies ReadonlyArray<{
  key: OrganizationalSupportKey;
  label: string;
  color: string;
}>;
const TOOL_SATISFACTION_SERIES = [
  { key: 'veryDissatisfied', label: 'Very dissatisfied', color: '#d4d4d8' },
  { key: 'dissatisfied', label: 'Dissatisfied', color: '#cbd5e1' },
  { key: 'neutral', label: 'Neutral', color: '#93c5fd' },
  { key: 'satisfied', label: 'Satisfied', color: '#2563eb' },
  { key: 'verySatisfied', label: 'Very satisfied', color: '#0f766e' },
] as const satisfies ReadonlyArray<{ key: ToolSatisfactionKey; label: string; color: string }>;
const ENJOYABILITY_SERIES = [
  { key: 'muchLessEnjoyable', label: 'Much less enjoyable', color: '#d4d4d8' },
  { key: 'slightlyLessEnjoyable', label: 'Slightly less enjoyable', color: '#cbd5e1' },
  { key: 'noChange', label: 'No change', color: '#93c5fd' },
  { key: 'moreEnjoyable', label: 'More enjoyable', color: '#2563eb' },
  { key: 'muchMoreEnjoyable', label: 'Much more enjoyable', color: '#0f766e' },
] as const satisfies ReadonlyArray<{ key: EnjoyabilityKey; label: string; color: string }>;
const PRACTICE_RESILIENCE_SERIES = [
  { key: 'noPractices', label: 'No practices to continue', color: '#d4d4d8' },
  { key: 'championDependent', label: 'Champion-dependent', color: '#cbd5e1' },
  { key: 'partiallyResilient', label: 'Partially resilient', color: '#93c5fd' },
  { key: 'teamOwned', label: 'Team-owned', color: '#2563eb' },
  { key: 'documentedOnboarded', label: 'Documented / onboarded', color: '#0f766e' },
] as const satisfies ReadonlyArray<{
  key: PracticeResilienceKey;
  label: string;
  color: string;
}>;
const KNOWLEDGE_ARTIFACT_SERIES = [
  { key: 'noArtifact', label: 'No artifact', color: '#d4d4d8' },
  { key: 'informalNotes', label: 'Informal notes', color: '#cbd5e1' },
  { key: 'shortReusableArtifact', label: 'Short reusable artifact', color: '#93c5fd' },
  { key: 'substantialGuide', label: 'Substantial guide / training material', color: '#2563eb' },
  { key: 'multipleArtifacts', label: 'Multiple artifacts', color: '#0f766e' },
] as const satisfies ReadonlyArray<{
  key: KnowledgeArtifactKey;
  label: string;
  color: string;
}>;
const INFLUENCE_SCORE_SERIES = [
  { key: 'noInfluenceYet', label: 'No influence yet', color: '#d4d4d8' },
  { key: 'adviceWithoutAdoption', label: 'Advice without clear adoption', color: '#cbd5e1' },
  { key: 'oneAdoptionExample', label: 'One adoption example', color: '#93c5fd' },
  { key: 'teamLevelInfluence', label: 'Team-level influence', color: '#2563eb' },
  { key: 'crossTeamInfluence', label: 'Cross-team influence', color: '#0f766e' },
] as const satisfies ReadonlyArray<{
  key: InfluenceScoreKey;
  label: string;
  color: string;
}>;
const BUSINESS_ONBOARDING_SERIES = [
  { key: 'noOnboarding', label: 'No onboarding', color: '#d4d4d8' },
  { key: 'informalOnboarding', label: 'Informal onboarding', color: '#93c5fd' },
  { key: 'partOfOnboarding', label: 'AI is part of onboarding', color: '#0f766e' },
] as const satisfies ReadonlyArray<{
  key: BusinessOnboardingKey;
  label: string;
  color: string;
}>;
const VISION_FILTER_KEYS: VisionFilterKey[] = [
  'opportunityClarity',
  'actionPriorities',
  'workChangeImagination',
  'opportunitySelectionMaturity',
  'businessValueConnection',
  'personalDevelopmentDirection',
  'visionReadiness',
  'visionActionMix',
];
const OPPORTUNITY_CLARITY_SERIES = [
  { key: 'stillExploring', label: 'Still exploring', color: '#d4d4d8' },
  { key: 'generalOpportunities', label: 'General opportunities', color: '#cbd5e1' },
  { key: 'oneToTwoTasks', label: 'Can name 1–2 tasks', color: '#93c5fd' },
  { key: 'specificWorkflows', label: 'Specific workflows identified', color: '#2563eb' },
  {
    key: 'prioritizedValueFeasibility',
    label: 'Prioritized by value and feasibility',
    color: '#0f766e',
  },
] as const satisfies ReadonlyArray<{
  key: OpportunityClarityKey;
  label: string;
  color: string;
}>;
const WORK_CHANGE_IMAGINATION_SERIES = [
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
] as const satisfies ReadonlyArray<{
  key: WorkChangeImaginationKey;
  label: string;
  color: string;
}>;
const OPPORTUNITY_SELECTION_SERIES = [
  { key: 'generalTrends', label: 'General trends', color: '#d4d4d8' },
  { key: 'someoneElseSuggests', label: 'Someone else suggests it', color: '#cbd5e1' },
  { key: 'usefulForMyTasks', label: 'Seems useful for my tasks', color: '#93c5fd' },
  { key: 'solvesRealProblem', label: 'Solves a real workflow problem', color: '#2563eb' },
  {
    key: 'evaluatedByValueAndImpact',
    label: 'Evaluated by value, feasibility, cost, privacy, and impact',
    color: '#0f766e',
  },
] as const satisfies ReadonlyArray<{
  key: OpportunitySelectionKey;
  label: string;
  color: string;
}>;
const BUSINESS_VALUE_CONNECTION_SERIES = [
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
] as const satisfies ReadonlyArray<{
  key: BusinessValueConnectionKey;
  label: string;
  color: string;
}>;
const PERSONAL_DEVELOPMENT_DIRECTION_SERIES = [
  { key: 'stillFiguringOut', label: 'Still figuring it out', color: '#d4d4d8' },
  { key: 'generalAiBasics', label: 'General AI basics', color: '#cbd5e1' },
  { key: 'oneSpecificSkill', label: 'One specific skill or workflow', color: '#93c5fd' },
  {
    key: 'roleStrengtheningCapability',
    label: 'Role-strengthening capability',
    color: '#2563eb',
  },
  {
    key: 'clearRoleLinkedDirection',
    label: 'Clear role-linked development direction',
    color: '#0f766e',
  },
] as const satisfies ReadonlyArray<{
  key: PersonalDevelopmentDirectionKey;
  label: string;
  color: string;
}>;
const VISION_READINESS_SERIES = [
  { key: 'emerging', label: 'Emerging', color: '#d4d4d8' },
  { key: 'earlyFraming', label: 'Early framing', color: '#cbd5e1' },
  { key: 'structuredThinking', label: 'Structured thinking', color: '#93c5fd' },
  { key: 'strategicVision', label: 'Strategic vision', color: '#2563eb' },
  { key: 'forwardLeading', label: 'Forward-leading', color: '#0f766e' },
] as const satisfies ReadonlyArray<{
  key: VisionReadinessKey;
  label: string;
  color: string;
}>;
const VISION_ACTION_MIX_LABELS = [
  'Workflow',
  'Enablement',
  'Governance',
  'Strategy',
] as const;
type VisionActionCategory = 'workflow' | 'enablement' | 'governance' | 'strategy';
type VisionActionRule = {
  needle: string;
  label: string;
  category: VisionActionCategory;
  score: number;
};
const VISION_ACTION_RULES: VisionActionRule[] = [
  {
    needle: 'organize practical training based on real team tasks',
    label: 'Practical training based on real tasks',
    category: 'enablement',
    score: 4,
  },
  {
    needle: 'ask everyone to experiment independently and see what happens',
    label: 'Experiment independently',
    category: 'strategy',
    score: 2,
  },
  {
    needle: 'create simple team guidelines for safe and effective ai usage',
    label: 'Simple team guidelines',
    category: 'governance',
    score: 4,
  },
  {
    needle: 'pick 1-2 recurring workflows and run a small ai improvement pilot',
    label: 'Pilot recurring workflows',
    category: 'workflow',
    score: 5,
  },
  {
    needle: 'share practical examples of how teammates already use ai successfully',
    label: 'Share practical examples',
    category: 'enablement',
    score: 4,
  },
  {
    needle: 'improve documentation, templates, or context so ai tools can work better',
    label: 'Improve documentation / templates / context',
    category: 'workflow',
    score: 4,
  },
  {
    needle: 'agree on recommended ai tools for common team workflows',
    label: 'Agree on recommended tools',
    category: 'governance',
    score: 4,
  },
  {
    needle: 'create reusable prompts, templates, checklists, or project instructions',
    label: 'Reusable prompts / templates / checklists / project instructions',
    category: 'workflow',
    score: 5,
  },
  {
    needle: 'set up peer learning sessions based on real team tasks',
    label: 'Peer learning sessions',
    category: 'enablement',
    score: 4,
  },
  {
    needle: 'buy access to the most advanced ai tool for everyone',
    label: 'Buy access to advanced tools for everyone',
    category: 'strategy',
    score: 2,
  },
  {
    needle: 'give people access to the right ai tools or paid plans where needed',
    label: 'Give people the right tools / paid plans',
    category: 'enablement',
    score: 4,
  },
  {
    needle: 'define where ai should not be used, or where human review is required',
    label: 'Define where AI should not be used / where review is required',
    category: 'governance',
    score: 5,
  },
  {
    needle: 'create a small backlog of ai improvement ideas for the team or department',
    label: 'Create a backlog of AI improvement ideas',
    category: 'strategy',
    score: 4,
  },
  {
    needle: 'wait until the company creates a full ai strategy before trying anything',
    label: 'Wait for full company strategy',
    category: 'strategy',
    score: 1,
  },
  {
    needle: 'i am not sure yet what would help most',
    label: 'Not sure yet',
    category: 'strategy',
    score: 1,
  },
];
const CULTURE_SUPPORT_NEEDED_LABELS = [
  'Advanced workflows',
  'Tool overview',
  'Prompt engineering',
  'Task setup',
  'Peer learning',
] as const;
const HANDS_ON_HELP_LABELS = [
  'No hands-on help needed',
  'Overview session',
  'Deeper training',
  'Task setup help',
  '1:1 pairing',
] as const;

const ORGANIZATION_DEEP_DIVE_SECTION_LINKS = [
  { id: 'org-top-summary', label: 'Top summary' },
  {
    id: 'org-where-now',
    label: 'Where are we now?',
    children: [
      { id: 'org-dimension-usage', label: 'Usage' },
      { id: 'org-dimension-skills', label: 'Skills' },
      { id: 'org-dimension-impact', label: 'Impact' },
      { id: 'org-dimension-culture', label: 'Culture' },
      { id: 'org-dimension-vision', label: 'Vision' },
    ],
  },
  { id: 'org-where-gaps', label: 'Where are the gaps?' },
  { id: 'org-where-invest', label: 'Where should we invest?' },
] as const;
const ORGANIZATION_MUST_KNOW_SECTION_LINKS = [
  { id: 'org-top-summary', label: 'Top summary' },
  { id: 'org-where-now', label: 'Where are we now?' },
  { id: 'org-where-gaps', label: 'Usage vs Impact' },
  { id: 'org-top-deviating', label: 'Top deviating people' },
  { id: 'org-where-invest', label: 'Suggested goals' },
] as const;
const ALL_DEPARTMENTS = 'All departments';
const ALL_SENIORITIES = 'All seniorities';
const ALL_TEAMS = 'All teams';
const TOOL_MENTION_PHRASES = [
  'Claude Code',
  'Claude (web)',
  'ChatGPT (web)',
  'GitHub Copilot',
  'VS Code with AI extension',
  "I didn't use any AI tool last month",
  'Other (free text)',
  'Antigravity',
  'Perplexity',
  'Windsurf',
  'Cursor',
  'Gemini',
  'Codex',
  'Cline',
] as const;
const MODEL_MENTION_PHRASES = [
  'I don’t track specific model names',
  "I don't track specific model names",
  'GPT-5.4 mini / nano, or GPT-5.5 mini / nano',
  'Claude Sonnet 4.5 / 4.6',
  'Gemini 2.5 Pro / Flash',
  'Gemini 3 Pro / Flash',
  'GPT-5.4 / GPT-5.5',
  'Self-hosted (e.g. Llama 4, DeepSeek)',
  'ChatGPT Images 2.0',
  'Claude Opus 4.6',
  'Claude Opus 4.7',
  'Claude Haiku',
  'GPT-4.1',
  'GPT-4o',
  'o3 / o4-mini',
  'no usage',
] as const;
const LITERAL_BLOCKER_STOP_WORDS = new Set([
  'a',
  'about',
  'actually',
  'adds',
  'all',
  'also',
  'am',
  'an',
  'and',
  'any',
  'are',
  'as',
  'at',
  'be',
  'because',
  'been',
  'being',
  'but',
  'by',
  'can',
  'cant',
  "can't",
  'could',
  'did',
  'didnt',
  "didn't",
  'do',
  'does',
  'doing',
  'dont',
  "don't",
  'for',
  'from',
  'get',
  'got',
  'had',
  'has',
  'have',
  'having',
  'how',
  'i',
  'if',
  'im',
  "i'm",
  'in',
  'instead',
  'into',
  'is',
  'it',
  "it's",
  'its',
  'just',
  'know',
  'lack',
  'like',
  'lot',
  'lots',
  'main',
  'mainly',
  'make',
  'makes',
  'me',
  'more',
  'most',
  'mostly',
  'much',
  'my',
  'need',
  'needs',
  'no',
  'not',
  'nothing',
  'of',
  'often',
  'on',
  'one',
  'only',
  'or',
  'our',
  'out',
  'point',
  'really',
  'right',
  'same',
  'so',
  'some',
  'something',
  'specific',
  'still',
  'such',
  'than',
  'that',
  "that's",
  'the',
  'their',
  'them',
  'then',
  'there',
  'these',
  'they',
  'thing',
  'things',
  'think',
  'this',
  'to',
  'too',
  'understand',
  'use',
  'used',
  'using',
  'value',
  'very',
  'want',
  'was',
  'way',
  'we',
  'well',
  'were',
  'when',
  'whenever',
  'where',
  'which',
  'while',
  'who',
  'why',
  'will',
  'with',
  'work',
  'would',
  'you',
  'your',
  'always',
]);
const MENTION_STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'any',
  'app',
  'apps',
  'are',
  'as',
  'at',
  'be',
  'been',
  'being',
  'but',
  'by',
  'do',
  'does',
  'dont',
  "don't",
  'for',
  'from',
  'had',
  'has',
  'have',
  'i',
  'im',
  "i'm",
  'in',
  'into',
  'is',
  'it',
  'just',
  'last',
  'like',
  'lot',
  'lots',
  'make',
  'model',
  'models',
  'month',
  'more',
  'mostly',
  'most',
  'my',
  'names',
  'not',
  'of',
  'on',
  'one',
  'or',
  'other',
  'our',
  'out',
  'over',
  'plus',
  'primary',
  'really',
  'specific',
  'stuff',
  'that',
  'the',
  'their',
  'them',
  'then',
  'there',
  'these',
  'thing',
  'things',
  'to',
  'tool',
  'tools',
  'track',
  'tracking',
  'use',
  'used',
  'user',
  'using',
  'very',
  'via',
  'was',
  'web',
  'were',
  'with',
  'work',
]);
const MENTION_DISPLAY_MAP = new Map<string, string>([
  ['ai', 'AI'],
  ['claude', 'Claude'],
  ['chatgpt', 'ChatGPT'],
  ['codex', 'Codex'],
  ['copilot', 'Copilot'],
  ['cursor', 'Cursor'],
  ['deepseek', 'DeepSeek'],
  ['figma', 'Figma'],
  ['firefly', 'Firefly'],
  ['gemini', 'Gemini'],
  ['github', 'GitHub'],
  ['gitlab', 'GitLab'],
  ['glm', 'GLM'],
  ['google', 'Google'],
  ['junie', 'Junie'],
  ['kimi', 'Kimi'],
  ['llama', 'Llama'],
  ['midjourney', 'Midjourney'],
  ['nanobanana', 'NanoBanana'],
  ['opencode', 'OpenCode'],
  ['openai', 'OpenAI'],
  ['opus', 'Opus'],
  ['perplexity', 'Perplexity'],
  ['playwright', 'Playwright'],
  ['pro', 'Pro'],
  ['qwen', 'Qwen'],
  ['rovo', 'Rovo'],
  ['sonnet', 'Sonnet'],
  ['stitch', 'Stitch'],
]);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeMentionSource(rawValue: string): string {
  return rawValue
    .toLowerCase()
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/[()[\]{}]/g, ' ')
    .replace(/[,;:/\\|]+/g, ' ')
    .replace(/[!?]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildMentionPhraseMatchers(phrases: readonly string[]) {
  return [...phrases]
    .map((label) => ({
      label,
      key: normalizeMentionSource(label),
    }))
    .sort((left, right) => right.key.length - left.key.length);
}

const TOOL_MENTION_MATCHERS = buildMentionPhraseMatchers(TOOL_MENTION_PHRASES);
const MODEL_MENTION_MATCHERS = buildMentionPhraseMatchers(MODEL_MENTION_PHRASES);

function formatMentionToken(token: string): string {
  const mapped = MENTION_DISPLAY_MAP.get(token);

  if (mapped) {
    return mapped;
  }

  if (/^(gpt|o\d|r\d|v\d)/.test(token)) {
    return token.toUpperCase();
  }

  if (token.includes('-') || token.includes('.')) {
    return token
      .split(/([-.])/)
      .map((part) => {
        if (part === '-' || part === '.') {
          return part;
        }

        const mappedPart = MENTION_DISPLAY_MAP.get(part);
        if (mappedPart) {
          return mappedPart;
        }

        if (/^\d+[a-z]*$/i.test(part)) {
          return part.toUpperCase();
        }

        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join('');
  }

  return token.charAt(0).toUpperCase() + token.slice(1);
}

function isStandaloneVersionToken(token: string): boolean {
  return /^\d+(?:\.\d+)+$/.test(token);
}

function normalizeLiteralWordSource(rawValue: string): string {
  return rawValue
    .toLowerCase()
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014\u2212]/g, '-')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[()[\]{}]/g, ' ')
    .replace(/[.,;:/\\|!?]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatLiteralWordToken(token: string): string {
  if (token === 'ai') {
    return 'AI';
  }

  if (token === 'llm') {
    return 'LLM';
  }

  if (token === 'mcp') {
    return 'MCP';
  }

  return token;
}

function extractMentionLabels(
  rawValue: string | undefined,
  matchers: Array<{ label: string; key: string }>,
): string[] {
  const selections = splitSurveyMultiValue(rawValue);
  const mentions = new Set<string>();

  for (const selection of selections) {
    let working = ` ${normalizeMentionSource(selection)} `;

    if (!working.trim()) {
      continue;
    }

    for (const matcher of matchers) {
      if (!matcher.key) {
        continue;
      }

      const pattern = new RegExp(`(^| )${escapeRegExp(matcher.key)}(?= |$)`, 'g');

      if (pattern.test(working)) {
        mentions.add(matcher.label);
        working = working.replace(pattern, ' ');
      }
    }

    const tokens = working
      .split(' ')
      .map((token) => token.replace(/^[^a-z0-9]+|[^a-z0-9.+#-]+$/g, ''))
      .filter((token) => token.length > 0);

    for (const token of tokens) {
      const normalizedToken = token.replace(/^['"]+|['"]+$/g, '');

      if (!normalizedToken) {
        continue;
      }

      if (MENTION_STOP_WORDS.has(normalizedToken)) {
        continue;
      }

      if (/^\d+$/.test(normalizedToken)) {
        continue;
      }

      if (isStandaloneVersionToken(normalizedToken)) {
        continue;
      }

      if (normalizedToken.length < 3 && !/\d/.test(normalizedToken)) {
        continue;
      }

      mentions.add(formatMentionToken(normalizedToken));
    }
  }

  return Array.from(mentions);
}

function buildMentionCloudRows(
  responses: RawResponse[],
  getValue: (response: RawResponse) => string | undefined,
  matchers: Array<{ label: string; key: string }>,
): MentionCloudEntry[] {
  const counts = new Map<string, MentionCloudEntry>();

  for (const response of responses) {
    const mentions = extractMentionLabels(getValue(response), matchers);

    for (const mention of mentions) {
      const key = mention.toLowerCase();
      const current = counts.get(key);

      if (current) {
        current.count += 1;
        continue;
      }

      counts.set(key, {
        label: mention,
        count: 1,
      });
    }
  }

  return Array.from(counts.values()).sort(
    (left, right) => right.count - left.count || left.label.localeCompare(right.label),
  );
}

function buildLiteralWordCloudRows(
  responses: RawResponse[],
  getValue: (response: RawResponse) => string | undefined,
): MentionCloudEntry[] {
  const counts = new Map<string, MentionCloudEntry>();

  for (const response of responses) {
    const rawValue = getValue(response);
    const normalized = rawValue ? normalizeLiteralWordSource(rawValue) : '';

    if (!normalized) {
      continue;
    }

    const tokens = normalized
      .split(' ')
      .map((token) => token.replace(/^[^a-z0-9]+|[^a-z0-9+#-]+$/g, ''))
      .filter(Boolean);

    for (const token of tokens) {
      if (LITERAL_BLOCKER_STOP_WORDS.has(token)) {
        continue;
      }

      if (/^\d+$/.test(token) || isStandaloneVersionToken(token)) {
        continue;
      }

      if (token.length < 3 && !/\d/.test(token)) {
        continue;
      }

      const label = formatLiteralWordToken(token);
      const key = label.toLowerCase();
      const current = counts.get(key);

      if (current) {
        current.count += 1;
        continue;
      }

      counts.set(key, {
        label,
        count: 1,
      });
    }
  }

  return Array.from(counts.values()).sort(
    (left, right) => right.count - left.count || left.label.localeCompare(right.label),
  );
}

function buildMentionCloudLayout(
  entries: MentionCloudEntry[],
  width: number,
  height: number,
): Array<MentionCloudEntry & { x: number; y: number; fontSize: number }> {
  const visibleEntries = entries.slice(0, 30);

  if (visibleEntries.length === 0) {
    return [];
  }

  const maxCount = visibleEntries[0]?.count ?? 1;
  const minCount = visibleEntries[visibleEntries.length - 1]?.count ?? 1;
  const countRange = Math.max(maxCount - minCount, 1);
  const horizontalGap = 22;
  const verticalGap = 18;
  const maxRowWidth = width - 48;
  const rows: Array<
    Array<MentionCloudEntry & { fontSize: number; estimatedWidth: number }>
  > = [];
  let currentRow: Array<MentionCloudEntry & { fontSize: number; estimatedWidth: number }> = [];
  let currentRowWidth = 0;

  for (const entry of visibleEntries) {
    const weightRatio = (entry.count - minCount) / countRange;
    const fontSize = Math.round(16 + weightRatio * 22);
    const estimatedWidth = Math.max(entry.label.length * fontSize * 0.56, fontSize * 3.2);
    const nextWidth =
      currentRow.length === 0
        ? estimatedWidth
        : currentRowWidth + horizontalGap + estimatedWidth;

    if (currentRow.length > 0 && nextWidth > maxRowWidth) {
      rows.push(currentRow);
      currentRow = [];
      currentRowWidth = 0;
    }

    currentRow.push({
      ...entry,
      fontSize,
      estimatedWidth,
    });
    currentRowWidth =
      currentRow.length === 1 ? estimatedWidth : currentRowWidth + horizontalGap + estimatedWidth;
  }

  if (currentRow.length > 0) {
    rows.push(currentRow);
  }

  const maxRows = 5;
  const visibleRows = rows.slice(0, maxRows);
  const rowHeights = visibleRows.map((row) => Math.max(...row.map((item) => item.fontSize)));
  const totalHeight =
    rowHeights.reduce((sum, rowHeight) => sum + rowHeight, 0) +
    verticalGap * Math.max(visibleRows.length - 1, 0);
  let topOffset = Math.max((height - totalHeight) / 2 + 8, 24);
  const positioned: Array<MentionCloudEntry & { x: number; y: number; fontSize: number }> = [];

  visibleRows.forEach((row, rowIndex) => {
    const rowWidth =
      row.reduce((sum, item) => sum + item.estimatedWidth, 0) +
      horizontalGap * Math.max(row.length - 1, 0);
    let currentX = Math.max((width - rowWidth) / 2, 24);
    const rowHeight = rowHeights[rowIndex];
    const baselineY = topOffset + rowHeight;

    row.forEach((item, itemIndex) => {
      const verticalNudge = ((itemIndex + rowIndex) % 2 === 0 ? -1 : 1) * Math.min(item.fontSize * 0.08, 3);

      positioned.push({
        label: item.label,
        count: item.count,
        fontSize: item.fontSize,
        x: currentX,
        y: baselineY + verticalNudge,
      });

      currentX += item.estimatedWidth + horizontalGap;
    });

    topOffset += rowHeight + verticalGap;
  });

  return positioned;
}

function MentionCloud({
  entries,
  accent,
  emptyLabel,
}: {
  entries: MentionCloudEntry[];
  accent: 'teal' | 'blue';
  emptyLabel: string;
}) {
  if (entries.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-[#d4d4d8] bg-[#fafafa] px-4 py-5 text-sm text-[#737373]">
        {emptyLabel}
      </div>
    );
  }

  const visibleEntries = entries.slice(0, 30);
  const hiddenCount = Math.max(entries.length - visibleEntries.length, 0);
  const layout = buildMentionCloudLayout(entries, 920, 250);
  const colorClasses =
    accent === 'teal'
      ? {
          text: '#0f766e',
          background: '#f5f5f5',
          border: '#e5e7eb',
          subtitle: 'text-[#737373]',
        }
      : {
          text: '#1d4ed8',
          background: '#f5f5f5',
          border: '#e5e7eb',
          subtitle: 'text-[#737373]',
        };

  return (
    <>
      <p className={`mt-4 text-xs ${colorClasses.subtitle}`}>
        Word size reflects how many respondents mentioned each term.
      </p>
      <div
        className="mt-3 overflow-hidden rounded-2xl border"
        style={{ backgroundColor: colorClasses.background, borderColor: colorClasses.border }}
      >
        <svg viewBox="0 0 920 250" className="block h-[250px] w-full" role="img" aria-label="Mention word cloud">
          {layout.map((entry) => (
            <text
              key={entry.label}
              x={entry.x}
              y={entry.y}
              fill={colorClasses.text}
              fontSize={entry.fontSize}
              fontWeight={entry.count === visibleEntries[0]?.count ? 700 : 600}
            >
              <title>{`${entry.label}: ${entry.count} respondents`}</title>
              {entry.label}
            </text>
          ))}
        </svg>
      </div>
      {hiddenCount > 0 ? (
        <p className="mt-3 text-xs text-[#8b8b8b]">
          {`Showing the top ${visibleEntries.length} mentions in the chart. ${hiddenCount} lower-frequency mentions are still included in the counts.`}
        </p>
      ) : null}
    </>
  );
}

function createEmptyImpactFilters(): Record<ImpactFilterKey, string[]> {
  return {
    personalOutputImpact: [],
    workflowTransformation: [],
    hoursSaved: [],
    dependencyOnAi: [],
    accessLicensing: [],
    whoPays: [],
    costMaturity: [],
    planningImpact: [],
    nonAiBlocker: [],
  };
}

function createEmptyCultureFilters(): Record<CultureFilterKey, string[]> {
  return {
    growthMomentum: [],
    experimentationInitiative: [],
    knowledgeSharing: [],
    teamAiMaturity: [],
    organizationalSupport: [],
    toolSatisfaction: [],
    enjoyability: [],
    practiceResilience: [],
    knowledgeArtifacts: [],
    influenceScore: [],
    supportNeeded: [],
    handsOnHelp: [],
    businessOnboarding: [],
  };
}

function createEmptyVisionFilters(): Record<VisionFilterKey, string[]> {
  return {
    opportunityClarity: [],
    actionPriorities: [],
    workChangeImagination: [],
    opportunitySelectionMaturity: [],
    businessValueConnection: [],
    personalDevelopmentDirection: [],
    visionReadiness: [],
    visionActionMix: [],
  };
}

function formatScore(value: number): string {
  return `${value.toFixed(1)} / 5`;
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

function splitSurveyMultiValue(rawValue: string | undefined): string[] {
  if (!rawValue) {
    return [];
  }

  return rawValue
    .split(';')
    .map((part) => part.trim().replace(/\s+/g, ' '))
    .filter((part) => part && part.toLowerCase() !== 'n/a');
}

function normalizeUsageCategoryLabel(
  surveyType: SurveyType,
  rawLabel: string,
): string | null {
  const normalized = rawLabel.trim().replace(/\s+/g, ' ');

  if (!normalized) {
    return null;
  }

  const lower = normalized.toLowerCase();
  const labelMap =
    surveyType === 'business' ? BUSINESS_USAGE_WORKFLOW_MAP : DELIVERY_USAGE_ACTIVITY_MAP;

  return labelMap.get(lower) ?? 'Other (custom responses)';
}

function buildUsageCategoryInsight(
  responses: RawResponse[],
  surveyType: SurveyType,
  mode: UsageCategoryMode = 'needle',
): UsageCategoryInsight {
  const scopedResponses = responses.filter((response) => response.surveyType === surveyType);

  if (scopedResponses.length === 0) {
    return {
      respondents: 0,
      averageSelections: 0,
      rows: [],
    };
  }

  const counts = new Map<string, number>();
  let totalSelections = 0;

  for (const response of scopedResponses) {
    const selections = new Set(
      splitSurveyMultiValue(response.q1_5)
        .map((label) => normalizeUsageCategoryLabel(surveyType, label))
        .map((label) => {
          if (!label) {
            return null;
          }

          if (mode === 'needle') {
            return label;
          }

          if (label === 'Other (custom responses)') {
            return surveyType === 'business'
              ? BUSINESS_USAGE_GROUP_LABELS.other_custom
              : DELIVERY_USAGE_GROUP_LABELS.other_custom;
          }

          if (surveyType === 'business') {
            const groupKey = BUSINESS_USAGE_GROUP_MAP.get(label.toLowerCase()) ?? 'other_custom';
            return BUSINESS_USAGE_GROUP_LABELS[groupKey];
          }

          const groupKey = DELIVERY_USAGE_GROUP_MAP.get(label.toLowerCase()) ?? 'other_custom';
          return DELIVERY_USAGE_GROUP_LABELS[groupKey];
        })
        .filter((label): label is string => Boolean(label)),
    );

    totalSelections += selections.size;

    for (const selection of selections) {
      counts.set(selection, (counts.get(selection) ?? 0) + 1);
    }
  }

  return {
    respondents: scopedResponses.length,
    averageSelections: roundToOne(totalSelections / scopedResponses.length),
    rows: Array.from(counts.entries())
      .map(([label, count]) => ({
        label,
        count,
        share: roundToOne((count / scopedResponses.length) * 100),
      }))
      .sort((left, right) => right.share - left.share || right.count - left.count || left.label.localeCompare(right.label)),
  };
}

function normalizeEmbeddednessAnswer(
  surveyType: SurveyType,
  rawValue: string | undefined,
): EmbeddednessCategoryKey | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) {
    return null;
  }

  if (surveyType === 'business') {
    if (value.includes('keep ai separate from my work responsibilities')) return 'separate';
    if (value.includes('occasionally use it alongside my work')) return 'occasional';
    if (value.includes('standard workflow for several recurring tasks')) return 'standard';
    if (value.includes('deeply integrated')) return 'deep';
    if (value.includes('inseparable from how i work')) return 'inseparable';
    if (value.includes('not currently on a project or in an active role')) return 'notActive';
    if (value.includes("haven't figured out where ai could apply to my role yet")) return 'notYet';
    return null;
  }

  if (value.includes('keep ai separate from project work')) return 'separate';
  if (value.includes('occasionally use it alongside project work')) return 'occasional';
  if (value.includes('part of my standard project workflow')) return 'standard';
  if (value.includes('deeply integrated')) return 'deep';
  if (value.includes('inseparable from how i work')) return 'inseparable';
  if (value.includes('not currently on a project')) return 'notActive';
  return null;
}

function buildEmbeddednessDistribution(
  responses: RawResponse[],
): EmbeddednessDistributionRow[] {
  const surveyTypes: SurveyType[] = ['business', 'delivery-engineering'];

  return surveyTypes.map((surveyType) => {
    const scopedResponses = responses.filter((response) => response.surveyType === surveyType);
    const respondents = scopedResponses.length;
    const counts = EMBEDDEDNESS_SERIES.reduce(
      (acc, entry) => ({
        ...acc,
        [entry.key]: 0,
      }),
      {} as Record<EmbeddednessCategoryKey, number>,
    );

    for (const response of scopedResponses) {
      const key = normalizeEmbeddednessAnswer(surveyType, response.q1_6);
      if (key) {
        counts[key] += 1;
      }
    }

    const shares = EMBEDDEDNESS_SERIES.reduce(
      (acc, entry) => ({
        ...acc,
        [entry.key]: respondents > 0 ? roundToOne((counts[entry.key] / respondents) * 100) : 0,
      }),
      {} as Record<EmbeddednessCategoryKey, number>,
    );

    return {
      cohort: surveyType === 'business' ? 'Business' : 'Delivery & engineering',
      respondents,
      ...shares,
    };
  });
}

function normalizeSharedPracticesAnswer(
  rawValue: string | undefined,
): SharedPracticesCategoryKey | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) {
    return null;
  }

  if (
    value.includes('documented guidelines') ||
    value.includes('documented standards') ||
    value.includes('guidelines or expectations') ||
    value.includes('guidelines or standards')
  ) {
    return 'standardized';
  }

  if (value.includes('loose team norms') || value.includes('informally')) {
    return 'partial';
  }

  if (
    value.includes('fully individual') ||
    value.includes('everyone uses whatever they want')
  ) {
    return 'fragmented';
  }

  return null;
}

function buildSharedPracticesDistribution(
  responses: RawResponse[],
): SharedPracticesDistributionRow[] {
  const surveyTypes: SurveyType[] = ['business', 'delivery-engineering'];

  return surveyTypes.map((surveyType) => {
    const scopedResponses = responses.filter((response) => response.surveyType === surveyType);
    const respondents = scopedResponses.length;
    const counts = SHARED_PRACTICES_SERIES.reduce(
      (acc, entry) => ({
        ...acc,
        [entry.key]: 0,
      }),
      {} as Record<SharedPracticesCategoryKey, number>,
    );

    for (const response of scopedResponses) {
      const key = normalizeSharedPracticesAnswer(response.q1_7);
      if (key) {
        counts[key] += 1;
      }
    }

    const shares = SHARED_PRACTICES_SERIES.reduce(
      (acc, entry) => ({
        ...acc,
        [entry.key]: respondents > 0 ? roundToOne((counts[entry.key] / respondents) * 100) : 0,
      }),
      {} as Record<SharedPracticesCategoryKey, number>,
    );

    return {
      cohort: surveyType === 'business' ? 'Business' : 'Delivery & engineering',
      respondents,
      ...shares,
    };
  });
}

function normalizeSkillsBaselineAnswer(
  surveyType: SurveyType,
  rawValue: string | undefined,
): SkillsBaselineCategoryKey | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) {
    return null;
  }

  if (surveyType === 'business') {
    if (value.includes('no idea') || value.includes("heard of them but never used them")) {
      return 'unfamiliar';
    }
    if (value.includes('know the basics')) {
      return 'foundational';
    }
    if (value.includes('strengths and limitations well')) {
      return 'working';
    }
    if (value.includes('explain to a colleague when to use ai and when not to')) {
      return 'advanced';
    }
    return null;
  }

  if (value.includes("haven't explored this yet")) {
    return 'unfamiliar';
  }
  if (value.includes("they're neural networks but not the details")) {
    return 'foundational';
  }
  if (value.includes('understand the high-level architecture')) {
    return 'working';
  }
  if (value.includes('explain how inference works')) {
    return 'advanced';
  }
  if (value.includes('teach someone else') || value.includes('make technical decisions')) {
    return 'expert';
  }

  return null;
}

function buildSkillsBaselineDistribution(
  responses: RawResponse[],
): SkillsBaselineDistributionRow[] {
  const surveyTypes: SurveyType[] = ['business', 'delivery-engineering'];

  return surveyTypes.map((surveyType) => {
    const scopedResponses = responses.filter((response) => response.surveyType === surveyType);
    const respondents = scopedResponses.length;
    const counts = SKILLS_BASELINE_SERIES.reduce(
      (acc, entry) => ({
        ...acc,
        [entry.key]: 0,
      }),
      {} as Record<SkillsBaselineCategoryKey, number>,
    );

    for (const response of scopedResponses) {
      const key = normalizeSkillsBaselineAnswer(surveyType, response.q2_1);
      if (key) {
        counts[key] += 1;
      }
    }

    const shares = SKILLS_BASELINE_SERIES.reduce(
      (acc, entry) => ({
        ...acc,
        [entry.key]: respondents > 0 ? roundToOne((counts[entry.key] / respondents) * 100) : 0,
      }),
      {} as Record<SkillsBaselineCategoryKey, number>,
    );

    return {
      cohort: surveyType === 'business' ? 'Business' : 'Delivery & engineering',
      respondents,
      ...shares,
    };
  });
}

function normalizeSensitiveDataAnswer(
  rawValue: string | undefined,
): SensitiveDataCategoryKey | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) {
    return null;
  }

  if (value.includes("don't think about it") || value.includes('paste whatever i need')) {
    return 'risky';
  }

  if (value.includes("i'm cautious but not sure where the line is")) {
    return 'uncertain';
  }

  if (value.includes('know the basics')) {
    return 'basic';
  }

  if (value.includes('clear mental checklist')) {
    return 'checklist';
  }

  if (
    value.includes('follow documented guidelines') ||
    value.includes('enterprise/soc2 compliance')
  ) {
    return 'governed';
  }

  return null;
}

function buildSensitiveDataDistribution(
  responses: RawResponse[],
): SensitiveDataDistributionRow[] {
  const surveyTypes: SurveyType[] = ['business', 'delivery-engineering'];

  return surveyTypes.map((surveyType) => {
    const scopedResponses = responses.filter((response) => response.surveyType === surveyType);
    const respondents = scopedResponses.length;
    const counts = SENSITIVE_DATA_SERIES.reduce(
      (acc, entry) => ({
        ...acc,
        [entry.key]: 0,
      }),
      {} as Record<SensitiveDataCategoryKey, number>,
    );

    for (const response of scopedResponses) {
      const key = normalizeSensitiveDataAnswer(
        surveyType === 'business' ? response.q2_9 : response.q2_12,
      );
      if (key) {
        counts[key] += 1;
      }
    }

    const shares = SENSITIVE_DATA_SERIES.reduce(
      (acc, entry) => ({
        ...acc,
        [entry.key]: respondents > 0 ? roundToOne((counts[entry.key] / respondents) * 100) : 0,
      }),
      {} as Record<SensitiveDataCategoryKey, number>,
    );

    return {
      cohort: surveyType === 'business' ? 'Business' : 'Delivery & engineering',
      respondents,
      ...shares,
    };
  });
}

function buildTwoCohortStackedDistribution<Key extends string>(
  responses: RawResponse[],
  series: ReadonlyArray<{ key: Key }>,
  getAnswer: (surveyType: SurveyType, response: RawResponse) => string | undefined,
  normalize: (surveyType: SurveyType, rawValue: string | undefined) => Key | null,
): Array<{ cohort: string; respondents: number } & Record<Key, number>> {
  const surveyTypes: SurveyType[] = ['business', 'delivery-engineering'];

  return surveyTypes.map((surveyType) => {
    const scopedResponses = responses.filter((response) => response.surveyType === surveyType);
    const respondents = scopedResponses.length;
    const counts = series.reduce(
      (acc, entry) => ({
        ...acc,
        [entry.key]: 0,
      }),
      {} as Record<Key, number>,
    );

    for (const response of scopedResponses) {
      const key = normalize(surveyType, getAnswer(surveyType, response));
      if (key) {
        counts[key] += 1;
      }
    }

    const shares = series.reduce(
      (acc, entry) => ({
        ...acc,
        [entry.key]: respondents > 0 ? roundToOne((counts[entry.key] / respondents) * 100) : 0,
      }),
      {} as Record<Key, number>,
    );

    return {
      cohort: surveyType === 'business' ? 'Business' : 'Delivery & engineering',
      respondents,
      ...shares,
    };
  });
}

function buildTwoCohortComparison(
  responses: RawResponse[],
  labels: readonly string[],
  getAnswer: (surveyType: SurveyType, response: RawResponse) => string | undefined,
  normalize: (surveyType: SurveyType, rawValue: string | undefined) => string | null,
): ImpactComparisonRow[] {
  const businessResponses = responses.filter((response) => response.surveyType === 'business');
  const deliveryResponses = responses.filter(
    (response) => response.surveyType === 'delivery-engineering',
  );
  const businessCounts = new Map<string, number>();
  const deliveryCounts = new Map<string, number>();

  for (const response of businessResponses) {
    const label = normalize('business', getAnswer('business', response));
    if (label) {
      businessCounts.set(label, (businessCounts.get(label) ?? 0) + 1);
    }
  }

  for (const response of deliveryResponses) {
    const label = normalize('delivery-engineering', getAnswer('delivery-engineering', response));
    if (label) {
      deliveryCounts.set(label, (deliveryCounts.get(label) ?? 0) + 1);
    }
  }

  return labels.map((label) => {
    const businessCount = businessCounts.get(label) ?? 0;
    const deliveryCount = deliveryCounts.get(label) ?? 0;

    return {
      label,
      businessCount,
      businessShare:
        businessResponses.length > 0 ? roundToOne((businessCount / businessResponses.length) * 100) : 0,
      deliveryCount,
      deliveryShare:
        deliveryResponses.length > 0 ? roundToOne((deliveryCount / deliveryResponses.length) * 100) : 0,
    };
  });
}

function normalizePersonalOutputImpactAnswer(
  _surveyType: SurveyType,
  rawValue: string | undefined,
): PersonalOutputImpactKey | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (value.includes('no change')) return 'noChange';
  if (value.includes('slight improvement')) return 'slight';
  if (value.includes('noticeable improvement')) return 'noticeable';
  if (value.includes('significant improvement')) return 'significant';
  if (value.includes('transformative')) return 'transformative';
  return null;
}

function buildPersonalOutputImpactDistribution(
  responses: RawResponse[],
): PersonalOutputImpactDistributionRow[] {
  return buildTwoCohortStackedDistribution(
    responses,
    PERSONAL_OUTPUT_IMPACT_SERIES,
    (_surveyType, response) => response.q3_1,
    normalizePersonalOutputImpactAnswer,
  ) as PersonalOutputImpactDistributionRow[];
}

function normalizeWorkflowTransformationAnswer(
  surveyType: SurveyType,
  rawValue: string | undefined,
): WorkflowTransformationKey | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (value.includes('same tasks faster')) return 'sameTasksFaster';
  if (value.includes("tweaked how i do a few tasks")) return 'tweakedTasks';
  if (value.includes('meaningfully changed how one workflow operates')) {
    return 'oneWorkflowChanged';
  }
  if (value.includes('redesigned or eliminated a process entirely')) {
    return 'redesignedProcess';
  }
  if (value.includes('introduced a new process') || value.includes('introduced a new process or capability')) {
    return 'newAiEnabledProcess';
  }

  if (surveyType === 'business' && value.includes('only possible because of ai')) {
    return 'newAiEnabledProcess';
  }

  return null;
}

function buildWorkflowTransformationDistribution(
  responses: RawResponse[],
): WorkflowTransformationDistributionRow[] {
  return buildTwoCohortStackedDistribution(
    responses,
    WORKFLOW_TRANSFORMATION_SERIES,
    (surveyType, response) => (surveyType === 'business' ? response.q3_5 : response.q3_3),
    normalizeWorkflowTransformationAnswer,
  ) as WorkflowTransformationDistributionRow[];
}

function normalizeHoursSavedLabel(
  _surveyType: SurveyType,
  rawValue: string | undefined,
): (typeof HOURS_SAVED_LABELS)[number] | null {
  const normalized = rawValue?.trim().replace(/\s+/g, ' ');
  if (!normalized) return null;
  return HOURS_SAVED_LABELS.includes(normalized as (typeof HOURS_SAVED_LABELS)[number])
    ? (normalized as (typeof HOURS_SAVED_LABELS)[number])
    : null;
}

function buildHoursSavedComparison(responses: RawResponse[]): ImpactComparisonRow[] {
  return buildTwoCohortComparison(
    responses,
    HOURS_SAVED_LABELS,
    (surveyType, response) => (surveyType === 'business' ? response.q3_7 : response.q3_4),
    normalizeHoursSavedLabel,
  );
}

function hoursSavedEstimate(rawValue: string | undefined): number | null {
  const label = normalizeHoursSavedLabel('business', rawValue);

  if (!label) return null;
  if (label === '0 hours') return 0;
  if (label === 'Less than 1 hour') return 0.5;
  if (label === '1–3 hours') return 2;
  if (label === '3–5 hours') return 4;
  if (label === 'More than 5 hours') return 6;
  return null;
}

function buildHoursSavedAverageSummary(
  filteredResponses: RawResponse[],
  allResponses: RawResponse[],
): Array<{
  cohort: 'Business' | 'Delivery & engineering';
  color: string;
  filteredRespondents: number;
  overallRespondents: number;
  filteredAverage: number | null;
  overallAverage: number | null;
  delta: number | null;
}> {
  const surveyTypes: SurveyType[] = ['business', 'delivery-engineering'];

  return surveyTypes.map((surveyType) => {
    const scopedFilteredResponses = filteredResponses.filter(
      (response) => response.surveyType === surveyType,
    );
    const scopedAllResponses = allResponses.filter((response) => response.surveyType === surveyType);
    const filteredValues = scopedFilteredResponses
      .map((response) => hoursSavedEstimate(surveyType === 'business' ? response.q3_7 : response.q3_4))
      .filter((value): value is number => value !== null);
    const overallValues = scopedAllResponses
      .map((response) => hoursSavedEstimate(surveyType === 'business' ? response.q3_7 : response.q3_4))
      .filter((value): value is number => value !== null);
    const filteredAverage = filteredValues.length > 0 ? roundToOne(average(filteredValues)) : null;
    const overallAverage = overallValues.length > 0 ? roundToOne(average(overallValues)) : null;

    return {
      cohort: surveyType === 'business' ? 'Business' : 'Delivery & engineering',
      color:
        surveyType === 'business'
          ? IMPACT_COHORT_COLORS.business
          : IMPACT_COHORT_COLORS.delivery,
      filteredRespondents: scopedFilteredResponses.length,
      overallRespondents: scopedAllResponses.length,
      filteredAverage,
      overallAverage,
      delta:
        filteredAverage !== null && overallAverage !== null
          ? roundToOne(filteredAverage - overallAverage)
          : null,
    };
  });
}

function normalizeDependencyImpactAnswer(
  _surveyType: SurveyType,
  rawValue: string | undefined,
): DependencyImpactKey | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (value.includes('no real impact')) return 'noImpact';
  if (value.includes('minor inconvenience')) return 'minor';
  if (value.includes('noticeable setback')) return 'noticeable';
  if (value.includes('significant impact')) return 'significant';
  if (value.includes('major disruption')) return 'major';
  return null;
}

function buildDependencyImpactDistribution(
  responses: RawResponse[],
): DependencyImpactDistributionRow[] {
  return buildTwoCohortStackedDistribution(
    responses,
    DEPENDENCY_IMPACT_SERIES,
    (_surveyType, response) => response.q3_8,
    normalizeDependencyImpactAnswer,
  ) as DependencyImpactDistributionRow[];
}

function normalizeAccessLicensingAnswer(
  _surveyType: SurveyType,
  rawValue: string | undefined,
): AccessLicensingKey | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (value.includes('have everything i need')) return 'haveEverything';
  if (value.includes('paid tier of a tool i currently use for free')) return 'needPaidTier';
  if (value.includes("there's a specific tool i'd like but don't have access to")) {
    return 'wantSpecificTool';
  }
  if (value.includes("don't know what's available") || value.includes('could request')) {
    return 'dontKnowAvailable';
  }
  if (value.includes("haven't thought about it")) return 'haventThought';
  return null;
}

function buildAccessLicensingDistribution(
  responses: RawResponse[],
): AccessLicensingDistributionRow[] {
  return buildTwoCohortStackedDistribution(
    responses,
    ACCESS_LICENSING_SERIES,
    (surveyType, response) => (surveyType === 'business' ? response.q3_10 : response.q3_7),
    normalizeAccessLicensingAnswer,
  ) as AccessLicensingDistributionRow[];
}

function normalizeWhoPaysLabel(
  _surveyType: SurveyType,
  rawValue: string | undefined,
): string | null {
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

function buildWhoPaysComparison(responses: RawResponse[]): ImpactComparisonRow[] {
  return buildTwoCohortComparison(
    responses,
    WHO_PAYS_LABELS,
    (surveyType, response) => (surveyType === 'business' ? response.q3_11 : response.q3_9),
    normalizeWhoPaysLabel,
  );
}

function pricingUnderstandingScore(
  _surveyType: SurveyType,
  rawValue: string | undefined,
): number | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

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

function costConsiderationScore(
  _surveyType: SurveyType,
  rawValue: string | undefined,
): number | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (value.includes("don't think about cost at all")) return 1;
  if (value.includes("use whatever's available without comparing")) return 2;
  if (value.includes("aware of cost differences but it doesn't change my behavior")) return 3;
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

function buildCostMaturityDistribution(
  responses: RawResponse[],
): CostMaturityDistributionRow[] {
  const surveyTypes: SurveyType[] = ['business', 'delivery-engineering'];

  return surveyTypes.map((surveyType) => {
    const scopedResponses = responses.filter((response) => response.surveyType === surveyType);
    const respondents = scopedResponses.length;
    const counts = COST_MATURITY_SERIES.reduce(
      (acc, entry) => ({
        ...acc,
        [entry.key]: 0,
      }),
      {} as Record<CostMaturityKey, number>,
    );

    for (const response of scopedResponses) {
      const pricingScore = pricingUnderstandingScore(
        surveyType,
        surveyType === 'business' ? response.q3_9 : response.q3_6,
      );
      const considerationScore = costConsiderationScore(
        surveyType,
        surveyType === 'business' ? response.q3_12 : response.q3_10,
      );

      if (pricingScore === null || considerationScore === null) {
        continue;
      }

      const bucket = costMaturityBucket((pricingScore + considerationScore) / 2);
      if (bucket) {
        counts[bucket] += 1;
      }
    }

    const shares = COST_MATURITY_SERIES.reduce(
      (acc, entry) => ({
        ...acc,
        [entry.key]: respondents > 0 ? roundToOne((counts[entry.key] / respondents) * 100) : 0,
      }),
      {} as Record<CostMaturityKey, number>,
    );

    return {
      cohort: surveyType === 'business' ? 'Business' : 'Delivery & engineering',
      respondents,
      ...shares,
    };
  });
}

function normalizePlanningImpactAnswer(
  rawValue: string | undefined,
): PlanningImpactKey | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (value.includes('estimate and plan the same way as before')) return 'samePlanning';
  if (value.includes('factor ai in informally')) return 'informalFactor';
  if (value.includes('explicitly adjust estimates')) return 'explicitlyAdjust';
  if (value.includes('fundamentally changed how i scope and plan work')) return 'planningChanged';
  if (value.includes('inseparable from how i estimate')) return 'inseparable';
  return null;
}

function buildDeliveryPlanningImpactDistribution(
  responses: RawResponse[],
): PlanningImpactDistributionRow[] {
  const scopedResponses = responses.filter((response) => response.surveyType === 'delivery-engineering');
  const respondents = scopedResponses.length;
  const counts = PLANNING_IMPACT_SERIES.reduce(
    (acc, entry) => ({
      ...acc,
      [entry.key]: 0,
    }),
    {} as Record<PlanningImpactKey, number>,
  );

  for (const response of scopedResponses) {
    const key = normalizePlanningImpactAnswer(response.q3_2);
    if (key) {
      counts[key] += 1;
    }
  }

  const shares = PLANNING_IMPACT_SERIES.reduce(
    (acc, entry) => ({
      ...acc,
      [entry.key]: respondents > 0 ? roundToOne((counts[entry.key] / respondents) * 100) : 0,
    }),
    {} as Record<PlanningImpactKey, number>,
  );

  return [
    {
      cohort: 'Delivery & engineering',
      respondents,
      ...shares,
    },
  ];
}

function normalizeBlockerLabel(
  surveyType: SurveyType,
  rawValue: string | undefined,
): string | null {
  const value = rawValue?.trim();
  const lower = value?.replace(/\s+/g, ' ').toLowerCase();

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
  if (
    lower.includes('lack of access to the right ai tools') ||
    lower.includes('cost, licensing, approval')
  ) {
    return BLOCKER_LABEL_BY_KEY.accessLicensingLimits;
  }
  if (
    lower.includes('data sensitivity') ||
    lower.includes('confidentiality concerns') ||
    lower.includes('client restrictions')
  ) {
    return BLOCKER_LABEL_BY_KEY.dataSensitivityOrClient;
  }
  if (
    lower.includes('unclear or undocumented processes') ||
    lower.includes('unclear system boundaries') ||
    lower.includes('hard to give ai the right context')
  ) {
    return BLOCKER_LABEL_BY_KEY.unclearProcessesOrSystem;
  }
  if (
    lower.includes('missing or outdated documentation') ||
    lower.includes('no templates') ||
    lower.includes('reference materials')
  ) {
    return BLOCKER_LABEL_BY_KEY.missingDocsOrReference;
  }
  if (
    lower.includes('legacy code') ||
    lower.includes('tech debt') ||
    lower.includes('ci/cd') ||
    lower.includes('dev environment') ||
    lower.includes('integration between tools')
  ) {
    return BLOCKER_LABEL_BY_KEY.technicalEnvironment;
  }
  if (surveyType === 'business' && lower.includes('unclear what ai can actually help with in my role')) {
    return BLOCKER_LABEL_BY_KEY.unclearRoleFit;
  }
  if (lower.includes('not sure') || lower.includes("hard to answer from the dev's perspective")) {
    return BLOCKER_LABEL_BY_KEY.other;
  }
  return BLOCKER_LABEL_BY_KEY.other;
}

function buildBlockerComparison(responses: RawResponse[]): ImpactComparisonRow[] {
  return buildTwoCohortComparison(
    responses,
    BLOCKER_LABELS,
    (surveyType, response) => (surveyType === 'business' ? response.q3_blocker : response.q3_12),
    normalizeBlockerLabel,
  );
}

function normalizeGrowthMomentumAnswer(
  _surveyType: SurveyType,
  rawValue: string | undefined,
): GrowthMomentumKey | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (value.includes('not actively developing')) return 'notDeveloping';
  if (value.includes('learn when it comes up')) return 'reactiveLearning';
  if (value.includes('steady pace')) return 'steadyLearning';
  if (value.includes('actively seek out')) return 'activelySeeking';
  if (value.includes('teach others')) return 'teachingOthers';
  return null;
}

function buildGrowthMomentumDistribution(
  responses: RawResponse[],
): GrowthMomentumDistributionRow[] {
  return buildTwoCohortStackedDistribution(
    responses,
    GROWTH_MOMENTUM_SERIES,
    (_surveyType, response) => response.q4_1,
    normalizeGrowthMomentumAnswer,
  ) as GrowthMomentumDistributionRow[];
}

function normalizeExperimentationInitiativeAnswer(
  _surveyType: SurveyType,
  rawValue: string | undefined,
): ExperimentationInitiativeKey | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (value === 'no') return 'no';
  if (value.includes("thought about it but didn't")) return 'thoughtButDidnt';
  if (value.includes('yes, once')) return 'yesOnce';
  if (value.includes('yes, multiple')) return 'yesMultiple';
  if (value.includes('regularly')) return 'regularlyExperimentAndShare';
  return null;
}

function buildExperimentationInitiativeDistribution(
  responses: RawResponse[],
): ExperimentationInitiativeDistributionRow[] {
  return buildTwoCohortStackedDistribution(
    responses,
    EXPERIMENTATION_INITIATIVE_SERIES,
    (_surveyType, response) => response.q4_2,
    normalizeExperimentationInitiativeAnswer,
  ) as ExperimentationInitiativeDistributionRow[];
}

function normalizeKnowledgeSharingAnswer(
  _surveyType: SurveyType,
  rawValue: string | undefined,
): KnowledgeSharingKey | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (value.includes('never')) return 'never';
  if (value.includes('rarely')) return 'rarely';
  if (value.includes('occasionally')) return 'occasionally';
  if (value.includes('actively share') || value.includes('regularly')) return 'regularlyShare';
  if (value.includes('go-to')) return 'goToResource';
  return null;
}

function buildKnowledgeSharingDistribution(
  responses: RawResponse[],
): KnowledgeSharingDistributionRow[] {
  return buildTwoCohortStackedDistribution(
    responses,
    KNOWLEDGE_SHARING_SERIES,
    (_surveyType, response) => response.q4_3,
    normalizeKnowledgeSharingAnswer,
  ) as KnowledgeSharingDistributionRow[];
}

function cultureInfluenceQ4_4Score(rawValue: string | undefined): number | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (value.includes('other teams') || value.includes('other projects')) return 5;
  if (value.includes('became part of how my team works') || value.includes('team practice')) return 4;
  if (value.includes('at least one person adopted')) return 3;
  if (value.includes("suggested something, but it didn't really stick")) return 2;
  if (value === 'no') return 1;
  return null;
}

function cultureInfluenceQ4_5Score(rawValue: string | undefined): number | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (value.includes('other teams') || value.includes('other projects')) return 5;
  if (value.includes('multiple people on my team')) return 4;
  if (value.includes('at least one person changed')) return 3;
  if (value.includes("i've given advice") || value.includes("i've given examples")) return 2;
  if (value.includes("haven't directly helped") || value.includes("can't think of anyone")) {
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

function buildInfluenceScoreDistribution(
  responses: RawResponse[],
): InfluenceScoreDistributionRow[] {
  return (['business', 'delivery-engineering'] as const).map((surveyType) => {
    const scopedResponses = responses.filter((response) => response.surveyType === surveyType);
    const respondents = scopedResponses.length;
    const counts = INFLUENCE_SCORE_SERIES.reduce(
      (acc, entry) => ({
        ...acc,
        [entry.key]: 0,
      }),
      {} as Record<InfluenceScoreKey, number>,
    );

    for (const response of scopedResponses) {
      const scores = [
        cultureInfluenceQ4_4Score(response.q4_4),
        cultureInfluenceQ4_5Score(response.q4_5),
      ].filter(isNumber);

      if (scores.length === 0) {
        continue;
      }

      const bucket = influenceScoreBucket(average(scores));
      counts[bucket] += 1;
    }

    const shares = INFLUENCE_SCORE_SERIES.reduce(
      (acc, entry) => ({
        ...acc,
        [entry.key]: respondents > 0 ? roundToOne((counts[entry.key] / respondents) * 100) : 0,
      }),
      {} as Record<InfluenceScoreKey, number>,
    );

    return {
      cohort: surveyType === 'business' ? 'Business' : 'Delivery & engineering',
      respondents,
      ...shares,
    };
  });
}

function normalizeTeamAiMaturityAnswer(
  _surveyType: SurveyType,
  rawValue: string | undefined,
): TeamAiMaturityKey | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (value.includes('very low')) return 'veryLow';
  if (value.includes('below average')) return 'belowAverage';
  if (value === 'average') return 'average';
  if (value.includes('above average')) return 'aboveAverage';
  if (value.includes('very high')) return 'veryHigh';
  return null;
}

function buildTeamAiMaturityDistribution(
  responses: RawResponse[],
): TeamAiMaturityDistributionRow[] {
  return buildTwoCohortStackedDistribution(
    responses,
    TEAM_AI_MATURITY_SERIES,
    (surveyType, response) => (surveyType === 'business' ? response.q4_6 : response.q4_8),
    normalizeTeamAiMaturityAnswer,
  ) as TeamAiMaturityDistributionRow[];
}

function normalizeOrganizationalSupportAnswer(
  _surveyType: SurveyType,
  rawValue: string | undefined,
): OrganizationalSupportKey | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (value.includes('not at all')) return 'notSupportedAtAll';
  if (value.includes('minimally')) return 'minimallySupported';
  if (value.includes('somewhat')) return 'somewhatSupported';
  if (value.includes('well supported')) return 'wellSupported';
  if (value.includes('very well supported')) return 'veryWellSupported';
  return null;
}

function buildOrganizationalSupportDistribution(
  responses: RawResponse[],
): OrganizationalSupportDistributionRow[] {
  return buildTwoCohortStackedDistribution(
    responses,
    ORGANIZATIONAL_SUPPORT_SERIES,
    (surveyType, response) => (surveyType === 'business' ? response.q4_9 : response.q4_11),
    normalizeOrganizationalSupportAnswer,
  ) as OrganizationalSupportDistributionRow[];
}

function normalizeToolSatisfactionAnswer(
  _surveyType: SurveyType,
  rawValue: string | undefined,
): ToolSatisfactionKey | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (value.includes('very dissatisfied')) return 'veryDissatisfied';
  if (value === 'dissatisfied') return 'dissatisfied';
  if (value === 'neutral') return 'neutral';
  if (value === 'satisfied') return 'satisfied';
  if (value.includes('very satisfied')) return 'verySatisfied';
  return null;
}

function buildToolSatisfactionDistribution(
  responses: RawResponse[],
): ToolSatisfactionDistributionRow[] {
  return buildTwoCohortStackedDistribution(
    responses,
    TOOL_SATISFACTION_SERIES,
    (surveyType, response) => (surveyType === 'business' ? response.q4_7 : response.q4_9),
    normalizeToolSatisfactionAnswer,
  ) as ToolSatisfactionDistributionRow[];
}

function normalizeEnjoyabilityAnswer(
  _surveyType: SurveyType,
  rawValue: string | undefined,
): EnjoyabilityKey | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (value.includes('much less enjoyable')) return 'muchLessEnjoyable';
  if (value.includes('slightly less enjoyable')) return 'slightlyLessEnjoyable';
  if (value.includes('no change')) return 'noChange';
  if (value === 'more enjoyable') return 'moreEnjoyable';
  if (value.includes('much more enjoyable')) return 'muchMoreEnjoyable';
  return null;
}

function buildEnjoyabilityDistribution(
  responses: RawResponse[],
): EnjoyabilityDistributionRow[] {
  return buildTwoCohortStackedDistribution(
    responses,
    ENJOYABILITY_SERIES,
    (surveyType, response) => (surveyType === 'business' ? response.q4_8 : response.q4_10),
    normalizeEnjoyabilityAnswer,
  ) as EnjoyabilityDistributionRow[];
}

function normalizePracticeResilienceAnswer(
  _surveyType: SurveyType,
  rawValue: string | undefined,
): PracticeResilienceKey | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (value.includes('there are no team ai practices to continue')) return 'noPractices';
  if (value.includes("i'm the one who's been driving")) return 'championDependent';
  if (value.includes('partially')) return 'partiallyResilient';
  if (value.includes('team property')) return 'teamOwned';
  if (value.includes('documented ai onboarding')) return 'documentedOnboarded';
  return null;
}

function buildPracticeResilienceDistribution(
  responses: RawResponse[],
): PracticeResilienceDistributionRow[] {
  return buildTwoCohortStackedDistribution(
    responses,
    PRACTICE_RESILIENCE_SERIES,
    (surveyType, response) => (surveyType === 'business' ? response.q4_12 : response.q4_14),
    normalizePracticeResilienceAnswer,
  ) as PracticeResilienceDistributionRow[];
}

function normalizeKnowledgeArtifactAnswer(
  _surveyType: SurveyType,
  rawValue: string | undefined,
): KnowledgeArtifactKey | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (value === 'no') return 'noArtifact';
  if (value.includes('slack thread') || value.includes('informal notes')) return 'informalNotes';
  if (value.includes('short how-to') || value.includes('shared prompt collection')) {
    return 'shortReusableArtifact';
  }
  if (value.includes('substantial guide') || value.includes('training material')) {
    return 'substantialGuide';
  }
  if (value.includes('multiple artifacts')) return 'multipleArtifacts';
  return null;
}

function buildKnowledgeArtifactDistribution(
  responses: RawResponse[],
): KnowledgeArtifactDistributionRow[] {
  return buildTwoCohortStackedDistribution(
    responses,
    KNOWLEDGE_ARTIFACT_SERIES,
    (surveyType, response) => (surveyType === 'business' ? response.q4_13 : response.q4_6),
    normalizeKnowledgeArtifactAnswer,
  ) as KnowledgeArtifactDistributionRow[];
}

const SUPPORT_NEEDED_LABEL_BY_KEY = {
  advanced: 'Advanced workflows',
  overview: 'Tool overview',
  prompting: 'Prompt engineering',
  setup: 'Task setup',
  peer: 'Peer learning',
} as const satisfies Record<
  Exclude<SupportDemandSeriesKey, 'pairing' | 'handsOn'>,
  (typeof CULTURE_SUPPORT_NEEDED_LABELS)[number]
>;

function buildCultureSupportNeededComparison(
  responses: RawResponse[],
): ImpactComparisonRow[] {
  const businessResponses = responses.filter((response) => response.surveyType === 'business');
  const deliveryResponses = responses.filter(
    (response) => response.surveyType === 'delivery-engineering',
  );
  const businessCounts = new Map<string, number>();
  const deliveryCounts = new Map<string, number>();

  for (const response of businessResponses) {
    const labels = new Set(
      splitSurveyMultiValue(response.q4_10)
        .map((answer) => supportDemandAnswerKey(answer))
        .filter(
          (key): key is Exclude<SupportDemandSeriesKey, 'pairing' | 'handsOn'> =>
            Boolean(key) && key !== 'pairing' && key !== 'handsOn',
        )
        .map((key) => SUPPORT_NEEDED_LABEL_BY_KEY[key]),
    );

    for (const label of labels) {
      businessCounts.set(label, (businessCounts.get(label) ?? 0) + 1);
    }
  }

  for (const response of deliveryResponses) {
    const labels = new Set(
      splitSurveyMultiValue(response.q4_12)
        .map((answer) => supportDemandAnswerKey(answer))
        .filter(
          (key): key is Exclude<SupportDemandSeriesKey, 'pairing' | 'handsOn'> =>
            Boolean(key) && key !== 'pairing' && key !== 'handsOn',
        )
        .map((key) => SUPPORT_NEEDED_LABEL_BY_KEY[key]),
    );

    for (const label of labels) {
      deliveryCounts.set(label, (deliveryCounts.get(label) ?? 0) + 1);
    }
  }

  return CULTURE_SUPPORT_NEEDED_LABELS.map((label) => {
    const businessCount = businessCounts.get(label) ?? 0;
    const deliveryCount = deliveryCounts.get(label) ?? 0;

    return {
      label,
      businessCount,
      businessShare:
        businessResponses.length > 0 ? roundToOne((businessCount / businessResponses.length) * 100) : 0,
      deliveryCount,
      deliveryShare:
        deliveryResponses.length > 0 ? roundToOne((deliveryCount / deliveryResponses.length) * 100) : 0,
    };
  });
}

function normalizeHandsOnHelpLabel(rawValue: string | undefined): (typeof HANDS_ON_HELP_LABELS)[number] | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (
    value.includes("don't need any hands-on help") ||
    value.includes("fine figuring things out on my own")
  ) {
    return 'No hands-on help needed';
  }
  if (value.includes('overview session')) return 'Overview session';
  if (value.includes('deeper training')) return 'Deeper training';
  if (value.includes('help setting up')) return 'Task setup help';
  if (value.includes('1:1 pairing')) return '1:1 pairing';
  return null;
}

function buildHandsOnHelpComparison(responses: RawResponse[]): ImpactComparisonRow[] {
  return buildTwoCohortComparison(
    responses,
    HANDS_ON_HELP_LABELS,
    (surveyType, response) => (surveyType === 'business' ? response.q4_11 : response.q4_13),
    (_surveyType, rawValue) => normalizeHandsOnHelpLabel(rawValue),
  );
}

function normalizeBusinessOnboardingAnswer(
  rawValue: string | undefined,
): BusinessOnboardingKey | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (value.includes('there are no ai practices to onboard on')) return 'noOnboarding';
  if (value.includes('everyone figures it out')) return 'noOnboarding';
  if (value.includes('informally')) return 'informalOnboarding';
  if (value.includes('part of onboarding')) return 'partOfOnboarding';
  return null;
}

function buildBusinessOnboardingDistribution(
  responses: RawResponse[],
): BusinessOnboardingDistributionRow[] {
  const scopedResponses = responses.filter((response) => response.surveyType === 'business');
  const respondents = scopedResponses.length;
  const counts = BUSINESS_ONBOARDING_SERIES.reduce(
    (acc, entry) => ({
      ...acc,
      [entry.key]: 0,
    }),
    {} as Record<BusinessOnboardingKey, number>,
  );

  for (const response of scopedResponses) {
    const key = normalizeBusinessOnboardingAnswer(response.q4_14);
    if (key) {
      counts[key] += 1;
    }
  }

  const shares = BUSINESS_ONBOARDING_SERIES.reduce(
    (acc, entry) => ({
      ...acc,
      [entry.key]: respondents > 0 ? roundToOne((counts[entry.key] / respondents) * 100) : 0,
    }),
    {} as Record<BusinessOnboardingKey, number>,
  );

  return [
    {
      cohort: 'Business',
      respondents,
      ...shares,
    },
  ];
}

function normalizeOpportunityClarityAnswer(
  _surveyType: SurveyType,
  rawValue: string | undefined,
): OpportunityClarityKey | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (value.includes('still exploring where ai could create value')) return 'stillExploring';
  if (value.includes('see general opportunities')) return 'generalOpportunities';
  if (value.includes('can name 1–2 specific recurring tasks') || value.includes('can name 1-2 specific recurring tasks')) {
    return 'oneToTwoTasks';
  }
  if (value.includes('identify specific workflows')) return 'specificWorkflows';
  if (value.includes('prioritize ai opportunities by value')) return 'prioritizedValueFeasibility';
  return null;
}

function buildOpportunityClarityDistribution(
  responses: RawResponse[],
): OpportunityClarityDistributionRow[] {
  return buildTwoCohortStackedDistribution(
    responses,
    OPPORTUNITY_CLARITY_SERIES,
    (_surveyType, response) => response.q5_1,
    normalizeOpportunityClarityAnswer,
  ) as OpportunityClarityDistributionRow[];
}

function normalizeWorkChangeImaginationAnswer(
  _surveyType: SurveyType,
  rawValue: string | undefined,
): WorkChangeImaginationKey | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (value.includes('still exploring this')) return 'stillExploring';
  if (value.includes('speed up small tasks')) return 'speedUpSmallTasks';
  if (value.includes('improve some parts of my daily workflow')) return 'improvePartsOfWorkflow';
  if (value.includes('at least one workflow that could work differently')) return 'workflowCouldDiffer';
  if (value.includes('future ai-assisted working model')) return 'futureAiAssistedModel';
  return null;
}

function buildWorkChangeImaginationDistribution(
  responses: RawResponse[],
): WorkChangeImaginationDistributionRow[] {
  return buildTwoCohortStackedDistribution(
    responses,
    WORK_CHANGE_IMAGINATION_SERIES,
    (_surveyType, response) => response.q5_3,
    normalizeWorkChangeImaginationAnswer,
  ) as WorkChangeImaginationDistributionRow[];
}

function normalizeOpportunitySelectionAnswer(
  _surveyType: SurveyType,
  rawValue: string | undefined,
): OpportunitySelectionKey | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (value.includes('general recommendations or trends')) return 'generalTrends';
  if (value.includes('when someone else suggests them')) return 'someoneElseSuggests';
  if (value.includes('seem useful for my own tasks')) return 'usefulForMyTasks';
  if (value.includes('solves a real workflow problem')) return 'solvesRealProblem';
  if (value.includes('value, feasibility, cost, privacy, adoption effort, and expected impact')) {
    return 'evaluatedByValueAndImpact';
  }
  return null;
}

function buildOpportunitySelectionDistribution(
  responses: RawResponse[],
): OpportunitySelectionDistributionRow[] {
  return buildTwoCohortStackedDistribution(
    responses,
    OPPORTUNITY_SELECTION_SERIES,
    (_surveyType, response) => response.q5_4,
    normalizeOpportunitySelectionAnswer,
  ) as OpportunitySelectionDistributionRow[];
}

function normalizeBusinessValueConnectionAnswer(
  _surveyType: SurveyType,
  rawValue: string | undefined,
): BusinessValueConnectionKey | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (value.includes('still learning how ai connects to broader value')) {
    return 'stillLearningBroaderValue';
  }
  if (value.includes('personal productivity help')) return 'personalProductivity';
  if (value.includes('improve internal efficiency')) return 'internalEfficiency';
  if (value.includes('improve delivery speed, quality, communication, or decision-making')) {
    return 'deliveryQualityCommunication';
  }
  if (value.includes('change delivery models, staffing, pricing, client experience, or competitive advantage')) {
    return 'businessModelClientAdvantage';
  }
  return null;
}

function buildBusinessValueConnectionDistribution(
  responses: RawResponse[],
): BusinessValueConnectionDistributionRow[] {
  return buildTwoCohortStackedDistribution(
    responses,
    BUSINESS_VALUE_CONNECTION_SERIES,
    (_surveyType, response) => response.q5_5,
    normalizeBusinessValueConnectionAnswer,
  ) as BusinessValueConnectionDistributionRow[];
}

function normalizePersonalDevelopmentDirectionAnswer(
  _surveyType: SurveyType,
  rawValue: string | undefined,
): PersonalDevelopmentDirectionKey | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (value.includes('still figuring out what would be useful')) return 'stillFiguringOut';
  if (value.includes('learn general ai basics and available tools')) return 'generalAiBasics';
  if (value.includes('one specific ai skill or workflow i want to improve')) return 'oneSpecificSkill';
  if (value.includes('which ai capabilities would help me become stronger in my role')) {
    return 'roleStrengtheningCapability';
  }
  if (value.includes('clear personal ai development direction connected to my role')) {
    return 'clearRoleLinkedDirection';
  }
  return null;
}

function buildPersonalDevelopmentDirectionDistribution(
  responses: RawResponse[],
): PersonalDevelopmentDirectionDistributionRow[] {
  return buildTwoCohortStackedDistribution(
    responses,
    PERSONAL_DEVELOPMENT_DIRECTION_SERIES,
    (_surveyType, response) => response.q5_6,
    normalizePersonalDevelopmentDirectionAnswer,
  ) as PersonalDevelopmentDirectionDistributionRow[];
}

function normalizeVisionActionLabel(rawValue: string): string | null {
  const normalized = rawValue.trim().replace(/\s+/g, ' ').toLowerCase();
  if (!normalized) return null;

  const match = VISION_ACTION_RULES.find((rule) => normalized.includes(rule.needle));
  return match?.label ?? null;
}

function normalizeVisionActionCategory(rawValue: string): (typeof VISION_ACTION_MIX_LABELS)[number] | null {
  const normalized = rawValue.trim().replace(/\s+/g, ' ').toLowerCase();
  if (!normalized) return null;

  const match = VISION_ACTION_RULES.find((rule) => normalized.includes(rule.needle));
  if (!match) return null;

  switch (match.category) {
    case 'workflow':
      return 'Workflow';
    case 'enablement':
      return 'Enablement';
    case 'governance':
      return 'Governance';
    case 'strategy':
      return 'Strategy';
  }
}

function buildVisionActionPrioritiesComparison(
  responses: RawResponse[],
): ImpactComparisonRow[] {
  const businessResponses = responses.filter((response) => response.surveyType === 'business');
  const deliveryResponses = responses.filter(
    (response) => response.surveyType === 'delivery-engineering',
  );
  const businessCounts = new Map<string, number>();
  const deliveryCounts = new Map<string, number>();

  for (const response of businessResponses) {
    const labels = new Set(
      splitSurveyMultiValue(response.q5_2)
        .map((answer) => normalizeVisionActionLabel(answer))
        .filter((label): label is string => Boolean(label)),
    );
    for (const label of labels) {
      businessCounts.set(label, (businessCounts.get(label) ?? 0) + 1);
    }
  }

  for (const response of deliveryResponses) {
    const labels = new Set(
      splitSurveyMultiValue(response.q5_2)
        .map((answer) => normalizeVisionActionLabel(answer))
        .filter((label): label is string => Boolean(label)),
    );
    for (const label of labels) {
      deliveryCounts.set(label, (deliveryCounts.get(label) ?? 0) + 1);
    }
  }

  return VISION_ACTION_RULES.map((rule) => rule.label).map((label) => {
    const businessCount = businessCounts.get(label) ?? 0;
    const deliveryCount = deliveryCounts.get(label) ?? 0;

    return {
      label,
      businessCount,
      businessShare:
        businessResponses.length > 0 ? roundToOne((businessCount / businessResponses.length) * 100) : 0,
      deliveryCount,
      deliveryShare:
        deliveryResponses.length > 0 ? roundToOne((deliveryCount / deliveryResponses.length) * 100) : 0,
    };
  });
}

function buildVisionActionMixComparison(
  responses: RawResponse[],
): VisionActionMixComparisonRow[] {
  const businessResponses = responses.filter((response) => response.surveyType === 'business');
  const deliveryResponses = responses.filter(
    (response) => response.surveyType === 'delivery-engineering',
  );
  const businessCounts = new Map<string, number>();
  const deliveryCounts = new Map<string, number>();

  for (const response of businessResponses) {
    const labels = new Set(
      splitSurveyMultiValue(response.q5_2)
        .map((answer) => normalizeVisionActionCategory(answer))
        .filter((label): label is (typeof VISION_ACTION_MIX_LABELS)[number] => Boolean(label)),
    );
    for (const label of labels) {
      businessCounts.set(label, (businessCounts.get(label) ?? 0) + 1);
    }
  }

  for (const response of deliveryResponses) {
    const labels = new Set(
      splitSurveyMultiValue(response.q5_2)
        .map((answer) => normalizeVisionActionCategory(answer))
        .filter((label): label is (typeof VISION_ACTION_MIX_LABELS)[number] => Boolean(label)),
    );
    for (const label of labels) {
      deliveryCounts.set(label, (deliveryCounts.get(label) ?? 0) + 1);
    }
  }

  return VISION_ACTION_MIX_LABELS.map((label) => {
    const businessCount = businessCounts.get(label) ?? 0;
    const deliveryCount = deliveryCounts.get(label) ?? 0;

    return {
      label,
      businessCount,
      businessShare:
        businessResponses.length > 0 ? roundToOne((businessCount / businessResponses.length) * 100) : 0,
      deliveryCount,
      deliveryShare:
        deliveryResponses.length > 0 ? roundToOne((deliveryCount / deliveryResponses.length) * 100) : 0,
    };
  });
}

function opportunityClarityScore(rawValue: string | undefined): number | null {
  const key = normalizeOpportunityClarityAnswer('business', rawValue);
  if (!key) return null;
  switch (key) {
    case 'stillExploring':
      return 1;
    case 'generalOpportunities':
      return 2;
    case 'oneToTwoTasks':
      return 3;
    case 'specificWorkflows':
      return 4;
    case 'prioritizedValueFeasibility':
      return 5;
  }
}

function workChangeImaginationScore(rawValue: string | undefined): number | null {
  const key = normalizeWorkChangeImaginationAnswer('business', rawValue);
  if (!key) return null;
  switch (key) {
    case 'stillExploring':
      return 1;
    case 'speedUpSmallTasks':
      return 2;
    case 'improvePartsOfWorkflow':
      return 3;
    case 'workflowCouldDiffer':
      return 4;
    case 'futureAiAssistedModel':
      return 5;
  }
}

function opportunitySelectionScore(rawValue: string | undefined): number | null {
  const key = normalizeOpportunitySelectionAnswer('business', rawValue);
  if (!key) return null;
  switch (key) {
    case 'generalTrends':
      return 1;
    case 'someoneElseSuggests':
      return 2;
    case 'usefulForMyTasks':
      return 3;
    case 'solvesRealProblem':
      return 4;
    case 'evaluatedByValueAndImpact':
      return 5;
  }
}

function businessValueConnectionScore(rawValue: string | undefined): number | null {
  const key = normalizeBusinessValueConnectionAnswer('business', rawValue);
  if (!key) return null;
  switch (key) {
    case 'stillLearningBroaderValue':
      return 1;
    case 'personalProductivity':
      return 2;
    case 'internalEfficiency':
      return 3;
    case 'deliveryQualityCommunication':
      return 4;
    case 'businessModelClientAdvantage':
      return 5;
  }
}

function personalDevelopmentDirectionScore(rawValue: string | undefined): number | null {
  const key = normalizePersonalDevelopmentDirectionAnswer('business', rawValue);
  if (!key) return null;
  switch (key) {
    case 'stillFiguringOut':
      return 1;
    case 'generalAiBasics':
      return 2;
    case 'oneSpecificSkill':
      return 3;
    case 'roleStrengtheningCapability':
      return 4;
    case 'clearRoleLinkedDirection':
      return 5;
  }
}

function visionReadinessBucket(score: number): VisionReadinessKey {
  const rounded = Math.max(1, Math.min(5, Math.round(score)));
  switch (rounded) {
    case 1:
      return 'emerging';
    case 2:
      return 'earlyFraming';
    case 3:
      return 'structuredThinking';
    case 4:
      return 'strategicVision';
    default:
      return 'forwardLeading';
  }
}

function buildVisionReadinessDistribution(
  responses: RawResponse[],
): VisionReadinessDistributionRow[] {
  return (['business', 'delivery-engineering'] as const).map((surveyType) => {
    const scopedResponses = responses.filter((response) => response.surveyType === surveyType);
    const respondents = scopedResponses.length;
    const counts = VISION_READINESS_SERIES.reduce(
      (acc, entry) => ({
        ...acc,
        [entry.key]: 0,
      }),
      {} as Record<VisionReadinessKey, number>,
    );

    for (const response of scopedResponses) {
      const scores = [
        opportunityClarityScore(response.q5_1),
        workChangeImaginationScore(response.q5_3),
        opportunitySelectionScore(response.q5_4),
        businessValueConnectionScore(response.q5_5),
        personalDevelopmentDirectionScore(response.q5_6),
      ].filter(isNumber);

      if (scores.length === 0) continue;

      const bucket = visionReadinessBucket(average(scores));
      counts[bucket] += 1;
    }

    const shares = VISION_READINESS_SERIES.reduce(
      (acc, entry) => ({
        ...acc,
        [entry.key]: respondents > 0 ? roundToOne((counts[entry.key] / respondents) * 100) : 0,
      }),
      {} as Record<VisionReadinessKey, number>,
    );

    return {
      cohort: surveyType === 'business' ? 'Business' : 'Delivery & engineering',
      respondents,
      ...shares,
    };
  });
}

function buildVisionReadinessAverageSummary(
  responses: RawResponse[],
): VisionReadinessAverageRow[] {
  return (['business', 'delivery-engineering'] as const).map((surveyType) => {
    const scopedResponses = responses.filter((response) => response.surveyType === surveyType);
    const scores = scopedResponses
      .map((response) => {
        const parts = [
          opportunityClarityScore(response.q5_1),
          workChangeImaginationScore(response.q5_3),
          opportunitySelectionScore(response.q5_4),
          businessValueConnectionScore(response.q5_5),
          personalDevelopmentDirectionScore(response.q5_6),
        ].filter(isNumber);

        return parts.length > 0 ? average(parts) : null;
      })
      .filter(isNumber);

    return {
      cohort: surveyType === 'business' ? 'Business' : 'Delivery & engineering',
      color:
        surveyType === 'business'
          ? IMPACT_COHORT_COLORS.business
          : IMPACT_COHORT_COLORS.delivery,
      averageScore: scores.length > 0 ? roundToOne(average(scores)) : null,
    };
  });
}

function normalizePromptTechniqueLabel(rawLabel: string): string | null {
  const normalized = rawLabel.trim().replace(/\s+/g, ' ');

  if (!normalized) {
    return null;
  }

  return PROMPT_TECHNIQUE_MAP.get(normalized.toLowerCase()) ?? null;
}

function buildPromptTechniqueComparison(
  responses: RawResponse[],
): PromptTechniqueComparisonRow[] {
  const businessResponses = responses.filter((response) => response.surveyType === 'business');
  const deliveryResponses = responses.filter(
    (response) => response.surveyType === 'delivery-engineering',
  );

  const businessCounts = new Map<string, number>();
  const deliveryCounts = new Map<string, number>();

  for (const response of businessResponses) {
    const selections = new Set(
      splitSurveyMultiValue(response.q2_7)
        .map((label) => normalizePromptTechniqueLabel(label))
        .filter((label): label is string => Boolean(label)),
    );

    for (const selection of selections) {
      businessCounts.set(selection, (businessCounts.get(selection) ?? 0) + 1);
    }
  }

  for (const response of deliveryResponses) {
    const selections = new Set(
      splitSurveyMultiValue(response.q2_8)
        .map((label) => normalizePromptTechniqueLabel(label))
        .filter((label): label is string => Boolean(label)),
    );

    for (const selection of selections) {
      deliveryCounts.set(selection, (deliveryCounts.get(selection) ?? 0) + 1);
    }
  }

  return PROMPT_TECHNIQUE_OPTIONS.map((label) => {
    const businessCount = businessCounts.get(label) ?? 0;
    const deliveryCount = deliveryCounts.get(label) ?? 0;

    return {
      label,
      businessCount,
      businessShare:
        businessResponses.length > 0 ? roundToOne((businessCount / businessResponses.length) * 100) : 0,
      deliveryCount,
      deliveryShare:
        deliveryResponses.length > 0 ? roundToOne((deliveryCount / deliveryResponses.length) * 100) : 0,
    };
  }).sort(
    (left, right) =>
      Math.max(right.businessShare, right.deliveryShare) -
        Math.max(left.businessShare, left.deliveryShare) ||
      right.deliveryShare - left.deliveryShare ||
      right.businessShare - left.businessShare ||
      left.label.localeCompare(right.label),
  );
}

function filterUsageResponsesMulti(
  responses: ReturnType<typeof useSurveyData>['rawResponses'],
  departments: string[],
  seniorities: string[],
  teams: string[],
) {
  return responses.filter((response) => {
    const matchesDepartment =
      departments.length === 0 ||
      allDepartmentsList(response.department).some((department) => departments.includes(department));
    const matchesSeniority =
      seniorities.length === 0 || seniorities.includes(response.seniority.trim());
    const responseTeams = allProjectsList(response.projects);
    const matchesTeam =
      teams.length === 0 || teams.some((team) => responseTeams.includes(team));

    return matchesDepartment && matchesSeniority && matchesTeam;
  });
}

function slugifyScopeName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'team'
  );
}

function lowScoreBadgeTone(value: number): string {
  if (value < 2.5) return 'bg-[#f3f4f6] text-[#334155] ring-1 ring-inset ring-[#d1d5db]';
  if (value < 3) return 'bg-[#f8fafc] text-[#475569] ring-1 ring-inset ring-[#e2e8f0]';
  return 'text-[#242424]';
}

function usageImpactQuadrantColor(usage: number, impact: number): string {
  const highUsage = usage >= 3;
  const highImpact = impact >= 3;

  if (highUsage && highImpact) return ORG_QUADRANT_COLORS.highHigh;
  if (highUsage) return ORG_QUADRANT_COLORS.highLow;
  if (highImpact) return ORG_QUADRANT_COLORS.lowHigh;
  return ORG_QUADRANT_COLORS.lowLow;
}

function usageImpactQuadrantKey(usage: number, impact: number): UsageImpactQuadrantKey {
  const highUsage = usage >= 3;
  const highImpact = impact >= 3;

  if (highUsage && highImpact) return 'highHigh';
  if (highUsage) return 'highLow';
  if (highImpact) return 'lowHigh';
  return 'lowLow';
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

function formatSurveyDay(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return dateKey;
  }

  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function responseDateKey(response: RawResponse): string | null {
  if (!response.timestamp) {
    return null;
  }

  const date = new Date(response.timestamp);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function emptyTechDimensionScores(): Record<TechDimension, number> {
  return TECH_DIMENSIONS.reduce(
    (scores, dimension) => ({
      ...scores,
      [dimension]: 0,
    }),
    {} as Record<TechDimension, number>,
  );
}

function averageTechDimensionScores(responses: RawResponse[]): Record<TechDimension, number> {
  if (responses.length === 0) {
    return emptyTechDimensionScores();
  }

  const totals = emptyTechDimensionScores();

  for (const response of responses) {
    const scored = computeScores(response);

    for (const dimension of TECH_DIMENSIONS) {
      totals[dimension] += scored.dimensions[dimension].score;
    }
  }

  return TECH_DIMENSIONS.reduce(
    (scores, dimension) => ({
      ...scores,
      [dimension]: roundToOne(totals[dimension] / responses.length),
    }),
    {} as Record<TechDimension, number>,
  );
}

function buildOrgMaturityMapSnapshot(rawResponses: RawResponse[]): MaturityMapSnapshot {
  const surveyTypes: SurveyType[] = ['delivery-engineering', 'business'];
  const latestDateBySurveyType = new Map<SurveyType, string>();
  const previousDateBySurveyType = new Map<SurveyType, string>();

  for (const surveyType of surveyTypes) {
    const surveyDates = Array.from(
      new Set(
        rawResponses
          .filter((response) => response.surveyType === surveyType)
          .map(responseDateKey)
          .filter((dateKey): dateKey is string => Boolean(dateKey)),
      ),
    ).sort((left, right) => left.localeCompare(right));

    if (surveyDates.length === 0) {
      continue;
    }

    latestDateBySurveyType.set(surveyType, surveyDates[surveyDates.length - 1]);
    previousDateBySurveyType.set(surveyType, surveyDates[Math.max(0, surveyDates.length - 2)]);
  }

  const currentResponses = rawResponses.filter((response) => {
    const dateKey = responseDateKey(response);
    const latestDate = latestDateBySurveyType.get(response.surveyType ?? 'delivery-engineering');
    return Boolean(dateKey && latestDate && dateKey <= latestDate);
  });

  const previousResponses = rawResponses.filter((response) => {
    const dateKey = responseDateKey(response);
    const previousDate = previousDateBySurveyType.get(
      response.surveyType ?? 'delivery-engineering',
    );
    return Boolean(dateKey && previousDate && dateKey <= previousDate);
  });

  const currentScores = averageTechDimensionScores(currentResponses);
  const previousScores =
    previousResponses.length > 0 ? averageTechDimensionScores(previousResponses) : currentScores;

  const deliveryCurrent = latestDateBySurveyType.get('delivery-engineering');
  const businessCurrent = latestDateBySurveyType.get('business');

  return {
    data: TECH_DIMENSIONS.map((dimension) => ({
      dimension,
      current: currentScores[dimension],
      previous: previousScores[dimension],
    })),
    detail:
      deliveryCurrent && businessCurrent
        ? `Current profile uses responses through ${formatSurveyDay(deliveryCurrent)} for Delivery & Engineering and ${formatSurveyDay(businessCurrent)} for Business.`
        : 'Current profile is derived from the latest available response timestamps.',
  };
}

function computeCompositeDimensionScore(
  member: Individual,
  dimension: CompositeDimension,
): number | null {
  return computeCompositeQuestionScore(
    member.questionScores,
    COMPOSITE_QUESTION_KEYS[dimension][member.surveyType],
  );
}

function dimensionScore(member: Individual, dimension: OrgDimension): number | null {
  if (dimension === 'Data' || dimension === 'Governance') {
    return computeCompositeDimensionScore(member, dimension);
  }

  return member.scores[dimension];
}

function averageDimensionScores(members: Individual[]): Record<OrgDimension, number> {
  return DIMENSION_KEYS.reduce(
    (scores, dimension) => ({
      ...scores,
      [dimension]: roundToOne(
        average(members.map((member) => dimensionScore(member, dimension)).filter(isNumber)),
      ),
    }),
    {} as Record<OrgDimension, number>,
  );
}

function techScoresFromOrgDimensions(
  dimensions: Record<OrgDimension, number>,
): Record<TechDimension, number> {
  return TECH_DIMENSIONS.reduce(
    (scores, dimension) => ({
      ...scores,
      [dimension]: dimensions[dimension],
    }),
    {} as Record<TechDimension, number>,
  );
}

function hasSkillsVerificationData(member: Individual): boolean {
  return SKILLS_VERIFICATION_QUESTION_KEYS.some(
    (questionKey) => typeof member.questionScores[questionKey] === 'number',
  );
}

function groupIndividualsByGapScope(
  members: Individual[],
  scope: GapScope,
): Array<[string, Individual[]]> {
  const grouped = new Map<string, Individual[]>();

  for (const member of members) {
    const scopeNames =
      scope === 'department'
        ? member.allDepartments
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
        ? allDepartmentsList(response.department)
        : Array.from(new Set(allProjectsList(response.projects).map((project) => project.trim()).filter(Boolean)));

    for (const scopeName of scopeNames) {
      if (!scopeName) continue;
      const existing = grouped.get(scopeName) ?? [];
      existing.push(response);
      grouped.set(scopeName, existing);
    }
  }

  return Array.from(grouped.entries()).sort(([left], [right]) => left.localeCompare(right));
}

function embeddednessScore(
  surveyType: SurveyType,
  rawValue: string | undefined,
): number | null {
  const key = normalizeEmbeddednessAnswer(surveyType, rawValue);
  if (!key) return null;

  switch (key) {
    case 'separate':
    case 'notActive':
    case 'notYet':
      return 1;
    case 'occasional':
      return 2;
    case 'standard':
      return 3;
    case 'deep':
      return 4;
    case 'inseparable':
      return 5;
  }
}

function sharedPracticesScore(rawValue: string | undefined): number | null {
  const key = normalizeSharedPracticesAnswer(rawValue);
  if (!key) return null;

  switch (key) {
    case 'fragmented':
      return 1;
    case 'partial':
      return 3;
    case 'standardized':
      return 5;
  }
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

function dependencyImpactScore(rawValue: string | undefined): number | null {
  const key = normalizeDependencyImpactAnswer('business', rawValue);
  if (!key) return null;

  switch (key) {
    case 'noImpact':
      return 1;
    case 'minor':
      return 2;
    case 'noticeable':
      return 3;
    case 'significant':
      return 4;
    case 'major':
      return 5;
  }
}

function accessLicensingScore(rawValue: string | undefined): number | null {
  const key = normalizeAccessLicensingAnswer('business', rawValue);
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
}

function practiceResilienceScore(rawValue: string | undefined): number | null {
  const key = normalizePracticeResilienceAnswer('business', rawValue);
  if (!key) return null;

  switch (key) {
    case 'noPractices':
      return 1;
    case 'championDependent':
      return 2;
    case 'partiallyResilient':
      return 3;
    case 'teamOwned':
      return 4;
    case 'documentedOnboarded':
      return 5;
  }
}

function knowledgeSharingScore(rawValue: string | undefined): number | null {
  const key = normalizeKnowledgeSharingAnswer('business', rawValue);
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
}

function knowledgeArtifactScore(rawValue: string | undefined): number | null {
  const key = normalizeKnowledgeArtifactAnswer('business', rawValue);
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
}

function companyOrClientFunded(rawValue: string | undefined): boolean {
  const label = normalizeWhoPaysLabel('business', rawValue);
  return (
    label === 'Company subscription' ||
    label === 'Client pays' ||
    label === 'Company + self-paid extras'
  );
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

function visionActionMixBonus(categories: Set<VisionActionCategory>): number {
  if (
    categories.has('workflow') &&
    categories.has('governance') &&
    (categories.has('enablement') || categories.has('strategy'))
  ) {
    return 1;
  }
  if (categories.has('workflow') && categories.has('governance')) return 0.5;
  if (categories.size >= 2) return 0.25;
  return 0;
}

function visionActionReadinessScore(rawValue: string | undefined): number | null {
  if (!rawValue || rawValue.trim() === '') return null;

  const items = splitSurveyMultiValue(rawValue);
  const sortedRules = [...VISION_ACTION_RULES].sort((left, right) => right.needle.length - left.needle.length);
  const matchedRules: VisionActionRule[] = [];

  for (const item of items) {
    const normalized = item.trim().replace(/\s+/g, ' ').toLowerCase();
    for (const rule of sortedRules) {
      if (normalized.includes(rule.needle)) {
        matchedRules.push(rule);
        break;
      }
    }
  }

  const uniqueMatches = Array.from(new Map(matchedRules.map((rule) => [rule.needle, rule])).values());
  if (uniqueMatches.length === 0) return null;

  const avgScore = average(uniqueMatches.map((rule) => rule.score));
  const categories = new Set(uniqueMatches.map((rule) => rule.category));
  const weakPenalty = uniqueMatches.some((rule) => rule.score <= 2) ? 0.5 : 0;
  const bonus = Math.min(visionActionMixBonus(categories), 0.5);

  return Math.min(5, Math.max(1, avgScore + bonus - weakPenalty));
}

function visionReadinessScoreFromResponse(response: RawResponse): number | null {
  const scores = [
    opportunityClarityScore(response.q5_1),
    workChangeImaginationScore(response.q5_3),
    opportunitySelectionScore(response.q5_4),
    businessValueConnectionScore(response.q5_5),
    personalDevelopmentDirectionScore(response.q5_6),
  ].filter(isNumber);

  return scores.length > 0 ? average(scores) : null;
}

function buildSkillsConfidenceGapRows(
  members: Individual[],
  scope: GapScope,
) {
  return groupIndividualsByGapScope(members, scope)
    .map(([name, scopedMembers]) => {
      const selfScores = scopedMembers
        .map((member) =>
          computeCompositeQuestionScore(member.questionScores, [...SKILLS_SELF_ASSESSMENT_QUESTION_KEYS]),
        )
        .filter(isNumber);
      const verificationScores = scopedMembers
        .map((member) =>
          hasSkillsVerificationData(member)
            ? computeCompositeQuestionScore(member.questionScores, [...SKILLS_VERIFICATION_QUESTION_KEYS])
            : null,
        )
        .filter(isNumber);

      if (selfScores.length === 0) return null;

      return {
        name,
        respondents: scopedMembers.length,
        self: roundToOne(average(selfScores)),
        verification: verificationScores.length > 0 ? roundToOne(average(verificationScores)) : null,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .sort(
      (left, right) =>
        (right.self - (right.verification ?? right.self)) - (left.self - (left.verification ?? left.self)) ||
        left.name.localeCompare(right.name),
    );
}

function buildToolAccessConstraintRows(
  responses: RawResponse[],
  scope: GapScope,
) {
  return groupResponsesByGapScope(responses, scope)
    .map(([name, scopedResponses]) => {
      const accessScores = scopedResponses
        .map((response) =>
          accessLicensingScore(response.surveyType === 'business' ? response.q3_10 : response.q3_7),
        )
        .filter(isNumber);
      const costScores = scopedResponses
        .map((response) => {
          const pricingScore = pricingUnderstandingScore(
            response.surveyType ?? 'delivery-engineering',
            response.surveyType === 'business' ? response.q3_9 : response.q3_6,
          );
          const considerationScore = costConsiderationScore(
            response.surveyType ?? 'delivery-engineering',
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

      return {
        name,
        respondents: scopedResponses.length,
        access: roundToOne(average(accessScores)),
        costMaturity: roundToOne(average(costScores)),
        companyFundedShare: fundedShare,
        color: usageImpactQuadrantColor(roundToOne(average(accessScores)), roundToOne(average(costScores))),
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .sort((left, right) => left.access + left.costMaturity - (right.access + right.costMaturity) || left.name.localeCompare(right.name));
}

function buildEmbeddednessSharedPracticesRows(
  responses: RawResponse[],
  scope: GapScope,
) {
  return groupResponsesByGapScope(responses, scope)
    .map(([name, scopedResponses]) => {
      const embeddednessScores = scopedResponses
        .map((response) => embeddednessScore(response.surveyType ?? 'delivery-engineering', response.q1_6))
        .filter(isNumber);
      const sharedScores = scopedResponses
        .map((response) => sharedPracticesScore(response.q1_7))
        .filter(isNumber);

      if (embeddednessScores.length === 0 || sharedScores.length === 0) return null;

      return {
        name,
        respondents: scopedResponses.length,
        embeddedness: roundToOne(average(embeddednessScores)),
        sharedPractices: roundToOne(average(sharedScores)),
        color: usageImpactQuadrantColor(
          roundToOne(average(embeddednessScores)),
          roundToOne(average(sharedScores)),
        ),
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
}

function buildImpactWithoutResilienceRows(
  responses: RawResponse[],
  scope: GapScope,
) {
  return groupResponsesByGapScope(responses, scope)
    .map(([name, scopedResponses]) => {
      const dependencyScores = scopedResponses
        .map((response) => dependencyImpactScore(response.q3_8))
        .filter(isNumber);
      const resilienceScores = scopedResponses
        .map((response) =>
          practiceResilienceScore(
            response.surveyType === 'business' ? response.q4_12 : response.q4_14,
          ),
        )
        .filter(isNumber);

      if (dependencyScores.length === 0 || resilienceScores.length === 0) return null;

      const dependency = roundToOne(average(dependencyScores));
      const resilience = roundToOne(average(resilienceScores));
      const color =
        dependency >= 3 && resilience < 3
          ? '#dc2626'
          : dependency >= 3
            ? '#0f766e'
            : resilience < 3
              ? '#f59e0b'
              : '#2563eb';

      return {
        name,
        respondents: scopedResponses.length,
        dependency,
        resilience,
        color,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
}

function buildSupportDemandSkillsGapRows(
  responses: RawResponse[],
  scope: GapScope,
) {
  return groupResponsesByGapScope(responses, scope)
    .map(([name, scopedResponses]) => {
      const baselineScores = scopedResponses
        .map((response) => skillsBaselineScore(response.surveyType ?? 'delivery-engineering', response.q2_1))
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
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .sort((left, right) => right.supportDemand - left.supportDemand || left.baselineSkills - right.baselineSkills);
}

function buildSensitiveDataRiskRows(
  responses: RawResponse[],
  scope: GapScope,
) {
  return groupResponsesByGapScope(responses, scope)
    .map(([name, scopedResponses]) => {
      const scores = scopedResponses
        .map((response) =>
          sensitiveDataScore(response.surveyType === 'business' ? response.q2_9 : response.q2_12),
        )
        .filter(isNumber);
      if (scores.length === 0) return null;

      const riskyShare =
        (scopedResponses.filter((response) => {
          const key = normalizeSensitiveDataAnswer(
            response.surveyType === 'business' ? response.q2_9 : response.q2_12,
          );
          return key === 'risky' || key === 'uncertain';
        }).length /
          scopedResponses.length) *
        100;

      const score = roundToOne(average(scores));

      return {
        name,
        respondents: scopedResponses.length,
        score,
        riskyShare: roundToOne(riskyShare),
        color:
          score < 2.5 ? '#dc2626' : score < 3.5 ? '#f59e0b' : score < 4.5 ? '#2563eb' : '#0f766e',
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .sort((left, right) => left.score - right.score || right.riskyShare - left.riskyShare || left.name.localeCompare(right.name));
}

function blockerIsGovernanceHotspot(label: string | null): boolean {
  return (
    label === BLOCKER_LABEL_BY_KEY.noTeamAgreement ||
    label === BLOCKER_LABEL_BY_KEY.dataSensitivityOrClient ||
    label === BLOCKER_LABEL_BY_KEY.unclearProcessesOrSystem ||
    label === BLOCKER_LABEL_BY_KEY.missingDocsOrReference
  );
}

function riskGovernanceHotspotColor(safetyScore: number, governanceBlockerShare: number): string {
  if (safetyScore < 3 && governanceBlockerShare >= 35) return '#dc2626';
  if (safetyScore < 3.5 || governanceBlockerShare >= 25) return '#d97706';
  return '#0f766e';
}

function buildRiskGovernanceHotspotRows(
  responses: RawResponse[],
  scope: GapScope,
) {
  return groupResponsesByGapScope(responses, scope)
    .map(([name, scopedResponses]) => {
      const safetyScores = scopedResponses
        .map((response) =>
          sensitiveDataScore(
            response.surveyType === 'business' ? response.q2_9 : response.q2_12,
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
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .sort(
      (left, right) =>
        left.safetyScore - right.safetyScore ||
        right.governanceBlockerShare - left.governanceBlockerShare ||
        left.name.localeCompare(right.name),
    );
}

function buildWorkflowTransformationGapRows(
  responses: RawResponse[],
  scope: GapScope,
) {
  return groupResponsesByGapScope(responses, scope)
    .map(([name, scopedResponses]) => {
      const hoursScores = scopedResponses
        .map((response) => hoursSavedEstimate(response.surveyType === 'business' ? response.q3_7 : response.q3_4))
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
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
}

function buildVisionToActionGapRows(
  responses: RawResponse[],
  scope: GapScope,
) {
  return groupResponsesByGapScope(responses, scope)
    .map(([name, scopedResponses]) => {
      const visionScores = scopedResponses
        .map((response) => visionReadinessScoreFromResponse(response))
        .filter(isNumber);
      const actionScores = scopedResponses
        .map((response) => visionActionReadinessScore(response.q5_2))
        .filter(isNumber);

      if (visionScores.length === 0 || actionScores.length === 0) return null;

      const visionReadiness = roundToOne(average(visionScores));
      const actionReadiness = roundToOne(average(actionScores));

      return {
        name,
        respondents: scopedResponses.length,
        visionReadiness,
        actionReadiness,
        color:
          visionReadiness >= 3 && actionReadiness < 3
            ? '#dc2626'
            : visionReadiness >= 3 && actionReadiness >= 3
              ? '#0f766e'
              : visionReadiness < 3 && actionReadiness >= 3
                ? '#2563eb'
                : '#94a3b8',
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
}

function buildCultureSpreadGapRows(
  responses: RawResponse[],
  scope: GapScope,
) {
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
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
}

function MaturityDistributionTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    payload?: {
      level?: string;
      count?: number;
      share?: number;
      scoreRange?: string;
    };
  }>;
}) {
  const point = payload?.[0]?.payload;

  if (!active || !point) {
    return null;
  }

  return (
    <div className="rounded-md bg-[#242424] px-4 py-3 text-sm text-white shadow-lg">
      <div className="mb-2 font-semibold text-white">{point.level ?? 'Unknown level'}</div>
      <div className="space-y-1">
        <div>
          Respondents: {point.count ?? 0} ({point.share ?? 0}% of all respondents)
        </div>
        <div>Score: {point.scoreRange ?? '-'}</div>
      </div>
    </div>
  );
}

function UsageCategoryTooltip({
  active,
  payload,
  cohortLabel,
}: {
  active?: boolean;
  payload?: Array<{
    payload?: {
      label?: string;
      count?: number;
      share?: number;
    };
  }>;
  cohortLabel: string;
}) {
  const point = payload?.[0]?.payload;

  if (!active || !point) {
    return null;
  }

  return (
    <div className="rounded-md bg-[#242424] px-4 py-3 text-sm text-white shadow-lg">
      <div className="mb-2 font-semibold text-white">{point.label ?? 'Unknown'}</div>
      <div className="space-y-1">
        <div>
          Adoption: {point.share ?? 0}% of {cohortLabel}
        </div>
        <div>Respondents: {point.count ?? 0}</div>
      </div>
    </div>
  );
}

function EmbeddednessTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    color?: string;
    dataKey?: string;
    name?: string;
    value?: number;
    payload?: EmbeddednessDistributionRow;
  }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const row = payload[0]?.payload;

  if (!row) {
    return null;
  }

  return (
    <div className="rounded-md bg-[#242424] px-4 py-3 text-sm text-white shadow-lg">
      <div className="mb-2 font-semibold text-white">
        {label ?? row.cohort}
      </div>
      <div className="mb-2 text-white/80">{row.respondents} respondents</div>
      <div className="space-y-1.5">
        {payload
          .filter((entry) => Number(entry.value) > 0)
          .sort((left, right) => Number(right.value ?? 0) - Number(left.value ?? 0))
          .map((entry) => (
            <div key={String(entry.dataKey)} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span>{entry.name}</span>
              </div>
              <span>{Number(entry.value ?? 0).toFixed(1)}%</span>
            </div>
          ))}
      </div>
    </div>
  );
}

function SharedPracticesTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    color?: string;
    dataKey?: string;
    name?: string;
    value?: number;
    payload?: SharedPracticesDistributionRow;
  }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const row = payload[0]?.payload;

  if (!row) {
    return null;
  }

  return (
    <div className="rounded-md bg-[#242424] px-4 py-3 text-sm text-white shadow-lg">
      <div className="mb-2 font-semibold text-white">
        {label ?? row.cohort}
      </div>
      <div className="mb-2 text-white/80">{row.respondents} respondents</div>
      <div className="space-y-1.5">
        {payload
          .filter((entry) => Number(entry.value) > 0)
          .sort((left, right) => Number(right.value ?? 0) - Number(left.value ?? 0))
          .map((entry) => (
            <div key={String(entry.dataKey)} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span>{entry.name}</span>
              </div>
              <span>{Number(entry.value ?? 0).toFixed(1)}%</span>
            </div>
          ))}
      </div>
    </div>
  );
}

function SkillsBaselineTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    color?: string;
    dataKey?: string;
    name?: string;
    value?: number;
    payload?: SkillsBaselineDistributionRow;
  }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const row = payload[0]?.payload;

  if (!row) {
    return null;
  }

  return (
    <div className="rounded-md bg-[#242424] px-4 py-3 text-sm text-white shadow-lg">
      <div className="mb-2 font-semibold text-white">
        {label ?? row.cohort}
      </div>
      <div className="mb-2 text-white/80">{row.respondents} respondents</div>
      <div className="space-y-1.5">
        {payload
          .filter((entry) => Number(entry.value) > 0)
          .sort((left, right) => Number(right.value ?? 0) - Number(left.value ?? 0))
          .map((entry) => (
            <div key={String(entry.dataKey)} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span>{entry.name}</span>
              </div>
              <span>{Number(entry.value ?? 0).toFixed(1)}%</span>
            </div>
          ))}
      </div>
    </div>
  );
}

function SensitiveDataTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    color?: string;
    dataKey?: string;
    name?: string;
    value?: number;
    payload?: SensitiveDataDistributionRow;
  }>;
  label?: string;
}) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const row = payload[0]?.payload;

  if (!row) {
    return null;
  }

  return (
    <div className="rounded-md bg-[#242424] px-4 py-3 text-sm text-white shadow-lg">
      <div className="mb-2 font-semibold text-white">
        {label ?? row.cohort}
      </div>
      <div className="mb-2 text-white/80">{row.respondents} respondents</div>
      <div className="space-y-1.5">
        {payload
          .filter((entry) => Number(entry.value) > 0)
          .sort((left, right) => Number(right.value ?? 0) - Number(left.value ?? 0))
          .map((entry) => (
            <div key={String(entry.dataKey)} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span>{entry.name}</span>
              </div>
              <span>{Number(entry.value ?? 0).toFixed(1)}%</span>
            </div>
          ))}
      </div>
    </div>
  );
}

function PromptTechniqueTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{
    color?: string;
    dataKey?: string;
    name?: string;
    value?: number;
    payload?: PromptTechniqueComparisonRow;
  }>;
}) {
  const point = payload?.[0]?.payload;

  if (!active || !point || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-md bg-[#242424] px-4 py-3 text-sm text-white shadow-lg">
      <div className="mb-2 font-semibold text-white">{point.label}</div>
      <div className="space-y-1.5">
        {payload.map((entry) => {
          const share =
            entry.dataKey === 'businessShare' ? point.businessShare : point.deliveryShare;
          const count =
            entry.dataKey === 'businessShare' ? point.businessCount : point.deliveryCount;

          return (
            <div key={String(entry.dataKey)} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span>{entry.name}</span>
              </div>
              <span>{share.toFixed(1)}% ({count})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrganizationView() {
  const { individuals, rawResponses, resolvePersonName } = useSurveyData();
  const { isSensitiveDataHidden } = useSensitiveData();
  const { clearPendingNavigation } = useNavigationPending();
  const [insightsMode, setInsightsMode] = useState<'mustKnow' | 'deepDive'>('mustKnow');
  const [selectedToolDepartments, setSelectedToolDepartments] = useState<string[]>([]);
  const [selectedToolSeniorities, setSelectedToolSeniorities] = useState<string[]>([]);
  const [selectedToolTeams, setSelectedToolTeams] = useState<string[]>([]);
  const [selectedModelDepartments, setSelectedModelDepartments] = useState<string[]>([]);
  const [selectedModelSeniorities, setSelectedModelSeniorities] = useState<string[]>([]);
  const [selectedModelTeams, setSelectedModelTeams] = useState<string[]>([]);
  const [selectedEmbeddednessDepartments, setSelectedEmbeddednessDepartments] = useState<string[]>([]);
  const [selectedEmbeddednessTeams, setSelectedEmbeddednessTeams] = useState<string[]>([]);
  const [selectedSharedPracticesDepartments, setSelectedSharedPracticesDepartments] = useState<string[]>([]);
  const [selectedSharedPracticesTeams, setSelectedSharedPracticesTeams] = useState<string[]>([]);
  const [selectedSkillsBaselineDepartments, setSelectedSkillsBaselineDepartments] = useState<string[]>([]);
  const [selectedSkillsBaselineTeams, setSelectedSkillsBaselineTeams] = useState<string[]>([]);
  const [selectedPromptTechniqueDepartments, setSelectedPromptTechniqueDepartments] = useState<string[]>([]);
  const [selectedPromptTechniqueTeams, setSelectedPromptTechniqueTeams] = useState<string[]>([]);
  const [selectedSensitiveDataDepartments, setSelectedSensitiveDataDepartments] = useState<string[]>([]);
  const [selectedSensitiveDataTeams, setSelectedSensitiveDataTeams] = useState<string[]>([]);
  const [impactDepartmentFilters, setImpactDepartmentFilters] = useState<Record<ImpactFilterKey, string[]>>(
    createEmptyImpactFilters(),
  );
  const [impactTeamFilters, setImpactTeamFilters] = useState<Record<ImpactFilterKey, string[]>>(
    createEmptyImpactFilters(),
  );
  const [cultureDepartmentFilters, setCultureDepartmentFilters] = useState<Record<CultureFilterKey, string[]>>(
    createEmptyCultureFilters(),
  );
  const [cultureTeamFilters, setCultureTeamFilters] = useState<Record<CultureFilterKey, string[]>>(
    createEmptyCultureFilters(),
  );
  const [visionDepartmentFilters, setVisionDepartmentFilters] = useState<Record<VisionFilterKey, string[]>>(
    createEmptyVisionFilters(),
  );
  const [visionTeamFilters, setVisionTeamFilters] = useState<Record<VisionFilterKey, string[]>>(
    createEmptyVisionFilters(),
  );
  const [businessUsageMode, setBusinessUsageMode] = useState<UsageCategoryMode>('needle');
  const [deliveryUsageMode, setDeliveryUsageMode] = useState<UsageCategoryMode>('needle');
  const [usageImpactScope, setUsageImpactScope] = useState<UsageImpactScope>('team');
  const [hiddenMaturityDistributionLevels, setHiddenMaturityDistributionLevels] = useState<MaturityDistributionLevelKey[]>([]);
  const [heatmapSort, setHeatmapSort] = useState<{
    key: HeatmapSortKey | null;
    direction: HeatmapSortDirection | null;
  }>({
    key: null,
    direction: null,
  });
  const [projectRankingSort, setProjectRankingSort] = useState<{
    key: ProjectRankingSortKey;
    direction: ProjectRankingSortDirection;
  }>({
    key: 'name',
    direction: 'asc',
  });
  const [showAllDimensionHeatmapRows, setShowAllDimensionHeatmapRows] = useState(false);
  const [showAllProjectRankingRows, setShowAllProjectRankingRows] = useState(false);
  const [isPreparingAiResearchPack, setIsPreparingAiResearchPack] = useState(false);
  const [isAskAiOpen, setIsAskAiOpen] = useState(false);
  const { isTableSortPending, queueTableSort, clearTableSortPending } = useTableSortPending();
  const aiResearchPackRef = useRef<OrganizationAiResearchPack | null>(null);
  const aiResearchPackPromiseRef = useRef<Promise<OrganizationAiResearchPack> | null>(null);
  const aiResearchPackVersionRef = useRef(0);
  const orgMaturityMap = useMemo(() => buildOrgMaturityMapSnapshot(rawResponses), [rawResponses]);
  const orgArchetype = useMemo(
    () =>
      resolveTeamArchetype(
        orgMaturityMap.data.reduce(
          (scores, point) => {
            scores[point.dimension] = point.current;
            return scores;
          },
          {} as Record<TechDimension, number>,
        ),
      ),
    [orgMaturityMap],
  );
  const organizationSectionLinks =
    insightsMode === 'mustKnow'
      ? ORGANIZATION_MUST_KNOW_SECTION_LINKS
      : ORGANIZATION_DEEP_DIVE_SECTION_LINKS;
  const isMustKnowMode = insightsMode === 'mustKnow';
  useEffect(() => {
    clearPendingNavigation('/organization');
  }, [clearPendingNavigation]);

  useEffect(() => {
    if (isTableSortPending) {
      clearTableSortPending();
    }
  }, [clearTableSortPending, heatmapSort, isTableSortPending, projectRankingSort]);

  useEffect(() => {
    aiResearchPackVersionRef.current += 1;
    aiResearchPackRef.current = null;
    aiResearchPackPromiseRef.current = null;
  }, [individuals, rawResponses, resolvePersonName]);

  const maturityDistribution = useMemo<MaturityDistributionRow[]>(() => {
    const respondentCount = individuals.length;
    const levelCounts = individuals.reduce<Record<MaturityLevel, number>>(
      (counts, person) => {
        counts[person.overallLevel] += 1;
        return counts;
      },
      {
        1: 0,
        2: 0,
        3: 0,
        4: 0,
        5: 0,
      },
    );

    return MATURITY_LEVELS.map((level, index) => {
      const series = MATURITY_DISTRIBUTION_SERIES[index];
      const count = levelCounts[level];
      const share = respondentCount > 0 ? Math.round((count / respondentCount) * 1000) / 10 : 0;

      return {
        level: series.key,
        count,
        share,
        fill: series.color,
        scoreRange: series.scoreRange,
      };
    });
  }, [individuals]);

  const individualArchetypeBubbleRows = useMemo<ArchetypeBubbleRow[]>(() => {
    const rowsByArchetype = new Map<
      string,
      {
        archetype: IndividualArchetypeProfile;
        people: typeof individuals;
      }
    >();

    for (const person of individuals) {
      const archetype = resolveIndividualArchetype(person.scores);
      const existing = rowsByArchetype.get(archetype.id);

      if (existing) {
        existing.people.push(person);
        continue;
      }

      rowsByArchetype.set(archetype.id, {
        archetype,
        people: [person],
      });
    }

    return Array.from(rowsByArchetype.values())
      .map(({ archetype, people }) => ({
        id: archetype.id,
        label: archetype.label,
        signal: archetype.signal,
        scopeCount: people.length,
        respondentCount: people.length,
        usageImpactAverage: average(
          people.map((person) => average([person.scores.Usage, person.scores.Impact])),
        ),
        cultureVisionAverage: average(
          people.map((person) => average([person.scores.Culture, person.scores.Vision])),
        ),
      }))
      .sort(
        (left, right) =>
          right.scopeCount - left.scopeCount ||
          right.usageImpactAverage - left.usageImpactAverage,
      );
  }, [individuals]);

  const dimensionHeatmap = useMemo<HeatmapRow[]>(() => {
    const membersByDepartment = new Map<string, typeof individuals>();

    for (const person of individuals) {
      for (const department of person.allDepartments) {
        const existing = membersByDepartment.get(department) ?? [];
        existing.push(person);
        membersByDepartment.set(department, existing);
      }
    }

    return Array.from(membersByDepartment.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([department, members]) => {
        const dimensions = averageDimensionScores(members);
        const overall = average(TECH_DIMENSIONS.map((dimension) => dimensions[dimension]));
        const archetype = resolveTeamArchetype(techScoresFromOrgDimensions(dimensions));

        return {
          id: slugifyScopeName(department),
          department,
          respondents: members.length,
          overall,
          level: LEVEL_LABELS[scoreToLevel(overall)],
          archetype,
          ...dimensions,
        };
      });
  }, [individuals]);

  const sortedDimensionHeatmap = useMemo(() => {
    const rows = [...dimensionHeatmap];

    if (!heatmapSort.key || !heatmapSort.direction) {
      return rows;
    }

    const sortKey = heatmapSort.key;
    const sortDirection = heatmapSort.direction;
    const levelNumberMap: Record<string, number> = {
      Observer: 1,
      Explorer: 2,
      Practitioner: 3,
      Orchestrator: 4,
      Native: 5,
    };

    rows.sort((left, right) => {
      const comparison = (() => {
        switch (sortKey) {
          case 'department':
            return left.department.localeCompare(right.department);
          case 'overall':
            return left.overall - right.overall;
          case 'level':
            return (levelNumberMap[left.level] ?? 0) - (levelNumberMap[right.level] ?? 0);
          case 'archetype':
            return left.archetype.label.localeCompare(right.archetype.label);
          case 'respondents':
            return left.respondents - right.respondents;
          default:
            return left[sortKey] - right[sortKey];
        }
      })();

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return rows;
  }, [dimensionHeatmap, heatmapSort]);

  const visibleDimensionHeatmapRows = useMemo(
    () =>
      showAllDimensionHeatmapRows
        ? sortedDimensionHeatmap
        : sortedDimensionHeatmap.slice(0, 8),
    [showAllDimensionHeatmapRows, sortedDimensionHeatmap],
  );

  const departmentArchetypeBubbleRows = useMemo<ArchetypeBubbleRow[]>(() => {
    const rowsByArchetype = new Map<
      string,
      {
        archetype: TeamArchetypeProfile;
        rows: HeatmapRow[];
      }
    >();

    for (const row of dimensionHeatmap) {
      const existing = rowsByArchetype.get(row.archetype.id);

      if (existing) {
        existing.rows.push(row);
        continue;
      }

      rowsByArchetype.set(row.archetype.id, {
        archetype: row.archetype,
        rows: [row],
      });
    }

    return Array.from(rowsByArchetype.values())
      .map(({ archetype, rows }) => ({
        id: archetype.id,
        label: archetype.label,
        signal: archetype.signal,
        scopeCount: rows.length,
        respondentCount: rows.reduce((sum, row) => sum + row.respondents, 0),
        usageImpactAverage: average(rows.map((row) => average([row.Usage, row.Impact]))),
        cultureVisionAverage: average(rows.map((row) => average([row.Culture, row.Vision]))),
      }))
      .sort(
        (left, right) =>
          right.scopeCount - left.scopeCount ||
          right.usageImpactAverage - left.usageImpactAverage,
      );
  }, [dimensionHeatmap]);

  const usageImpactQuadrant = useMemo(() => {
    const membersByScope = new Map<string, typeof individuals>();

    for (const person of individuals) {
      const scopes =
        usageImpactScope === 'department'
          ? person.allDepartments
          : person.allProjects
              .map((project) => project.trim())
              .filter((project) => project && project.toLowerCase() !== 'n/a');

      for (const scopeName of scopes) {
        if (!scopeName) {
          continue;
        }

        const existing = membersByScope.get(scopeName) ?? [];
        existing.push(person);
        membersByScope.set(scopeName, existing);
      }
    }

    return Array.from(membersByScope.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([scopeName, members]) => {
        const overall = average(members.map((member) => member.overallScore));
        const usage = roundToOne(average(members.map((member) => member.scores.Usage)));
        const impact = roundToOne(average(members.map((member) => member.scores.Impact)));

        return {
          name: scopeName,
          usage,
          impact,
          respondents: members.length,
          level: LEVEL_LABELS[scoreToLevel(overall)],
          color: usageImpactQuadrantColor(usage, impact),
        };
      });
  }, [individuals, usageImpactScope]);

  const organizationUsageImpactDepartmentRows = useMemo(() => {
    const membersByDepartment = new Map<string, typeof individuals>();

    for (const person of individuals) {
      for (const department of person.allDepartments) {
        if (!department) {
          continue;
        }

        const existing = membersByDepartment.get(department) ?? [];
        existing.push(person);
        membersByDepartment.set(department, existing);
      }
    }

    return Array.from(membersByDepartment.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([department, members]) => {
        const overall = average(members.map((member) => member.overallScore));
        const usage = roundToOne(average(members.map((member) => member.scores.Usage)));
        const impact = roundToOne(average(members.map((member) => member.scores.Impact)));

        return {
          name: department,
          usage,
          impact,
          respondents: members.length,
          level: LEVEL_LABELS[scoreToLevel(overall)],
          color: usageImpactQuadrantColor(usage, impact),
        };
      });
  }, [individuals]);

  const usageImpactQuadrantSummary = useMemo(() => {
    const totals = {
      highHigh: 0,
      highLow: 0,
      lowHigh: 0,
      lowLow: 0,
    } satisfies Record<UsageImpactQuadrantKey, number>;

    for (const point of usageImpactQuadrant) {
      totals[usageImpactQuadrantKey(point.usage, point.impact)] += 1;
    }

    const totalCohorts = usageImpactQuadrant.length || 1;

    return [
      {
        key: 'highHigh' as const,
        title: 'High usage + high impact',
        note: 'Role models and case-study candidates.',
      },
      {
        key: 'highLow' as const,
        title: 'High usage + low impact',
        note: 'Adoption is real, but workflow depth is still shallow.',
      },
      {
        key: 'lowHigh' as const,
        title: 'Low usage + high impact',
        note: 'Strong champions exist, but bus-factor risk is growing.',
      },
      {
        key: 'lowLow' as const,
        title: 'Low usage + low impact',
        note: 'Clear enablement and training need.',
      },
    ].map((item) => ({
      ...item,
      count: totals[item.key],
      share: Math.round((totals[item.key] / totalCohorts) * 100),
    }));
  }, [usageImpactQuadrant]);

  const projectRankingRows = useMemo<ProjectRankingRow[]>(() => {
    const membersByProject = new Map<string, typeof individuals>();

    for (const person of individuals) {
      for (const project of person.allProjects) {
        const normalizedProject = project.trim();

        if (!normalizedProject || normalizedProject.toLowerCase() === 'n/a') {
          continue;
        }

        const existing = membersByProject.get(normalizedProject) ?? [];
        existing.push(person);
        membersByProject.set(normalizedProject, existing);
      }
    }

    return Array.from(membersByProject.entries())
      .map(([projectName, members]) => {
        const dimensions = averageDimensionScores(members);
        const overall = average(TECH_DIMENSIONS.map((dimension) => dimensions[dimension]));
        const level = LEVEL_LABELS[scoreToLevel(overall)];
        const archetype = resolveTeamArchetype(techScoresFromOrgDimensions(dimensions));

        return {
          id: slugifyScopeName(projectName),
          name: projectName,
          respondents: members.length,
          overall,
          level,
          archetype,
          dimensions,
        };
      })
      .sort((left, right) => right.overall - left.overall || left.name.localeCompare(right.name));
  }, [individuals]);

  const visibleMaturityDistribution = useMemo(
    () =>
      maturityDistribution.filter(
        (entry) => !hiddenMaturityDistributionLevels.includes(entry.level),
      ),
    [hiddenMaturityDistributionLevels, maturityDistribution],
  );

  const resistanceSummary = useMemo(() => buildResistanceSummary(rawResponses), [rawResponses]);

  const summaryCards = useMemo<SummaryCard[]>(() => {
    const respondentCount = individuals.length;
    const overallScore =
      respondentCount > 0
        ? individuals.reduce((sum, person) => sum + person.overallScore, 0) / respondentCount
        : 0;
    const overallLevel = scoreToLevel(overallScore);
    const level45PeopleCount = individuals.filter((person) => person.overallLevel >= 4).length;
    const level45PeopleShare =
      respondentCount > 0 ? Math.round((level45PeopleCount / respondentCount) * 100) : 0;

    return [
      {
        title: 'Overall score',
        value: `${overallScore.toFixed(1)} / 5`,
        detail: `Level ${overallLevel} ${LEVEL_LABELS[overallLevel]}`,
        accent: true,
        hoverValue: `${overallScore.toFixed(2)} / 5`,
      },
      {
        title: 'Level 4–5 people share',
        value: `${level45PeopleShare}%`,
        detail: `${level45PeopleCount} of ${respondentCount} respondents at advanced maturity`,
      },
      {
        title: 'Resistance score',
        value: `${resistanceSummary.score.toFixed(1)} / 5`,
        detail:
          resistanceSummary.respondentCount > 0
            ? `Lower is better; ${resistanceSummary.highResistanceShare}% show strong resistance signals`
            : 'Lower is better; no scored responses yet',
        helpText: RESISTANCE_SCORE_HELP_TEXT,
        hoverValue: `${resistanceSummary.score.toFixed(2)} / 5`,
      },
    ];
  }, [individuals, resistanceSummary]);

  const topChampionRows = useMemo(() => buildTopChampionRows(individuals), [individuals]);
  const organizationChampionCount = useMemo(
    () =>
      buildChampionRows(individuals).filter(
        (row) => row.championScore >= AI_CHAMPION_SCORE_THRESHOLD,
      ).length,
    [individuals],
  );
  const organizationChampionShare = useMemo(() => {
    if (individuals.length === 0) {
      return 0;
    }

    return (organizationChampionCount / individuals.length) * 100;
  }, [individuals.length, organizationChampionCount]);
  const detailedReviewCohorts = useMemo(
    () => buildExperienceReviewCohorts(individuals),
    [individuals],
  );

  const sortedProjectRankingRows = useMemo(() => {
    const rows = [...projectRankingRows];
    const levelNumberMap: Record<string, number> = {
      Observer: 1,
      Explorer: 2,
      Practitioner: 3,
      Orchestrator: 4,
      Native: 5,
    };

    rows.sort((left, right) => {
      const comparison = (() => {
        switch (projectRankingSort.key) {
          case 'name':
            return left.name.localeCompare(right.name);
          case 'overall':
            return left.overall - right.overall;
          case 'level':
            return (levelNumberMap[left.level] ?? 0) - (levelNumberMap[right.level] ?? 0);
          case 'archetype':
            return left.archetype.label.localeCompare(right.archetype.label);
          case 'respondents':
            return left.respondents - right.respondents;
          default:
            return left.dimensions[projectRankingSort.key] - right.dimensions[projectRankingSort.key];
        }
      })();

      if (comparison !== 0) {
        return projectRankingSort.direction === 'asc' ? comparison : -comparison;
      }

      return left.name.localeCompare(right.name);
    });

    return rows;
  }, [projectRankingRows, projectRankingSort]);

  const visibleProjectRankingRows = useMemo(
    () =>
      showAllProjectRankingRows
        ? sortedProjectRankingRows
        : sortedProjectRankingRows.slice(0, 10),
    [showAllProjectRankingRows, sortedProjectRankingRows],
  );

  const projectArchetypeBubbleRows = useMemo<ArchetypeBubbleRow[]>(() => {
    const rowsByArchetype = new Map<
      string,
      {
        archetype: TeamArchetypeProfile;
        rows: ProjectRankingRow[];
      }
    >();

    for (const row of projectRankingRows) {
      const existing = rowsByArchetype.get(row.archetype.id);

      if (existing) {
        existing.rows.push(row);
        continue;
      }

      rowsByArchetype.set(row.archetype.id, {
        archetype: row.archetype,
        rows: [row],
      });
    }

    return Array.from(rowsByArchetype.values())
      .map(({ archetype, rows }) => ({
        id: archetype.id,
        label: archetype.label,
        signal: archetype.signal,
        scopeCount: rows.length,
        respondentCount: rows.reduce((sum, row) => sum + row.respondents, 0),
        usageImpactAverage: average(
          rows.map((row) => average([row.dimensions.Usage, row.dimensions.Impact])),
        ),
        cultureVisionAverage: average(
          rows.map((row) => average([row.dimensions.Culture, row.dimensions.Vision])),
        ),
      }))
      .sort(
        (left, right) =>
          right.scopeCount - left.scopeCount ||
          right.usageImpactAverage - left.usageImpactAverage,
      );
  }, [projectRankingRows]);

  const usageDepartmentOptions = useMemo(
    () => [
      ALL_DEPARTMENTS,
      ...Array.from(
        new Set(rawResponses.flatMap((response) => allDepartmentsList(response.department))),
      ).sort((left, right) => left.localeCompare(right)),
    ],
    [rawResponses],
  );

  const usageSeniorityOptions = useMemo(
    () => [
      ALL_SENIORITIES,
      ...Array.from(
        new Set(
          rawResponses
            .map((response) => response.seniority.trim())
            .filter(Boolean),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    ],
    [rawResponses],
  );

  const usageTeamOptions = useMemo(
    () => [
      ALL_TEAMS,
      ...Array.from(
        new Set(
          rawResponses.flatMap((response) => allProjectsList(response.projects)),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    ],
    [rawResponses],
  );

  const impactDepartmentOptions = useMemo(
    () => usageDepartmentOptions.filter((option) => option !== ALL_DEPARTMENTS),
    [usageDepartmentOptions],
  );

  const impactTeamOptions = useMemo(
    () => usageTeamOptions.filter((option) => option !== ALL_TEAMS),
    [usageTeamOptions],
  );

  const filteredToolResponses = useMemo(
    () =>
      filterUsageResponsesMulti(
        rawResponses,
        selectedToolDepartments,
        selectedToolSeniorities,
        selectedToolTeams,
      ),
    [rawResponses, selectedToolDepartments, selectedToolSeniorities, selectedToolTeams],
  );

  const filteredModelResponses = useMemo(
    () =>
      filterUsageResponsesMulti(
        rawResponses,
        selectedModelDepartments,
        selectedModelSeniorities,
        selectedModelTeams,
      ),
    [rawResponses, selectedModelDepartments, selectedModelSeniorities, selectedModelTeams],
  );

  const filteredEmbeddednessResponses = useMemo(
    () =>
      filterUsageResponsesMulti(
        rawResponses,
        selectedEmbeddednessDepartments,
        [],
        selectedEmbeddednessTeams,
      ),
    [rawResponses, selectedEmbeddednessDepartments, selectedEmbeddednessTeams],
  );

  const filteredSharedPracticesResponses = useMemo(
    () =>
      filterUsageResponsesMulti(
        rawResponses,
        selectedSharedPracticesDepartments,
        [],
        selectedSharedPracticesTeams,
      ),
    [rawResponses, selectedSharedPracticesDepartments, selectedSharedPracticesTeams],
  );

  const filteredSkillsBaselineResponses = useMemo(
    () =>
      filterUsageResponsesMulti(
        rawResponses,
        selectedSkillsBaselineDepartments,
        [],
        selectedSkillsBaselineTeams,
      ),
    [rawResponses, selectedSkillsBaselineDepartments, selectedSkillsBaselineTeams],
  );

  const filteredPromptTechniqueResponses = useMemo(
    () =>
      filterUsageResponsesMulti(
        rawResponses,
        selectedPromptTechniqueDepartments,
        [],
        selectedPromptTechniqueTeams,
      ),
    [rawResponses, selectedPromptTechniqueDepartments, selectedPromptTechniqueTeams],
  );

  const filteredSensitiveDataResponses = useMemo(
    () =>
      filterUsageResponsesMulti(
        rawResponses,
        selectedSensitiveDataDepartments,
        [],
        selectedSensitiveDataTeams,
      ),
    [rawResponses, selectedSensitiveDataDepartments, selectedSensitiveDataTeams],
  );

  const filteredImpactResponses = useMemo<Record<ImpactFilterKey, RawResponse[]>>(
    () =>
      IMPACT_FILTER_KEYS.reduce((acc, key) => {
        acc[key] = filterUsageResponsesMulti(
          rawResponses,
          impactDepartmentFilters[key],
          [],
          impactTeamFilters[key],
        );
        return acc;
      }, {} as Record<ImpactFilterKey, RawResponse[]>),
    [rawResponses, impactDepartmentFilters, impactTeamFilters],
  );

  const filteredCultureResponses = useMemo<Record<CultureFilterKey, RawResponse[]>>(
    () =>
      CULTURE_FILTER_KEYS.reduce((acc, key) => {
        acc[key] = filterUsageResponsesMulti(
          rawResponses,
          cultureDepartmentFilters[key],
          [],
          cultureTeamFilters[key],
        );
        return acc;
      }, {} as Record<CultureFilterKey, RawResponse[]>),
    [rawResponses, cultureDepartmentFilters, cultureTeamFilters],
  );

  const filteredVisionResponses = useMemo<Record<VisionFilterKey, RawResponse[]>>(
    () =>
      VISION_FILTER_KEYS.reduce((acc, key) => {
        acc[key] = filterUsageResponsesMulti(
          rawResponses,
          visionDepartmentFilters[key],
          [],
          visionTeamFilters[key],
        );
        return acc;
      }, {} as Record<VisionFilterKey, RawResponse[]>),
    [rawResponses, visionDepartmentFilters, visionTeamFilters],
  );

  const gapSkillsConfidenceDepartmentRows = useMemo(
    () => buildSkillsConfidenceGapRows(individuals, 'department'),
    [individuals],
  );

  const gapToolAccessDepartmentRows = useMemo(
    () => buildToolAccessConstraintRows(rawResponses, 'department'),
    [rawResponses],
  );

  const gapToolAccessTeamRows = useMemo(
    () => buildToolAccessConstraintRows(rawResponses, 'team'),
    [rawResponses],
  );

  const gapEmbeddednessDepartmentRows = useMemo(
    () => buildEmbeddednessSharedPracticesRows(rawResponses, 'department'),
    [rawResponses],
  );

  const gapEmbeddednessTeamRows = useMemo(
    () => buildEmbeddednessSharedPracticesRows(rawResponses, 'team'),
    [rawResponses],
  );

  const gapImpactWithoutResilienceDepartmentRows = useMemo(
    () => buildImpactWithoutResilienceRows(rawResponses, 'department'),
    [rawResponses],
  );

  const gapImpactWithoutResilienceTeamRows = useMemo(
    () => buildImpactWithoutResilienceRows(rawResponses, 'team'),
    [rawResponses],
  );

  const gapResistanceDepartmentRows = useMemo(
    () => buildResistanceByScopeRows(rawResponses, 'department'),
    [rawResponses],
  );

  const gapResistanceTeamRows = useMemo(
    () => buildResistanceByScopeRows(rawResponses, 'team'),
    [rawResponses],
  );

  const gapSupportDemandDepartmentRows = useMemo(
    () => buildSupportDemandSkillsGapRows(rawResponses, 'department'),
    [rawResponses],
  );

  const gapSupportDemandTeamRows = useMemo(
    () => buildSupportDemandSkillsGapRows(rawResponses, 'team'),
    [rawResponses],
  );

  const gapSensitiveDataDepartmentRows = useMemo(
    () => buildSensitiveDataRiskRows(rawResponses, 'department'),
    [rawResponses],
  );

  const gapSensitiveDataTeamRows = useMemo(
    () => buildSensitiveDataRiskRows(rawResponses, 'team'),
    [rawResponses],
  );

  const investmentRiskGovernanceDepartmentRows = useMemo(
    () => buildRiskGovernanceHotspotRows(rawResponses, 'department'),
    [rawResponses],
  );

  const investmentRiskGovernanceTeamRows = useMemo(
    () => buildRiskGovernanceHotspotRows(rawResponses, 'team'),
    [rawResponses],
  );

  const gapWorkflowTransformationDepartmentRows = useMemo(
    () => buildWorkflowTransformationGapRows(rawResponses, 'department'),
    [rawResponses],
  );

  const gapWorkflowTransformationTeamRows = useMemo(
    () => buildWorkflowTransformationGapRows(rawResponses, 'team'),
    [rawResponses],
  );

  const organizationSuggestedGoals = useMemo(
    () =>
      buildTeamSuggestedGoals({
        scopedIndividuals: individuals,
        allIndividuals: individuals,
        championShare: organizationChampionShare,
        resistanceSummary: {
          score: resistanceSummary.score,
          highResistanceShare: resistanceSummary.highResistanceShare,
        },
        usageImpactData: organizationUsageImpactDepartmentRows.map((row) => ({
          name: row.name,
          role: '',
          overall: 0,
          level: row.level,
          color: row.color,
          size: row.respondents,
          usage: row.usage,
          impact: row.impact,
        })),
        supportDemandRows: gapSupportDemandDepartmentRows.map((row) => ({
          name: row.name,
          role: '',
          overall: 0,
          level: '',
          color: row.color,
          size: row.respondents,
          baselineSkills: row.baselineSkills,
          supportDemand: row.supportDemand,
          supportSignals: row.respondents,
        })),
        toolAccessRows: gapToolAccessDepartmentRows.map((row) => ({
          name: row.name,
          role: '',
          overall: 0,
          level: '',
          color: row.color,
          size: row.respondents,
          access: row.access,
          costMaturity: row.costMaturity,
          fundedAccess: row.companyFundedShare >= 50,
        })),
        workflowRows: gapWorkflowTransformationDepartmentRows.map((row) => ({
          name: row.name,
          role: '',
          overall: 0,
          level: '',
          color: row.color,
          size: row.respondents,
          hoursSaved: row.hoursSaved,
          transformation: row.transformation,
        })),
      }),
    [
      gapSupportDemandDepartmentRows,
      gapToolAccessDepartmentRows,
      gapWorkflowTransformationDepartmentRows,
      individuals,
      organizationChampionShare,
      organizationUsageImpactDepartmentRows,
      resistanceSummary.highResistanceShare,
      resistanceSummary.score,
    ],
  );

  const gapVisionToActionDepartmentRows = useMemo(
    () => buildVisionToActionGapRows(rawResponses, 'department'),
    [rawResponses],
  );

  const gapVisionToActionTeamRows = useMemo(
    () => buildVisionToActionGapRows(rawResponses, 'team'),
    [rawResponses],
  );

  const gapCultureSpreadDepartmentRows = useMemo(
    () => buildCultureSpreadGapRows(rawResponses, 'department'),
    [rawResponses],
  );

  const gapCultureSpreadTeamRows = useMemo(
    () => buildCultureSpreadGapRows(rawResponses, 'team'),
    [rawResponses],
  );

  const gapMaturityVisibilityDepartmentRows = useMemo(
    () => buildTeamValidatedScopeRows(rawResponses, 'department'),
    [rawResponses],
  );

  const gapMaturityVisibilityTeamRows = useMemo(
    () => buildTeamValidatedScopeRows(rawResponses, 'team'),
    [rawResponses],
  );

  const deviatingPeopleRows = useMemo(
    () => buildDeviatingPeopleRows(individuals, rawResponses),
    [individuals, rawResponses],
  );

  const businessWorkflowUsage = useMemo(
    () => buildUsageCategoryInsight(rawResponses, 'business', businessUsageMode),
    [rawResponses, businessUsageMode],
  );

  const deliveryActivityUsage = useMemo(
    () => buildUsageCategoryInsight(rawResponses, 'delivery-engineering', deliveryUsageMode),
    [rawResponses, deliveryUsageMode],
  );

  const embeddednessDistribution = useMemo(
    () => buildEmbeddednessDistribution(filteredEmbeddednessResponses),
    [filteredEmbeddednessResponses],
  );

  const sharedPracticesDistribution = useMemo(
    () => buildSharedPracticesDistribution(filteredSharedPracticesResponses),
    [filteredSharedPracticesResponses],
  );

  const skillsBaselineDistribution = useMemo(
    () => buildSkillsBaselineDistribution(filteredSkillsBaselineResponses),
    [filteredSkillsBaselineResponses],
  );

  const sensitiveDataDistribution = useMemo(
    () => buildSensitiveDataDistribution(filteredSensitiveDataResponses),
    [filteredSensitiveDataResponses],
  );

  const promptTechniqueComparison = useMemo(
    () => buildPromptTechniqueComparison(filteredPromptTechniqueResponses),
    [filteredPromptTechniqueResponses],
  );

  const personalOutputImpactDistribution = useMemo(
    () => buildPersonalOutputImpactDistribution(filteredImpactResponses.personalOutputImpact),
    [filteredImpactResponses],
  );

  const workflowTransformationDistribution = useMemo(
    () => buildWorkflowTransformationDistribution(filteredImpactResponses.workflowTransformation),
    [filteredImpactResponses],
  );

  const hoursSavedComparison = useMemo(
    () => buildHoursSavedComparison(filteredImpactResponses.hoursSaved),
    [filteredImpactResponses],
  );

  const hoursSavedAverageSummary = useMemo(
    () => buildHoursSavedAverageSummary(filteredImpactResponses.hoursSaved, rawResponses),
    [filteredImpactResponses, rawResponses],
  );

  const dependencyImpactDistribution = useMemo(
    () => buildDependencyImpactDistribution(filteredImpactResponses.dependencyOnAi),
    [filteredImpactResponses],
  );

  const accessLicensingDistribution = useMemo(
    () => buildAccessLicensingDistribution(filteredImpactResponses.accessLicensing),
    [filteredImpactResponses],
  );

  const whoPaysComparison = useMemo(
    () => buildWhoPaysComparison(filteredImpactResponses.whoPays),
    [filteredImpactResponses],
  );

  const costMaturityDistribution = useMemo(
    () => buildCostMaturityDistribution(filteredImpactResponses.costMaturity),
    [filteredImpactResponses],
  );

  const deliveryPlanningImpactDistribution = useMemo(
    () => buildDeliveryPlanningImpactDistribution(filteredImpactResponses.planningImpact),
    [filteredImpactResponses],
  );

  const blockerComparison = useMemo(
    () => buildBlockerComparison(filteredImpactResponses.nonAiBlocker),
    [filteredImpactResponses],
  );

  const growthMomentumDistribution = useMemo(
    () => buildGrowthMomentumDistribution(filteredCultureResponses.growthMomentum),
    [filteredCultureResponses],
  );

  const experimentationInitiativeDistribution = useMemo(
    () =>
      buildExperimentationInitiativeDistribution(
        filteredCultureResponses.experimentationInitiative,
      ),
    [filteredCultureResponses],
  );

  const knowledgeSharingDistribution = useMemo(
    () => buildKnowledgeSharingDistribution(filteredCultureResponses.knowledgeSharing),
    [filteredCultureResponses],
  );

  const influenceScoreDistribution = useMemo(
    () => buildInfluenceScoreDistribution(filteredCultureResponses.influenceScore),
    [filteredCultureResponses],
  );

  const teamAiMaturityDistribution = useMemo(
    () => buildTeamAiMaturityDistribution(filteredCultureResponses.teamAiMaturity),
    [filteredCultureResponses],
  );

  const organizationalSupportDistribution = useMemo(
    () => buildOrganizationalSupportDistribution(filteredCultureResponses.organizationalSupport),
    [filteredCultureResponses],
  );

  const toolSatisfactionDistribution = useMemo(
    () => buildToolSatisfactionDistribution(filteredCultureResponses.toolSatisfaction),
    [filteredCultureResponses],
  );

  const enjoyabilityDistribution = useMemo(
    () => buildEnjoyabilityDistribution(filteredCultureResponses.enjoyability),
    [filteredCultureResponses],
  );

  const cultureSupportNeededComparison = useMemo(
    () => buildCultureSupportNeededComparison(filteredCultureResponses.supportNeeded),
    [filteredCultureResponses],
  );

  const handsOnHelpComparison = useMemo(
    () => buildHandsOnHelpComparison(filteredCultureResponses.handsOnHelp),
    [filteredCultureResponses],
  );

  const practiceResilienceDistribution = useMemo(
    () => buildPracticeResilienceDistribution(filteredCultureResponses.practiceResilience),
    [filteredCultureResponses],
  );

  const knowledgeArtifactDistribution = useMemo(
    () => buildKnowledgeArtifactDistribution(filteredCultureResponses.knowledgeArtifacts),
    [filteredCultureResponses],
  );

  const businessOnboardingDistribution = useMemo(
    () =>
      buildBusinessOnboardingDistribution(filteredCultureResponses.businessOnboarding),
    [filteredCultureResponses],
  );

  const opportunityClarityDistribution = useMemo(
    () => buildOpportunityClarityDistribution(filteredVisionResponses.opportunityClarity),
    [filteredVisionResponses],
  );

  const visionActionPrioritiesComparison = useMemo(
    () => buildVisionActionPrioritiesComparison(filteredVisionResponses.actionPriorities),
    [filteredVisionResponses],
  );

  const workChangeImaginationDistribution = useMemo(
    () => buildWorkChangeImaginationDistribution(filteredVisionResponses.workChangeImagination),
    [filteredVisionResponses],
  );

  const opportunitySelectionDistribution = useMemo(
    () =>
      buildOpportunitySelectionDistribution(
        filteredVisionResponses.opportunitySelectionMaturity,
      ),
    [filteredVisionResponses],
  );

  const businessValueConnectionDistribution = useMemo(
    () =>
      buildBusinessValueConnectionDistribution(
        filteredVisionResponses.businessValueConnection,
      ),
    [filteredVisionResponses],
  );

  const personalDevelopmentDirectionDistribution = useMemo(
    () =>
      buildPersonalDevelopmentDirectionDistribution(
        filteredVisionResponses.personalDevelopmentDirection,
      ),
    [filteredVisionResponses],
  );

  const visionReadinessDistribution = useMemo(
    () => buildVisionReadinessDistribution(filteredVisionResponses.visionReadiness),
    [filteredVisionResponses],
  );

  const visionReadinessAverageSummary = useMemo(
    () => buildVisionReadinessAverageSummary(filteredVisionResponses.visionReadiness),
    [filteredVisionResponses],
  );

  const visionActionMixComparison = useMemo(
    () => buildVisionActionMixComparison(filteredVisionResponses.visionActionMix),
    [filteredVisionResponses],
  );

  const filteredDeliveryPlanningResponses = useMemo(
    () =>
      filteredImpactResponses.planningImpact.filter(
        (response) => response.surveyType === 'delivery-engineering',
      ),
    [filteredImpactResponses],
  );

  const filteredBusinessOnboardingResponses = useMemo(
    () =>
      filteredCultureResponses.businessOnboarding.filter(
        (response) => response.surveyType === 'business',
      ),
    [filteredCultureResponses],
  );

  const hoursSavedFiltersActive =
    impactDepartmentFilters.hoursSaved.length > 0 ||
    impactTeamFilters.hoursSaved.length > 0;

  const mostUsedTools = useMemo<UsageFrequencyRow[]>(() => {
    const counts = new Map<string, UsageFrequencyRow>();

    for (const response of filteredToolResponses) {
      const uniqueSelections = new Set(splitSurveyMultiValue(response.q1_2));

      for (const selection of uniqueSelections) {
        const key = selection.toLowerCase();
        const current = counts.get(key);

        if (current) {
          current.count += 1;
          continue;
        }

        counts.set(key, {
          label: selection,
          count: 1,
        });
      }
    }

    return Array.from(counts.values())
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
      .slice(0, 10);
  }, [filteredToolResponses]);

  const mostUsedModels = useMemo<UsageFrequencyRow[]>(() => {
    const counts = new Map<string, UsageFrequencyRow>();

    for (const response of filteredModelResponses) {
      const uniqueSelections = new Set(splitSurveyMultiValue(response.q1_3));

      for (const selection of uniqueSelections) {
        const key = selection.toLowerCase();
        const current = counts.get(key);

        if (current) {
          current.count += 1;
          continue;
        }

        counts.set(key, {
          label: selection,
          count: 1,
        });
      }
    }

    return Array.from(counts.values())
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
      .slice(0, 10);
  }, [filteredModelResponses]);

  const toolMentionCloud = useMemo(
    () => buildMentionCloudRows(filteredToolResponses, (response) => response.q1_2, TOOL_MENTION_MATCHERS),
    [filteredToolResponses],
  );

  const modelMentionCloud = useMemo(
    () =>
      buildMentionCloudRows(
        filteredModelResponses,
        (response) => response.q1_3,
        MODEL_MENTION_MATCHERS,
      ),
    [filteredModelResponses],
  );

  const blockerOpenTextResponses = useMemo(
    () =>
      filteredImpactResponses.nonAiBlocker.filter((response) => {
        const value =
          response.surveyType === 'business'
            ? response.q_open_final || response.q3_blocker
            : response.q4_open || response.q3_12;

        return Boolean(value?.trim());
      }),
    [filteredImpactResponses],
  );

  const blockerWordCloud = useMemo(
    () =>
      buildLiteralWordCloudRows(blockerOpenTextResponses, (response) =>
        response.surveyType === 'business'
          ? response.q_open_final || response.q3_blocker
          : response.q4_open || response.q3_12,
      ),
    [blockerOpenTextResponses],
  );

  const toolFiltersActive =
    selectedToolDepartments.length > 0 ||
    selectedToolSeniorities.length > 0 ||
    selectedToolTeams.length > 0;
  const modelFiltersActive =
    selectedModelDepartments.length > 0 ||
    selectedModelSeniorities.length > 0 ||
    selectedModelTeams.length > 0;
  const embeddednessFiltersActive =
    selectedEmbeddednessDepartments.length > 0 ||
    selectedEmbeddednessTeams.length > 0;
  const sharedPracticesFiltersActive =
    selectedSharedPracticesDepartments.length > 0 ||
    selectedSharedPracticesTeams.length > 0;
  const skillsBaselineFiltersActive =
    selectedSkillsBaselineDepartments.length > 0 ||
    selectedSkillsBaselineTeams.length > 0;
  const promptTechniqueFiltersActive =
    selectedPromptTechniqueDepartments.length > 0 ||
    selectedPromptTechniqueTeams.length > 0;
  const sensitiveDataFiltersActive =
    selectedSensitiveDataDepartments.length > 0 ||
    selectedSensitiveDataTeams.length > 0;

  const toggleToolDepartment = (department: string) => {
    setSelectedToolDepartments((current) =>
      current.includes(department)
        ? current.filter((value) => value !== department)
        : [...current, department],
    );
  };

  const toggleToolSeniority = (seniority: string) => {
    setSelectedToolSeniorities((current) =>
      current.includes(seniority)
        ? current.filter((value) => value !== seniority)
        : [...current, seniority],
    );
  };

  const toggleToolTeam = (team: string) => {
    setSelectedToolTeams((current) =>
      current.includes(team)
        ? current.filter((value) => value !== team)
        : [...current, team],
    );
  };

  const toggleModelDepartment = (department: string) => {
    setSelectedModelDepartments((current) =>
      current.includes(department)
        ? current.filter((value) => value !== department)
        : [...current, department],
    );
  };

  const toggleModelSeniority = (seniority: string) => {
    setSelectedModelSeniorities((current) =>
      current.includes(seniority)
        ? current.filter((value) => value !== seniority)
        : [...current, seniority],
    );
  };

  const toggleModelTeam = (team: string) => {
    setSelectedModelTeams((current) =>
      current.includes(team)
        ? current.filter((value) => value !== team)
        : [...current, team],
    );
  };

  const toggleEmbeddednessDepartment = (department: string) => {
    setSelectedEmbeddednessDepartments((current) =>
      current.includes(department)
        ? current.filter((value) => value !== department)
        : [...current, department],
    );
  };

  const toggleEmbeddednessTeam = (team: string) => {
    setSelectedEmbeddednessTeams((current) =>
      current.includes(team)
        ? current.filter((value) => value !== team)
        : [...current, team],
    );
  };

  const toggleSharedPracticesDepartment = (department: string) => {
    setSelectedSharedPracticesDepartments((current) =>
      current.includes(department)
        ? current.filter((value) => value !== department)
        : [...current, department],
    );
  };

  const toggleSharedPracticesTeam = (team: string) => {
    setSelectedSharedPracticesTeams((current) =>
      current.includes(team)
        ? current.filter((value) => value !== team)
        : [...current, team],
    );
  };

  const toggleSkillsBaselineDepartment = (department: string) => {
    setSelectedSkillsBaselineDepartments((current) =>
      current.includes(department)
        ? current.filter((value) => value !== department)
        : [...current, department],
    );
  };

  const toggleSkillsBaselineTeam = (team: string) => {
    setSelectedSkillsBaselineTeams((current) =>
      current.includes(team)
        ? current.filter((value) => value !== team)
        : [...current, team],
    );
  };

  const togglePromptTechniqueDepartment = (department: string) => {
    setSelectedPromptTechniqueDepartments((current) =>
      current.includes(department)
        ? current.filter((value) => value !== department)
        : [...current, department],
    );
  };

  const togglePromptTechniqueTeam = (team: string) => {
    setSelectedPromptTechniqueTeams((current) =>
      current.includes(team)
        ? current.filter((value) => value !== team)
        : [...current, team],
    );
  };

  const toggleSensitiveDataDepartment = (department: string) => {
    setSelectedSensitiveDataDepartments((current) =>
      current.includes(department)
        ? current.filter((value) => value !== department)
        : [...current, department],
    );
  };

  const toggleSensitiveDataTeam = (team: string) => {
    setSelectedSensitiveDataTeams((current) =>
      current.includes(team)
        ? current.filter((value) => value !== team)
        : [...current, team],
    );
  };

  const toggleImpactDepartment = (key: ImpactFilterKey, department: string) => {
    setImpactDepartmentFilters((current) => ({
      ...current,
      [key]: current[key].includes(department)
        ? current[key].filter((value) => value !== department)
        : [...current[key], department],
    }));
  };

  const toggleImpactTeam = (key: ImpactFilterKey, team: string) => {
    setImpactTeamFilters((current) => ({
      ...current,
      [key]: current[key].includes(team)
        ? current[key].filter((value) => value !== team)
        : [...current[key], team],
    }));
  };

  const clearImpactDepartments = (key: ImpactFilterKey) => {
    setImpactDepartmentFilters((current) => ({
      ...current,
      [key]: [],
    }));
  };

  const clearImpactTeams = (key: ImpactFilterKey) => {
    setImpactTeamFilters((current) => ({
      ...current,
      [key]: [],
    }));
  };

  const clearImpactFilters = (key: ImpactFilterKey) => {
    setImpactDepartmentFilters((current) => ({
      ...current,
      [key]: [],
    }));
    setImpactTeamFilters((current) => ({
      ...current,
      [key]: [],
    }));
  };

  const removeImpactDepartment = (key: ImpactFilterKey, department: string) => {
    setImpactDepartmentFilters((current) => ({
      ...current,
      [key]: current[key].filter((value) => value !== department),
    }));
  };

  const removeImpactTeam = (key: ImpactFilterKey, team: string) => {
    setImpactTeamFilters((current) => ({
      ...current,
      [key]: current[key].filter((value) => value !== team),
    }));
  };

  const toggleCultureDepartment = (key: CultureFilterKey, department: string) => {
    setCultureDepartmentFilters((current) => ({
      ...current,
      [key]: current[key].includes(department)
        ? current[key].filter((value) => value !== department)
        : [...current[key], department],
    }));
  };

  const toggleCultureTeam = (key: CultureFilterKey, team: string) => {
    setCultureTeamFilters((current) => ({
      ...current,
      [key]: current[key].includes(team)
        ? current[key].filter((value) => value !== team)
        : [...current[key], team],
    }));
  };

  const clearCultureDepartments = (key: CultureFilterKey) => {
    setCultureDepartmentFilters((current) => ({
      ...current,
      [key]: [],
    }));
  };

  const clearCultureTeams = (key: CultureFilterKey) => {
    setCultureTeamFilters((current) => ({
      ...current,
      [key]: [],
    }));
  };

  const clearCultureFilters = (key: CultureFilterKey) => {
    setCultureDepartmentFilters((current) => ({
      ...current,
      [key]: [],
    }));
    setCultureTeamFilters((current) => ({
      ...current,
      [key]: [],
    }));
  };

  const removeCultureDepartment = (key: CultureFilterKey, department: string) => {
    setCultureDepartmentFilters((current) => ({
      ...current,
      [key]: current[key].filter((value) => value !== department),
    }));
  };

  const removeCultureTeam = (key: CultureFilterKey, team: string) => {
    setCultureTeamFilters((current) => ({
      ...current,
      [key]: current[key].filter((value) => value !== team),
    }));
  };

  const toggleVisionDepartment = (key: VisionFilterKey, department: string) => {
    setVisionDepartmentFilters((current) => ({
      ...current,
      [key]: current[key].includes(department)
        ? current[key].filter((value) => value !== department)
        : [...current[key], department],
    }));
  };

  const toggleVisionTeam = (key: VisionFilterKey, team: string) => {
    setVisionTeamFilters((current) => ({
      ...current,
      [key]: current[key].includes(team)
        ? current[key].filter((value) => value !== team)
        : [...current[key], team],
    }));
  };

  const clearVisionDepartments = (key: VisionFilterKey) => {
    setVisionDepartmentFilters((current) => ({
      ...current,
      [key]: [],
    }));
  };

  const clearVisionTeams = (key: VisionFilterKey) => {
    setVisionTeamFilters((current) => ({
      ...current,
      [key]: [],
    }));
  };

  const clearVisionFilters = (key: VisionFilterKey) => {
    setVisionDepartmentFilters((current) => ({
      ...current,
      [key]: [],
    }));
    setVisionTeamFilters((current) => ({
      ...current,
      [key]: [],
    }));
  };

  const removeVisionDepartment = (key: VisionFilterKey, department: string) => {
    setVisionDepartmentFilters((current) => ({
      ...current,
      [key]: current[key].filter((value) => value !== department),
    }));
  };

  const removeVisionTeam = (key: VisionFilterKey, team: string) => {
    setVisionTeamFilters((current) => ({
      ...current,
      [key]: current[key].filter((value) => value !== team),
    }));
  };

  const toggleHeatmapSort = (key: HeatmapSortKey) => {
    queueTableSort(() => {
      setHeatmapSort((current) => ({
        key:
          current.key === key && current.direction === 'desc'
            ? null
            : key,
        direction:
          current.key !== key
            ? 'asc'
            : current.direction === 'asc'
              ? 'desc'
              : current.direction === 'desc'
                ? null
                : 'asc',
      }));
    });
  };

  const sortIndicator = (key: HeatmapSortKey) => {
    if (heatmapSort.key !== key || !heatmapSort.direction) {
      return '↕';
    }

    return heatmapSort.direction === 'asc' ? '↑' : '↓';
  };

  const toggleProjectRankingSort = (key: ProjectRankingSortKey) => {
    queueTableSort(() => {
      setProjectRankingSort((current) => ({
        key,
        direction:
          current.key === key
            ? current.direction === 'asc'
              ? 'desc'
              : 'asc'
            : key === 'name'
              ? 'asc'
              : 'desc',
      }));
    });
  };

  const projectRankingSortIndicator = (key: ProjectRankingSortKey) => {
    if (projectRankingSort.key !== key) {
      return '↕';
    }

    return projectRankingSort.direction === 'asc' ? '↑' : '↓';
  };

  const getAiResearchPack = async (): Promise<OrganizationAiResearchPack> => {
    if (aiResearchPackRef.current) {
      return aiResearchPackRef.current;
    }

    if (!aiResearchPackPromiseRef.current) {
      const version = aiResearchPackVersionRef.current;

      aiResearchPackPromiseRef.current = import('../data/survey/organizationAiResearchPack')
        .then(({ buildOrganizationAiResearchPack }) =>
          buildOrganizationAiResearchPack({
            individuals,
            rawResponses,
            resolvePersonName,
            scopeType: 'organization',
            scopeLabel: 'Organization AI analysis',
          }),
        )
        .then((researchPack) => {
          if (aiResearchPackVersionRef.current === version) {
            aiResearchPackRef.current = researchPack;
          }

          return researchPack;
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
      console.error('[organization] Failed to build AI research pack', error);
    } finally {
      setIsPreparingAiResearchPack(false);
    }
  };

  const askAiStarterQuestions = [
    'What are the biggest organization-wide maturity gaps?',
    'Which teams or departments need the most support next?',
    'What should leadership prioritize over the next quarter?',
  ];

  const buildImpactFilterProps = (key: ImpactFilterKey, label: string) => ({
    respondentCount: filteredImpactResponses[key].length,
    departmentOptions: impactDepartmentOptions,
    teamOptions: impactTeamOptions,
    selectedDepartments: impactDepartmentFilters[key],
    selectedTeams: impactTeamFilters[key],
    departmentAriaLabel: `Filter ${label} by departments`,
    teamAriaLabel: `Filter ${label} by teams`,
    onToggleDepartment: (value: string) => toggleImpactDepartment(key, value),
    onToggleTeam: (value: string) => toggleImpactTeam(key, value),
    onClearDepartments: () => clearImpactDepartments(key),
    onClearTeams: () => clearImpactTeams(key),
    onClearAll: () => clearImpactFilters(key),
    onRemoveDepartment: (value: string) => removeImpactDepartment(key, value),
    onRemoveTeam: (value: string) => removeImpactTeam(key, value),
  });

  const buildCultureFilterProps = (
    key: CultureFilterKey,
    label: string,
    respondentCount = filteredCultureResponses[key].length,
  ) => ({
    respondentCount,
    departmentOptions: impactDepartmentOptions,
    teamOptions: impactTeamOptions,
    selectedDepartments: cultureDepartmentFilters[key],
    selectedTeams: cultureTeamFilters[key],
    departmentAriaLabel: `Filter ${label} by departments`,
    teamAriaLabel: `Filter ${label} by teams`,
    onToggleDepartment: (value: string) => toggleCultureDepartment(key, value),
    onToggleTeam: (value: string) => toggleCultureTeam(key, value),
    onClearDepartments: () => clearCultureDepartments(key),
    onClearTeams: () => clearCultureTeams(key),
    onClearAll: () => clearCultureFilters(key),
    onRemoveDepartment: (value: string) => removeCultureDepartment(key, value),
    onRemoveTeam: (value: string) => removeCultureTeam(key, value),
  });

  const buildVisionFilterProps = (key: VisionFilterKey, label: string) => ({
    respondentCount: filteredVisionResponses[key].length,
    departmentOptions: impactDepartmentOptions,
    teamOptions: impactTeamOptions,
    selectedDepartments: visionDepartmentFilters[key],
    selectedTeams: visionTeamFilters[key],
    departmentAriaLabel: `Filter ${label} by departments`,
    teamAriaLabel: `Filter ${label} by teams`,
    onToggleDepartment: (value: string) => toggleVisionDepartment(key, value),
    onToggleTeam: (value: string) => toggleVisionTeam(key, value),
    onClearDepartments: () => clearVisionDepartments(key),
    onClearTeams: () => clearVisionTeams(key),
    onClearAll: () => clearVisionFilters(key),
    onRemoveDepartment: (value: string) => removeVisionDepartment(key, value),
    onRemoveTeam: (value: string) => removeVisionTeam(key, value),
  });

  const impactSectionProps = {
    personalOutputImpact: {
      filterProps: buildImpactFilterProps('personalOutputImpact', 'personal output impact'),
      data: personalOutputImpactDistribution,
      series: PERSONAL_OUTPUT_IMPACT_SERIES,
    },
    workflowTransformation: {
      filterProps: buildImpactFilterProps('workflowTransformation', 'workflow transformation depth'),
      data: workflowTransformationDistribution,
      series: WORKFLOW_TRANSFORMATION_SERIES,
    },
    hoursSaved: {
      filterProps: buildImpactFilterProps('hoursSaved', 'hours saved per week'),
      data: hoursSavedComparison,
      filtersActive: hoursSavedFiltersActive,
      averageSummary: hoursSavedAverageSummary,
    },
    dependencyOnAi: {
      filterProps: buildImpactFilterProps('dependencyOnAi', 'dependency on AI'),
      data: dependencyImpactDistribution,
      series: DEPENDENCY_IMPACT_SERIES,
    },
    accessLicensing: {
      filterProps: buildImpactFilterProps('accessLicensing', 'access and licensing'),
      data: accessLicensingDistribution,
      series: ACCESS_LICENSING_SERIES,
    },
    whoPays: {
      filterProps: buildImpactFilterProps('whoPays', 'who pays for AI tools'),
      data: whoPaysComparison,
    },
    costMaturity: {
      filterProps: buildImpactFilterProps('costMaturity', 'cost maturity'),
      data: costMaturityDistribution,
      series: COST_MATURITY_SERIES,
    },
    deliveryPlanningImpact: {
      filterProps: buildImpactFilterProps('planningImpact', 'delivery-only planning impact'),
      data: deliveryPlanningImpactDistribution,
      series: PLANNING_IMPACT_SERIES,
      respondentCount: filteredDeliveryPlanningResponses.length,
    },
    nonAiBlocker: {
      filterProps: buildImpactFilterProps('nonAiBlocker', 'biggest non-AI blocker'),
      data: blockerComparison,
    },
    businessColor: IMPACT_COHORT_COLORS.business,
    deliveryColor: IMPACT_COHORT_COLORS.delivery,
  };

  const cultureSectionProps = {
    topChampionRows,
    detailedReviewCohorts,
    growthMomentum: {
      title: 'AI growth momentum',
      description:
        'This is the best opener for Culture because it shows whether people feel stagnant, reactive, or actively growing.',
      filterProps: buildCultureFilterProps('growthMomentum', 'AI growth momentum'),
      data: growthMomentumDistribution,
      series: GROWTH_MOMENTUM_SERIES,
      stackId: 'culture-growth-momentum',
    },
    experimentationInitiative: {
      title: 'Experimentation initiative',
      description:
        'This tells you whether people are waiting for permission or self-starting with new tools and workflows.',
      filterProps: buildCultureFilterProps('experimentationInitiative', 'experimentation initiative'),
      data: experimentationInitiativeDistribution,
      series: EXPERIMENTATION_INITIATIVE_SERIES,
      stackId: 'culture-experimentation-initiative',
    },
    knowledgeSharing: {
      title: 'Knowledge sharing behavior',
      description: 'This is the clearest “is AI practice social or still private?” chart.',
      filterProps: buildCultureFilterProps('knowledgeSharing', 'knowledge sharing behavior'),
      data: knowledgeSharingDistribution,
      series: KNOWLEDGE_SHARING_SERIES,
      stackId: 'culture-knowledge-sharing',
    },
    influenceScore: {
      title: 'Adoption influence on others',
      description: 'This is your strongest champion-spread signal.',
      filterProps: buildCultureFilterProps('influenceScore', 'adoption influence on others'),
      data: influenceScoreDistribution,
      series: INFLUENCE_SCORE_SERIES,
      stackId: 'culture-influence-score',
    },
    teamAiMaturity: {
      title: 'Team AI maturity around me',
      description:
        'This gives the local culture climate view: do people feel surrounded by strong AI practice or not.',
      filterProps: buildCultureFilterProps('teamAiMaturity', 'team AI maturity around me'),
      data: teamAiMaturityDistribution,
      series: TEAM_AI_MATURITY_SERIES,
      stackId: 'culture-team-ai-maturity',
    },
    organizationalSupport: {
      title: 'Organizational support for adoption',
      description:
        'This is the main culture-system chart: even if people want to adopt AI, do they feel backed by the org?',
      filterProps: buildCultureFilterProps('organizationalSupport', 'organizational support for adoption'),
      data: organizationalSupportDistribution,
      series: ORGANIZATIONAL_SUPPORT_SERIES,
      stackId: 'culture-organizational-support',
    },
    toolSatisfaction: {
      title: 'Tool satisfaction',
      description:
        'Useful, but placed after support because it is more operational than cultural.',
      filterProps: buildCultureFilterProps('toolSatisfaction', 'tool satisfaction'),
      data: toolSatisfactionDistribution,
      series: TOOL_SATISFACTION_SERIES,
      stackId: 'culture-tool-satisfaction',
    },
    enjoyability: {
      title: 'Does AI make work more enjoyable?',
      description:
        'This is a strong secondary culture signal because enjoyment usually tracks whether adoption feels energizing or draining.',
      filterProps: buildCultureFilterProps('enjoyability', 'AI work enjoyability'),
      data: enjoyabilityDistribution,
      series: ENJOYABILITY_SERIES,
      stackId: 'culture-enjoyability',
    },
    supportNeeded: {
      title: 'Support needed right now',
      description: 'This shows what kind of enablement people are actually asking for right now.',
      filterProps: buildCultureFilterProps('supportNeeded', 'support needed right now'),
      data: cultureSupportNeededComparison,
      chartHeight: 300,
    },
    handsOnHelp: {
      title: 'Hands-on help demand',
      description:
        'This is great for showing how much appetite there is for real enablement, not just passive resources.',
      filterProps: buildCultureFilterProps('handsOnHelp', 'hands-on help demand'),
      data: handsOnHelpComparison,
      chartHeight: 280,
    },
    practiceResilience: {
      title: 'Would practices survive if a key person left?',
      description:
        'This is one of the best Culture charts in the survey because it exposes dependency risk directly.',
      filterProps: buildCultureFilterProps('practiceResilience', 'practice resilience if a key person left'),
      data: practiceResilienceDistribution,
      series: PRACTICE_RESILIENCE_SERIES,
      stackId: 'culture-practice-resilience',
    },
    knowledgeArtifacts: {
      title: 'Knowledge artifacts created',
      description: 'This shows whether AI knowledge is becoming reusable and durable.',
      filterProps: buildCultureFilterProps('knowledgeArtifacts', 'knowledge artifacts created'),
      data: knowledgeArtifactDistribution,
      series: KNOWLEDGE_ARTIFACT_SERIES,
      stackId: 'culture-knowledge-artifacts',
    },
    businessOnboarding: {
      title: 'Business-only onboarding on AI practices',
      description:
        'This is the cleanest signal of whether AI practice is actually institutionalized for non-engineering teams.',
      filterProps: buildCultureFilterProps(
        'businessOnboarding',
        'business onboarding on AI practices',
        filteredBusinessOnboardingResponses.length,
      ),
      data: businessOnboardingDistribution,
      series: BUSINESS_ONBOARDING_SERIES,
      stackId: 'culture-business-onboarding',
      emptyState: 'No business respondents match the current department and team filter.',
      respondentCount: filteredBusinessOnboardingResponses.length,
      cohortColor: IMPACT_COHORT_COLORS.business,
      cohortLabel: 'Business',
    },
    businessColor: IMPACT_COHORT_COLORS.business,
    deliveryColor: IMPACT_COHORT_COLORS.delivery,
  };

  const visionSectionProps = {
    opportunityClarity: {
      title: 'Opportunity clarity',
      description:
        'This should open the section because it answers the core question: do people clearly see where more AI value could come from in the next 6 months?',
      filterProps: buildVisionFilterProps('opportunityClarity', 'opportunity clarity'),
      data: opportunityClarityDistribution,
      series: OPPORTUNITY_CLARITY_SERIES,
      stackId: 'vision-opportunity-clarity',
    },
    actionPriorities: {
      title: 'Next-quarter action priorities',
      description:
        'This is probably the most practical chart in the whole section because it turns Vision into specific near-term interventions.',
      filterProps: buildVisionFilterProps('actionPriorities', 'next-quarter action priorities'),
      data: visionActionPrioritiesComparison,
      chartHeight: 560,
      labelWidth: 340,
    },
    workChangeImagination: {
      title: 'How people imagine work changing',
      description:
        'This shows whether people still think in “AI speeds up tasks” mode or whether they can imagine genuinely different workflows.',
      filterProps: buildVisionFilterProps('workChangeImagination', 'how people imagine work changing'),
      data: workChangeImaginationDistribution,
      series: WORK_CHANGE_IMAGINATION_SERIES,
      stackId: 'vision-work-change-imagination',
    },
    opportunitySelectionMaturity: {
      title: 'Opportunity selection maturity',
      description:
        'This shows whether people choose AI opportunities based on hype, personal curiosity, or real value and feasibility thinking.',
      filterProps: buildVisionFilterProps('opportunitySelectionMaturity', 'opportunity selection maturity'),
      data: opportunitySelectionDistribution,
      series: OPPORTUNITY_SELECTION_SERIES,
      stackId: 'vision-opportunity-selection',
      chartHeight: 280,
    },
    businessValueConnection: {
      title: 'Ability to connect AI to business value',
      description:
        'This is one of the strongest leadership-facing Vision charts because it shows whether AI is framed as personal productivity or as business, project, client, or team value.',
      filterProps: buildVisionFilterProps('businessValueConnection', 'ability to connect AI to business value'),
      data: businessValueConnectionDistribution,
      series: BUSINESS_VALUE_CONNECTION_SERIES,
      stackId: 'vision-business-value-connection',
      chartHeight: 280,
    },
    personalDevelopmentDirection: {
      title: 'Personal development direction',
      description:
        'This shows whether people know what capability they want to build next, which is a strong forward-readiness signal.',
      filterProps: buildVisionFilterProps('personalDevelopmentDirection', 'personal development direction'),
      data: personalDevelopmentDirectionDistribution,
      series: PERSONAL_DEVELOPMENT_DIRECTION_SERIES,
      stackId: 'vision-personal-development-direction',
      chartHeight: 280,
    },
    visionReadiness: {
      filterProps: buildVisionFilterProps('visionReadiness', 'vision readiness score'),
      data: visionReadinessDistribution,
      series: VISION_READINESS_SERIES,
      averageSummary: visionReadinessAverageSummary,
    },
    visionActionMix: {
      title: 'Vision action mix',
      description:
        'This is a more executive-friendly version of the action-priority view, showing whether the organization’s next-step thinking is concentrated on workflow change, enablement, governance, or broader strategy.',
      filterProps: buildVisionFilterProps('visionActionMix', 'vision action mix'),
      data: visionActionMixComparison,
      chartHeight: 260,
      labelWidth: 170,
    },
    businessColor: IMPACT_COHORT_COLORS.business,
    deliveryColor: IMPACT_COHORT_COLORS.delivery,
  };

  return (
    <div className="relative">
      <FloatingSectionNav
        items={organizationSectionLinks}
        showItemLabelsOnHover
        labelAlignment="right"
      />

      <PageHeader
        title="Organization Insights"
        subtitle="Organization-level view of AI maturity."
        titleClassName="text-[1.6rem] font-bold tracking-tight text-[#242424] md:text-[1.75rem]"
        subtitleClassName="mb-6 text-sm text-[#8b8b8b]"
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex w-fit items-center rounded-full border border-[#e5e7eb] bg-white p-1 shadow-sm">
          {[
            { id: 'mustKnow' as const, label: 'Must-know' },
            { id: 'deepDive' as const, label: 'Deep analysis' },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setInsightsMode(option.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                insightsMode === option.id
                  ? 'bg-[#3f3f46] text-white shadow-sm'
                  : 'text-[#6b7280] hover:bg-[#f5f5f5] hover:text-[#242424]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <section id="org-top-summary" className="scroll-mt-24">
        <SectionHeader
          title="Top summary"
          subtitle="Fast-read KPIs for overall maturity, movement, breadth of adoption, and adoption resistance."
        />

        <div className="flex flex-wrap gap-3">
          {summaryCards.map((card) => (
            <button
              type="button"
              key={card.title}
              onClick={card.onClick}
              className={
                `w-full sm:w-[260px] ${card.accent
                  ? 'flex min-h-[126px] flex-col rounded-2xl bg-[linear-gradient(135deg,#0f766e_0%,#1d4ed8_100%)] px-5 py-4 text-white shadow-sm'
                  : 'flex min-h-[126px] flex-col rounded-2xl border border-[#eaeaea] bg-white px-4 py-3 shadow-sm'} ${
                  card.onClick
                    ? 'text-left transition hover:border-[#d4d4d8] hover:bg-[#fafafa] focus:outline-none focus:ring-[3px] focus:ring-[#c7c7cc]/25'
                    : 'text-left'
                }`
              }
            >
              <div
                className={
                  card.accent
                    ? 'text-[11px] font-medium uppercase tracking-[0.14em] text-white/75'
                    : 'text-[11px] font-medium uppercase tracking-[0.14em] text-[#8b8b8b]'
                }
              >
                <span className="inline-flex items-center gap-1.5">
                  {card.title}
                  {card.helpText ? (
                    <InfoTooltip>
                      <TooltipTrigger asChild>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(event) => event.stopPropagation()}
                          onKeyDown={(event) => event.stopPropagation()}
                          className={`inline-flex h-4 w-4 items-center justify-center rounded-full ${
                            card.accent ? 'text-white/75' : 'text-[#9ca3af]'
                          }`}
                          aria-label={`About ${card.title}`}
                        >
                          <CircleHelp className="h-3.5 w-3.5" />
                        </span>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        sideOffset={8}
                        className="max-w-[260px] px-3 py-2 text-[12px] leading-relaxed"
                      >
                        <div className="text-white">{card.helpText}</div>
                      </TooltipContent>
                    </InfoTooltip>
                  ) : null}
                  {card.onClick ? (
                    <ArrowDown className={card.accent ? 'h-3 w-3 text-white/70' : 'h-3 w-3 text-[#9ca3af]'} />
                  ) : null}
                </span>
              </div>
              <div className="mt-8 flex items-center gap-3">
                {card.hoverValue ? (
                  <InfoTooltip>
                    <TooltipTrigger asChild>
                      <div
                        className={
                          card.accent
                            ? 'cursor-default text-2xl font-semibold tracking-tight leading-none'
                            : 'cursor-default text-2xl font-semibold tracking-tight leading-none text-[#242424]'
                        }
                      >
                        {card.value}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={8} className="px-3 py-2 text-[12px] leading-relaxed">
                      <div className="font-medium text-white">{card.hoverValue}</div>
                    </TooltipContent>
                  </InfoTooltip>
                ) : (
                  <div
                    className={
                      card.accent
                        ? 'text-2xl font-semibold tracking-tight leading-none'
                        : 'text-2xl font-semibold tracking-tight leading-none text-[#242424]'
                    }
                  >
                    {card.value}
                  </div>
                )}
                {card.delta ? (
                  <span
                    className={
                      card.accent
                        ? 'inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/12 px-2.5 py-1 text-xs font-medium text-white'
                        : 'inline-flex items-center gap-1.5 rounded-full bg-[#ecfdf5] px-2.5 py-1 text-xs font-medium text-[#0f766e]'
                    }
                  >
                    <span className="text-emerald-300">↑</span>
                    {card.delta}
                  </span>
                ) : null}
              </div>
              <div className={card.accent ? 'mt-4 text-sm text-white/80' : 'mt-4 text-sm text-[#8b8b8b]'}>
                {card.detail}
              </div>
              {card.deltaDetail ? (
                <div className={card.accent ? 'mt-1 text-xs text-white/65' : 'mt-1 text-xs text-[#a1a1aa]'}>
                  {card.deltaDetail}
                </div>
              ) : null}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-3xl border border-[#e5e7eb] bg-[linear-gradient(180deg,#fbfbfc_0%,#ffffff_100%)] p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8b8b8b]">
                Ask External AI
              </div>
              <h3 className="mt-2 text-lg font-semibold tracking-tight text-[#1f2937]">
                Download an{' '}
                <InfoTooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-help underline decoration-dotted underline-offset-4">
                      anonymized
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8} className="max-w-[280px] px-3 py-2 text-[12px] leading-relaxed">
                    People are shortened like John R, and project names are replaced with stable aliases like GGLE.
                  </TooltipContent>
                </InfoTooltip>{' '}
                research pack for ChatGPT or Claude
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#667085]">
                Ask questions in the sidebar or download a markdown brief with survey context,
                organization snapshot, raw dimension scores for individuals, departments, and
                projects, plus question-level responses.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
              <AskAiTriggerButton onClick={() => setIsAskAiOpen(true)} />

              <button
                type="button"
                onClick={downloadAiResearchPack}
                disabled={isPreparingAiResearchPack}
                className="inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl border border-[#d4d4d8] bg-[#f5f5f5] px-5 text-sm font-semibold text-[#3f3f46] transition hover:border-[#c4c4c7] hover:bg-[#ededee] focus:outline-none focus:ring-[3px] focus:ring-[#c7c7cc]/25 disabled:cursor-wait disabled:opacity-70"
              >
                {isPreparingAiResearchPack ? 'Preparing AI research pack...' : 'Download AI research pack'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section id="org-where-now" className="mt-8 scroll-mt-24">
        <SectionHeader
          title="Where are we now?"
          subtitle="See whether maturity is broad-based or concentrated, and which departments are ahead or lagging by dimension."
        />

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.8fr)_minmax(320px,0.8fr)]">
          <section className="group relative rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
            <ChartFeedback
              chartId="organization_maturity_map"
              chartTitle="Organization maturity map"
              page="organization"
              eventProperties={{
                chart_section: 'where_are_we_now',
                respondent_count: individuals.length,
              }}
            />
            <div className="pr-24">
              <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
                Organization maturity map
              </h3>
              <p className="mt-1 text-sm text-[#7a7a7a]">
                {orgMaturityMap.detail}
              </p>
            </div>
            <div className="mt-4 rounded-2xl border border-[#1d4ed8]/20 bg-[linear-gradient(135deg,#0f766e_0%,#1d4ed8_100%)] p-4 text-white shadow-sm">
              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/75">
                Organization archetype
              </div>
              <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="inline-flex w-fit items-center rounded-full border border-white/25 bg-white/15 px-3 py-1 text-sm font-semibold text-white shadow-sm backdrop-blur-sm">
                  {orgArchetype.label}
                </div>
                <p className="max-w-2xl text-sm text-white/85">{orgArchetype.signal}</p>
              </div>
            </div>

            <div className="mt-6 h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={orgMaturityMap.data} outerRadius="72%">
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
                      padding: '10px 12px',
                      color: '#ffffff',
                      fontSize: '14px',
                    }}
                    labelStyle={{ color: '#ffffff', fontWeight: 600, marginBottom: 4, fontSize: '14px' }}
                    itemStyle={{ color: '#ffffff', fontSize: '14px' }}
                    formatter={(value, name) => {
                      const num = Number(value);
                      return [`${num.toFixed(1)} / 5`, name];
                    }}
                  />
                  <Radar
                    name="Current"
                    dataKey="current"
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

          <section className="group relative rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
            <ChartFeedback chartTitle="Maturity level distribution" page="organization" />
            <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
              Maturity level distribution
            </h3>
            <p className="mt-1 text-sm text-[#7a7a7a]">
              Distribution shows whether adoption is broad or concentrated in a small group of champions.
              Based on {individuals.length} survey respondents.
            </p>

            <div className="mt-6">
              <div className="flex flex-wrap justify-center gap-2 px-4 pb-4">
                {maturityDistribution.map((entry) => {
                  const isHidden = hiddenMaturityDistributionLevels.includes(entry.level);

                  return (
                    <InfoTooltip key={entry.level}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() =>
                            setHiddenMaturityDistributionLevels((current) =>
                              current.includes(entry.level)
                                ? current.filter((level) => level !== entry.level)
                                : [...current, entry.level],
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
                            style={{ backgroundColor: entry.fill, opacity: isHidden ? 0.35 : 1 }}
                          />
                          <span className={isHidden ? 'line-through' : ''}>{entry.level}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top" sideOffset={8} className="max-w-[220px] px-3 py-2 text-[11px] leading-relaxed">
                        <div className="font-medium text-white">{entry.level}</div>
                        <div className="mt-1 text-white/80">
                          Respondents: {entry.count} ({entry.share}% of all respondents)
                        </div>
                        <div className="mt-1 text-white/80">Score: {entry.scoreRange}</div>
                      </TooltipContent>
                    </InfoTooltip>
                  );
                })}
              </div>

              <div className="h-[340px]">
                {visibleMaturityDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={visibleMaturityDistribution}
                        dataKey="count"
                        nameKey="level"
                        isAnimationActive={false}
                        cx="50%"
                        cy="54%"
                        innerRadius={60}
                        outerRadius={112}
                        paddingAngle={2}
                        stroke="white"
                        strokeWidth={2}
                        label={({ payload }) => `${payload?.share ?? 0}%`}
                        labelLine={false}
                      >
                        {visibleMaturityDistribution.map((entry) => (
                          <Cell key={entry.level} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip isAnimationActive={false} content={<MaturityDistributionTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[#d4d4d8] bg-[#fafafa] px-6 text-center text-sm text-[#7a7a7a]">
                    All maturity levels are hidden. Click a badge to show them again.
                  </div>
                )}
              </div>
            </div>
          </section>

          <ProjectArchetypeBubbleChart
            rows={individualArchetypeBubbleRows}
            scopeLabel="Individual"
            scopeLabelPlural="Individuals"
            title="Individual archetype bubble chart"
            colors={INDIVIDUAL_ARCHETYPE_BUBBLE_COLORS}
            cardClassName="bg-white shadow-sm"
          />
        </div>

        <section className="mt-5 rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
            Dimension heatmap by department
          </h3>
          <p className="mt-1 text-sm text-[#7a7a7a]">
            This replaces one score per department with a more actionable view of exactly where intervention is needed.
          </p>

          <div className="mt-5 grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
            <ProjectArchetypeBubbleChart
              rows={departmentArchetypeBubbleRows}
              scopeLabel="Department"
              scopeLabelPlural="Departments"
            />

            <div className="min-w-0 overflow-x-auto">
              <table className="w-full min-w-[1540px]">
                <thead>
                  <tr className="border-b border-[#eaeaea] text-left text-xs text-[#8b8b8b]">
                    {[
                      { key: 'department' as const, label: 'Department' },
                      { key: 'overall' as const, label: 'Overall' },
                      { key: 'level' as const, label: 'Level' },
                      { key: 'archetype' as const, label: 'Archetype' },
                      ...DIMENSION_KEYS.map((dimension) => ({
                        key: dimension,
                        label: DIMENSION_LABELS[dimension],
                      })),
                      { key: 'respondents' as const, label: 'Responses' },
                    ].map((header) => (
                      <th
                        key={header.key}
                        className={`px-4 py-3 font-medium ${
                          header.key === 'department'
                            ? 'w-[200px] min-w-[200px] max-w-[200px]'
                            : header.key === 'archetype'
                              ? 'w-[220px] min-w-[220px] max-w-[220px]'
                              : ''
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleHeatmapSort(header.key)}
                          className={`items-center gap-1 transition-colors hover:text-[#525252] ${
                            header.key === 'department' ? 'flex w-full min-w-0' : 'inline-flex'
                          }`}
                        >
                          <span>{header.label}</span>
                          <span className="inline-flex h-4 w-4 items-center justify-center text-[11px]">
                            {isTableSortPending && heatmapSort.key === header.key ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              sortIndicator(header.key)
                            )}
                          </span>
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleDimensionHeatmapRows.map((row) => (
                    <tr key={row.id} className="border-b border-[#eaeaea] last:border-b-0">
                      <td className="w-[200px] min-w-[200px] max-w-[200px] px-4 py-3 font-medium text-[#242424]">
                        <div className="flex min-w-0 items-center gap-2">
                          <SensitiveText
                            as="span"
                            hidden={isSensitiveDataHidden}
                            className="block flex-1 truncate"
                          >
                            {row.department}
                          </SensitiveText>
                          <Link
                            to={`/teams?scope=department&scopeId=${row.id}`}
                            className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[#8b8b8b] transition-colors hover:bg-[#f5f5f5] hover:text-[#525252]"
                            aria-label={
                              isSensitiveDataHidden
                                ? 'Open department in Team Scores'
                                : `Open ${row.department} in Team Scores`
                            }
                            title="Open in Team Scores"
                          >
                            <svg
                              viewBox="0 0 16 16"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            >
                              <path
                                d="M6 3H3.75A1.75 1.75 0 0 0 2 4.75v7.5C2 13.216 2.784 14 3.75 14h7.5A1.75 1.75 0 0 0 13 12.25V10"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M9 3h4v4M13 3 7.5 8.5"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </Link>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#242424]">{formatScore(row.overall)}</td>
                      <td className="px-4 py-3 text-sm text-[#242424]">{formatLevelLabel(row.level)}</td>
                      <td className="w-[220px] min-w-[220px] max-w-[220px] px-4 py-3 text-sm text-[#242424]">
                        <InfoTooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex max-w-full items-center rounded-full border border-[#dbe6ff] bg-[#f5f8ff] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
                              <span className="truncate">{row.archetype.label}</span>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={8} className="max-w-[280px] px-3 py-2 text-[12px] leading-relaxed">
                            <div className="font-medium text-white">{row.archetype.label}</div>
                            <div className="mt-1 text-white/80">{row.archetype.signal}</div>
                          </TooltipContent>
                        </InfoTooltip>
                      </td>
                      {DIMENSION_KEYS.map((dimension) => (
                        <td
                          key={`${row.id}-${dimension}`}
                          className="px-4 py-3 text-center text-sm text-[#242424]"
                        >
                          <span
                            className={`inline-flex min-w-[3rem] items-center justify-center rounded-md px-2 py-1 font-medium ${lowScoreBadgeTone(row[dimension])}`}
                          >
                            {row[dimension].toFixed(1)}
                          </span>
                        </td>
                      ))}
                      <td className="px-4 py-3 text-sm text-[#242424]">
                        <span
                          className={`inline-flex min-w-[3rem] items-center justify-center rounded-md px-2 py-1 font-medium ${
                            row.respondents < 5
                              ? 'bg-amber-100 text-amber-800'
                              : ''
                          }`}
                        >
                          {row.respondents}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {sortedDimensionHeatmap.length > 8 ? (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAllDimensionHeatmapRows((current) => !current)}
                className="rounded-full border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#525252] transition hover:bg-[#f8f8f8]"
              >
                {showAllDimensionHeatmapRows
                  ? 'Show less'
                  : `Show all (${sortedDimensionHeatmap.length})`}
              </button>
            </div>
          ) : null}
        </section>

        <section className="mt-5 rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
            Project ranking table
          </h3>
          <p className="mt-1 text-sm text-[#7a7a7a]">
            Project-by-project view of current maturity so you can spot where stronger AI practice is already concentrated.
          </p>

          <div className="mt-5 grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
            <ProjectArchetypeBubbleChart
              rows={projectArchetypeBubbleRows}
              scopeLabel="Project"
              scopeLabelPlural="Projects"
            />

            <div className="min-w-0 overflow-x-auto">
              <table className="w-full min-w-[1540px]">
                <thead>
                  <tr className="border-b border-[#eaeaea] text-left text-xs text-[#8b8b8b]">
                    {[
                      { key: 'name' as const, label: 'Project' },
                      { key: 'overall' as const, label: 'Overall' },
                      { key: 'level' as const, label: 'Level' },
                      { key: 'archetype' as const, label: 'Archetype' },
                      ...DIMENSION_KEYS.map((dimension) => ({
                        key: dimension,
                        label: DIMENSION_LABELS[dimension],
                      })),
                      { key: 'respondents' as const, label: 'Responses' },
                    ].map((header) => (
                      <th key={header.key} className="px-4 py-3 font-medium">
                        <button
                          type="button"
                          onClick={() => toggleProjectRankingSort(header.key)}
                          className="inline-flex items-center gap-1 transition-colors hover:text-[#525252]"
                        >
                          <span>{header.label}</span>
                          <span className="inline-flex h-4 w-4 items-center justify-center text-[11px]">
                            {isTableSortPending && projectRankingSort.key === header.key ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              projectRankingSortIndicator(header.key)
                            )}
                          </span>
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleProjectRankingRows.map((project) => (
                    <tr key={project.id} className="border-b border-[#eaeaea] last:border-b-0">
                      <td className="px-4 py-3 font-medium text-[#242424]">
                        <div className="flex items-center gap-3">
                          <ProjectAvatar name={project.name} />
                          <div className="flex min-w-0 items-center gap-2">
                            <SensitiveText as="span" hidden={isSensitiveDataHidden} className="truncate">
                              {project.name}
                            </SensitiveText>
                            <Link
                              to={`/teams?scope=team&scopeId=${project.id}`}
                              className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[#8b8b8b] transition-colors hover:bg-[#f5f5f5] hover:text-[#525252]"
                              aria-label={
                                isSensitiveDataHidden
                                  ? 'Open project in Team Scores'
                                  : `Open ${project.name} in Team Scores`
                              }
                              title="Open in Team Scores"
                            >
                              <svg
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              >
                                <path
                                  d="M6 3H3.75A1.75 1.75 0 0 0 2 4.75v7.5C2 13.216 2.784 14 3.75 14h7.5A1.75 1.75 0 0 0 13 12.25V10"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M9 3h4v4M13 3 7.5 8.5"
                                  stroke="currentColor"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#242424]">{formatScore(project.overall)}</td>
                      <td className="px-4 py-3 text-sm text-[#242424]">{formatLevelLabel(project.level)}</td>
                      <td className="w-[220px] min-w-[220px] max-w-[220px] px-4 py-3 text-sm text-[#242424]">
                        <InfoTooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex max-w-full items-center rounded-full border border-[#dbe6ff] bg-[#f5f8ff] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
                              <span className="truncate">{project.archetype.label}</span>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" sideOffset={8} className="max-w-[280px] px-3 py-2 text-[12px] leading-relaxed">
                            <div className="font-medium text-white">{project.archetype.label}</div>
                            <div className="mt-1 text-white/80">{project.archetype.signal}</div>
                          </TooltipContent>
                        </InfoTooltip>
                      </td>
                      {DIMENSION_KEYS.map((dimension) => (
                        <td
                          key={`${project.id}-${dimension}`}
                          className="px-4 py-3 text-center text-sm text-[#242424]"
                        >
                          <span
                            className={`inline-flex min-w-[3rem] items-center justify-center rounded-md px-2 py-1 font-medium ${lowScoreBadgeTone(project.dimensions[dimension])}`}
                          >
                            {project.dimensions[dimension].toFixed(1)}
                          </span>
                        </td>
                      ))}
                      <td className="px-4 py-3 text-sm text-[#242424]">
                        <span
                          className={`inline-flex min-w-[3rem] items-center justify-center rounded-md px-2 py-1 font-medium ${
                            project.respondents < 5
                              ? 'bg-amber-100 text-amber-800'
                              : ''
                          }`}
                        >
                          {project.respondents}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {sortedProjectRankingRows.length > 10 ? (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAllProjectRankingRows((current) => !current)}
                className="rounded-full border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#525252] transition hover:bg-[#f8f8f8]"
              >
                {showAllProjectRankingRows
                  ? 'Show less'
                  : `Show all (${sortedProjectRankingRows.length})`}
              </button>
            </div>
          ) : null}
        </section>

      </section>

      {!isMustKnowMode ? (
        <>
      <section id="org-dimension-usage" className="mt-8 scroll-mt-24">
        <SectionHeader
          title="Dimension 1: Usage"
          subtitle="Understand how people currently use AI in practice, using the workflow and activity questions from each survey."
        />

        <div className="grid gap-5 xl:grid-cols-2">
          <section className="group relative rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
            <ChartFeedback chartTitle="Business workflows using AI" page="organization" />
            <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
              Business workflows using AI
            </h3>
            <p className="mt-1 text-sm text-[#7a7a7a]">
              Based on responses to "Which workflows do you currently use AI for?" Normalized by share of business respondents.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {USAGE_MODE_OPTIONS.map((option) => {
                const isActive = businessUsageMode === option.key;

                return (
                  <button
                    key={`business-usage-mode-${option.key}`}
                    type="button"
                    onClick={() => setBusinessUsageMode(option.key)}
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

            <div className="mt-6 h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={businessWorkflowUsage.rows}
                  layout="vertical"
                  margin={{ top: 0, right: 12, left: 12, bottom: 0 }}
                >
                  <CartesianGrid stroke="#ececec" strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    tick={{ fontSize: 12, fill: '#737373' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={230}
                    tick={{ fontSize: 12, fill: '#525252' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    isAnimationActive={false}
                    content={<UsageCategoryTooltip cohortLabel="business respondents" />}
                  />
                  <Bar dataKey="share" radius={[0, 8, 8, 0]} fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="group relative rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
            <ChartFeedback chartTitle="Delivery & engineering activities using AI" page="organization" />
            <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
              Delivery & engineering activities using AI
            </h3>
            <p className="mt-1 text-sm text-[#7a7a7a]">
              Based on responses to "In which activities do you currently use AI?" Normalized by share of delivery & engineering respondents.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {USAGE_MODE_OPTIONS.map((option) => {
                const isActive = deliveryUsageMode === option.key;

                return (
                  <button
                    key={`delivery-usage-mode-${option.key}`}
                    type="button"
                    onClick={() => setDeliveryUsageMode(option.key)}
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

            <div className="mt-6 h-[420px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={deliveryActivityUsage.rows}
                  layout="vertical"
                  margin={{ top: 0, right: 12, left: 12, bottom: 0 }}
                >
                  <CartesianGrid stroke="#ececec" strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    tick={{ fontSize: 12, fill: '#737373' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={270}
                    tick={{ fontSize: 12, fill: '#525252' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    isAnimationActive={false}
                    content={<UsageCategoryTooltip cohortLabel="delivery & engineering respondents" />}
                  />
                  <Bar dataKey="share" radius={[0, 8, 8, 0]} fill="#14b8a6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        <section className="group relative mt-5 rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
          <ChartFeedback chartTitle="AI embeddedness in actual work" page="organization" />
          <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
            AI embeddedness in actual work
          </h3>
          <p className="mt-1 text-sm text-[#7a7a7a]">
            Based on responses to "How embedded is AI in your actual daily work?" and "How embedded is AI in your actual project work?" This shows whether AI is peripheral, routine, or deeply built into delivery.
          </p>

          <div className="mt-5">
            <div className="flex flex-wrap gap-3">
              <CompactUsageMultiSelect
                placeholder="Department"
                singularLabel="department"
                pluralLabel="departments"
                searchPlaceholder="Search departments..."
                ariaLabel="Filter embeddedness by departments"
                options={usageDepartmentOptions.filter((option) => option !== ALL_DEPARTMENTS)}
                selectedValues={selectedEmbeddednessDepartments}
                onToggle={toggleEmbeddednessDepartment}
                onClear={() => setSelectedEmbeddednessDepartments([])}
              />
              <CompactUsageMultiSelect
                placeholder="Team"
                singularLabel="team"
                pluralLabel="teams"
                searchPlaceholder="Search teams..."
                ariaLabel="Filter embeddedness by teams"
                options={usageTeamOptions.filter((option) => option !== ALL_TEAMS)}
                selectedValues={selectedEmbeddednessTeams}
                onToggle={toggleEmbeddednessTeam}
                onClear={() => setSelectedEmbeddednessTeams([])}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <div className="text-[#8b8b8b]">
                {filteredEmbeddednessResponses.length} respondents in current filter
              </div>
              {embeddednessFiltersActive ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEmbeddednessDepartments([]);
                      setSelectedEmbeddednessTeams([]);
                    }}
                    className="inline-flex items-center rounded-full border border-[#d8e5de] bg-[#f7fbf8] px-3 py-1.5 text-xs font-medium text-[#2f6f59] transition hover:border-[#c3d9ce] hover:bg-[#eef8f2]"
                  >
                    Clear filters
                  </button>
                  {selectedEmbeddednessDepartments.map((department) => (
                    <span
                      key={`embeddedness-department-${department}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-[#f4f4f5] py-1 pl-2.5 pr-1 text-xs font-medium text-[#242424]"
                    >
                      <span className="text-[#6b7280]">Department</span>
                      <SensitiveText as="span" hidden={isSensitiveDataHidden}>
                        {department}
                      </SensitiveText>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedEmbeddednessDepartments((current) =>
                            current.filter((value) => value !== department),
                          )
                        }
                        className="rounded-full p-1 text-[#8b8b8b] transition hover:bg-white hover:text-[#242424]"
                        aria-label={
                          isSensitiveDataHidden
                            ? 'Remove department filter'
                            : `Remove department filter ${department}`
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {selectedEmbeddednessTeams.map((team) => (
                    <span
                      key={`embeddedness-team-${team}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-[#f4f4f5] py-1 pl-2.5 pr-1 text-xs font-medium text-[#242424]"
                    >
                      <span className="text-[#6b7280]">Team</span>
                      <SensitiveText as="span" hidden={isSensitiveDataHidden}>
                        {team}
                      </SensitiveText>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedEmbeddednessTeams((current) =>
                            current.filter((value) => value !== team),
                          )
                        }
                        className="rounded-full p-1 text-[#8b8b8b] transition hover:bg-white hover:text-[#242424]"
                        aria-label={`Remove team filter ${team}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {EMBEDDEDNESS_SERIES.map((series) => (
              <div
                key={series.key}
                className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-[#fafafa] px-3 py-1.5 text-xs font-medium text-[#374151]"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: series.color }}
                />
                <span>{series.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={embeddednessDistribution}
                layout="vertical"
                margin={{ top: 10, right: 12, left: 20, bottom: 0 }}
              >
                <CartesianGrid stroke="#ececec" vertical={false} strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fontSize: 12, fill: '#737373' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="cohort"
                  width={150}
                  tick={{ fontSize: 12, fill: '#525252' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip isAnimationActive={false} content={<EmbeddednessTooltip />} />
                {EMBEDDEDNESS_SERIES.map((series, index) => (
                  <Bar
                    key={series.key}
                    dataKey={series.key}
                    name={series.label}
                    stackId="embeddedness"
                    fill={series.color}
                    radius={
                      index === EMBEDDEDNESS_SERIES.length - 1 ? [0, 8, 8, 0] : undefined
                    }
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="group relative mt-5 rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
          <ChartFeedback chartTitle="Shared AI practices on teams" page="organization" />
          <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
            Shared AI practices on teams
          </h3>
          <p className="mt-1 text-sm text-[#7a7a7a]">
            Based on responses to whether project teams have shared AI practices, tools, or guidelines. This shows whether usage is still individual, loosely shared, or standardized at the team level.
          </p>

          <div className="mt-5">
            <div className="flex flex-wrap gap-3">
              <CompactUsageMultiSelect
                placeholder="Department"
                singularLabel="department"
                pluralLabel="departments"
                searchPlaceholder="Search departments..."
                ariaLabel="Filter shared practices by departments"
                options={usageDepartmentOptions.filter((option) => option !== ALL_DEPARTMENTS)}
                selectedValues={selectedSharedPracticesDepartments}
                onToggle={toggleSharedPracticesDepartment}
                onClear={() => setSelectedSharedPracticesDepartments([])}
              />
              <CompactUsageMultiSelect
                placeholder="Team"
                singularLabel="team"
                pluralLabel="teams"
                searchPlaceholder="Search teams..."
                ariaLabel="Filter shared practices by teams"
                options={usageTeamOptions.filter((option) => option !== ALL_TEAMS)}
                selectedValues={selectedSharedPracticesTeams}
                onToggle={toggleSharedPracticesTeam}
                onClear={() => setSelectedSharedPracticesTeams([])}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <div className="text-[#8b8b8b]">
                {filteredSharedPracticesResponses.length} respondents in current filter
              </div>
              {sharedPracticesFiltersActive ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSharedPracticesDepartments([]);
                      setSelectedSharedPracticesTeams([]);
                    }}
                    className="inline-flex items-center rounded-full border border-[#d8e5de] bg-[#f7fbf8] px-3 py-1.5 text-xs font-medium text-[#2f6f59] transition hover:border-[#c3d9ce] hover:bg-[#eef8f2]"
                  >
                    Clear filters
                  </button>
                  {selectedSharedPracticesDepartments.map((department) => (
                    <span
                      key={`shared-practices-department-${department}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-[#f4f4f5] py-1 pl-2.5 pr-1 text-xs font-medium text-[#242424]"
                    >
                      <span className="text-[#6b7280]">Department</span>
                      <SensitiveText as="span" hidden={isSensitiveDataHidden}>
                        {department}
                      </SensitiveText>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedSharedPracticesDepartments((current) =>
                            current.filter((value) => value !== department),
                          )
                        }
                        className="rounded-full p-1 text-[#8b8b8b] transition hover:bg-white hover:text-[#242424]"
                        aria-label={
                          isSensitiveDataHidden
                            ? 'Remove department filter'
                            : `Remove department filter ${department}`
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {selectedSharedPracticesTeams.map((team) => (
                    <span
                      key={`shared-practices-team-${team}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-[#f4f4f5] py-1 pl-2.5 pr-1 text-xs font-medium text-[#242424]"
                    >
                      <span className="text-[#6b7280]">Team</span>
                      <SensitiveText as="span" hidden={isSensitiveDataHidden}>
                        {team}
                      </SensitiveText>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedSharedPracticesTeams((current) =>
                            current.filter((value) => value !== team),
                          )
                        }
                        className="rounded-full p-1 text-[#8b8b8b] transition hover:bg-white hover:text-[#242424]"
                        aria-label={`Remove team filter ${team}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {SHARED_PRACTICES_SERIES.map((series) => (
              <div
                key={series.key}
                className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-[#fafafa] px-3 py-1.5 text-xs font-medium text-[#374151]"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: series.color }}
                />
                <span>{series.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sharedPracticesDistribution}
                layout="vertical"
                margin={{ top: 10, right: 12, left: 20, bottom: 0 }}
              >
                <CartesianGrid stroke="#ececec" vertical={false} strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fontSize: 12, fill: '#737373' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="cohort"
                  width={150}
                  tick={{ fontSize: 12, fill: '#525252' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip isAnimationActive={false} content={<SharedPracticesTooltip />} />
                {SHARED_PRACTICES_SERIES.map((series, index) => (
                  <Bar
                    key={series.key}
                    dataKey={series.key}
                    name={series.label}
                    stackId="shared-practices"
                    fill={series.color}
                    radius={
                      index === SHARED_PRACTICES_SERIES.length - 1 ? [0, 8, 8, 0] : undefined
                    }
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </section>

      <section id="org-dimension-skills" className="mt-8 scroll-mt-24">
        <SectionHeader
          title="Dimension 2: Skills"
          subtitle="See how strong people’s AI understanding is today, using the baseline skills questions from each survey."
        />

        <section className="group relative rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
          <ChartFeedback chartTitle="Baseline AI understanding" page="organization" />
          <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
            Baseline AI understanding
          </h3>
          <p className="mt-1 text-sm text-[#7a7a7a]">
            Based on the first skills question in each survey. Because the business and delivery surveys ask about different kinds of understanding, responses are normalized into a shared ladder from unfamiliar to expert.
          </p>

          <div className="mt-5">
            <div className="flex flex-wrap gap-3">
              <CompactUsageMultiSelect
                placeholder="Department"
                singularLabel="department"
                pluralLabel="departments"
                searchPlaceholder="Search departments..."
                ariaLabel="Filter baseline AI understanding by departments"
                options={usageDepartmentOptions.filter((option) => option !== ALL_DEPARTMENTS)}
                selectedValues={selectedSkillsBaselineDepartments}
                onToggle={toggleSkillsBaselineDepartment}
                onClear={() => setSelectedSkillsBaselineDepartments([])}
              />
              <CompactUsageMultiSelect
                placeholder="Team"
                singularLabel="team"
                pluralLabel="teams"
                searchPlaceholder="Search teams..."
                ariaLabel="Filter baseline AI understanding by teams"
                options={usageTeamOptions.filter((option) => option !== ALL_TEAMS)}
                selectedValues={selectedSkillsBaselineTeams}
                onToggle={toggleSkillsBaselineTeam}
                onClear={() => setSelectedSkillsBaselineTeams([])}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <div className="text-[#8b8b8b]">
                {filteredSkillsBaselineResponses.length} respondents in current filter
              </div>
              {skillsBaselineFiltersActive ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSkillsBaselineDepartments([]);
                      setSelectedSkillsBaselineTeams([]);
                    }}
                    className="inline-flex items-center rounded-full border border-[#d8e5de] bg-[#f7fbf8] px-3 py-1.5 text-xs font-medium text-[#2f6f59] transition hover:border-[#c3d9ce] hover:bg-[#eef8f2]"
                  >
                    Clear filters
                  </button>
                  {selectedSkillsBaselineDepartments.map((department) => (
                    <span
                      key={`skills-baseline-department-${department}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-[#f4f4f5] py-1 pl-2.5 pr-1 text-xs font-medium text-[#242424]"
                    >
                      <span className="text-[#6b7280]">Department</span>
                      <SensitiveText as="span" hidden={isSensitiveDataHidden}>
                        {department}
                      </SensitiveText>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedSkillsBaselineDepartments((current) =>
                            current.filter((value) => value !== department),
                          )
                        }
                        className="rounded-full p-1 text-[#8b8b8b] transition hover:bg-white hover:text-[#242424]"
                        aria-label={
                          isSensitiveDataHidden
                            ? 'Remove department filter'
                            : `Remove department filter ${department}`
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {selectedSkillsBaselineTeams.map((team) => (
                    <span
                      key={`skills-baseline-team-${team}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-[#f4f4f5] py-1 pl-2.5 pr-1 text-xs font-medium text-[#242424]"
                    >
                      <span className="text-[#6b7280]">Team</span>
                      <SensitiveText as="span" hidden={isSensitiveDataHidden}>
                        {team}
                      </SensitiveText>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedSkillsBaselineTeams((current) =>
                            current.filter((value) => value !== team),
                          )
                        }
                        className="rounded-full p-1 text-[#8b8b8b] transition hover:bg-white hover:text-[#242424]"
                        aria-label={`Remove team filter ${team}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {SKILLS_BASELINE_SERIES.map((series) => (
              <div
                key={series.key}
                className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-[#fafafa] px-3 py-1.5 text-xs font-medium text-[#374151]"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: series.color }}
                />
                <span>{series.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={skillsBaselineDistribution}
                layout="vertical"
                margin={{ top: 10, right: 12, left: 20, bottom: 0 }}
              >
                <CartesianGrid stroke="#ececec" vertical={false} strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fontSize: 12, fill: '#737373' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="cohort"
                  width={150}
                  tick={{ fontSize: 12, fill: '#525252' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip isAnimationActive={false} content={<SkillsBaselineTooltip />} />
                {SKILLS_BASELINE_SERIES.map((series, index) => (
                  <Bar
                    key={series.key}
                    dataKey={series.key}
                    name={series.label}
                    stackId="skills-baseline"
                    fill={series.color}
                    radius={
                      index === SKILLS_BASELINE_SERIES.length - 1 ? [0, 8, 8, 0] : undefined
                    }
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <section className="group relative rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
            <ChartFeedback chartTitle="Most-used AI tools" page="organization" />
            <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
              Most-used AI tools
            </h3>
            <p className="mt-1 text-sm text-[#7a7a7a]">
              Based on responses to “What is your primary (most-used) AI tools over the last month?”
            </p>

            <div className="mt-5">
              <div className="flex flex-wrap gap-3">
                <CompactUsageMultiSelect
                  placeholder="Department"
                  singularLabel="department"
                  pluralLabel="departments"
                  searchPlaceholder="Search departments..."
                  ariaLabel="Filter tools by departments"
                  options={usageDepartmentOptions.filter((option) => option !== ALL_DEPARTMENTS)}
                  selectedValues={selectedToolDepartments}
                  onToggle={toggleToolDepartment}
                  onClear={() => setSelectedToolDepartments([])}
                />
                <CompactUsageMultiSelect
                  placeholder="Seniority"
                  singularLabel="seniority"
                  pluralLabel="seniorities"
                  searchPlaceholder="Search seniorities..."
                  ariaLabel="Filter tools by seniorities"
                  options={usageSeniorityOptions.filter((option) => option !== ALL_SENIORITIES)}
                  selectedValues={selectedToolSeniorities}
                  onToggle={toggleToolSeniority}
                  onClear={() => setSelectedToolSeniorities([])}
                />
                <CompactUsageMultiSelect
                  placeholder="Team"
                  singularLabel="team"
                  pluralLabel="teams"
                  searchPlaceholder="Search teams..."
                  ariaLabel="Filter tools by teams"
                  options={usageTeamOptions.filter((option) => option !== ALL_TEAMS)}
                  selectedValues={selectedToolTeams}
                  onToggle={toggleToolTeam}
                  onClear={() => setSelectedToolTeams([])}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <div className="text-[#8b8b8b]">
                  {filteredToolResponses.length} respondents in current filter
                </div>
                {toolFiltersActive ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedToolDepartments([]);
                        setSelectedToolSeniorities([]);
                        setSelectedToolTeams([]);
                      }}
                      className="inline-flex items-center rounded-full border border-[#d8e5de] bg-[#f7fbf8] px-3 py-1.5 text-xs font-medium text-[#2f6f59] transition hover:border-[#c3d9ce] hover:bg-[#eef8f2]"
                    >
                      Clear filters
                    </button>
                    {selectedToolDepartments.map((department) => (
                      <span
                        key={`tool-department-${department}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-[#f4f4f5] py-1 pl-2.5 pr-1 text-xs font-medium text-[#242424]"
                      >
                        <span className="text-[#6b7280]">Department</span>
                        <SensitiveText as="span" hidden={isSensitiveDataHidden}>
                          {department}
                        </SensitiveText>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedToolDepartments((current) =>
                              current.filter((value) => value !== department),
                            )
                          }
                          className="rounded-full p-1 text-[#8b8b8b] transition hover:bg-white hover:text-[#242424]"
                          aria-label={
                            isSensitiveDataHidden
                              ? 'Remove department filter'
                              : `Remove department filter ${department}`
                          }
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    {selectedToolSeniorities.map((seniority) => (
                      <span
                        key={`tool-seniority-${seniority}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-[#f4f4f5] py-1 pl-2.5 pr-1 text-xs font-medium text-[#242424]"
                      >
                        <span className="text-[#6b7280]">Seniority</span>
                        <span>{seniority}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedToolSeniorities((current) =>
                              current.filter((value) => value !== seniority),
                            )
                          }
                          className="rounded-full p-1 text-[#8b8b8b] transition hover:bg-white hover:text-[#242424]"
                          aria-label={`Remove seniority filter ${seniority}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    {selectedToolTeams.map((team) => (
                      <span
                        key={`tool-team-${team}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-[#f4f4f5] py-1 pl-2.5 pr-1 text-xs font-medium text-[#242424]"
                      >
                        <span className="text-[#6b7280]">Team</span>
                        <SensitiveText as="span" hidden={isSensitiveDataHidden}>
                          {team}
                        </SensitiveText>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedToolTeams((current) =>
                              current.filter((value) => value !== team),
                            )
                          }
                          className="rounded-full p-1 text-[#8b8b8b] transition hover:bg-white hover:text-[#242424]"
                          aria-label={`Remove team filter ${team}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </>
                ) : null}
              </div>
            </div>

            <div className="mt-6 h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mostUsedTools}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 24, bottom: 0 }}
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
                    width={150}
                    tick={{ fontSize: 12, fill: '#525252' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    isAnimationActive={false}
                    formatter={(value) => [`${value} respondents`, 'Used by']}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} fill="#14b8a6" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 rounded-2xl border border-[#e5e7eb] bg-[#fafafa] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-[#242424]">Tool mentions cloud</h4>
                  <p className="mt-1 text-xs text-[#737373]">
                    Combines predefined options with cleaned free-text mentions from the same
                    responses.
                  </p>
                </div>
                <div className="rounded-full border border-[#e5e7eb] bg-[#f5f5f5] px-3 py-1 text-xs font-medium text-[#525252]">
                  {toolMentionCloud.length} distinct mentions
                </div>
              </div>
              <MentionCloud
                entries={toolMentionCloud}
                accent="teal"
                emptyLabel="No tool mentions found for the current filter."
              />
            </div>
          </section>

          <section className="group relative rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
            <ChartFeedback chartTitle="Most-used LLM models" page="organization" />
            <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
              Most-used LLM models
            </h3>
            <p className="mt-1 text-sm text-[#7a7a7a]">
              Based on responses to “What is the LLM model you used most over the last month?”
            </p>

            <div className="mt-5">
              <div className="flex flex-wrap gap-3">
                <CompactUsageMultiSelect
                  placeholder="Department"
                  singularLabel="department"
                  pluralLabel="departments"
                  searchPlaceholder="Search departments..."
                  ariaLabel="Filter models by departments"
                  options={usageDepartmentOptions.filter((option) => option !== ALL_DEPARTMENTS)}
                  selectedValues={selectedModelDepartments}
                  onToggle={toggleModelDepartment}
                  onClear={() => setSelectedModelDepartments([])}
                />
                <CompactUsageMultiSelect
                  placeholder="Seniority"
                  singularLabel="seniority"
                  pluralLabel="seniorities"
                  searchPlaceholder="Search seniorities..."
                  ariaLabel="Filter models by seniorities"
                  options={usageSeniorityOptions.filter((option) => option !== ALL_SENIORITIES)}
                  selectedValues={selectedModelSeniorities}
                  onToggle={toggleModelSeniority}
                  onClear={() => setSelectedModelSeniorities([])}
                />
                <CompactUsageMultiSelect
                  placeholder="Team"
                  singularLabel="team"
                  pluralLabel="teams"
                  searchPlaceholder="Search teams..."
                  ariaLabel="Filter models by teams"
                  options={usageTeamOptions.filter((option) => option !== ALL_TEAMS)}
                  selectedValues={selectedModelTeams}
                  onToggle={toggleModelTeam}
                  onClear={() => setSelectedModelTeams([])}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <div className="text-[#8b8b8b]">
                  {filteredModelResponses.length} respondents in current filter
                </div>
                {modelFiltersActive ? (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedModelDepartments([]);
                        setSelectedModelSeniorities([]);
                        setSelectedModelTeams([]);
                      }}
                      className="inline-flex items-center rounded-full border border-[#d8e5de] bg-[#f7fbf8] px-3 py-1.5 text-xs font-medium text-[#2f6f59] transition hover:border-[#c3d9ce] hover:bg-[#eef8f2]"
                    >
                      Clear filters
                    </button>
                    {selectedModelDepartments.map((department) => (
                      <span
                        key={`model-department-${department}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-[#f4f4f5] py-1 pl-2.5 pr-1 text-xs font-medium text-[#242424]"
                      >
                        <span className="text-[#6b7280]">Department</span>
                        <SensitiveText as="span" hidden={isSensitiveDataHidden}>
                          {department}
                        </SensitiveText>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedModelDepartments((current) =>
                              current.filter((value) => value !== department),
                            )
                          }
                          className="rounded-full p-1 text-[#8b8b8b] transition hover:bg-white hover:text-[#242424]"
                          aria-label={
                            isSensitiveDataHidden
                              ? 'Remove department filter'
                              : `Remove department filter ${department}`
                          }
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    {selectedModelSeniorities.map((seniority) => (
                      <span
                        key={`model-seniority-${seniority}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-[#f4f4f5] py-1 pl-2.5 pr-1 text-xs font-medium text-[#242424]"
                      >
                        <span className="text-[#6b7280]">Seniority</span>
                        <span>{seniority}</span>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedModelSeniorities((current) =>
                              current.filter((value) => value !== seniority),
                            )
                          }
                          className="rounded-full p-1 text-[#8b8b8b] transition hover:bg-white hover:text-[#242424]"
                          aria-label={`Remove seniority filter ${seniority}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    {selectedModelTeams.map((team) => (
                      <span
                        key={`model-team-${team}`}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-[#f4f4f5] py-1 pl-2.5 pr-1 text-xs font-medium text-[#242424]"
                      >
                        <span className="text-[#6b7280]">Team</span>
                        <SensitiveText as="span" hidden={isSensitiveDataHidden}>
                          {team}
                        </SensitiveText>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedModelTeams((current) =>
                              current.filter((value) => value !== team),
                            )
                          }
                          className="rounded-full p-1 text-[#8b8b8b] transition hover:bg-white hover:text-[#242424]"
                          aria-label={`Remove team filter ${team}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </>
                ) : null}
              </div>
            </div>

            <div className="mt-6 h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mostUsedModels}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 24, bottom: 0 }}
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
                    width={170}
                    tick={{ fontSize: 12, fill: '#525252' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    isAnimationActive={false}
                    formatter={(value) => [`${value} respondents`, 'Used by']}
                  />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]} fill="#2563eb" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 rounded-2xl border border-[#e5e7eb] bg-[#fafafa] p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-[#242424]">Model mentions cloud</h4>
                  <p className="mt-1 text-xs text-[#737373]">
                    Combines predefined options with cleaned free-text mentions from the same
                    responses.
                  </p>
                </div>
                <div className="rounded-full border border-[#e5e7eb] bg-[#f5f5f5] px-3 py-1 text-xs font-medium text-[#525252]">
                  {modelMentionCloud.length} distinct mentions
                </div>
              </div>
              <MentionCloud
                entries={modelMentionCloud}
                accent="blue"
                emptyLabel="No model mentions found for the current filter."
              />
            </div>
          </section>
        </div>

        <section className="group relative mt-5 rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
          <ChartFeedback chartTitle="Prompting techniques used in practice" page="organization" />
          <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
            Prompting techniques used in practice
          </h3>
          <p className="mt-1 text-sm text-[#7a7a7a]">
            Based on responses to "Do you use any of the following when working with AI?" This comparison includes only techniques that were asked in both surveys.
          </p>

          <div className="mt-5">
            <div className="flex flex-wrap gap-3">
              <CompactUsageMultiSelect
                placeholder="Department"
                singularLabel="department"
                pluralLabel="departments"
                searchPlaceholder="Search departments..."
                ariaLabel="Filter prompting techniques by departments"
                options={usageDepartmentOptions.filter((option) => option !== ALL_DEPARTMENTS)}
                selectedValues={selectedPromptTechniqueDepartments}
                onToggle={togglePromptTechniqueDepartment}
                onClear={() => setSelectedPromptTechniqueDepartments([])}
              />
              <CompactUsageMultiSelect
                placeholder="Team"
                singularLabel="team"
                pluralLabel="teams"
                searchPlaceholder="Search teams..."
                ariaLabel="Filter prompting techniques by teams"
                options={usageTeamOptions.filter((option) => option !== ALL_TEAMS)}
                selectedValues={selectedPromptTechniqueTeams}
                onToggle={togglePromptTechniqueTeam}
                onClear={() => setSelectedPromptTechniqueTeams([])}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <div className="text-[#8b8b8b]">
                {filteredPromptTechniqueResponses.length} respondents in current filter
              </div>
              {promptTechniqueFiltersActive ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPromptTechniqueDepartments([]);
                      setSelectedPromptTechniqueTeams([]);
                    }}
                    className="inline-flex items-center rounded-full border border-[#d8e5de] bg-[#f7fbf8] px-3 py-1.5 text-xs font-medium text-[#2f6f59] transition hover:border-[#c3d9ce] hover:bg-[#eef8f2]"
                  >
                    Clear filters
                  </button>
                  {selectedPromptTechniqueDepartments.map((department) => (
                    <span
                      key={`prompt-technique-department-${department}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-[#f4f4f5] py-1 pl-2.5 pr-1 text-xs font-medium text-[#242424]"
                    >
                      <span className="text-[#6b7280]">Department</span>
                      <SensitiveText as="span" hidden={isSensitiveDataHidden}>
                        {department}
                      </SensitiveText>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedPromptTechniqueDepartments((current) =>
                            current.filter((value) => value !== department),
                          )
                        }
                        className="rounded-full p-1 text-[#8b8b8b] transition hover:bg-white hover:text-[#242424]"
                        aria-label={
                          isSensitiveDataHidden
                            ? 'Remove department filter'
                            : `Remove department filter ${department}`
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {selectedPromptTechniqueTeams.map((team) => (
                    <span
                      key={`prompt-technique-team-${team}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-[#f4f4f5] py-1 pl-2.5 pr-1 text-xs font-medium text-[#242424]"
                    >
                      <span className="text-[#6b7280]">Team</span>
                      <SensitiveText as="span" hidden={isSensitiveDataHidden}>
                        {team}
                      </SensitiveText>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedPromptTechniqueTeams((current) =>
                            current.filter((value) => value !== team),
                          )
                        }
                        className="rounded-full p-1 text-[#8b8b8b] transition hover:bg-white hover:text-[#242424]"
                        aria-label={`Remove team filter ${team}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#dbeafe] bg-[#eff6ff] px-3 py-1.5 text-xs font-medium text-[#1d4ed8]">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: IMPACT_COHORT_COLORS.business }}
              />
              <span>Business</span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ccfbf1] bg-[#f0fdfa] px-3 py-1.5 text-xs font-medium text-[#0f766e]">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: IMPACT_COHORT_COLORS.delivery }}
              />
              <span>Delivery & engineering</span>
            </div>
          </div>

          <div className="mt-6 h-[440px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={promptTechniqueComparison}
                layout="vertical"
                margin={{ top: 0, right: 12, left: 12, bottom: 0 }}
                barCategoryGap={10}
              >
                <CartesianGrid stroke="#ececec" strokeDasharray="3 3" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fontSize: 12, fill: '#737373' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={280}
                  tick={{ fontSize: 12, fill: '#525252' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip isAnimationActive={false} content={<PromptTechniqueTooltip />} />
                <Bar
                  dataKey="businessShare"
                  name="Business"
                  fill="#2563eb"
                  radius={[0, 8, 8, 0]}
                />
                <Bar
                  dataKey="deliveryShare"
                  name="Delivery & engineering"
                  fill="#14b8a6"
                  radius={[0, 8, 8, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="group relative mt-5 rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
          <ChartFeedback chartTitle="Sensitive data handling with AI" page="organization" />
          <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
            Sensitive data handling with AI
          </h3>
          <p className="mt-1 text-sm text-[#7a7a7a]">
            Based on the sensitive-data handling question in each survey. Responses are normalized from risky behavior to policy-driven handling so we can compare cohorts on judgment and safeguards.
          </p>

          <div className="mt-5">
            <div className="flex flex-wrap gap-3">
              <CompactUsageMultiSelect
                placeholder="Department"
                singularLabel="department"
                pluralLabel="departments"
                searchPlaceholder="Search departments..."
                ariaLabel="Filter sensitive data handling by departments"
                options={usageDepartmentOptions.filter((option) => option !== ALL_DEPARTMENTS)}
                selectedValues={selectedSensitiveDataDepartments}
                onToggle={toggleSensitiveDataDepartment}
                onClear={() => setSelectedSensitiveDataDepartments([])}
              />
              <CompactUsageMultiSelect
                placeholder="Team"
                singularLabel="team"
                pluralLabel="teams"
                searchPlaceholder="Search teams..."
                ariaLabel="Filter sensitive data handling by teams"
                options={usageTeamOptions.filter((option) => option !== ALL_TEAMS)}
                selectedValues={selectedSensitiveDataTeams}
                onToggle={toggleSensitiveDataTeam}
                onClear={() => setSelectedSensitiveDataTeams([])}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <div className="text-[#8b8b8b]">
                {filteredSensitiveDataResponses.length} respondents in current filter
              </div>
              {sensitiveDataFiltersActive ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedSensitiveDataDepartments([]);
                      setSelectedSensitiveDataTeams([]);
                    }}
                    className="inline-flex items-center rounded-full border border-[#d8e5de] bg-[#f7fbf8] px-3 py-1.5 text-xs font-medium text-[#2f6f59] transition hover:border-[#c3d9ce] hover:bg-[#eef8f2]"
                  >
                    Clear filters
                  </button>
                  {selectedSensitiveDataDepartments.map((department) => (
                    <span
                      key={`sensitive-data-department-${department}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-[#f4f4f5] py-1 pl-2.5 pr-1 text-xs font-medium text-[#242424]"
                    >
                      <span className="text-[#6b7280]">Department</span>
                      <SensitiveText as="span" hidden={isSensitiveDataHidden}>
                        {department}
                      </SensitiveText>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedSensitiveDataDepartments((current) =>
                            current.filter((value) => value !== department),
                          )
                        }
                        className="rounded-full p-1 text-[#8b8b8b] transition hover:bg-white hover:text-[#242424]"
                        aria-label={
                          isSensitiveDataHidden
                            ? 'Remove department filter'
                            : `Remove department filter ${department}`
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  {selectedSensitiveDataTeams.map((team) => (
                    <span
                      key={`sensitive-data-team-${team}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-[#f4f4f5] py-1 pl-2.5 pr-1 text-xs font-medium text-[#242424]"
                    >
                      <span className="text-[#6b7280]">Team</span>
                      <SensitiveText as="span" hidden={isSensitiveDataHidden}>
                        {team}
                      </SensitiveText>
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedSensitiveDataTeams((current) =>
                            current.filter((value) => value !== team),
                          )
                        }
                        className="rounded-full p-1 text-[#8b8b8b] transition hover:bg-white hover:text-[#242424]"
                        aria-label={`Remove team filter ${team}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {SENSITIVE_DATA_SERIES.map((series) => (
              <div
                key={series.key}
                className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-[#fafafa] px-3 py-1.5 text-xs font-medium text-[#374151]"
              >
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: series.color }}
                />
                <span>{series.label}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sensitiveDataDistribution}
                layout="vertical"
                margin={{ top: 10, right: 12, left: 20, bottom: 0 }}
              >
                <CartesianGrid stroke="#ececec" vertical={false} strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}%`}
                  tick={{ fontSize: 12, fill: '#737373' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="cohort"
                  width={150}
                  tick={{ fontSize: 12, fill: '#525252' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip isAnimationActive={false} content={<SensitiveDataTooltip />} />
                {SENSITIVE_DATA_SERIES.map((series, index) => (
                  <Bar
                    key={series.key}
                    dataKey={series.key}
                    name={series.label}
                    stackId="sensitive-data"
                    fill={series.color}
                    radius={
                      index === SENSITIVE_DATA_SERIES.length - 1 ? [0, 8, 8, 0] : undefined
                    }
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </section>
        </>
      ) : null}

      {isMustKnowMode ? (
        <>
          <section id="org-where-gaps" className="mt-8 scroll-mt-24">
            <SectionHeader
              title="Usage vs Impact quadrant"
              subtitle="A quick read on whether AI usage is already translating into meaningful outcomes across departments and teams."
            />

            <UsageImpactQuadrantCard
              scope={usageImpactScope}
              onScopeChange={setUsageImpactScope}
              summary={usageImpactQuadrantSummary}
              data={usageImpactQuadrant}
            />
          </section>

          <section id="org-top-deviating" className="mt-8 scroll-mt-24">
            <SectionHeader
              title="Top deviating people"
              subtitle="Focus on the individuals who differ most from the organization pattern and may need support, follow-up, or closer review."
            />

            <TopDeviatingPeopleCard rows={deviatingPeopleRows} />
          </section>

          <section id="org-where-invest" className="mt-8 scroll-mt-24">
            <SectionHeader
              title="Suggested goals for the organization"
              subtitle="The most important next actions, ranked from organization-wide maturity scores, champion coverage, and the strongest friction signals."
            />

            {organizationSuggestedGoals.length > 0 ? (
              <div className="grid gap-4 xl:grid-cols-3">
                {organizationSuggestedGoals.map((goal) => (
                  <SuggestedGoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#d4d4d8] bg-[#fafafa] px-6 py-8 text-center text-sm text-[#7a7a7a]">
                No organization-level suggested goals are available yet.
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          <OrganizationDimensionImpactSection {...impactSectionProps} />

          <OrganizationDimensionCultureSection {...cultureSectionProps} />

          <OrganizationDimensionVisionSection {...visionSectionProps} />

          <section id="org-where-gaps" className="mt-8 scroll-mt-24">
            <SectionHeader
              title="Where are the gaps?"
              subtitle="Spot where AI usage outruns value, where practices remain fragile, and where teams need enablement, structure, or safer operating habits."
            />

            <div className="space-y-5">
              <UsageImpactQuadrantCard
                scope={usageImpactScope}
                onScopeChange={setUsageImpactScope}
                summary={usageImpactQuadrantSummary}
                data={usageImpactQuadrant}
              />

              <TopDeviatingPeopleCard rows={deviatingPeopleRows} />

              <div className="grid gap-5 xl:grid-cols-2">
                <ResistanceReasonsCard
                  data={blockerComparison}
                  businessColor={IMPACT_COHORT_COLORS.business}
                  deliveryColor={IMPACT_COHORT_COLORS.delivery}
                />
                <ResistanceByScopeCard
                  departmentRows={gapResistanceDepartmentRows}
                  teamRows={gapResistanceTeamRows}
                />
                <section className="group relative rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
                  <ChartFeedback chartTitle="Words used in blocker answers" page="organization" />
                  <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
                    Words used in blocker answers
                  </h3>
                  <p className="mt-1 text-sm text-[#7a7a7a]">
                    Literal words from the open-text answers to “What is the biggest thing stopping you
                    from using AI more in your work?”
                  </p>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-[#8b8b8b]">
                      {blockerOpenTextResponses.length} responses with blocker text
                    </div>
                    <div className="rounded-full border border-[#e5e7eb] bg-[#f5f5f5] px-3 py-1 text-xs font-medium text-[#525252]">
                      {blockerWordCloud.length} distinct words
                    </div>
                  </div>
                  <div className="mt-4 rounded-2xl border border-[#e5e7eb] bg-[#fafafa] p-4">
                    <MentionCloud
                      entries={blockerWordCloud}
                      accent="blue"
                      emptyLabel="No blocker words are available in the current view."
                    />
                  </div>
                </section>
                <SkillsConfidenceGapCard
                  departmentRows={gapSkillsConfidenceDepartmentRows}
                />
                <EmbeddednessSharedPracticesGapCard
                  departmentRows={gapEmbeddednessDepartmentRows}
                  teamRows={gapEmbeddednessTeamRows}
                />
                <ImpactWithoutResilienceCard
                  departmentRows={gapImpactWithoutResilienceDepartmentRows}
                  teamRows={gapImpactWithoutResilienceTeamRows}
                />
                <SupportDemandSkillsGapCard
                  departmentRows={gapSupportDemandDepartmentRows}
                  teamRows={gapSupportDemandTeamRows}
                />
                <SensitiveDataRiskPocketsCard
                  departmentRows={gapSensitiveDataDepartmentRows}
                  teamRows={gapSensitiveDataTeamRows}
                />
                <WorkflowTransformationGapCard
                  departmentRows={gapWorkflowTransformationDepartmentRows}
                  teamRows={gapWorkflowTransformationTeamRows}
                />
                <VisionToActionGapCard
                  departmentRows={gapVisionToActionDepartmentRows}
                  teamRows={gapVisionToActionTeamRows}
                />
                <CultureSpreadGapCard
                  departmentRows={gapCultureSpreadDepartmentRows}
                  teamRows={gapCultureSpreadTeamRows}
                />
                <MaturityVisibilityGapCard
                  departmentRows={gapMaturityVisibilityDepartmentRows}
                  teamRows={gapMaturityVisibilityTeamRows}
                />
              </div>
            </div>
          </section>

          <section id="org-where-invest" className="mt-8 scroll-mt-24">
            <SectionHeader
              title="Where should we invest?"
              subtitle="Translate survey outcomes into enablement priorities: role-specific training, licensing, and deeper workflow integration."
            />

            <div className="grid gap-5 xl:grid-cols-2">
              <SupportDemandSkillsGapCard
                departmentRows={gapSupportDemandDepartmentRows}
                teamRows={gapSupportDemandTeamRows}
              />
              <ToolAccessConstraintMapCard
                departmentRows={gapToolAccessDepartmentRows}
                teamRows={gapToolAccessTeamRows}
              />
              <RiskGovernanceHotspotsCard
                departmentRows={investmentRiskGovernanceDepartmentRows}
                teamRows={investmentRiskGovernanceTeamRows}
              />
            </div>

            {organizationSuggestedGoals.length > 0 ? (
              <div className="mt-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
                    Suggested goals for the organization
                  </h3>
                  <p className="mt-1 text-sm text-[#7a7a7a]">
                    Ranked from organization-wide maturity scores, champion coverage, and the strongest friction signals across departments.
                  </p>
                </div>

                <div className="grid gap-4 xl:grid-cols-3">
                  {organizationSuggestedGoals.map((goal) => (
                    <SuggestedGoalCard key={goal.id} goal={goal} />
                  ))}
                </div>
              </div>
            ) : null}
          </section>
        </>
      )}

      <AskAiSidebar
        isOpen={isAskAiOpen}
        onClose={() => setIsAskAiOpen(false)}
        scopeType="organization"
        scopeLabel="Organization AI analysis"
        scopeDescription="Ask follow-up questions about maturity patterns, benchmarks, hotspots, and where to invest next across the organization."
        threadKey="organization"
        buildResearchPack={getAiResearchPack}
        starterQuestions={askAiStarterQuestions}
      />

    </div>
  );
}
