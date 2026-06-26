import {

  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
} from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Check,
  ChevronDown,
  Funnel,
  Loader2,
  RotateCcw,
  Upload,
  X,
} from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import { useSensitiveData } from '../components/privacy/SensitiveDataContext';
import PersonAvatar from '../components/ui/PersonAvatar';
import SensitiveText from '../components/ui/SensitiveText';
import SurveyAvatar from '../components/ui/SurveyAvatar';
import { useSurveyData } from '../data/survey/SurveyDataContext';
import { trackEvent } from '../lib/amplitude';
import { nameFromEmail } from '../data/survey/scoring';
import { useTableSortPending } from '../hooks/useTableSortPending';
import {
  DEFAULT_RAW_SURVEY_ID,
  parseCsv,
  SURVEY_PROFILE_COLUMN_COUNT,
  stringifyCsv,
} from '../data/survey/rawDatasets';
import { SURVEYS } from '../data/surveyCards';

const TIMESTAMP_INDEX = 0;
const USERNAME_INDEX = 1;
const DEPARTMENT_INDEX = 3;
const SENIORITY_INDEX = 4;
const PROJECTS_INDEX = 5;
const INITIAL_TABLE_ROW_BATCH = 12;
const TABLE_ROW_BATCH_SIZE = 12;
const VALUE_COLLATOR = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
const TIMESTAMP_DISPLAY_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
});
const TIMESTAMP_TOOLTIP_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

type SortDirection = 'asc' | 'desc';
type ColumnFilters = Record<number, string[]>;
type FormattedAnswer = { display: string; tooltip?: string };
type FormattedRow = {
  key: string;
  respondentName: string;
  fullName: string;
  cells: FormattedAnswer[];
};
type MergeCandidateRow = {
  key: string;
  row: string[];
  respondentName: string;
  email: string;
  alignedFields: string[];
};
type MergePreview = {
  surveyId: string;
  fileName: string;
  columns: string[];
  currentRows: string[][];
  candidateRows: MergeCandidateRow[];
  uploadedRowCount: number;
  alreadyPresentCount: number;
  duplicateUploadedCount: number;
  alignedCandidateCount: number;
};

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

function getColumnLabel(label: string, index: number): string {
  if (index === USERNAME_INDEX) {
    return 'Name';
  }

  return label;
}

function getRowKey(row: string[]): string {
  return `${row[USERNAME_INDEX] ?? 'unknown'}-${row[TIMESTAMP_INDEX] ?? 'unknown'}`;
}

function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

function padRow(row: string[], columnCount: number): string[] {
  return Array.from({ length: columnCount }, (_, index) => row[index] ?? '');
}

function getSortableValue(value: string, columnIndex: number): number | string {
  if (columnIndex === TIMESTAMP_INDEX) {
    const normalized = value.replace(/ GMT([+-]\d{1,2})$/, (_, hours: string) => {
      const sign = hours.startsWith('-') ? '-' : '+';
      const digits = hours.replace(/[+-]/, '').padStart(2, '0');
      return ` GMT${sign}${digits}:00`;
    });
    const date = new Date(normalized);
    if (!Number.isNaN(date.getTime())) {
      return date.getTime();
    }
  }

  return value.trim();
}

function getTimestampValue(value: string): number {
  const sortableValue = getSortableValue(value, TIMESTAMP_INDEX);
  return typeof sortableValue === 'number' ? sortableValue : 0;
}

function formatTimestamp(value: string): { display: string; tooltip: string } {
  const normalized = value.replace(/ GMT([+-]\d{1,2})$/, (_, hours: string) => {
    const sign = hours.startsWith('-') ? '-' : '+';
    const digits = hours.replace(/[+-]/, '').padStart(2, '0');
    return ` GMT${sign}${digits}:00`;
  });

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return { display: value, tooltip: value };
  }

  const display = TIMESTAMP_DISPLAY_FORMATTER
    .format(date)
    .replace(',', '')
    .replace(' am', 'am')
    .replace(' pm', 'pm');

  const tooltip = TIMESTAMP_TOOLTIP_FORMATTER.format(date);

  return { display, tooltip };
}

function formatAnswer(value: unknown, options?: { isTimestamp?: boolean }): { display: string; tooltip?: string } {
  if (typeof value !== 'string' || value.trim() === '') {
    return { display: '—' };
  }

  if (options?.isTimestamp) {
    return formatTimestamp(value);
  }

  const parts = value
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return { display: '—' };
  }

  if (parts.length === 1) {
    return { display: parts[0], tooltip: value };
  }

  return {
    display: parts.join(' • '),
    tooltip: value,
  };
}

function formatFilterOption(value: string, columnIndex: number): { display: string; tooltip?: string } {
  if (columnIndex === USERNAME_INDEX) {
    return {
      display: nameFromEmail(value),
    };
  }

  if (value.trim() === '') {
    return { display: '—', tooltip: 'Empty value' };
  }

  return formatAnswer(value, { isTimestamp: columnIndex === TIMESTAMP_INDEX });
}

function DataCellText({
  display,
  tooltip,
  isObscured = false,
}: {
  display: string;
  tooltip?: string;
  isObscured?: boolean;
}) {
  const resolvedTitle = !isObscured && tooltip && tooltip !== display ? tooltip : undefined;

  return (
    <SensitiveText
      as="div"
      hidden={isObscured}
      title={resolvedTitle}
      className="max-w-full truncate whitespace-nowrap leading-5"
    >
      {display}
    </SensitiveText>
  );
}

function NameCellText({
  name,
  hideSurname = false,
  className = 'max-w-full truncate whitespace-nowrap leading-5',
}: {
  name: string;
  hideSurname?: boolean;
  className?: string;
}) {
  if (hideSurname) {
    return (
      <SensitiveText as="div" hidden className={className}>
        {name.trim() || 'Unknown'}
      </SensitiveText>
    );
  }

  const { firstName, remainder } = splitNameParts(name);
  const resolvedName = name.trim() || 'Unknown';

  return (
    <div title={hideSurname ? undefined : resolvedName} className={className}>
      <span>{firstName || 'Unknown'}</span>
      {remainder ? <span>{remainder}</span> : null}
    </div>
  );
}

function getStickyHeaderClass(index: number): string {
  if (index === 0) {
    return 'sticky left-0 z-50 min-w-[160px] bg-white shadow-[1px_0_0_0_#eaeaea]';
  }

  if (index === 1) {
    return 'sticky left-[160px] z-50 min-w-[240px] bg-white shadow-[1px_0_0_0_#eaeaea]';
  }

  return 'w-[200px] min-w-[200px] max-w-[200px]';
}

function getStickyBodyClass(index: number, rowIndex: number): string {
  const rowBackground = rowIndex % 2 === 0 ? 'bg-white' : 'bg-[#fcfcfc]';

  if (index === 0) {
    return `sticky left-0 z-10 min-w-[160px] font-medium ${rowBackground} shadow-[1px_0_0_0_#f4f4f5]`;
  }

  if (index === 1) {
    return `sticky left-[160px] z-10 min-w-[240px] ${rowBackground} shadow-[1px_0_0_0_#f4f4f5]`;
  }

  return `w-[200px] min-w-[200px] max-w-[200px] ${rowBackground}`;
}

interface DataTableProps {
  selectedSurveyId: string;
  columns: string[];
  rows: FormattedRow[];
  sortColumnIndex: number | null;
  sortDirection: SortDirection;
  isTableSortPending: boolean;
  filterMenuColumnIndex: number | null;
  columnFilters: ColumnFilters;
  activeFilterOptions: string[];
  hideProjectAssignments: boolean;
  hidePersonSurname: boolean;
  onSort: (columnIndex: number) => void;
  onToggleFilterMenu: (columnIndex: number) => void;
  onClearFilter: (columnIndex: number) => void;
  onToggleFilterValue: (columnIndex: number, value: string) => void;
  onSelectRow: (rowKey: string) => void;
}

const DataTable = memo(function DataTable({
  selectedSurveyId,
  columns,
  rows,
  sortColumnIndex,
  sortDirection,
  isTableSortPending,
  filterMenuColumnIndex,
  columnFilters,
  activeFilterOptions,
  hideProjectAssignments,
  hidePersonSurname,
  onSort,
  onToggleFilterMenu,
  onClearFilter,
  onToggleFilterValue,
  onSelectRow,
}: DataTableProps) {
  return (
    <div className="rounded-xl border border-[#eaeaea] bg-white shadow-sm overflow-hidden">
      <div className="overflow-auto max-h-[78vh]">
        <table className="min-w-[2600px] border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-40 bg-white">
            <tr>
              {columns.map((label, index) => {
                const isProfileField = index < SURVEY_PROFILE_COLUMN_COUNT;
                const columnLabel = getColumnLabel(label, index);
                const isSorted = sortColumnIndex === index;
                const isFilterOpen = filterMenuColumnIndex === index;
                const activeFilterCount = (columnFilters[index] ?? []).length;
                const shouldShowFilterControl = isFilterOpen || activeFilterCount > 0;

                return (
                  <th
                    key={`${selectedSurveyId}-${label}`}
                    className={`group/column relative border-b border-[#eaeaea] px-3 py-3 text-left align-bottom text-xs font-semibold text-[#525252] ${getStickyHeaderClass(index)}`}
                  >
                    <div className="flex items-end justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => onSort(index)}
                        className="flex min-w-0 flex-1 items-end justify-between gap-2 text-left transition-colors hover:text-[#242424]"
                      >
                        <div className="space-y-1">
                          {!isProfileField && (
                            <div className="text-[10px] uppercase tracking-wide text-[#8b8b8b]">
                              Question {index - SURVEY_PROFILE_COLUMN_COUNT + 1}
                            </div>
                          )}
                          <div className="leading-snug">{columnLabel}</div>
                        </div>
                        <span className="shrink-0 text-[#8b8b8b]">
                          {isTableSortPending && isSorted ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : isSorted ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5" />
                            ) : (
                              <ArrowDown className="h-3.5 w-3.5" />
                            )
                          ) : (
                            <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                          )}
                        </span>
                      </button>
                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={() => onToggleFilterMenu(index)}
                          className={`rounded-md border px-1.5 py-1 transition-[opacity,color,background-color,border-color] ${
                            activeFilterCount > 0
                              ? 'border-[#14b8a6] bg-[#ecfeff] text-[#0f766e]'
                              : 'border-[#e5e7eb] bg-white text-[#8b8b8b] hover:text-[#242424]'
                          } ${
                            shouldShowFilterControl
                              ? 'opacity-100'
                              : 'pointer-events-none opacity-0 group-hover/column:pointer-events-auto group-hover/column:opacity-100 group-focus-within/column:pointer-events-auto group-focus-within/column:opacity-100'
                          }`}
                          aria-label={`Filter ${columnLabel}`}
                          tabIndex={shouldShowFilterControl ? 0 : -1}
                        >
                          <div className="flex items-center gap-1">
                            <Funnel className="h-3.5 w-3.5" />
                            {activeFilterCount > 0 && (
                              <span className="text-[10px] font-semibold">
                                {activeFilterCount}
                              </span>
                            )}
                          </div>
                        </button>

                        {isFilterOpen && (
                          <div
                            className="absolute right-0 top-[calc(100%+0.5rem)] z-[70] w-[280px] rounded-xl border border-[#e5e7eb] bg-white p-3 shadow-lg"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <div className="mb-3 flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="truncate text-xs font-medium uppercase tracking-[0.12em] text-[#8b8b8b]">
                                  Filter
                                </div>
                                <div className="truncate text-sm font-semibold text-[#242424]">
                                  {columnLabel}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => onToggleFilterMenu(index)}
                                className="rounded-md p-1 text-[#8b8b8b] transition-colors hover:text-[#242424]"
                                aria-label="Close filter"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="mb-3 flex items-center justify-between gap-2">
                              <div className="text-xs text-[#8b8b8b]">{activeFilterOptions.length} values</div>
                              {activeFilterCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => onClearFilter(index)}
                                  className="text-xs font-medium text-[#0f766e] transition-colors hover:text-[#115e59]"
                                >
                                  Clear
                                </button>
                              )}
                            </div>

                            <div className="max-h-[280px] space-y-1 overflow-y-auto">
                              {activeFilterOptions.map((optionValue) => {
                                const isChecked = (columnFilters[index] ?? []).includes(optionValue);
                                const option = formatFilterOption(optionValue, index);
                                const isProjectValueHidden =
                                  hideProjectAssignments && index === PROJECTS_INDEX;

                                return (
                                  <label
                                    key={`${selectedSurveyId}-${index}-${optionValue || '__empty__'}`}
                                    className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-[#f8fafc]"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => onToggleFilterValue(index, optionValue)}
                                      className="mt-0.5 h-4 w-4 rounded border-[#d4d4d8] text-[#14b8a6] focus:ring-[#14b8a6]"
                                    />
                                    <div className="min-w-0">
                                      {index === USERNAME_INDEX ? (
                                        <NameCellText
                                          name={option.display}
                                          hideSurname={hidePersonSurname}
                                          className="truncate text-sm text-[#242424]"
                                        />
                                      ) : (
                                        <SensitiveText
                                          as="div"
                                          hidden={isProjectValueHidden}
                                          className="truncate text-sm text-[#242424]"
                                        >
                                          {option.display}
                                        </SensitiveText>
                                      )}
                                      {!isProjectValueHidden &&
                                        option.tooltip &&
                                        option.tooltip !== option.display && (
                                        <div className="truncate text-xs text-[#8b8b8b]">
                                          {option.tooltip}
                                        </div>
                                      )}
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {rows.map((formattedRow, rowIndex) => (
              <tr
                key={`${selectedSurveyId}-${formattedRow.key}`}
                onClick={() => onSelectRow(formattedRow.key)}
                className="cursor-pointer odd:bg-[#fcfcfc] hover:bg-[#f7f7f8] transition-colors"
              >
                {formattedRow.cells.map((formatted, index) => {
                  const isProjectValueHidden = hideProjectAssignments && index === PROJECTS_INDEX;

                  return (
                    <td
                      key={`${selectedSurveyId}-${formattedRow.key}-${index}`}
                      className={`border-b border-[#f4f4f5] px-3 py-3 align-top text-[#242424] ${getStickyBodyClass(index, rowIndex)} ${
                        rowIndex === rows.length - 1 ? 'border-b-0' : ''
                      }`}
                    >
                      {index === USERNAME_INDEX ? (
                        <div className="flex items-center gap-2 min-w-0">
                          <PersonAvatar
                            name={formattedRow.fullName}
                            className="h-8 w-8"
                            textClassName="text-xs"
                            hidden={hidePersonSurname}
                          />
                          <NameCellText
                            name={formatted.display}
                            hideSurname={hidePersonSurname}
                          />
                        </div>
                      ) : (
                        <DataCellText
                          display={formatted.display}
                          tooltip={formatted.tooltip}
                          isObscured={isProjectValueHidden}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});

export default function DataView() {
  const {
    rawSurveyDatasets,
    hasResponseData,
    replaceSurveyCsv,
    isSurveyOverridden,
    resolvePersonName,
  } = useSurveyData();
  const { isSensitiveDataHidden } = useSensitiveData();
  const [selectedSurveyId, setSelectedSurveyId] = useState(DEFAULT_RAW_SURVEY_ID);
  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);
  const [sortColumnIndex, setSortColumnIndex] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterMenuColumnIndex, setFilterMenuColumnIndex] = useState<number | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({});
  const [isSurveyMenuOpen, setIsSurveyMenuOpen] = useState(false);
  const [isUploadSurveyModalOpen, setIsUploadSurveyModalOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTargetSurveyId, setUploadTargetSurveyId] = useState<string | null>(null);
  const [pendingUploadSurveyId, setPendingUploadSurveyId] = useState<string | null>(null);
  const [mergePreview, setMergePreview] = useState<MergePreview | null>(null);
  const [selectedMergeRowKeys, setSelectedMergeRowKeys] = useState<string[]>([]);
  const [visibleRowCount, setVisibleRowCount] = useState(INITIAL_TABLE_ROW_BATCH);
  const [isClearDataModalOpen, setIsClearDataModalOpen] = useState(false);
  const [clearDataCountdown, setClearDataCountdown] = useState(5);
  const { isTableSortPending, queueTableSort, clearTableSortPending } = useTableSortPending();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const surveyMenuRef = useRef<HTMLDivElement | null>(null);

  const surveyMetaById = useMemo(
    () => new Map(SURVEYS.map((survey) => [survey.id, survey])),
    [],
  );
  const selectedSurvey =
    rawSurveyDatasets.find((dataset) => dataset.id === selectedSurveyId) ?? rawSurveyDatasets[0];
  const selectedSurveyMeta = surveyMetaById.get(selectedSurvey.id);
  const selectedSurveyIsOverridden = isSurveyOverridden(selectedSurvey.id);
  const questionColumns = selectedSurvey.columns.slice(SURVEY_PROFILE_COLUMN_COUNT);
  const activeFilterOptions = useMemo(() => {
    if (filterMenuColumnIndex === null) {
      return [];
    }

    const uniqueValues = Array.from(
      new Set(selectedSurvey.rows.map((row) => row[filterMenuColumnIndex] ?? '')),
    );

    uniqueValues.sort((a, b) => {
      if (!a.trim() && !b.trim()) return 0;
      if (!a.trim()) return 1;
      if (!b.trim()) return -1;

      const formattedA = formatFilterOption(a, filterMenuColumnIndex).display;
      const formattedB = formatFilterOption(b, filterMenuColumnIndex).display;
      return VALUE_COLLATOR.compare(formattedA, formattedB);
    });

    return uniqueValues;
  }, [filterMenuColumnIndex, selectedSurvey.id, selectedSurvey.rows]);
  const filteredRows = useMemo(
    () =>
      selectedSurvey.rows.filter((row) =>
        Object.entries(columnFilters).every(([columnIndex, values]) => {
          if (values.length === 0) return true;
          return values.includes(row[Number(columnIndex)] ?? '');
        }),
      ),
    [columnFilters, selectedSurvey.id, selectedSurvey.rows],
  );
  const sortedRows = useMemo(() => {
    const rows = [...filteredRows];

    if (sortColumnIndex === null) {
      return rows;
    }

    rows.sort((a, b) => {
      const aValue = a[sortColumnIndex] ?? '';
      const bValue = b[sortColumnIndex] ?? '';

      if (!aValue.trim() && !bValue.trim()) return 0;
      if (!aValue.trim()) return 1;
      if (!bValue.trim()) return -1;

      const sortableA = getSortableValue(aValue, sortColumnIndex);
      const sortableB = getSortableValue(bValue, sortColumnIndex);

      const comparison =
        typeof sortableA === 'number' && typeof sortableB === 'number'
          ? sortableA - sortableB
          : VALUE_COLLATOR.compare(String(sortableA), String(sortableB));

      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return rows;
  }, [filteredRows, selectedSurvey.id, sortColumnIndex, sortDirection]);
  const selectedResponse =
    selectedRowKey === null
      ? null
      : sortedRows.find((row) => getRowKey(row) === selectedRowKey) ??
        selectedSurvey.rows.find((row) => getRowKey(row) === selectedRowKey) ??
        null;
  const formattedRows = useMemo<FormattedRow[]>(
    () =>
      sortedRows.map((row) => {
        const email = row[USERNAME_INDEX] ?? '';
        const fullName = resolvePersonName(email);

        return {
          key: getRowKey(row),
          respondentName: fullName,
          fullName,
          cells: row.map((value, index) =>
            index === USERNAME_INDEX
              ? {
                  display: fullName,
                }
              : formatAnswer(value, { isTimestamp: index === TIMESTAMP_INDEX }),
          ),
        };
      }),
    [resolvePersonName, selectedSurvey.columns.length, selectedSurvey.id, sortedRows],
  );
  const selectedFormattedRow = useMemo(
    () => formattedRows.find((row) => row.key === selectedRowKey) ?? null,
    [formattedRows, selectedRowKey],
  );
  const progressivelyVisibleRows = useMemo(
    () => formattedRows.slice(0, visibleRowCount),
    [formattedRows, visibleRowCount],
  );
  const selectedMergeKeySet = useMemo(
    () => new Set(selectedMergeRowKeys),
    [selectedMergeRowKeys],
  );
  const selectedMergeCandidates = useMemo(
    () =>
      mergePreview?.candidateRows.filter((candidate) => selectedMergeKeySet.has(candidate.key)) ?? [],
    [mergePreview, selectedMergeKeySet],
  );

  useEffect(() => {
    if (rawSurveyDatasets.some((dataset) => dataset.id === selectedSurveyId)) {
      return;
    }

    setSelectedSurveyId(rawSurveyDatasets[0]?.id ?? DEFAULT_RAW_SURVEY_ID);
  }, [rawSurveyDatasets, selectedSurveyId]);

  useEffect(() => {
    const totalRowCount = formattedRows.length;
    const initialVisibleRowCount = Math.min(totalRowCount, INITIAL_TABLE_ROW_BATCH);

    setVisibleRowCount(initialVisibleRowCount);

    if (typeof window === 'undefined' || totalRowCount <= initialVisibleRowCount) {
      return undefined;
    }

    let cancelled = false;
    let frameId = 0;

    const revealNextBatch = () => {
      frameId = window.requestAnimationFrame(() => {
        if (cancelled) {
          return;
        }

        setVisibleRowCount((current) => {
          const nextVisibleRowCount = Math.min(
            totalRowCount,
            Math.max(current, initialVisibleRowCount) + TABLE_ROW_BATCH_SIZE,
          );

          if (nextVisibleRowCount < totalRowCount) {
            revealNextBatch();
          }

          return nextVisibleRowCount;
        });
      });
    };

    revealNextBatch();

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [formattedRows, selectedSurvey.id]);

  useEffect(() => {
    if (!isTableSortPending || visibleRowCount < formattedRows.length) {
      return;
    }

    clearTableSortPending();
  }, [
    clearTableSortPending,
    formattedRows.length,
    isTableSortPending,
    visibleRowCount,
  ]);

  useEffect(() => {
    if (!isSurveyMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (surveyMenuRef.current?.contains(event.target as Node)) {
        return;
      }

      setIsSurveyMenuOpen(false);
    };

    window.addEventListener('mousedown', handlePointerDown);
    return () => window.removeEventListener('mousedown', handlePointerDown);
  }, [isSurveyMenuOpen]);

  useEffect(() => {
    if (!isClearDataModalOpen) {
      setClearDataCountdown(5);
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setClearDataCountdown((current) => (current <= 1 ? 0 : current - 1));
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isClearDataModalOpen]);

  const handleSelectSurvey = (surveyId: string) => {
    setSelectedSurveyId(surveyId);
    setSelectedRowKey(null);
    setSortColumnIndex(null);
    setSortDirection('asc');
    setFilterMenuColumnIndex(null);
    setColumnFilters({});
    setIsSurveyMenuOpen(false);
    setUploadError(null);
    setUploadSuccess(null);
  };

  const handleSort = (columnIndex: number) => {
    const columnLabel = getColumnLabel(selectedSurvey.columns[columnIndex] ?? `Column ${columnIndex + 1}`, columnIndex);
    const nextSortState =
      sortColumnIndex !== columnIndex ? 'asc' : sortDirection === 'asc' ? 'desc' : 'none';

    trackEvent('data_table_column_sort_clicked', {
      page: 'data',
      survey_id: selectedSurvey.id,
      column_index: columnIndex,
      column_label: columnLabel,
      is_profile_field: columnIndex < SURVEY_PROFILE_COLUMN_COUNT,
      next_sort_state: nextSortState,
    });

    queueTableSort(() => {
      if (sortColumnIndex === columnIndex) {
        if (sortDirection === 'asc') {
          setSortDirection('desc');
        } else {
          setSortColumnIndex(null);
          setSortDirection('asc');
        }
        return;
      }

      setSortColumnIndex(columnIndex);
      setSortDirection('asc');
    });
  };

  const toggleColumnFilterValue = (columnIndex: number, value: string) => {
    setColumnFilters((current) => {
      const existingValues = current[columnIndex] ?? [];
      const nextValues = existingValues.includes(value)
        ? existingValues.filter((item) => item !== value)
        : [...existingValues, value];

      if (nextValues.length === 0) {
        const { [columnIndex]: _removed, ...rest } = current;
        return rest;
      }

      return {
        ...current,
        [columnIndex]: nextValues,
      };
    });
  };

  const clearColumnFilter = (columnIndex: number) => {
    setColumnFilters((current) => {
      const { [columnIndex]: _removed, ...rest } = current;
      return rest;
    });
  };

  const handleUploadClick = () => {
    trackEvent('data_upload_csv_clicked', {
      page: 'data',
      survey_id: selectedSurvey.id,
      response_count: selectedSurvey.rows.length,
      question_count: questionColumns.length,
    });

    setUploadTargetSurveyId(selectedSurvey.id);
    setIsUploadSurveyModalOpen(true);
  };

  const handleConfirmUploadSurvey = () => {
    const targetSurveyId = uploadTargetSurveyId ?? selectedSurvey.id;
    setPendingUploadSurveyId(targetSurveyId);
    setSelectedSurveyId(targetSurveyId);
    setIsUploadSurveyModalOpen(false);
    window.setTimeout(() => {
      fileInputRef.current?.click();
    }, 0);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const csvText = await file.text();
      const targetSurveyId = pendingUploadSurveyId ?? selectedSurvey.id;
      const targetDataset =
        rawSurveyDatasets.find((dataset) => dataset.id === targetSurveyId) ?? selectedSurvey;
      const parsedUpload = parseCsv(csvText);

      if (parsedUpload.columns.length === 0) {
        throw new Error('The uploaded CSV is empty or missing a header row.');
      }

      if (parsedUpload.columns.length < targetDataset.columns.length) {
        throw new Error(
          `This CSV has ${parsedUpload.columns.length} columns, but "${targetSurveyId}" expects at least ${targetDataset.columns.length}.`,
        );
      }

      const targetColumnCount = parsedUpload.columns.length;
      const currentRows = targetDataset.rows.map((row) => padRow(row, targetColumnCount));
      const existingKeys = new Set(currentRows.map((row) => getRowKey(row)));
      const seenUploadedKeys = new Set<string>();
      const latestProfileByUsername = new Map<
        string,
        {
          timestamp: number;
          department: string;
          seniority: string;
          projects: string;
        }
      >();

      for (const row of currentRows) {
        const normalizedUsername = normalizeUsername(row[USERNAME_INDEX] ?? '');

        if (!normalizedUsername) {
          continue;
        }

        const nextTimestamp = getTimestampValue(row[TIMESTAMP_INDEX] ?? '');
        const existingProfile = latestProfileByUsername.get(normalizedUsername);

        if (!existingProfile || nextTimestamp >= existingProfile.timestamp) {
          latestProfileByUsername.set(normalizedUsername, {
            timestamp: nextTimestamp,
            department: row[DEPARTMENT_INDEX] ?? '',
            seniority: row[SENIORITY_INDEX] ?? '',
            projects: row[PROJECTS_INDEX] ?? '',
          });
        }
      }

      let alreadyPresentCount = 0;
      let duplicateUploadedCount = 0;
      let alignedCandidateCount = 0;

      const candidateRows: MergeCandidateRow[] = parsedUpload.rows.reduce<MergeCandidateRow[]>(
        (rows, rawRow) => {
          const row = padRow(rawRow, targetColumnCount);
          const rowKey = getRowKey(row);

          if (existingKeys.has(rowKey)) {
            alreadyPresentCount += 1;
            return rows;
          }

          if (seenUploadedKeys.has(rowKey)) {
            duplicateUploadedCount += 1;
            return rows;
          }

          seenUploadedKeys.add(rowKey);

          const normalizedUsername = normalizeUsername(row[USERNAME_INDEX] ?? '');
          const existingProfile = latestProfileByUsername.get(normalizedUsername);
          const nextRow = [...row];
          const alignedFields: string[] = [];

          if (existingProfile) {
            if (existingProfile.department.trim() && existingProfile.department !== nextRow[DEPARTMENT_INDEX]) {
              nextRow[DEPARTMENT_INDEX] = existingProfile.department;
              alignedFields.push('department');
            }

            if (existingProfile.seniority.trim() && existingProfile.seniority !== nextRow[SENIORITY_INDEX]) {
              nextRow[SENIORITY_INDEX] = existingProfile.seniority;
              alignedFields.push('seniority');
            }

            if (existingProfile.projects.trim() && existingProfile.projects !== nextRow[PROJECTS_INDEX]) {
              nextRow[PROJECTS_INDEX] = existingProfile.projects;
              alignedFields.push('projects');
            }
          }

          if (alignedFields.length > 0) {
            alignedCandidateCount += 1;
          }

          rows.push({
            key: rowKey,
            row: nextRow,
            respondentName: resolvePersonName(nextRow[USERNAME_INDEX] ?? ''),
            email: nextRow[USERNAME_INDEX] ?? '',
            alignedFields,
          });

          return rows;
        },
        [],
      );

      setSelectedSurveyId(targetSurveyId);
      setSelectedRowKey(null);
      setSortColumnIndex(null);
      setSortDirection('asc');
      setFilterMenuColumnIndex(null);
      setColumnFilters({});

      if (candidateRows.length === 0) {
        setUploadSuccess(
          `Checked ${file.name}. No new responses were found, so your current edits were left unchanged.`,
        );
        return;
      }

      setMergePreview({
        surveyId: targetSurveyId,
        fileName: file.name,
        columns: parsedUpload.columns,
        currentRows,
        candidateRows,
        uploadedRowCount: parsedUpload.rows.length,
        alreadyPresentCount,
        duplicateUploadedCount,
        alignedCandidateCount,
      });
      setSelectedMergeRowKeys(candidateRows.map((candidate) => candidate.key));
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : 'The CSV could not be processed.',
      );
    } finally {
      setPendingUploadSurveyId(null);
      setIsUploading(false);
    }
  };

  const handleToggleMergeRow = (rowKey: string) => {
    setSelectedMergeRowKeys((current) =>
      current.includes(rowKey)
        ? current.filter((key) => key !== rowKey)
        : [...current, rowKey],
    );
  };

  const handleConfirmMerge = () => {
    if (!mergePreview) {
      return;
    }

    const selectedRows = selectedMergeCandidates.map((candidate) => candidate.row);

    if (selectedRows.length === 0) {
      return;
    }

    const mergedCsv = stringifyCsv({
      columns: mergePreview.columns,
      rows: [...mergePreview.currentRows, ...selectedRows],
    });

    replaceSurveyCsv(mergePreview.surveyId, mergedCsv);
    setSelectedSurveyId(mergePreview.surveyId);
    setMergePreview(null);
    setSelectedMergeRowKeys([]);
    setUploadError(null);
    setUploadSuccess(
      `Merged ${selectedRows.length} new response${selectedRows.length === 1 ? '' : 's'} from ${mergePreview.fileName}. ${mergePreview.alreadyPresentCount} already in the survey were skipped.`,
    );
  };

  const handleCancelMergePreview = () => {
    setMergePreview(null);
    setSelectedMergeRowKeys([]);
  };

  const handleClearStoredData = () => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.clear();
    window.location.reload();
  };

  return (
    <div>
      <PageHeader
        title="Data"
        subtitle="All raw survey answers in one table, with a survey switcher so each schema stays intact."
        badge={selectedSurvey.rows.length}
      />

      <div className="relative z-[70] mb-4 flex flex-wrap items-end justify-between gap-6">
        <div ref={surveyMenuRef} className="relative z-[80] space-y-2 pb-0 text-left">
          <label htmlFor="survey-select" className="text-xs font-medium uppercase tracking-[0.12em] text-[#8b8b8b]">
            Survey
          </label>
          <button
            id="survey-select"
            type="button"
            aria-haspopup="listbox"
            aria-expanded={isSurveyMenuOpen}
            onClick={() => {
              trackEvent('data_survey_dropdown_clicked', {
                page: 'data',
                survey_id: selectedSurvey.id,
                response_count: selectedSurvey.rows.length,
                question_count: questionColumns.length,
                menu_action: isSurveyMenuOpen ? 'close' : 'open',
              });

              setIsSurveyMenuOpen((open) => !open);
            }}
            className={`flex min-w-[320px] items-center gap-3 rounded-xl border bg-white px-3 py-2.5 text-left shadow-sm outline-none transition ${
              isSurveyMenuOpen
                ? 'border-[#94a3b8] ring-2 ring-[#cbd5e1]'
                : 'border-[#eaeaea] hover:border-[#d6d6d6] hover:bg-[#fcfcfc]'
            }`}
          >
            <SurveyAvatar
              surveyId={selectedSurvey.id}
              label={selectedSurveyMeta?.title ?? selectedSurvey.id}
              className="h-10 w-10"
              textClassName="text-xs"
            />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-[#242424]">
                {selectedSurveyMeta?.title ?? selectedSurvey.id}
              </div>
              <div className="truncate text-xs text-[#8b8b8b]">
                {questionColumns.length} questions, {selectedSurvey.rows.length} answers
              </div>
            </div>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-[#737373] transition-transform ${
                isSurveyMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isSurveyMenuOpen ? (
            <div className="absolute left-0 top-full z-[90] mt-0.5 w-full overflow-hidden rounded-2xl border border-[#eaeaea] bg-white p-2 shadow-[0_18px_48px_rgba(15,23,42,0.12)]">
              <div role="listbox" aria-labelledby="survey-select" className="flex flex-col gap-1">
                {rawSurveyDatasets.map((dataset) => {
                  const surveyMeta = surveyMetaById.get(dataset.id);
                  const isSelected = dataset.id === selectedSurvey.id;

                  return (
                    <button
                      key={dataset.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectSurvey(dataset.id)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                        isSelected ? 'bg-[#f4f4f5]' : 'hover:bg-[#f8fafc]'
                      }`}
                    >
                      <SurveyAvatar
                        surveyId={dataset.id}
                        label={surveyMeta?.title ?? dataset.id}
                        className="h-10 w-10"
                        textClassName="text-xs"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-[#242424]">
                          {surveyMeta?.title ?? dataset.id}
                        </div>
                        <div className="truncate text-xs text-[#8b8b8b]">
                          {Math.max(dataset.columns.length - SURVEY_PROFILE_COLUMN_COUNT, 0)} questions,{' '}
                          {dataset.rows.length} answers
                        </div>
                      </div>
                      {isSelected ? <Check className="h-4 w-4 shrink-0 text-[#0f766e]" /> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="ml-auto space-y-2 text-right">
          <div className="text-xs font-medium uppercase tracking-[0.12em] text-[#8b8b8b]">
            Refresh data
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleUploadClick}
              disabled={isUploading}
              className="inline-flex h-[46px] items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-4 text-sm font-medium text-[#525252] shadow-sm transition hover:bg-[#fafafa] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Upload className="h-4 w-4" />
              {isUploading ? 'Preparing merge...' : 'Upload CSV'}
            </button>

            {hasResponseData ? (
              <button
                type="button"
                onClick={() => {
                  trackEvent('data_clear_browser_data_clicked', {
                    page: 'data',
                    response_count: selectedSurvey.rows.length,
                    question_count: questionColumns.length,
                  });

                  setIsClearDataModalOpen(true);
                }}
                className="inline-flex h-[46px] items-center gap-2 rounded-xl border border-[#e5e7eb] bg-white px-4 text-sm font-medium text-[#525252] shadow-sm transition hover:bg-[#fafafa]"
              >
                <RotateCcw className="h-4 w-4" />
                Clear browser data
              </button>
            ) : null}
          </div>
        </div>

      </div>

      {selectedSurveyIsOverridden ? (
        <div className="mb-4 rounded-xl border border-[#99f6e4] bg-[#f0fdfa] px-4 py-3 text-sm text-[#115e59]">
          Uploaded responses are active for this survey.
        </div>
      ) : null}

      {uploadSuccess ? (
        <div className="mb-4 rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#166534]">
          {uploadSuccess}
        </div>
      ) : null}

      {uploadError ? (
        <div className="mb-4 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]">
          {uploadError}
        </div>
      ) : null}

      {isClearDataModalOpen ? (
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/40"
            onClick={() => setIsClearDataModalOpen(false)}
          />
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div
              className="w-full max-w-xl rounded-2xl border border-[#fecaca] bg-white p-6 shadow-[0_24px_64px_rgba(15,23,42,0.16)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#fef2f2] text-[#b42318]">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-xl font-semibold text-[#242424]">Clear browser data?</h2>
                  <p className="mt-2 text-sm leading-6 text-[#737373]">
                    This is an unrevertible action. It will clean all dashboard data from browser
                    storage, including uploaded responses, renamed people, workspace name, and local
                    preferences.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-[#fecaca] bg-[#fff5f5] px-4 py-3 text-sm text-[#991b1b]">
                You can confirm this action in {clearDataCountdown} second
                {clearDataCountdown === 1 ? '' : 's'}.
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsClearDataModalOpen(false)}
                  className="inline-flex h-[44px] items-center rounded-xl border border-[#e5e7eb] bg-white px-4 text-sm font-medium text-[#525252] transition hover:bg-[#fafafa]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleClearStoredData}
                  disabled={clearDataCountdown > 0}
                  className="inline-flex h-[44px] items-center gap-2 rounded-xl border border-[#ef4444] bg-[#ef4444] px-4 text-sm font-medium text-white transition hover:bg-[#dc2626] disabled:cursor-not-allowed disabled:border-[#fca5a5] disabled:bg-[#fca5a5]"
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear all browser data
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {isUploadSurveyModalOpen ? (
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/40"
            onClick={() => setIsUploadSurveyModalOpen(false)}
          />
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div
              className="w-full max-w-xl rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-[0_24px_64px_rgba(15,23,42,0.16)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-[#242424]">Select Survey First</h2>
                  <p className="mt-2 text-sm text-[#737373]">
                    Choose whether this CSV belongs to the Business survey or the Delivery &amp; Engineering survey before selecting the file.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUploadSurveyModalOpen(false)}
                  className="rounded-md p-1 text-[#8b8b8b] transition-colors hover:text-[#242424]"
                  aria-label="Close upload survey selector"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 grid gap-3">
                {rawSurveyDatasets.map((dataset) => {
                  const surveyMeta = surveyMetaById.get(dataset.id);
                  const isSelectedForUpload = (uploadTargetSurveyId ?? selectedSurvey.id) === dataset.id;

                  return (
                    <button
                      key={`upload-target-${dataset.id}`}
                      type="button"
                      onClick={() => setUploadTargetSurveyId(dataset.id)}
                      className={`flex items-center gap-3 rounded-2xl border px-4 py-4 text-left transition ${
                        isSelectedForUpload
                          ? 'border-[#14b8a6] bg-[#f0fdfa] shadow-sm'
                          : 'border-[#e5e7eb] bg-white hover:border-[#d4d4d8] hover:bg-[#fafafa]'
                      }`}
                    >
                      <SurveyAvatar
                        surveyId={dataset.id}
                        label={surveyMeta?.title ?? dataset.id}
                        className="h-11 w-11"
                        textClassName="text-xs"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-[#242424]">
                          {surveyMeta?.title ?? dataset.id}
                        </div>
                        <div className="truncate text-xs text-[#8b8b8b]">
                          {Math.max(dataset.columns.length - SURVEY_PROFILE_COLUMN_COUNT, 0)} questions,{' '}
                          {dataset.rows.length} current answers
                        </div>
                      </div>
                      {isSelectedForUpload ? (
                        <div className="rounded-full bg-[#14b8a6] p-1 text-white">
                          <Check className="h-4 w-4" />
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUploadSurveyModalOpen(false)}
                  className="inline-flex h-[44px] items-center rounded-xl border border-[#e5e7eb] bg-white px-4 text-sm font-medium text-[#525252] transition hover:bg-[#fafafa]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmUploadSurvey}
                  className="inline-flex h-[44px] items-center gap-2 rounded-xl border border-[#14b8a6] bg-white px-4 text-sm font-medium text-[#0f766e] transition hover:bg-[#f0fdfa]"
                >
                  <Upload className="h-4 w-4" />
                  Continue to file picker
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {mergePreview ? (
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/40"
            onClick={handleCancelMergePreview}
          />
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div
              className="flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#eaeaea] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.16)]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-[#eaeaea] px-6 py-5">
                <div>
                  <h2 className="text-xl font-semibold text-[#242424]">Review New Records</h2>
                  <p className="mt-2 text-sm text-[#737373]">
                    Select which new responses from {mergePreview.fileName} should be added to{' '}
                    {surveyMetaById.get(mergePreview.surveyId)?.title ?? mergePreview.surveyId}. Existing edited rows stay as they are.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCancelMergePreview}
                  className="rounded-md p-1 text-[#8b8b8b] transition-colors hover:text-[#242424]"
                  aria-label="Close merge preview"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="grid gap-3 border-b border-[#f1f5f9] bg-[#fcfcfc] px-6 py-4 md:grid-cols-4">
                <div className="rounded-xl border border-[#eaeaea] bg-white px-4 py-3">
                  <div className="text-xs font-medium uppercase tracking-[0.12em] text-[#8b8b8b]">
                    New Responses
                  </div>
                  <div className="mt-2 text-lg font-semibold text-[#242424]">
                    {mergePreview.candidateRows.length}
                  </div>
                </div>
                <div className="rounded-xl border border-[#eaeaea] bg-white px-4 py-3">
                  <div className="text-xs font-medium uppercase tracking-[0.12em] text-[#8b8b8b]">
                    Already Present
                  </div>
                  <div className="mt-2 text-lg font-semibold text-[#242424]">
                    {mergePreview.alreadyPresentCount}
                  </div>
                </div>
                <div className="rounded-xl border border-[#eaeaea] bg-white px-4 py-3">
                  <div className="text-xs font-medium uppercase tracking-[0.12em] text-[#8b8b8b]">
                    Profile Sync Applied
                  </div>
                  <div className="mt-2 text-lg font-semibold text-[#242424]">
                    {mergePreview.alignedCandidateCount}
                  </div>
                </div>
                <div className="rounded-xl border border-[#eaeaea] bg-white px-4 py-3">
                  <div className="text-xs font-medium uppercase tracking-[0.12em] text-[#8b8b8b]">
                    Duplicate Rows In Upload
                  </div>
                  <div className="mt-2 text-lg font-semibold text-[#242424]">
                    {mergePreview.duplicateUploadedCount}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-b border-[#f1f5f9] px-6 py-4">
                <div className="text-sm text-[#525252]">
                  {selectedMergeCandidates.length} of {mergePreview.candidateRows.length} new responses selected
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedMergeRowKeys(mergePreview.candidateRows.map((candidate) => candidate.key))
                    }
                    className="text-sm font-medium text-[#0f766e] transition-colors hover:text-[#115e59]"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedMergeRowKeys([])}
                    className="text-sm font-medium text-[#525252] transition-colors hover:text-[#242424]"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="overflow-auto px-6 py-4">
                <table className="min-w-full divide-y divide-[#ececec] text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.12em] text-[#8b8b8b]">
                      <th className="px-3 py-3">Add</th>
                      <th className="px-3 py-3">Submitted</th>
                      <th className="px-3 py-3">Respondent</th>
                      <th className="px-3 py-3">Department</th>
                      <th className="px-3 py-3">Seniority</th>
                      <th className="px-3 py-3">Projects</th>
                      <th className="px-3 py-3">Profile Sync</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f1f1f1]">
                    {mergePreview.candidateRows.map((candidate) => {
                      const timestamp = formatTimestamp(candidate.row[TIMESTAMP_INDEX] ?? '');
                      const isSelected = selectedMergeKeySet.has(candidate.key);

                      return (
                        <tr key={candidate.key} className={isSelected ? 'bg-[#f8fffd]' : 'bg-white'}>
                          <td className="px-3 py-3 align-top">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleMergeRow(candidate.key)}
                              className="mt-1 h-4 w-4 rounded border-[#d4d4d8] text-[#14b8a6] focus:ring-[#14b8a6]"
                              aria-label={`Select ${candidate.email || candidate.respondentName}`}
                            />
                          </td>
                          <td className="px-3 py-3 align-top text-[#242424]">
                            <div title={timestamp.tooltip}>{timestamp.display}</div>
                          </td>
                          <td className="px-3 py-3 align-top">
                            <div className="flex min-w-[240px] items-center gap-3">
                              <PersonAvatar
                                name={candidate.respondentName}
                                className="h-8 w-8"
                                textClassName="text-xs"
                                hidden={isSensitiveDataHidden}
                              />
                              <div className="min-w-0">
                                <NameCellText
                                  name={candidate.respondentName}
                                  hideSurname={isSensitiveDataHidden}
                                  className="truncate font-medium text-[#242424]"
                                />
                                <div className="truncate text-xs text-[#8b8b8b]">
                                  <SensitiveText as="span" hidden={isSensitiveDataHidden}>
                                    {candidate.email || 'Unknown email'}
                                  </SensitiveText>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 align-top text-[#242424]">
                            {candidate.row[DEPARTMENT_INDEX] || '—'}
                          </td>
                          <td className="px-3 py-3 align-top text-[#242424]">
                            {candidate.row[SENIORITY_INDEX] || '—'}
                          </td>
                          <td className="px-3 py-3 align-top text-[#242424]">
                            <SensitiveText
                              as="div"
                              hidden={isSensitiveDataHidden}
                              title={candidate.row[PROJECTS_INDEX] || undefined}
                              className="max-w-[240px] truncate"
                            >
                              {formatAnswer(candidate.row[PROJECTS_INDEX]).display}
                            </SensitiveText>
                          </td>
                          <td className="px-3 py-3 align-top text-sm text-[#525252]">
                            {candidate.alignedFields.length > 0 ? (
                              <div className="max-w-[240px] rounded-lg border border-[#ccfbf1] bg-[#f0fdfa] px-3 py-2 text-[#0f766e]">
                                Kept current {candidate.alignedFields.join(', ')}
                              </div>
                            ) : (
                              <span className="text-[#8b8b8b]">Used uploaded values</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-[#eaeaea] px-6 py-5">
                <button
                  type="button"
                  onClick={handleCancelMergePreview}
                  className="inline-flex h-[44px] items-center rounded-xl border border-[#e5e7eb] bg-white px-4 text-sm font-medium text-[#525252] transition hover:bg-[#fafafa]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmMerge}
                  disabled={selectedMergeCandidates.length === 0}
                  className="inline-flex h-[44px] items-center gap-2 rounded-xl border border-[#14b8a6] bg-white px-4 text-sm font-medium text-[#0f766e] transition hover:bg-[#f0fdfa] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Check className="h-4 w-4" />
                  Add selected responses
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}

      {hasResponseData ? (
        <DataTable
          selectedSurveyId={selectedSurvey.id}
          columns={selectedSurvey.columns}
          rows={progressivelyVisibleRows}
          sortColumnIndex={sortColumnIndex}
          sortDirection={sortDirection}
          isTableSortPending={isTableSortPending}
          filterMenuColumnIndex={filterMenuColumnIndex}
          columnFilters={columnFilters}
          activeFilterOptions={activeFilterOptions}
          hideProjectAssignments={isSensitiveDataHidden}
          hidePersonSurname={isSensitiveDataHidden}
          onSort={handleSort}
          onToggleFilterMenu={(columnIndex) =>
            setFilterMenuColumnIndex((current) => (current === columnIndex ? null : columnIndex))
          }
          onClearFilter={clearColumnFilter}
          onToggleFilterValue={toggleColumnFilterValue}
          onSelectRow={setSelectedRowKey}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-[#cbd5e1] bg-[linear-gradient(135deg,#f8fafc_0%,#ffffff_100%)] p-8 shadow-sm">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center rounded-full border border-[#dbeafe] bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#1d4ed8]">
              No responses yet
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-[#0f172a]">
              Upload a survey CSV to populate the dashboard.
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#475569]">
              The app is ready, but there are no uploaded survey results yet. Run one of the surveys,
              export the responses as CSV, and upload it here to unlock organization, team, people,
              project, department, and seniority insights.
            </p>

            <div className="mt-6 grid gap-3 text-left md:grid-cols-3">
              <div className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-4">
                <div className="text-xs font-medium uppercase tracking-[0.12em] text-[#94a3b8]">
                  Step 1
                </div>
                <div className="mt-2 text-sm font-semibold text-[#1e293b]">
                  Run the survey
                </div>
                <div className="mt-1 text-sm leading-6 text-[#64748b]">
                  Send the survey forms from the Surveys page and collect responses.
                </div>
              </div>
              <div className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-4">
                <div className="text-xs font-medium uppercase tracking-[0.12em] text-[#94a3b8]">
                  Step 2
                </div>
                <div className="mt-2 text-sm font-semibold text-[#1e293b]">
                  Export the CSV
                </div>
                <div className="mt-1 text-sm leading-6 text-[#64748b]">
                  Download the responses CSV from Google Forms for the matching survey.
                </div>
              </div>
              <div className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-4">
                <div className="text-xs font-medium uppercase tracking-[0.12em] text-[#94a3b8]">
                  Step 3
                </div>
                <div className="mt-2 text-sm font-semibold text-[#1e293b]">
                  Upload it here
                </div>
                <div className="mt-1 text-sm leading-6 text-[#64748b]">
                  Choose the survey first, then upload the CSV to start analyzing results.
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-[#e2e8f0] bg-white px-5 py-4 text-left">
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-[#8b8b8b]">
                Selected survey
              </div>
              <div className="mt-2 flex items-center gap-3">
                <SurveyAvatar
                  surveyId={selectedSurvey.id}
                  label={selectedSurveyMeta?.title ?? selectedSurvey.id}
                  className="h-10 w-10"
                  textClassName="text-xs"
                />
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-[#242424]">
                    {selectedSurveyMeta?.title ?? selectedSurvey.id}
                  </div>
                  <div className="truncate text-xs text-[#8b8b8b]">
                    {questionColumns.length} questions ready for upload mapping
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedResponse && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/50" onClick={() => setSelectedRowKey(null)} />
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
            onClick={() => setSelectedRowKey(null)}
          >
            <div
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl border border-[#eaeaea] bg-white shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-[#eaeaea] px-6 py-4">
                <div className="flex items-center gap-3">
                  <PersonAvatar
                    name={nameFromEmail(selectedResponse[USERNAME_INDEX] ?? '')}
                    className="h-10 w-10"
                    textClassName="text-sm"
                    hidden={isSensitiveDataHidden}
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-[#242424]">
                      <NameCellText
                        name={
                          selectedFormattedRow?.respondentName ??
                          resolvePersonName(selectedResponse[USERNAME_INDEX] ?? '')
                        }
                        hideSurname={isSensitiveDataHidden}
                        className="max-w-full truncate"
                      />
                    </h3>
                    <p className="text-sm text-[#8b8b8b]">
                      <SensitiveText as="span" hidden={isSensitiveDataHidden}>
                        {selectedResponse[USERNAME_INDEX] || 'Unknown respondent'}
                      </SensitiveText>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedRowKey(null)}
                  className="p-1 text-[#8b8b8b] transition-colors hover:text-[#242424]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-[#fcfcfc] px-6 py-5">
                <div className="mb-5 grid gap-3 md:grid-cols-4">
                  <div className="rounded-lg border border-[#eaeaea] bg-white p-4">
                    <div className="text-xs font-medium uppercase tracking-[0.12em] text-[#8b8b8b]">
                      Submitted At
                    </div>
                    <div className="mt-2 text-sm font-medium text-[#242424]">
                      {formatTimestamp(selectedResponse[TIMESTAMP_INDEX] ?? '').tooltip}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#eaeaea] bg-white p-4">
                    <div className="text-xs font-medium uppercase tracking-[0.12em] text-[#8b8b8b]">
                      Department
                    </div>
                    <div className="mt-2 text-sm font-medium text-[#242424]">
                      {selectedResponse[DEPARTMENT_INDEX] || '—'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#eaeaea] bg-white p-4">
                    <div className="text-xs font-medium uppercase tracking-[0.12em] text-[#8b8b8b]">
                      Seniority
                    </div>
                    <div className="mt-2 text-sm font-medium text-[#242424]">
                      {selectedResponse[SENIORITY_INDEX] || '—'}
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#eaeaea] bg-white p-4">
                    <div className="text-xs font-medium uppercase tracking-[0.12em] text-[#8b8b8b]">
                      Projects
                    </div>
                    <div className="mt-2 text-sm font-medium text-[#242424]">
                      <SensitiveText as="span" hidden={isSensitiveDataHidden}>
                        {formatAnswer(selectedResponse[PROJECTS_INDEX]).display}
                      </SensitiveText>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-[#eaeaea] bg-white p-5">
                  <div className="mb-4 text-sm font-semibold text-[#242424]">
                    All Questions
                  </div>
                  <div className="space-y-3">
                    {questionColumns.map((question, questionIndex) => {
                      const answer = formatAnswer(
                        selectedResponse[questionIndex + SURVEY_PROFILE_COLUMN_COUNT],
                      );

                      return (
                        <div
                          key={`${selectedSurvey.id}-question-${questionIndex}`}
                          className="rounded-lg border border-[#f0f0f0] bg-[#fafafa] px-4 py-3"
                        >
                          <div className="text-xs font-medium uppercase tracking-wide text-[#8b8b8b]">
                            Question {questionIndex + 1}
                          </div>
                          <div className="mt-1 text-sm font-medium text-[#242424]">
                            {question}
                          </div>
                          <div className="mt-2 whitespace-pre-line text-sm leading-6 text-[#4b5563]">
                            {answer.tooltip ?? answer.display}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
