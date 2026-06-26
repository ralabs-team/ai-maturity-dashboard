import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {

  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import AskAiSidebar, { AskAiTriggerButton } from '../components/ai/AskAiSidebar';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from '../components/charts/recharts';
import SuggestedGoalCard from '../components/goals/SuggestedGoalCard';
import { Tooltip, TooltipTrigger, TooltipContent } from '../components/ui/tooltip';
import { useSensitiveData } from '../components/privacy/SensitiveDataContext';
import PersonAvatar from '../components/ui/PersonAvatar';
import SensitiveText from '../components/ui/SensitiveText';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '../components/ui/collapsible';
import SearchableMultiSelect from '../components/ui/SearchableMultiSelect';
import PageHeader from '../components/layout/PageHeader';
import FloatingSectionNav from '../components/layout/FloatingSectionNav';
import { useNavigationPending } from '../components/layout/NavigationPendingContext';
import { useSurveyData } from '../data/survey/SurveyDataContext';
import {
  resolveIndividualArchetype,
  type IndividualArchetypeProfile,
} from '../data/survey/individualArchetypes';
import { buildIndividualSuggestedGoals } from '../data/survey/goals';
import { getQuestionsForSurveyType, type QuestionMeta } from '../data/survey/questions';
import { computeScores } from '../data/survey/scoring';
import { useTableSortPending } from '../hooks/useTableSortPending';
import {
  buildTeamValidatedView,
  type TeamValidatedSignal,
} from '../data/survey/teamValidatedView';
import type { Individual, TechDimension } from '../data/types';
import { TECH_DIMENSIONS, LEVEL_LABELS, scoreToLevel } from '../data/types';
import { MAX_DIMENSION_SCORE } from '../data/types';

type PersonMapDimension = TechDimension;
type SortKey = 'name' | 'level' | 'archetype' | PersonMapDimension | 'updated';
type SortDir = 'asc' | 'desc';
type PersonMapSeriesKey = 'person' | 'roleAverage' | 'teamAverage';

const INDIVIDUAL_DIMENSIONS: Array<{ key: PersonMapDimension; label: string }> = [
  { key: 'Usage', label: 'Dim1: Usage' },
  { key: 'Skills', label: 'Dim2: Skills' },
  { key: 'Impact', label: 'Dim3: Impact' },
  { key: 'Culture', label: 'Dim4: Culture' },
  { key: 'Vision', label: 'Dim5: Vision' },
];

const PERSON_META_MAX_LENGTH = 25;

const INDIVIDUAL_NAME_GROUPS = [
  { key: 'a-f', label: 'A-F', start: 'A', end: 'F' },
  { key: 'g-j', label: 'G-J', start: 'G', end: 'J' },
  { key: 'k-n', label: 'K-N', start: 'K', end: 'N' },
  { key: 'o-q', label: 'O-Q', start: 'O', end: 'Q' },
  { key: 'r-t', label: 'R-T', start: 'R', end: 'T' },
  { key: 'u-w', label: 'U-W', start: 'U', end: 'W' },
  { key: 'x-z', label: 'X-Z', start: 'X', end: 'Z' },
] as const;

const INDIVIDUAL_LEVEL_GROUPS = [
  { key: 1, label: 'L1' },
  { key: 2, label: 'L2' },
  { key: 3, label: 'L3' },
  { key: 4, label: 'L4' },
  { key: 5, label: 'L5' },
] as const;

function individualNameGroupKey(name: string): (typeof INDIVIDUAL_NAME_GROUPS)[number]['key'] | null {
  const firstLetter = name.trim().charAt(0).toUpperCase();

  if (!firstLetter || firstLetter < 'A' || firstLetter > 'Z') {
    return null;
  }

  const group = INDIVIDUAL_NAME_GROUPS.find(
    (item) => firstLetter >= item.start && firstLetter <= item.end,
  );

  return group?.key ?? null;
}

function splitNameParts(name: string): { firstName: string; remainder: string } {
  const trimmedName = name.trim();
  const firstSpaceIndex = trimmedName.indexOf(' ');

  if (firstSpaceIndex === -1) {
    return { firstName: trimmedName, remainder: '' };
  }

  return {
    firstName: trimmedName.slice(0, firstSpaceIndex),
    remainder: trimmedName.slice(firstSpaceIndex),
  };
}

function truncatePersonMeta(value: string, maxLength = PERSON_META_MAX_LENGTH): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 3)}...`;
}

function PersonMetaValue({ value }: { value: string }) {
  const truncated = truncatePersonMeta(value);
  if (truncated === value) return <>{value}</>;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help">{truncated}</span>
      </TooltipTrigger>
      <TooltipContent>{value}</TooltipContent>
    </Tooltip>
  );
}

function PersonNameText({
  name,
  hideSurname = false,
  className = 'truncate font-medium',
}: {
  name: string;
  hideSurname?: boolean;
  className?: string;
}) {
  if (hideSurname) {
    return (
      <SensitiveText as="div" hidden className={className}>
        {name || 'Unknown'}
      </SensitiveText>
    );
  }

  const { firstName, remainder } = splitNameParts(name);

  return (
    <div title={hideSurname ? undefined : name} className={className}>
      <span>{firstName || 'Unknown'}</span>
      {remainder ? <span>{remainder}</span> : null}
    </div>
  );
}

function areStringArraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return left.every((value, index) => value === right[index]);
}

function getSortValue(person: Individual, key: SortKey): number | string {
  switch (key) {
    case 'name':
      return person.name.toLowerCase();
    case 'level':
      return person.overallLevel;
    case 'updated':
      return new Date(person.lastUpdated).getTime();
    default:
      return person.scores[key as TechDimension];
  }
}

function roundToOne(value: number): number {
  return Number(value.toFixed(1));
}

function averageDimensionScores(members: Individual[]): Record<TechDimension, number> {
  const averages = {} as Record<TechDimension, number>;

  for (const dimension of TECH_DIMENSIONS) {
    averages[dimension] =
      members.reduce((sum, member) => sum + member.scores[dimension], 0) / members.length;
  }

  return averages;
}

function formatSignedDelta(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}`;
}

function alignmentGapSummary(gap: number | null): string {
  if (gap === null) return 'Not enough data yet';
  if (gap >= 0.8) return 'Self-rating is running well above team reality';
  if (gap >= 0.4) return 'Self-rating is somewhat above team reality';
  if (gap <= -0.8) return 'Team signal is stronger than the self-rating';
  if (gap <= -0.4) return 'Team signal is slightly stronger than the self-rating';
  return 'Self-rating and team signal are broadly aligned';
}

function proxyAvailabilityNote(peerRespondentCount: number, teamClimateScore: number | null): string {
  if (peerRespondentCount === 0) {
    return 'No team-peer responses were found, so this proxy is currently driven only by the respondent’s own spread-of-practice signals.';
  }

  if (teamClimateScore === null) {
    return 'Team-peer responses exist, but not enough team-climate answers were available to validate the surrounding environment yet.';
  }

  return 'This is a proxy built from existing survey signals, not direct peer ratings.';
}

function scoreTrackClass(score: number | null): string {
  if (score === null) return 'bg-[#e5e7eb]';
  if (score >= 4) return 'bg-[#0f766e]';
  if (score >= 3) return 'bg-[#2563eb]';
  if (score >= 2) return 'bg-[#d97706]';
  return 'bg-[#dc2626]';
}

function formatScoreValue(score: number | null): string {
  return score === null ? 'N/A' : `${score.toFixed(1)} / 5`;
}

function SortHeader({
  label,
  sortKey,
  currentKey,
  currentDir,
  isPending,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentKey: SortKey | null;
  currentDir: SortDir;
  isPending: boolean;
  onSort: (key: SortKey) => void;
}) {
  const isActive = currentKey === sortKey;
  return (
    <th className="px-4 py-3 font-medium">
      <button
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 hover:text-[#242424] transition-colors"
      >
        {label}
        {isPending && isActive ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : isActive ? (
          currentDir === 'asc' ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-40" />
        )}
      </button>
    </th>
  );
}

function TeamAvatar({ name, className = 'h-5 w-5' }: { name: string; className?: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2);
  return (
    <div className={`${className} rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shrink-0 select-none`}>
      <span className="text-white text-[8px] font-medium leading-none">{initials}</span>
    </div>
  );
}

function LevelBadge({
  level,
  maxWidthClassName = 'max-w-[9rem]',
}: {
  level: Individual['overallLevel'];
  maxWidthClassName?: string;
}) {
  const styles: Record<number, string> = {
    1: 'bg-[#f4f4f5] text-[#b0b0b0]',
    2: 'bg-[#eaeaea] text-[#737373]',
    3: 'bg-[#d4d4d4] text-[#404040]',
    4: 'bg-[#a3a3a3] text-[#ffffff]',
    5: 'bg-[#525252] text-[#ffffff]',
  };
  const fullLabel = `L${level} ${LEVEL_LABELS[level]}`;

  return (
    <span
      title={fullLabel}
      className={`inline-flex items-center gap-1 overflow-hidden rounded-md px-2.5 py-1 text-xs font-medium ${maxWidthClassName} ${styles[level]}`}
    >
      <span className="shrink-0">{`L${level}`}</span>
      <span className="min-w-0 truncate">{LEVEL_LABELS[level]}</span>
    </span>
  );
}

function formatPersonTeams(person: Individual): string {
  if (person.allProjects.length === 0) return person.project;
  if (person.allProjects.length <= 2) return person.allProjects.join(', ');
  return `${person.allProjects.slice(0, 2).join(', ')} +${person.allProjects.length - 2}`;
}

function QuestionScoreBadge({ score }: { score: number | 'SKIP' | undefined }) {
  if (score === undefined) {
    return (
      <span className="ml-auto shrink-0 rounded-md bg-[#f4f4f5] px-2 py-0.5 text-[10px] font-medium text-[#8b8b8b]">
        N/A
      </span>
    );
  }

  if (score === 'SKIP') {
    return (
      <span className="ml-auto shrink-0 rounded-md bg-[#f4f4f5] px-2 py-0.5 text-[10px] font-medium text-[#8b8b8b]">
        SKIP
      </span>
    );
  }

  const tone =
    score >= 4
      ? 'bg-[#dcfce7] text-[#166534]'
      : score >= 3
      ? 'bg-[#d1fae5] text-[#0f766e]'
      : score >= 2
      ? 'bg-[#fef3c7] text-[#92400e]'
      : score >= 1
      ? 'bg-[#fee2e2] text-[#b91c1c]'
      : 'bg-[#e5e7eb] text-[#4b5563]';

  return (
    <span className={`ml-auto shrink-0 rounded-md px-2 py-0.5 text-[10px] font-medium ${tone}`}>
      {score.toFixed(0)} / 5
    </span>
  );
}

function TeamValidatedSignalRow({ signal }: { signal: TeamValidatedSignal }) {
  const width =
    typeof signal.score === 'number'
      ? `${Math.max(0, Math.min(100, (signal.score / MAX_DIMENSION_SCORE) * 100))}%`
      : '0%';
  const responseLabel =
    typeof signal.score === 'number'
      ? signal.respondentCount === 1
        ? '1 response'
        : `${signal.respondentCount} responses`
      : 'No usable answer';

  return (
    <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-medium text-[#242424]">{signal.label}</div>
          <div className="mt-1 text-xs leading-5 text-[#6b7280]">{signal.description}</div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm font-semibold text-[#242424]">{formatScoreValue(signal.score)}</div>
          <div className="mt-1 text-[11px] text-[#8b8b8b]">{responseLabel}</div>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eef2f7]">
        <div
          className={`h-full rounded-full transition-[width] ${scoreTrackClass(signal.score)}`}
          style={{ width }}
        />
      </div>
    </div>
  );
}

export default function PeopleView() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { individuals, orgAvgScores, rawResponses } = useSurveyData();
  const { isSensitiveDataHidden } = useSensitiveData();
  const { clearPendingNavigation } = useNavigationPending();
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [nameQuery, setNameQuery] = useState(() => searchParams.get('name') ?? '');
  const [selectedTeams, setSelectedTeams] = useState<string[]>(() => searchParams.getAll('team'));
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(() =>
    searchParams.getAll('department'),
  );
  const [breakdownOpen, setBreakdownOpen] = useState(false);
  const [goalsOpen, setGoalsOpen] = useState(false);
  const [teamValidatedOpen, setTeamValidatedOpen] = useState(false);
  const [gapsOpen, setGapsOpen] = useState(false);
  const [answersOpen, setAnswersOpen] = useState(false);
  const [hiddenPersonMapSeries, setHiddenPersonMapSeries] = useState<PersonMapSeriesKey[]>([]);
  const [isPreparingAiResearchPack, setIsPreparingAiResearchPack] = useState(false);
  const [isAskAiOpen, setIsAskAiOpen] = useState(false);
  const { isTableSortPending, queueTableSort, clearTableSortPending } = useTableSortPending();
  const allProjectNames = useMemo(
    () => [...new Set(individuals.flatMap((individual) => individual.allProjects))].sort((a, b) => a.localeCompare(b)),
    [individuals],
  );
  const allDepartmentNames = useMemo(
    () =>
      [...new Set(individuals.flatMap((individual) => individual.allDepartments))].sort((a, b) =>
        a.localeCompare(b),
      ),
    [individuals],
  );
  const individualCountByProject = useMemo(() => {
    const counts = new Map<string, number>();

    for (const person of individuals) {
      for (const project of person.allProjects) {
        counts.set(project, (counts.get(project) ?? 0) + 1);
      }
    }

    return counts;
  }, [individuals]);
  const individualCountByDepartment = useMemo(() => {
    const counts = new Map<string, number>();

    for (const person of individuals) {
      for (const department of person.allDepartments) {
        counts.set(department, (counts.get(department) ?? 0) + 1);
      }
    }

    return counts;
  }, [individuals]);

  useEffect(() => {
    clearPendingNavigation('/people');
  }, [clearPendingNavigation]);

  useEffect(() => {
    if (isTableSortPending) {
      clearTableSortPending();
    }
  }, [clearTableSortPending, isTableSortPending, sortDir, sortKey]);

  // Reset all sections to collapsed whenever a new person is selected
  useEffect(() => {
    setBreakdownOpen(false);
    setGoalsOpen(false);
    setTeamValidatedOpen(false);
    setGapsOpen(false);
    setAnswersOpen(false);
    setHiddenPersonMapSeries([]);
  }, [selectedPersonId]);

  useEffect(() => {
    setSelectedTeams((current) =>
      current.filter((team) => allProjectNames.includes(team)),
    );
  }, [allProjectNames]);

  useEffect(() => {
    setSelectedDepartments((current) =>
      current.filter((department) => allDepartmentNames.includes(department)),
    );
  }, [allDepartmentNames]);

  useEffect(() => {
    if (!selectedPersonId) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedPersonId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedPersonId]);

  useEffect(() => {
    const nextNameQuery = searchParams.get('name') ?? '';
    const nextTeams = searchParams.getAll('team');
    const nextDepartments = searchParams.getAll('department');

    setNameQuery((current) => (current === nextNameQuery ? current : nextNameQuery));
    setSelectedTeams((current) => (areStringArraysEqual(current, nextTeams) ? current : nextTeams));
    setSelectedDepartments((current) =>
      areStringArraysEqual(current, nextDepartments) ? current : nextDepartments,
    );
  }, [searchParams]);

  useEffect(() => {
    const nextSearchParams = new URLSearchParams();
    const normalizedNameQuery = nameQuery.trim();

    if (normalizedNameQuery) {
      nextSearchParams.set('name', normalizedNameQuery);
    }

    selectedDepartments.forEach((department) => {
      nextSearchParams.append('department', department);
    });

    selectedTeams.forEach((team) => {
      nextSearchParams.append('team', team);
    });

    const nextSerializedParams = nextSearchParams.toString();
    const currentSerializedParams = searchParams.toString();

    if (nextSerializedParams !== currentSerializedParams) {
      setSearchParams(nextSearchParams, { replace: true });
    }
  }, [
    nameQuery,
    searchParams,
    selectedDepartments,
    selectedTeams,
    setSearchParams,
  ]);

  useEffect(() => {
    if (selectedPersonId && !individuals.some((person) => person.id === selectedPersonId)) {
      setSelectedPersonId(null);
    }
  }, [individuals, selectedPersonId]);

  const initialSortDirForKey = (key: SortKey): SortDir => (key === 'name' ? 'asc' : 'desc');

  const handleSort = (key: SortKey) => {
    queueTableSort(() => {
      if (sortKey !== key) {
        setSortKey(key);
        setSortDir(initialSortDirForKey(key));
        return;
      }

      if (sortDir === initialSortDirForKey(key)) {
        setSortDir((current) => (current === 'asc' ? 'desc' : 'asc'));
        return;
      }

      setSortKey(null);
      setSortDir('asc');
    });
  };

  const toggleTeam = (team: string) => {
    setSelectedTeams((prev) =>
      prev.includes(team) ? prev.filter((t) => t !== team) : [...prev, team],
    );
  };

  const toggleDepartment = (department: string) => {
    setSelectedDepartments((prev) =>
      prev.includes(department)
        ? prev.filter((currentDepartment) => currentDepartment !== department)
        : [...prev, department],
    );
  };

  const removeTeam = (team: string) => {
    setSelectedTeams((prev) => prev.filter((t) => t !== team));
  };

  const removeDepartment = (department: string) => {
    setSelectedDepartments((prev) =>
      prev.filter((currentDepartment) => currentDepartment !== department),
    );
  };

  const personArchetypeById = useMemo(
    () =>
      Object.fromEntries(
        individuals.map((person) => [person.id, resolveIndividualArchetype(person.scores)]),
      ) as Record<string, IndividualArchetypeProfile>,
    [individuals],
  );

  const sorted = useMemo(() => {
    let filtered = individuals;
    const normalizedNameQuery = nameQuery.trim().toLowerCase();

    if (normalizedNameQuery) {
      filtered = filtered.filter((person) =>
        person.name.toLowerCase().includes(normalizedNameQuery),
      );
    }

    if (selectedTeams.length > 0) {
      filtered = filtered.filter((i) =>
        i.allProjects.some((project) => selectedTeams.includes(project)),
      );
    }

    if (selectedDepartments.length > 0) {
      filtered = filtered.filter((person) =>
        person.allDepartments.some((department) => selectedDepartments.includes(department)),
      );
    }

    const resolvedSortKey = sortKey ?? 'name';
    const resolvedSortDir = sortKey === null ? 'asc' : sortDir;
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av =
        resolvedSortKey === 'archetype'
          ? personArchetypeById[a.id]?.label ?? ''
          : getSortValue(a, resolvedSortKey);
      const bv =
        resolvedSortKey === 'archetype'
          ? personArchetypeById[b.id]?.label ?? ''
          : getSortValue(b, resolvedSortKey);
      let cmp = 0;
      if (typeof av === 'string' && typeof bv === 'string') {
        cmp = av.localeCompare(bv);
      } else {
        cmp = (av as number) - (bv as number);
      }
      return resolvedSortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [
    individuals,
    nameQuery,
    personArchetypeById,
    selectedDepartments,
    sortKey,
    sortDir,
    selectedTeams,
  ]);

  const firstPersonAnchorByGroup = useMemo(() => {
    const anchors = new Map<string, { personId: string; anchorId: string }>();

    for (const person of sorted) {
      const groupKey = individualNameGroupKey(person.name);

      if (!groupKey || anchors.has(groupKey)) {
        continue;
      }

      anchors.set(groupKey, {
        personId: person.id,
        anchorId: `individual-group-${groupKey}`,
      });
    }

    return anchors;
  }, [sorted]);

  const individualLetterNavItems = useMemo(
    () =>
      INDIVIDUAL_NAME_GROUPS.flatMap((group) => {
        const anchor = firstPersonAnchorByGroup.get(group.key);

        return anchor ? [{ id: anchor.anchorId, label: group.label }] : [];
      }),
    [firstPersonAnchorByGroup],
  );

  const firstPersonAnchorByLevel = useMemo(() => {
    const anchors = new Map<number, { personId: string; anchorId: string }>();

    for (const person of sorted) {
      const level = person.overallLevel;

      if (anchors.has(level)) {
        continue;
      }

      anchors.set(level, {
        personId: person.id,
        anchorId: `individual-level-${level}`,
      });
    }

    return anchors;
  }, [sorted]);

  const individualLevelNavItems = useMemo(
    () => {
      const orderedGroups =
        sortDir === 'desc' ? [...INDIVIDUAL_LEVEL_GROUPS].reverse() : INDIVIDUAL_LEVEL_GROUPS;

      return orderedGroups.flatMap((group) => {
        const anchor = firstPersonAnchorByLevel.get(group.key);

        return anchor
          ? [{ id: anchor.anchorId, label: `${group.label} ${LEVEL_LABELS[group.key]}` }]
          : [];
      });
    },
    [firstPersonAnchorByLevel, sortDir],
  );

  const individualNavItems = useMemo(() => {
    if (sortKey === null || (sortKey === 'name' && sortDir === 'asc')) {
      return individualLetterNavItems;
    }

    if (sortKey === 'level') {
      return individualLevelNavItems;
    }

    return [];
  }, [individualLetterNavItems, individualLevelNavItems, sortDir, sortKey]);

  const selectedPerson = selectedPersonId
    ? individuals.find((i) => i.id === selectedPersonId)
    : null;
  const personColor = '#14b8a6';
  const personMapStrokeWidth = 2;
  const personMapFillOpacity = 0;
  const roleBenchmarkColor = '#94a3b8';
  const teamBenchmarkColor = '#2563eb';
  const selectedPersonResponse = useMemo(
    () =>
      selectedPerson
        ? rawResponses.find((response) => response.username.split('@')[0] === selectedPerson.id) ?? null
        : null,
    [rawResponses, selectedPerson],
  );
  const selectedPersonScoredResponse = useMemo(
    () => (selectedPersonResponse ? computeScores(selectedPersonResponse) : null),
    [selectedPersonResponse],
  );
  const selectedPersonRolePeers = useMemo(
    () =>
      selectedPerson
        ? individuals.filter(
            (person) => person.id !== selectedPerson.id && person.role === selectedPerson.role,
          )
        : [],
    [individuals, selectedPerson],
  );
  const selectedPersonTeamScopeNames = useMemo(
    () =>
      selectedPerson
        ? selectedPerson.allProjects
            .map((project) => project.trim())
            .filter((project) => project && project.toLowerCase() !== 'n/a')
        : [],
    [selectedPerson],
  );
  const selectedPersonTeamCohort = useMemo(() => {
    if (!selectedPerson || selectedPersonTeamScopeNames.length === 0) {
      return [];
    }

    const teamSet = new Set(selectedPersonTeamScopeNames);

    return individuals.filter((person) =>
      person.allProjects.some((project) => teamSet.has(project.trim())),
    );
  }, [individuals, selectedPerson, selectedPersonTeamScopeNames]);
  const selectedPersonTeamPeers = useMemo(
    () =>
      selectedPersonTeamCohort.filter((person) =>
        selectedPerson ? person.id !== selectedPerson.id : true,
      ),
    [selectedPerson, selectedPersonTeamCohort],
  );
  const selectedPersonTeamPeerResponses = useMemo(() => {
    if (selectedPersonTeamPeers.length === 0) {
      return [];
    }

    const peerIds = new Set(selectedPersonTeamPeers.map((person) => person.id));

    return rawResponses.filter((response) => peerIds.has(response.username.split('@')[0]));
  }, [rawResponses, selectedPersonTeamPeers]);
  const roleBenchmarkLabel = selectedPerson
    ? `Avg ${selectedPerson.role} peers`
    : 'Avg same role';
  const teamBenchmarkLabel = 'Avg current team(s)';
  const handlePersonSelection = (person: Individual, isSelected: boolean) => {
    if (isSelected) {
      setSelectedPersonId(null);
      return;
    }

    setSelectedPersonId(person.id);
  };
  const roleAverageScores = useMemo(
    () =>
      selectedPersonRolePeers.length > 0
        ? averageDimensionScores(selectedPersonRolePeers)
        : null,
    [selectedPersonRolePeers],
  );
  const teamAverageScores = useMemo(
    () =>
      selectedPersonTeamPeers.length > 0
        ? averageDimensionScores(selectedPersonTeamPeers)
        : null,
    [selectedPersonTeamPeers],
  );
  const teamValidatedView = useMemo(
    () =>
      selectedPersonResponse
        ? buildTeamValidatedView(selectedPersonResponse, selectedPersonTeamPeerResponses)
        : null,
    [selectedPersonResponse, selectedPersonTeamPeerResponses],
  );
  const selectedPersonArchetype = useMemo<IndividualArchetypeProfile | null>(
    () => (selectedPerson ? resolveIndividualArchetype(selectedPerson.scores) : null),
    [selectedPerson],
  );
  const personMapData = useMemo(
    () =>
      selectedPerson
        ? TECH_DIMENSIONS.map((dimension) => ({
            dimension,
            you: selectedPerson.scores[dimension],
            roleAverage: roleAverageScores?.[dimension],
            teamAverage: teamAverageScores?.[dimension],
          }))
        : [],
    [roleAverageScores, selectedPerson, teamAverageScores],
  );
  const personMapSeriesMeta = useMemo<
    Record<PersonMapSeriesKey, { color: string; label: string }>
  >(
    () => ({
      person: {
        color: personColor,
        label: 'This respondent',
      },
      roleAverage: {
        color: roleBenchmarkColor,
        label: `${roleBenchmarkLabel}${roleAverageScores ? ` (${selectedPersonRolePeers.length})` : ' unavailable'}`,
      },
      teamAverage: {
        color: teamBenchmarkColor,
        label: `${teamBenchmarkLabel}${teamAverageScores ? ` (${selectedPersonTeamPeers.length})` : ' unavailable'}`,
      },
    }),
    [
      personColor,
      roleAverageScores,
      roleBenchmarkColor,
      roleBenchmarkLabel,
      selectedPersonRolePeers.length,
      selectedPersonTeamPeers.length,
      teamAverageScores,
      teamBenchmarkColor,
      teamBenchmarkLabel,
    ],
  );
  const visiblePersonMapSeries = useMemo(
    () =>
      (Object.keys(personMapSeriesMeta) as PersonMapSeriesKey[]).filter(
        (key) => !hiddenPersonMapSeries.includes(key),
      ),
    [hiddenPersonMapSeries, personMapSeriesMeta],
  );
  const biggestGaps = useMemo(() => {
    if (!selectedPerson) {
      return [];
    }

    const benchmarks = [
      {
        label: 'Org average',
        respondentCount: individuals.length,
        scores: orgAvgScores,
      },
      ...(roleAverageScores
        ? [
            {
              label: roleBenchmarkLabel,
              respondentCount: selectedPersonRolePeers.length,
              scores: roleAverageScores,
            },
          ]
        : []),
      ...(teamAverageScores
        ? [
            {
              label: teamBenchmarkLabel,
              respondentCount: selectedPersonTeamPeers.length,
              scores: teamAverageScores,
            },
          ]
        : []),
    ];

    return TECH_DIMENSIONS.flatMap((dimension) =>
      benchmarks.map((benchmark) => ({
        dimension,
        benchmarkLabel: benchmark.label,
        respondentCount: benchmark.respondentCount,
        personScore: selectedPerson.scores[dimension],
        benchmarkScore: benchmark.scores[dimension],
        delta: roundToOne(selectedPerson.scores[dimension] - benchmark.scores[dimension]),
      })),
    )
      .filter((row) => row.delta < 0)
      .sort(
        (left, right) =>
          left.delta - right.delta || left.dimension.localeCompare(right.dimension),
      )
      .slice(0, 3);
  }, [
    individuals.length,
    orgAvgScores,
    roleAverageScores,
    roleBenchmarkLabel,
    selectedPerson,
    selectedPersonRolePeers.length,
    selectedPersonTeamPeers.length,
    teamAverageScores,
  ]);
  const selectedPersonSuggestedGoals = useMemo(
    () =>
      selectedPerson
        ? buildIndividualSuggestedGoals({
            person: selectedPerson,
            orgAvgScores,
            roleAverageScores,
            teamAverageScores,
          })
        : [],
    [orgAvgScores, roleAverageScores, selectedPerson, teamAverageScores],
  );

  const hasSelection = !!selectedPerson;

  const getIndividualAiResearchPack = async () => {
    if (!selectedPerson || !selectedPersonResponse) {
      throw new Error('No respondent is selected.');
    }

    const { buildIndividualAiResearchPack } = await import('../data/survey/individualAiResearchPack');

    return buildIndividualAiResearchPack({
      person: selectedPerson,
      rawResponse: selectedPersonResponse,
      orgBenchmark: {
        label: 'Org average',
        respondentCount: individuals.length,
        scores: orgAvgScores,
      },
      roleBenchmark: roleAverageScores
        ? {
            label: roleBenchmarkLabel,
            respondentCount: selectedPersonRolePeers.length,
            scores: roleAverageScores,
          }
        : null,
      teamBenchmark: teamAverageScores
        ? {
            label: teamBenchmarkLabel,
            respondentCount: selectedPersonTeamPeers.length,
            scores: teamAverageScores,
          }
        : null,
      teamNames: selectedPersonTeamScopeNames,
    });
  };

  const visibleAskAiName =
    selectedPerson && !isSensitiveDataHidden ? selectedPerson.name : 'this respondent';

  const askAiStarterQuestions = selectedPerson
    ? [
        `What stands out most about ${visibleAskAiName}?`,
        'Where is this respondent below their benchmarks?',
        'What are the best next steps for this person?',
      ]
    : [
        'What stands out most about this respondent?',
        'Where is this respondent below their benchmarks?',
        'What are the best next steps for this person?',
      ];

  const togglePersonMapSeries = (seriesKey: PersonMapSeriesKey) => {
    setHiddenPersonMapSeries((current) =>
      current.includes(seriesKey)
        ? current.filter((key) => key !== seriesKey)
        : [...current, seriesKey],
    );
  };

  const downloadIndividualAiResearchPack = async () => {
    if (!selectedPerson || !selectedPersonResponse) {
      return;
    }

    setIsPreparingAiResearchPack(true);

    try {
      const aiResearchPack = await getIndividualAiResearchPack();
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
      console.error('[individual] Failed to build AI research pack', error);
    } finally {
      setIsPreparingAiResearchPack(false);
    }
  };

  return (
    <div className="relative">
      {individualNavItems.length > 0 ? <FloatingSectionNav items={individualNavItems} showItemLabels /> : null}

      <PageHeader
        title="Individual Results"
        subtitle="Select a person to see their AI adoption maturity profile"
        badge={individuals.length}
        titleClassName="text-[1.6rem] font-bold tracking-tight text-[#242424] md:text-[1.75rem]"
        subtitleClassName="mb-6 text-sm text-[#8b8b8b]"
      />

      {/* Filter row */}
      <div className="mb-4 flex items-center gap-3">
        <input
          type="search"
          value={nameQuery}
          onChange={(event) => setNameQuery(event.target.value)}
          placeholder="Search by name"
          className="w-full max-w-[260px] rounded-md border border-[#eaeaea] bg-white px-3 py-2 text-sm text-[#242424] outline-none transition-colors placeholder:text-[#a3a3a3] focus:border-[#b0b0b0]"
        />

        {/* Active filter badges */}
        {(selectedTeams.length > 0 || selectedDepartments.length > 0 || nameQuery.trim()) && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-sm font-medium text-[#8b8b8b] mr-2">Filters:</span>
            {nameQuery.trim() && (
              <span className="inline-flex items-center gap-1.5 px-2 py-1 text-sm font-normal rounded-md border border-transparent bg-[#f4f4f5] text-[#242424]">
                Name: {nameQuery.trim()}
                <button
                  className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-[#b0b0b0] focus:ring-offset-2"
                  onClick={() => setNameQuery('')}
                >
                  <X className="h-3 w-3 text-[#8b8b8b] hover:text-[#242424]" />
                </button>
              </span>
            )}
            {selectedDepartments.map((department) => (
              <span
                key={department}
                className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 text-sm font-normal rounded-md border border-transparent bg-[#f4f4f5] text-[#242424]"
              >
                <SensitiveText as="span" hidden={isSensitiveDataHidden}>
                  {department}
                </SensitiveText>
                <button
                  className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-[#b0b0b0] focus:ring-offset-2"
                  onClick={() => removeDepartment(department)}
                >
                  <X className="h-3 w-3 text-[#8b8b8b] hover:text-[#242424]" />
                </button>
              </span>
            ))}
            {selectedTeams.map((team) => (
              <span
                key={team}
                className="inline-flex items-center gap-1.5 pl-1.5 pr-1 py-1 text-sm font-normal rounded-md border border-transparent bg-[#f4f4f5] text-[#242424]"
              >
                <TeamAvatar name={team} className="h-5 w-5" />
                <SensitiveText as="span" hidden={isSensitiveDataHidden}>
                  {team}
                </SensitiveText>
                <button
                  className="ml-1 rounded-full outline-none focus:ring-2 focus:ring-[#b0b0b0] focus:ring-offset-2"
                  onClick={() => removeTeam(team)}
                >
                  <X className="h-3 w-3 text-[#8b8b8b] hover:text-[#242424]" />
                </button>
              </span>
            ))}
            <button
              onClick={() => {
                setSelectedTeams([]);
                setSelectedDepartments([]);
                setNameQuery('');
              }}
              className="text-xs text-[#8b8b8b] hover:text-[#242424] px-2 h-6 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Filter dropdowns — pushed to the right */}
        <div className="ml-auto flex items-center gap-2">
          <SearchableMultiSelect
            placeholder="Filter by department"
            singularLabel="department"
            pluralLabel="departments"
            searchPlaceholder="Search departments..."
            ariaLabel="Filter individuals by department"
            options={allDepartmentNames}
            selectedValues={selectedDepartments}
            onToggle={toggleDepartment}
            onClear={() => setSelectedDepartments([])}
            containerClassName="relative"
            triggerClassName="inline-flex items-center gap-2 rounded-md border border-[#eaeaea] bg-white px-3 py-2 text-sm text-[#242424] shadow-xs outline-none transition-[color,box-shadow,border-color] hover:bg-[#fafafa] focus-visible:border-[#b0b0b0] focus-visible:ring-[3px] focus-visible:ring-[#b0b0b0]/40"
            dropdownClassName="absolute right-0 top-full z-20 mt-1 w-[240px] rounded-md border border-[#eaeaea] bg-white p-2 shadow-lg"
            searchInputClassName="h-10 w-full rounded-md border border-[#eaeaea] bg-white px-3 text-sm text-[#242424] outline-none transition-colors placeholder:text-[#a3a3a3] focus:border-[#b0b0b0] focus-visible:ring-[3px] focus-visible:ring-[#b0b0b0]/30"
            clearButtonClassName="text-xs text-[#8b8b8b] transition-colors hover:text-[#242424]"
            renderOptionTrailing={(name) => (
              <span className="ml-auto text-xs text-[#8b8b8b]">
                {individualCountByDepartment.get(name) ?? 0}
              </span>
            )}
          />

          <SearchableMultiSelect
            placeholder="Filter by team"
            singularLabel="team"
            pluralLabel="teams"
            searchPlaceholder="Search teams..."
            ariaLabel="Filter individuals by team"
            options={allProjectNames}
            selectedValues={selectedTeams}
            onToggle={toggleTeam}
            onClear={() => setSelectedTeams([])}
            containerClassName="relative"
            triggerClassName="inline-flex items-center gap-2 rounded-md border border-[#eaeaea] bg-white px-3 py-2 text-sm text-[#242424] shadow-xs outline-none transition-[color,box-shadow,border-color] hover:bg-[#fafafa] focus-visible:border-[#b0b0b0] focus-visible:ring-[3px] focus-visible:ring-[#b0b0b0]/40"
            dropdownClassName="absolute right-0 top-full z-20 mt-1 w-[260px] rounded-md border border-[#eaeaea] bg-white p-2 shadow-lg"
            searchInputClassName="h-10 w-full rounded-md border border-[#eaeaea] bg-white px-3 text-sm text-[#242424] outline-none transition-colors placeholder:text-[#a3a3a3] focus:border-[#b0b0b0] focus-visible:ring-[3px] focus-visible:ring-[#b0b0b0]/30"
            clearButtonClassName="text-xs text-[#8b8b8b] transition-colors hover:text-[#242424]"
            renderOptionLeading={(name) => <TeamAvatar name={name} className="h-5 w-5" />}
            renderOptionLabel={(name) => (
              <SensitiveText
                as="span"
                hidden={isSensitiveDataHidden}
                className="min-w-0 flex-1 truncate"
              >
                {name}
              </SensitiveText>
            )}
            renderOptionTrailing={(name) => (
              <span className="ml-auto text-xs text-[#8b8b8b]">
                {individualCountByProject.get(name) ?? 0}
              </span>
            )}
          />
        </div>
      </div>

      {/* People list */}
      <div className="mb-6 rounded-xl border border-[#eaeaea] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#eaeaea] text-left text-xs text-[#8b8b8b]">
                <th className="px-4 py-3 font-medium">Name</th>
                <SortHeader label="Level" sortKey="level" currentKey={sortKey} currentDir={sortDir} isPending={isTableSortPending} onSort={handleSort} />
                <SortHeader label="Archetype" sortKey="archetype" currentKey={sortKey} currentDir={sortDir} isPending={isTableSortPending} onSort={handleSort} />
                {INDIVIDUAL_DIMENSIONS.map((dim) => (
                  <SortHeader key={dim.key} label={dim.label} sortKey={dim.key} currentKey={sortKey} currentDir={sortDir} isPending={isTableSortPending} onSort={handleSort} />
                ))}
                <SortHeader label="Updated" sortKey="updated" currentKey={sortKey} currentDir={sortDir} isPending={isTableSortPending} onSort={handleSort} />
              </tr>
            </thead>
            <tbody>
              {sorted.map((person) => {
                const isSelected = selectedPersonId === person.id;
                const lvl = person.overallLevel;
                const archetype = personArchetypeById[person.id];
                const groupKey = individualNameGroupKey(person.name);
                const groupAnchorId =
                  groupKey && firstPersonAnchorByGroup.get(groupKey)?.personId === person.id
                    ? firstPersonAnchorByGroup.get(groupKey)?.anchorId
                    : undefined;
                const levelAnchorId =
                  firstPersonAnchorByLevel.get(person.overallLevel)?.personId === person.id
                    ? firstPersonAnchorByLevel.get(person.overallLevel)?.anchorId
                    : undefined;
                const rowAnchorId =
                  sortKey === null || (sortKey === 'name' && sortDir === 'asc')
                    ? groupAnchorId
                    : sortKey === 'level'
                      ? levelAnchorId
                      : undefined;
                return (
                  <tr
                    key={person.id}
                    id={rowAnchorId}
                    onClick={() => handlePersonSelection(person, isSelected)}
                    className={`cursor-pointer border-b border-[#eaeaea] last:border-b-0 transition-colors ${
                      isSelected
                        ? 'bg-[#f4f4f5]'
                        : 'hover:bg-[#fafafa]'
                    } ${rowAnchorId ? 'scroll-mt-24' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <PersonAvatar
                          name={person.name}
                          className="h-8 w-8"
                          textClassName="text-xs"
                          hidden={isSensitiveDataHidden}
                        />
                        <div className="min-w-0">
                          <PersonNameText
                            name={person.name}
                            hideSurname={isSensitiveDataHidden}
                            className="truncate font-medium"
                          />
                          <div className="text-sm text-[#8b8b8b]">
                          <PersonMetaValue value={person.seniority} /> &middot; <PersonMetaValue value={person.role} /> &middot;{' '}
                            <PersonMetaValue value={person.department} />
                          </div>
                          <SensitiveText
                            as="div"
                            hidden={isSensitiveDataHidden}
                            className="truncate text-xs text-[#a3a3a3]"
                            title={`${person.allProjects.join(', ')}`}
                          >
                            {formatPersonTeams(person)}
                          </SensitiveText>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <LevelBadge level={lvl} />
                    </td>
                    <td className="px-4 py-3 text-sm text-[#242424]">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex max-w-full items-center rounded-full border border-[#dbe6ff] bg-[#f5f8ff] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
                            <span className="truncate">{archetype.label}</span>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={8} className="max-w-[280px] px-3 py-2 text-[12px] leading-relaxed">
                          <div className="font-medium text-white">{archetype.label}</div>
                          <div className="mt-1 text-white/80">{archetype.signal}</div>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    {INDIVIDUAL_DIMENSIONS.map((dim) => {
                      const score = person.scores[dim.key];
                      return (
                        <td key={dim.key} className="px-4 py-3 text-sm text-[#242424]">
                          {score.toFixed(1)} / {MAX_DIMENSION_SCORE}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-sm text-[#8b8b8b]">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-default">
                            {new Date(person.lastUpdated).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="text-xs">
                            {new Date(person.lastUpdated).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Person detail modal */}
      {selectedPerson && hasSelection && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50"
            onClick={() => setSelectedPersonId(null)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPersonId(null)}>
            <div
              className="bg-white rounded-xl shadow-lg border border-[#eaeaea] w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="flex items-center justify-between border-b border-[#eaeaea] px-6 py-4">
              <div className="flex items-center gap-3">
                  <PersonAvatar
                    name={selectedPerson.name}
                    className="h-10 w-10"
                    textClassName="text-sm"
                    hidden={isSensitiveDataHidden}
                  />
                  <div>
                    <PersonNameText
                      name={selectedPerson.name}
                      hideSurname={isSensitiveDataHidden}
                      className="text-lg font-semibold text-[#242424]"
                    />
                    <p className="text-sm text-[#8b8b8b]">{selectedPerson.seniority} &middot; {selectedPerson.role}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedPersonId(null)}
                  className="text-[#8b8b8b] hover:text-[#242424] transition-colors p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

	              {/* Modal body */}
	              <div className="px-6 py-5 flex flex-col gap-2 bg-[#fcfcfc]">
	                <section className="rounded-2xl border border-[#e5e7eb] bg-[linear-gradient(180deg,#fbfbfc_0%,#ffffff_100%)] p-5 shadow-sm">
	                  <div className="max-w-4xl">
	                      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8b8b8b]">
	                        Ask External AI
	                      </div>
	                      <h3 className="mt-2 text-lg font-semibold tracking-tight text-[#1f2937]">
	                        Download an{' '}
	                        <Tooltip>
	                          <TooltipTrigger asChild>
	                            <span className="cursor-help underline decoration-dotted underline-offset-4">
	                              anonymized
	                            </span>
	                          </TooltipTrigger>
	                          <TooltipContent side="top" sideOffset={8} className="max-w-[280px] px-3 py-2 text-[12px] leading-relaxed">
	                            This export removes direct personal identifiers and replaces team names with generic references.
	                          </TooltipContent>
	                        </Tooltip>{' '}
	                        research pack for ChatGPT or Claude
	                      </h3>
	                      <p className="mt-2 text-sm leading-6 text-[#667085]">
	                        Ask questions in the sidebar or download a markdown brief with this
	                        respondent&apos;s maturity profile, org and cohort benchmarks, strengths,
	                        growth areas, suggested actions, and question-level answers.
	                      </p>

	                    <div className="mt-4 flex flex-wrap gap-2">
	                      <AskAiTriggerButton
	                        onClick={() => setIsAskAiOpen(true)}
	                        disabled={!selectedPersonResponse}
	                      />

	                      <button
	                        type="button"
	                        onClick={downloadIndividualAiResearchPack}
	                        disabled={isPreparingAiResearchPack || !selectedPersonResponse}
	                        className="inline-flex h-11 cursor-pointer items-center justify-center rounded-2xl border border-[#d4d4d8] bg-[#f5f5f5] px-5 text-sm font-semibold text-[#3f3f46] transition hover:border-[#c4c4c7] hover:bg-[#ededee] focus:outline-none focus:ring-[3px] focus:ring-[#c7c7cc]/25 disabled:cursor-wait disabled:opacity-70"
	                      >
	                        {isPreparingAiResearchPack ? 'Preparing AI research pack...' : 'Download AI research pack'}
	                      </button>
	                    </div>
	                  </div>
	                </section>

                  <AskAiSidebar
                    isOpen={isAskAiOpen}
                    onClose={() => setIsAskAiOpen(false)}
                    scopeType="individual"
                    scopeLabel={
                      selectedPerson && !isSensitiveDataHidden
                        ? `${selectedPerson.name} analysis`
                        : 'Respondent analysis'
                    }
                    scopeDescription="Ask follow-up questions about this respondent's strengths, weak spots, benchmark gaps, and the most useful next actions."
                    avatarName={
                      selectedPerson && !isSensitiveDataHidden ? selectedPerson.name : undefined
                    }
                    threadKey={selectedPerson?.id ?? 'no-person'}
                    buildResearchPack={getIndividualAiResearchPack}
                    starterQuestions={askAiStarterQuestions}
                    disabled={!selectedPersonResponse}
                    disabledReason="Ask AI needs a selected respondent with response data."
                  />

	                {/* Person Maturity Map (collapsible) */}
	                <Collapsible open={breakdownOpen} onOpenChange={setBreakdownOpen} className="mt-3 mb-2">
                  <CollapsibleTrigger
                    className={`flex w-full items-center justify-between border border-[#eaeaea] bg-[#f4f4f5]/60 p-3 hover:bg-[#f4f4f5] transition-colors ${
                      breakdownOpen ? 'rounded-t-lg border-b-0' : 'rounded-lg'
                    }`}
                  >
                    <span className="font-medium text-[#242424]">Person Maturity Map</span>
                    <div className="flex items-center gap-2">
                      <LevelBadge level={selectedPerson.overallLevel} maxWidthClassName="max-w-[11rem]" />
                      {selectedPersonArchetype ? (
                        <span className="inline-flex max-w-[12rem] items-center rounded-full border border-[#dbe6ff] bg-[#f5f8ff] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
                          <span className="truncate">{selectedPersonArchetype.label}</span>
                        </span>
                      ) : null}
                      <ChevronDown
                        className={`h-4 w-4 text-[#8b8b8b] transition-transform ${breakdownOpen ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="rounded-b-lg border border-[#eaeaea] bg-white p-4">
                      {selectedPersonArchetype ? (
                        <div className="mb-4 rounded-2xl border border-[#1d4ed8]/20 bg-[linear-gradient(135deg,#0f766e_0%,#1d4ed8_100%)] p-4 text-white shadow-sm">
                          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/75">
                            Respondent archetype
                          </div>
                          <div className="mt-2 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                            <div className="inline-flex min-w-[16rem] items-center rounded-full border border-white/25 bg-white/15 px-6 py-1 text-sm font-semibold text-white shadow-sm backdrop-blur-sm">
                              {selectedPersonArchetype.label}
                            </div>
                            <p className="max-w-2xl text-sm text-white/85">
                              {selectedPersonArchetype.signal}
                            </p>
                          </div>
                        </div>
                      ) : null}
                      <div className="flex flex-wrap gap-2">
                        {(Object.keys(personMapSeriesMeta) as PersonMapSeriesKey[]).map((seriesKey) => {
                          const series = personMapSeriesMeta[seriesKey];
                          const isHidden = hiddenPersonMapSeries.includes(seriesKey);

                          return (
                            <Tooltip key={seriesKey}>
                              <TooltipTrigger asChild>
                                <button
                                  type="button"
                                  onClick={() => togglePersonMapSeries(seriesKey)}
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
                              <TooltipContent side="top" sideOffset={8} className="px-3 py-2 text-[11px] leading-relaxed">
                                <div className="font-medium text-white">{series.label}</div>
                                <div className="mt-1 text-white/80">
                                  Click to {isHidden ? 'show' : 'hide'} this comparison series.
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                      <div className="h-[340px]">
                        {visiblePersonMapSeries.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={personMapData} outerRadius="70%">
                              <PolarGrid stroke="rgb(229,229,229)" />
                              <PolarAngleAxis
                                dataKey="dimension"
                                tick={{ fontSize: 12, fill: '#737373' }}
                              />
                              <PolarRadiusAxis
                                domain={[1, MAX_DIMENSION_SCORE]}
                                ticks={Array.from({ length: MAX_DIMENSION_SCORE }, (_, idx) => idx + 1)}
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
                                labelStyle={{ color: '#ffffff', fontWeight: 600, marginBottom: 2 }}
                                itemStyle={{ color: '#ffffff' }}
                                formatter={(value, name) => {
                                  const num = Number(value);
                                  const lvl = scoreToLevel(num);
                                  return [`${num.toFixed(1)} — ${LEVEL_LABELS[lvl]}`, name];
                                }}
                              />
                              <Legend
                                layout="vertical"
                                align="right"
                                verticalAlign="middle"
                                wrapperStyle={{ fontSize: '12px', paddingLeft: '16px' }}
                                iconType="circle"
                              />
                              {!hiddenPersonMapSeries.includes('roleAverage') && roleAverageScores ? (
                                <Radar
                                  name={roleBenchmarkLabel}
                                  dataKey="roleAverage"
                                  stroke={roleBenchmarkColor}
                                  fill={roleBenchmarkColor}
                                  fillOpacity={0}
                                  strokeWidth={1.5}
                                  dot={{ r: 5, fill: roleBenchmarkColor, fillOpacity: 1, strokeWidth: 0 }}
                                  isAnimationActive={false}
                                />
                              ) : null}
                              {!hiddenPersonMapSeries.includes('teamAverage') && teamAverageScores ? (
                                <Radar
                                  name={teamBenchmarkLabel}
                                  dataKey="teamAverage"
                                  stroke={teamBenchmarkColor}
                                  fill={teamBenchmarkColor}
                                  fillOpacity={0}
                                  strokeWidth={1.5}
                                  strokeDasharray="6 4"
                                  dot={{ r: 5, fill: teamBenchmarkColor, fillOpacity: 1, strokeWidth: 0 }}
                                  isAnimationActive={false}
                                />
                              ) : null}
                              {!hiddenPersonMapSeries.includes('person') ? (
                                <Radar
                                  name={personMapSeriesMeta.person.label}
                                  dataKey="you"
                                  stroke={personColor}
                                  fill={personColor}
                                  fillOpacity={personMapFillOpacity}
                                  strokeWidth={personMapStrokeWidth}
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
                                          fill={personColor}
                                        />
                                      );
                                    }) as unknown as never
                                  }
                                  label={
                                    ((props: { x?: number; y?: number; index?: number; value?: number }) => {
                                      const { x = 0, y = 0, index = 0, value = 0 } = props;
                                      const offset = 14;
                                      let lx = x;
                                      let ly = y;
                                      let textAnchor: 'start' | 'middle' | 'end' = 'middle';
                                      let baseline: 'auto' | 'middle' | 'hanging' = 'middle';
                                      switch (index) {
                                        case 0:
                                          ly = y - offset;
                                          baseline = 'auto';
                                          break;
                                        case 1:
                                          lx = x + offset;
                                          ly = y - offset * 0.35;
                                          textAnchor = 'start';
                                          break;
                                        case 2:
                                          lx = x + offset * 0.7;
                                          ly = y + offset * 0.85;
                                          textAnchor = 'start';
                                          baseline = 'hanging';
                                          break;
                                        case 3:
                                          lx = x - offset * 0.7;
                                          ly = y + offset * 0.85;
                                          textAnchor = 'end';
                                          baseline = 'hanging';
                                          break;
                                        case 4:
                                          lx = x - offset;
                                          ly = y - offset * 0.35;
                                          textAnchor = 'end';
                                          break;
                                      }
                                      return (
                                        <text
                                          x={lx}
                                          y={ly}
                                          fill={personColor}
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
                              ) : null}
                            </RadarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[#d4d4d8] bg-[#fafafa] px-6 text-center text-sm text-[#7a7a7a]">
                            All comparison series are hidden. Click a chip above to show them again.
                          </div>
                        )}
                      </div>
                    </div>
	                  </CollapsibleContent>
	                </Collapsible>

                  <Collapsible open={goalsOpen} onOpenChange={setGoalsOpen} className="mb-2">
                    <CollapsibleTrigger
                      className={`flex w-full items-center justify-between border border-[#eaeaea] bg-[#f4f4f5]/60 p-3 hover:bg-[#f4f4f5] transition-colors ${
                        goalsOpen ? 'rounded-t-lg border-b-0' : 'rounded-lg'
                      }`}
                    >
                      <span className="font-medium text-[#242424]">
                        Suggested next steps
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex rounded-full border border-[#e5e7eb] bg-white px-3 py-1 text-xs font-semibold text-[#374151]">
                          {selectedPersonSuggestedGoals.length} goals
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-[#8b8b8b] transition-transform ${goalsOpen ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <section className="rounded-b-lg border border-[#e5e7eb] bg-white p-5 shadow-sm">
                        <div>
                          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8b8b8b]">
                            Suggested goals
                          </div>
                          <h4 className="mt-2 text-lg font-semibold tracking-tight text-[#1f2937]">
                            Suggested next steps
                          </h4>
                          <p className="mt-2 text-sm leading-6 text-[#667085]">
                            These suggestions come from the built-in goal catalog and are ranked using
                            this respondent&apos;s weakest dimensions, benchmark gaps, and question-level
                            survey signals.
                          </p>
                        </div>

                        <div className="mt-4 grid gap-4 xl:grid-cols-3">
                          {selectedPersonSuggestedGoals.map((goal) => (
                            <SuggestedGoalCard key={goal.id} goal={goal} />
                          ))}
                        </div>
                      </section>
                    </CollapsibleContent>
                  </Collapsible>

                  {teamValidatedView ? (
                    <Collapsible
                      open={teamValidatedOpen}
                      onOpenChange={setTeamValidatedOpen}
                      className="mb-2"
                    >
                      <CollapsibleTrigger
                        className={`flex w-full items-center justify-between border border-[#eaeaea] bg-[#f4f4f5]/60 p-3 hover:bg-[#f4f4f5] transition-colors ${
                          teamValidatedOpen ? 'rounded-t-lg border-b-0' : 'rounded-lg'
                        }`}
                      >
                        <span className="font-medium text-[#242424]">
                          Compared with others
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex rounded-full border border-[#e5e7eb] bg-white px-3 py-1 text-xs font-semibold text-[#374151]">
                            {teamValidatedView.alignmentGap !== null
                              ? formatSignedDelta(teamValidatedView.alignmentGap)
                              : 'N/A'}
                          </span>
                          <ChevronDown
                            className={`h-4 w-4 text-[#8b8b8b] transition-transform ${teamValidatedOpen ? 'rotate-180' : ''}`}
                          />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <section className="rounded-b-lg border border-[#eaeaea] bg-white p-5 shadow-sm">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="max-w-3xl">
                              <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#64748b]">
                                Team-Validated View
                              </div>
                              <h3 className="mt-2 flex items-center gap-2 text-lg font-semibold tracking-tight text-[#1f2937]">
                                Compared with others
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="cursor-help text-sm font-medium text-[#64748b] underline decoration-dotted underline-offset-4">
                                      proxy
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" sideOffset={8} className="max-w-[300px] px-3 py-2 text-[12px] leading-relaxed">
                                    This score is inferred from existing survey signals: the person&apos;s own evidence of helping others adopt AI, plus the AI climate reported by teammates on the same project scope.
                                  </TooltipContent>
                                </Tooltip>
                              </h3>
                              <p className="mt-2 text-sm leading-6 text-[#64748b]">
                                {proxyAvailabilityNote(
                                  teamValidatedView.peerRespondentCount,
                                  teamValidatedView.teamClimateValidationScore,
                                )}
                              </p>
                              <p className="mt-3 text-sm leading-6 text-[#475569]">
                                Self-Reported Maturity is the person&apos;s own survey score.
                                Team-Validated Proxy estimates how much that maturity is visible in real team behavior.
                                Alignment Gap is the difference: self score minus team-validated proxy.
                              </p>
                            </div>
                            <div className="rounded-2xl border border-[#dbe4f0] bg-white px-4 py-3 text-sm text-[#475569]">
                              <div className="font-medium text-[#0f172a]">
                                {teamValidatedView.peerRespondentCount} team peer
                                {teamValidatedView.peerRespondentCount === 1 ? '' : 's'}
                              </div>
                              <div className="mt-1 text-xs">
                                {teamValidatedView.influenceAnsweredSignals} of{' '}
                                {teamValidatedView.influenceSignalCount} own influence signals answered
                              </div>
                            </div>
                          </div>

                          <div className="mt-5 grid gap-3 md:grid-cols-3">
                            <div className="rounded-2xl border border-[#dbe4f0] bg-white p-4">
                              <div className="text-xs font-medium uppercase tracking-[0.12em] text-[#64748b]">
                                Self-Reported Maturity
                              </div>
                              <div className="mt-3 flex items-end justify-between gap-3">
                                <div className="text-3xl font-semibold tracking-tight text-[#0f172a]">
                                  {teamValidatedView.selfOverallScore.toFixed(1)}
                                </div>
                                <LevelBadge level={scoreToLevel(teamValidatedView.selfOverallScore)} />
                              </div>
                              <p className="mt-3 text-sm leading-6 text-[#64748b]">
                                This is the standard maturity score already used across the dashboard, calculated only from this respondent&apos;s own answers.
                              </p>
                            </div>

                            <div className="rounded-2xl border border-[#dbe4f0] bg-white p-4">
                              <div className="text-xs font-medium uppercase tracking-[0.12em] text-[#64748b]">
                                Team-Validated Proxy
                              </div>
                              <div className="mt-3 flex items-end justify-between gap-3">
                                <div className="text-3xl font-semibold tracking-tight text-[#0f172a]">
                                  {teamValidatedView.peerViewProxyScore?.toFixed(1) ?? 'N/A'}
                                </div>
                                {teamValidatedView.peerViewProxyScore !== null ? (
                                  <LevelBadge level={scoreToLevel(teamValidatedView.peerViewProxyScore)} />
                                ) : null}
                              </div>
                              <p className="mt-3 text-sm leading-6 text-[#64748b]">
                                This is a proxy from existing data: 65% comes from this person&apos;s own evidence of helping others adopt AI, and 35% comes from teammate signals about the surrounding AI climate.
                              </p>
                            </div>

                            <div className="rounded-2xl border border-[#dbe4f0] bg-white p-4">
                              <div className="text-xs font-medium uppercase tracking-[0.12em] text-[#64748b]">
                                Alignment Gap
                              </div>
                              <div className="mt-3 flex items-end justify-between gap-3">
                                <div className="text-3xl font-semibold tracking-tight text-[#0f172a]">
                                  {teamValidatedView.alignmentGap !== null
                                    ? formatSignedDelta(teamValidatedView.alignmentGap)
                                    : 'N/A'}
                                </div>
                                {teamValidatedView.alignmentGap !== null ? (
                                  <span
                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                      Math.abs(teamValidatedView.alignmentGap) <= 0.35
                                        ? 'bg-[#ecfdf5] text-[#047857]'
                                        : teamValidatedView.alignmentGap > 0
                                          ? 'bg-[#fff7ed] text-[#c2410c]'
                                          : 'bg-[#eff6ff] text-[#1d4ed8]'
                                    }`}
                                  >
                                    {Math.abs(teamValidatedView.alignmentGap) <= 0.35
                                      ? 'Aligned'
                                      : teamValidatedView.alignmentGap > 0
                                        ? 'Self > proxy'
                                        : 'Proxy > self'}
                                  </span>
                                ) : null}
                              </div>
                              <p className="mt-3 text-sm leading-6 text-[#64748b]">
                                Positive means the self-score is higher than the team-validated proxy. Negative means the maturity shows up around them more strongly than they rated themselves.
                              </p>
                              <p className="mt-2 text-xs leading-5 text-[#8b8b8b]">
                                {alignmentGapSummary(teamValidatedView.alignmentGap)}
                              </p>
                            </div>
                          </div>

                          <div className="mt-5 grid gap-3 md:grid-cols-2">
                            <div className="rounded-2xl border border-[#dbe4f0] bg-white p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-sm font-medium text-[#0f172a]">Influence evidence</div>
                                  <div className="mt-1 text-xs leading-5 text-[#64748b]">
                                    Signals from this respondent about whether their AI behavior spreads to others through advice, artifacts, workflows, and durable practices.
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-semibold text-[#0f172a]">
                                    {formatScoreValue(teamValidatedView.influenceEvidenceScore)}
                                  </div>
                                  <div className="mt-1 text-[11px] text-[#8b8b8b]">
                                    {teamValidatedView.influenceAnsweredSignals} answered signals
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="rounded-2xl border border-[#dbe4f0] bg-white p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-sm font-medium text-[#0f172a]">Team climate validation</div>
                                  <div className="mt-1 text-xs leading-5 text-[#64748b]">
                                    Signals from teammates in the same current team scope about shared practices, discussion habits, durability, and the AI maturity around them.
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-lg font-semibold text-[#0f172a]">
                                    {formatScoreValue(teamValidatedView.teamClimateValidationScore)}
                                  </div>
                                  <div className="mt-1 text-[11px] text-[#8b8b8b]">
                                    {teamValidatedView.peerRespondentCount} peer respondents
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="mt-5 grid gap-3 xl:grid-cols-2">
                            <div className="space-y-3">
                              <div className="text-sm font-medium text-[#0f172a]">Own influence signals</div>
                              {teamValidatedView.influenceSignals.map((signal) => (
                                <TeamValidatedSignalRow key={signal.id} signal={signal} />
                              ))}
                            </div>
                            <div className="space-y-3">
                              <div className="text-sm font-medium text-[#0f172a]">Team climate signals</div>
                              {teamValidatedView.teamSignals.map((signal) => (
                                <TeamValidatedSignalRow key={signal.id} signal={signal} />
                              ))}
                            </div>
                          </div>
                        </section>
                      </CollapsibleContent>
                    </Collapsible>
                  ) : null}

	                <Collapsible open={gapsOpen} onOpenChange={setGapsOpen} className="mb-2">
	                  <CollapsibleTrigger
	                    className={`flex w-full items-center justify-between border border-[#eaeaea] bg-[#f4f4f5]/60 p-3 hover:bg-[#f4f4f5] transition-colors ${
	                      gapsOpen ? 'rounded-t-lg border-b-0' : 'rounded-lg'
	                    }`}
	                  >
	                    <span className="font-medium text-[#242424]">Top-3 biggest gaps</span>
	                    <ChevronDown
	                      className={`h-4 w-4 text-[#8b8b8b] transition-transform ${gapsOpen ? 'rotate-180' : ''}`}
	                    />
	                  </CollapsibleTrigger>
	                  <CollapsibleContent>
	                    <div className="rounded-b-lg border border-[#eaeaea] bg-white p-6 shadow-sm">
	                      <p className="text-sm text-[#7a7a7a]">
	                        The largest negative deltas against current benchmarks across organization, same-role peers, and current team scope.
	                      </p>

	                      <div className="mt-5 space-y-3">
	                        {biggestGaps.length > 0 ? (
	                          biggestGaps.map((gap) => (
	                            <div key={`${gap.dimension}-${gap.benchmarkLabel}`} className="rounded-2xl border border-[#fcd34d] bg-[#fffbeb] p-4">
	                              <div className="flex items-start justify-between gap-3">
	                                <div>
	                                  <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#b45309]">
	                                    {gap.dimension}
	                                  </div>
	                                  <div className="mt-1 text-sm font-medium text-[#242424]">
	                                    Below {gap.benchmarkLabel}
	                                  </div>
	                                  <div className="mt-1 text-sm text-[#92400e]">
	                                    {gap.personScore.toFixed(1)} vs {gap.benchmarkScore.toFixed(1)}
	                                    {' '}across {gap.respondentCount} respondents
	                                  </div>
	                                </div>
	                                <span className="inline-flex rounded-full bg-[#fef3c7] px-3 py-1 text-sm font-semibold text-[#b45309]">
	                                  {formatSignedDelta(gap.delta)}
	                                </span>
	                              </div>
	                            </div>
	                          ))
	                        ) : (
	                          <div className="rounded-2xl border border-dashed border-[#d4d4d8] bg-[#fafafa] px-5 py-8 text-center text-sm text-[#7a7a7a]">
	                            No negative gaps are standing out against the currently available benchmarks.
	                          </div>
	                        )}
	                      </div>
	                    </div>
	                  </CollapsibleContent>
	                </Collapsible>

                {/* Survey answers (collapsible) */}
                {(() => {
                  const response = selectedPersonResponse;
                  const scoredResponse = selectedPersonScoredResponse;
                  if (!response || !scoredResponse) return null;
                  const questions = getQuestionsForSurveyType(response.surveyType);

                  // Group questions by dimension
                  const grouped: Record<TechDimension, QuestionMeta[]> = {
                    'Usage': [],
                    'Skills': [],
                    'Impact': [],
                    'Culture': [],
                    'Vision': [],
                  };
                  for (const q of questions) {
                    grouped[q.dimension].push(q);
                  }

                  return (
                    <Collapsible open={answersOpen} onOpenChange={setAnswersOpen} className="mb-2">
                      <CollapsibleTrigger
                        className={`flex w-full items-center justify-between border border-[#eaeaea] bg-[#f4f4f5]/60 p-3 hover:bg-[#f4f4f5] transition-colors ${
                          answersOpen ? 'rounded-t-lg border-b-0' : 'rounded-lg'
                        }`}
                      >
                        <span className="font-medium text-[#242424]">
                          Survey Answers
                          <span className="ml-2 text-xs text-[#8b8b8b] font-normal">
                            {questions.length} questions
                          </span>
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-[#8b8b8b] transition-transform ${answersOpen ? 'rotate-180' : ''}`}
                        />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="rounded-b-lg border border-[#eaeaea] bg-[#fafafa] p-4 space-y-5">
                          {TECH_DIMENSIONS.map((dim) => (
                            <div key={dim}>
                              <h5 className="text-xs font-semibold uppercase tracking-wider text-[#8b8b8b] mb-3">
                                {dim}
                              </h5>
                              <div className="space-y-3">
                                {grouped[dim].map((q) => {
                                  const value = (response[q.id] as string) || '';
                                  const answers = q.isMulti
                                    ? value.split(';').map((s) => s.trim()).filter(Boolean)
                                    : value
                                    ? [value]
                                    : [];
                                  return (
                                    <div key={q.id} className="bg-white rounded-md border border-[#eaeaea] p-3">
                                      <div className="flex items-start gap-2 mb-1.5">
                                        <span className="text-xs font-mono text-[#b0b0b0] mt-0.5 shrink-0">
                                          {q.number}
                                        </span>
                                        <span className="text-sm text-[#242424] font-medium">
                                          {q.text}
                                        </span>
                                        <QuestionScoreBadge score={scoredResponse.questionScores[q.scoreKey ?? q.number]} />
                                        {q.isVerification && (
                                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#fef3c7] text-[#92400e] shrink-0">
                                            VERIFICATION
                                          </span>
                                        )}
                                      </div>
                                      {answers.length === 0 ? (
                                        <p className="text-sm text-[#b0b0b0] italic ml-6">No answer</p>
                                      ) : answers.length === 1 ? (
                                        <p className="text-sm text-[#404040] ml-6">{answers[0]}</p>
                                      ) : (
                                        <ul className="text-sm text-[#404040] ml-6 list-disc list-inside space-y-0.5">
                                          {answers.map((a, i) => (
                                            <li key={i}>{a}</li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })()}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
