import Papa from 'papaparse';
import {
  BUSINESS_OPEN_QUESTIONS,
  BUSINESS_QUESTIONS,
  DELIVERY_ENGINEERING_OPEN_QUESTIONS,
  DELIVERY_ENGINEERING_QUESTIONS,
} from './questions';

export const SURVEY_PROFILE_COLUMN_COUNT = 6;
export const DEFAULT_RAW_SURVEY_ID = 'delivery-engineering';
export const SURVEY_USERNAME_COLUMN_INDEX = 1;
export const SURVEY_PROJECTS_COLUMN_INDEX = 5;
export const SURVEY_DEPARTMENT_COLUMN_INDEX = 3;
export const SURVEY_SENIORITY_COLUMN_INDEX = 4;

export interface RawSurveyDataset {
  id: string;
  columns: string[];
  rows: string[][];
}

export function parseCsv(csv: string): Pick<RawSurveyDataset, 'columns' | 'rows'> {
  const parsed = Papa.parse<string[]>(csv, {
    header: false,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    console.warn('[survey] CSV parse warnings', parsed.errors);
  }

  const [headerRow = [], ...dataRows] = parsed.data;
  const columnCount = headerRow.length;

  return {
    columns: headerRow,
    rows: dataRows
      .filter((row) => row.some((cell) => cell?.trim()))
      .map((row) => Array.from({ length: columnCount }, (_, index) => row[index] ?? '')),
  };
}

export function stringifyCsv(dataset: Pick<RawSurveyDataset, 'columns' | 'rows'>): string {
  return Papa.unparse([dataset.columns, ...dataset.rows]);
}

const DEFAULT_RAW_SURVEY_ORDER = ['delivery-engineering', 'business'] as const;

const SURVEY_PROFILE_COLUMNS = [
  'Timestamp',
  'Username',
  'Consent',
  'Department',
  'Seniority',
  'Projects',
] as const;

const defaultRawSurveyColumnsById: Record<(typeof DEFAULT_RAW_SURVEY_ORDER)[number], string[]> = {
  'delivery-engineering': [
    ...SURVEY_PROFILE_COLUMNS,
    ...DELIVERY_ENGINEERING_QUESTIONS.map((question) => question.text),
    ...DELIVERY_ENGINEERING_OPEN_QUESTIONS.map((question) => question.text),
  ],
  business: [
    ...SURVEY_PROFILE_COLUMNS,
    ...BUSINESS_QUESTIONS.map((question) => question.text),
    ...BUSINESS_OPEN_QUESTIONS.map((question) => question.text),
  ],
};

function buildDefaultRawSurveyDatasets(): RawSurveyDataset[] {
  return DEFAULT_RAW_SURVEY_ORDER.map((id) => ({
    id,
    columns: defaultRawSurveyColumnsById[id],
    rows: [],
  }));
}

export const defaultRawSurveyDatasets: RawSurveyDataset[] = buildDefaultRawSurveyDatasets();

const defaultRawSurveyDatasetsById = new Map(
  defaultRawSurveyDatasets.map((dataset) => [dataset.id, dataset]),
);

export function buildRawSurveyDatasets(
  csvOverrides: Partial<Record<string, string>> = {},
): RawSurveyDataset[] {
  return DEFAULT_RAW_SURVEY_ORDER.map((id) => {
    const defaultDataset = defaultRawSurveyDatasetsById.get(id);

    if (!defaultDataset) {
      throw new Error(`Default raw survey dataset is missing for "${id}".`);
    }

    if (!(id in csvOverrides)) {
      return {
        id,
        columns: defaultDataset.columns,
        rows: [],
      };
    }

    return {
      id,
      ...parseCsv(csvOverrides[id] ?? ''),
    };
  });
}

export const rawSurveyDatasets: RawSurveyDataset[] = buildRawSurveyDatasets();

export function getRawSurveyDataset(id: string): RawSurveyDataset | undefined {
  return rawSurveyDatasets.find((dataset) => dataset.id === id);
}

export function getDefaultRawSurveyDataset(id: string): RawSurveyDataset | undefined {
  return defaultRawSurveyDatasets.find((dataset) => dataset.id === id);
}
