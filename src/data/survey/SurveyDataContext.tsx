import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { deriveIndividualsFromResponses } from '../individuals';
import { deriveOrgAverageScores } from '../projects';
import type { Individual, TechDimension } from '../types';
import {
  allDepartmentsList,
  nameFromEmail,
  renameDepartmentInDepartmentsField,
  renameProjectInProjectsField,
  type RawResponse,
} from './scoring';
import {
  buildRawSurveyDatasets,
  getDefaultRawSurveyDataset,
  parseCsv,
  SURVEY_DEPARTMENT_COLUMN_INDEX,
  SURVEY_SENIORITY_COLUMN_INDEX,
  SURVEY_USERNAME_COLUMN_INDEX,
  stringifyCsv,
  SURVEY_PROJECTS_COLUMN_INDEX,
  type RawSurveyDataset,
} from './rawDatasets';
import { buildRawResponsesFromDatasets } from './responses';

const STORAGE_KEY = 'ai-maturity-dashboard.survey-csv-overrides.v1';
const PERSON_NAME_OVERRIDES_STORAGE_KEY = 'ai-maturity-dashboard.person-name-overrides.v1';

type SurveyCsvOverrides = Partial<Record<string, string>>;
type PersonNameOverrides = Record<string, string>;

interface SurveyDataContextValue {
  rawSurveyDatasets: RawSurveyDataset[];
  rawResponses: RawResponse[];
  individuals: Individual[];
  orgAvgScores: Record<TechDimension, number>;
  hasResponseData: boolean;
  replaceSurveyCsv: (surveyId: string, csvText: string) => void;
  resetSurveyCsv: (surveyId: string) => void;
  resetAllSurveyCsvs: () => void;
  isSurveyOverridden: (surveyId: string) => boolean;
  renameProject: (previousName: string, nextName: string) => void;
  renameDepartment: (previousName: string, nextName: string) => void;
  renameSeniority: (previousName: string, nextName: string) => void;
  renamePerson: (username: string, nextName: string) => void;
  updatePersonDepartment: (username: string, nextDepartment: string) => void;
  updatePersonProjects: (username: string, nextProjects: string) => void;
  resolvePersonName: (username: string) => string;
}

const SurveyDataContext = createContext<SurveyDataContextValue | null>(null);

function validateSurveyDataset(dataset: RawSurveyDataset): void {
  const defaultDataset = getDefaultRawSurveyDataset(dataset.id);

  if (!defaultDataset) {
    throw new Error(`Unknown survey "${dataset.id}".`);
  }

  if (dataset.columns.length === 0) {
    throw new Error('The uploaded CSV is empty or missing a header row.');
  }

  if (dataset.columns.length < defaultDataset.columns.length) {
    throw new Error(
      `This CSV has ${dataset.columns.length} columns, but "${dataset.id}" expects at least ${defaultDataset.columns.length}.`,
    );
  }
}

function sanitizeCsvOverrides(rawValue: unknown): SurveyCsvOverrides {
  if (!rawValue || typeof rawValue !== 'object') {
    return {};
  }

  const sanitized: SurveyCsvOverrides = {};

  for (const [surveyId, csvText] of Object.entries(rawValue)) {
    if (typeof csvText !== 'string' || csvText.trim() === '') {
      continue;
    }

    try {
      validateSurveyDataset({
        id: surveyId,
        ...parseCsv(csvText),
      });
      sanitized[surveyId] = csvText;
    } catch (error) {
      console.warn(`[survey] Ignoring invalid stored CSV override for "${surveyId}"`, error);
    }
  }

  return sanitized;
}

function readStoredOverrides(): SurveyCsvOverrides {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? sanitizeCsvOverrides(JSON.parse(stored)) : {};
  } catch (error) {
    console.warn('[survey] Failed to restore stored CSV overrides', error);
    return {};
  }
}

function sanitizePersonNameOverrides(rawValue: unknown): PersonNameOverrides {
  if (!rawValue || typeof rawValue !== 'object') {
    return {};
  }

  const sanitized: PersonNameOverrides = {};

  for (const [username, displayName] of Object.entries(rawValue)) {
    if (typeof displayName !== 'string') {
      continue;
    }

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedDisplayName = displayName.trim().replace(/\s+/g, ' ');

    if (!normalizedUsername || !normalizedDisplayName) {
      continue;
    }

    sanitized[normalizedUsername] = normalizedDisplayName;
  }

  return sanitized;
}

function readStoredPersonNameOverrides(): PersonNameOverrides {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const stored = window.localStorage.getItem(PERSON_NAME_OVERRIDES_STORAGE_KEY);
    return stored ? sanitizePersonNameOverrides(JSON.parse(stored)) : {};
  } catch (error) {
    console.warn('[survey] Failed to restore stored person name overrides', error);
    return {};
  }
}

function renameExactFieldValue(
  currentValue: string,
  previousName: string,
  nextName: string,
): string {
  const sanitizedCurrentValue = currentValue.trim();
  const sanitizedPreviousName = previousName.trim();
  const sanitizedNextName = nextName.trim().replace(/\s+/g, ' ');

  if (!sanitizedCurrentValue || !sanitizedPreviousName || !sanitizedNextName) {
    return currentValue;
  }

  return sanitizedCurrentValue.localeCompare(sanitizedPreviousName, undefined, {
    sensitivity: 'base',
  }) === 0
    ? sanitizedNextName
    : currentValue;
}

function sanitizeDepartmentMemberships(rawValue: string): string {
  return allDepartmentsList(rawValue).join(', ');
}

export function SurveyDataProvider({ children }: { children: ReactNode }) {
  const [csvOverrides, setCsvOverrides] = useState<SurveyCsvOverrides>(() => readStoredOverrides());
  const [personNameOverrides, setPersonNameOverrides] = useState<PersonNameOverrides>(() =>
    readStoredPersonNameOverrides(),
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (Object.keys(csvOverrides).length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(csvOverrides));
  }, [csvOverrides]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (Object.keys(personNameOverrides).length === 0) {
      window.localStorage.removeItem(PERSON_NAME_OVERRIDES_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(
      PERSON_NAME_OVERRIDES_STORAGE_KEY,
      JSON.stringify(personNameOverrides),
    );
  }, [personNameOverrides]);

  const rawSurveyDatasets = useMemo(() => buildRawSurveyDatasets(csvOverrides), [csvOverrides]);
  const rawResponses = useMemo(
    () => buildRawResponsesFromDatasets(rawSurveyDatasets),
    [rawSurveyDatasets],
  );
  const resolvePersonName = useMemo(
    () => (username: string) =>
      personNameOverrides[username.trim().toLowerCase()] ?? nameFromEmail(username),
    [personNameOverrides],
  );
  const individuals = useMemo(
    () => deriveIndividualsFromResponses(rawResponses, resolvePersonName),
    [rawResponses, resolvePersonName],
  );
  const orgAvgScores = useMemo(
    () => deriveOrgAverageScores(individuals),
    [individuals],
  );
  const hasResponseData = rawResponses.length > 0;

  const value = useMemo<SurveyDataContextValue>(
    () => ({
      rawSurveyDatasets,
      rawResponses,
      individuals,
      orgAvgScores,
      hasResponseData,
      resolvePersonName,
      replaceSurveyCsv: (surveyId: string, csvText: string) => {
        validateSurveyDataset({
          id: surveyId,
          ...parseCsv(csvText),
        });

        setCsvOverrides((current) => ({
          ...current,
          [surveyId]: csvText,
        }));
      },
      resetSurveyCsv: (surveyId: string) => {
        setCsvOverrides((current) => {
          const { [surveyId]: _removed, ...rest } = current;
          return rest;
        });
      },
      resetAllSurveyCsvs: () => {
        setCsvOverrides({});
      },
      isSurveyOverridden: (surveyId: string) => surveyId in csvOverrides,
      renameProject: (previousName: string, nextName: string) => {
        const sanitizedPreviousName = previousName.trim();
        const sanitizedNextName = nextName.trim().replace(/\s+/g, ' ');

        if (!sanitizedPreviousName || !sanitizedNextName || sanitizedPreviousName === sanitizedNextName) {
          return;
        }

        setCsvOverrides((current) => {
          const nextOverrides = { ...current };
          let hasChanges = false;

          for (const dataset of rawSurveyDatasets) {
            const nextRows = dataset.rows.map((row) => {
              const currentProjectsValue = row[SURVEY_PROJECTS_COLUMN_INDEX] ?? '';
              const updatedProjectsValue = renameProjectInProjectsField(
                currentProjectsValue,
                sanitizedPreviousName,
                sanitizedNextName,
              );

              if (updatedProjectsValue === currentProjectsValue) {
                return row;
              }

              hasChanges = true;

              const nextRow = [...row];
              nextRow[SURVEY_PROJECTS_COLUMN_INDEX] = updatedProjectsValue;
              return nextRow;
            });

            if (!nextRows.some((row, index) => row !== dataset.rows[index])) {
              continue;
            }

            nextOverrides[dataset.id] = stringifyCsv({
              columns: dataset.columns,
              rows: nextRows,
            });
          }

          return hasChanges ? nextOverrides : current;
        });
      },
      renameDepartment: (previousName: string, nextName: string) => {
        const sanitizedPreviousName = previousName.trim();
        const sanitizedNextName = nextName.trim().replace(/\s+/g, ' ');

        if (!sanitizedPreviousName || !sanitizedNextName || sanitizedPreviousName === sanitizedNextName) {
          return;
        }

        setCsvOverrides((current) => {
          const nextOverrides = { ...current };
          let hasChanges = false;

          for (const dataset of rawSurveyDatasets) {
            const nextRows = dataset.rows.map((row) => {
              const currentDepartmentValue = row[SURVEY_DEPARTMENT_COLUMN_INDEX] ?? '';
              const updatedDepartmentValue = renameDepartmentInDepartmentsField(
                currentDepartmentValue,
                sanitizedPreviousName,
                sanitizedNextName,
              );

              if (updatedDepartmentValue === currentDepartmentValue) {
                return row;
              }

              hasChanges = true;

              const nextRow = [...row];
              nextRow[SURVEY_DEPARTMENT_COLUMN_INDEX] = updatedDepartmentValue;
              return nextRow;
            });

            if (!nextRows.some((row, index) => row !== dataset.rows[index])) {
              continue;
            }

            nextOverrides[dataset.id] = stringifyCsv({
              columns: dataset.columns,
              rows: nextRows,
            });
          }

          return hasChanges ? nextOverrides : current;
        });
      },
      renameSeniority: (previousName: string, nextName: string) => {
        const sanitizedPreviousName = previousName.trim();
        const sanitizedNextName = nextName.trim().replace(/\s+/g, ' ');

        if (!sanitizedPreviousName || !sanitizedNextName || sanitizedPreviousName === sanitizedNextName) {
          return;
        }

        setCsvOverrides((current) => {
          const nextOverrides = { ...current };
          let hasChanges = false;

          for (const dataset of rawSurveyDatasets) {
            const nextRows = dataset.rows.map((row) => {
              const currentSeniorityValue = row[SURVEY_SENIORITY_COLUMN_INDEX] ?? '';
              const updatedSeniorityValue = renameExactFieldValue(
                currentSeniorityValue,
                sanitizedPreviousName,
                sanitizedNextName,
              );

              if (updatedSeniorityValue === currentSeniorityValue) {
                return row;
              }

              hasChanges = true;

              const nextRow = [...row];
              nextRow[SURVEY_SENIORITY_COLUMN_INDEX] = updatedSeniorityValue;
              return nextRow;
            });

            if (!nextRows.some((row, index) => row !== dataset.rows[index])) {
              continue;
            }

            nextOverrides[dataset.id] = stringifyCsv({
              columns: dataset.columns,
              rows: nextRows,
            });
          }

          return hasChanges ? nextOverrides : current;
        });
      },
      renamePerson: (username: string, nextName: string) => {
        const normalizedUsername = username.trim().toLowerCase();
        const sanitizedNextName = nextName.trim().replace(/\s+/g, ' ');

        if (!normalizedUsername || !sanitizedNextName) {
          return;
        }

        setPersonNameOverrides((current) => {
          const defaultName = nameFromEmail(username);

          if (sanitizedNextName === defaultName) {
            if (!(normalizedUsername in current)) {
              return current;
            }

            const { [normalizedUsername]: _removed, ...rest } = current;
            return rest;
          }

          if (current[normalizedUsername] === sanitizedNextName) {
            return current;
          }

          return {
            ...current,
            [normalizedUsername]: sanitizedNextName,
          };
        });
      },
      updatePersonDepartment: (username: string, nextDepartment: string) => {
        const normalizedUsername = username.trim().toLowerCase();
        const sanitizedNextDepartment = sanitizeDepartmentMemberships(nextDepartment);

        if (!normalizedUsername || !sanitizedNextDepartment) {
          return;
        }

        setCsvOverrides((current) => {
          const nextOverrides = { ...current };
          let hasChanges = false;

          for (const dataset of rawSurveyDatasets) {
            const nextRows = dataset.rows.map((row) => {
              const rowUsername = (row[SURVEY_USERNAME_COLUMN_INDEX] ?? '').trim().toLowerCase();

              if (rowUsername !== normalizedUsername) {
                return row;
              }

              const currentDepartmentValue = row[SURVEY_DEPARTMENT_COLUMN_INDEX] ?? '';

              if (sanitizedNextDepartment === currentDepartmentValue) {
                return row;
              }

              hasChanges = true;

              const nextRow = [...row];
              nextRow[SURVEY_DEPARTMENT_COLUMN_INDEX] = sanitizedNextDepartment;
              return nextRow;
            });

            if (!nextRows.some((row, index) => row !== dataset.rows[index])) {
              continue;
            }

            nextOverrides[dataset.id] = stringifyCsv({
              columns: dataset.columns,
              rows: nextRows,
            });
          }

          return hasChanges ? nextOverrides : current;
        });
      },
      updatePersonProjects: (username: string, nextProjects: string) => {
        const normalizedUsername = username.trim().toLowerCase();
        const sanitizedNextProjects = nextProjects.trim().replace(/\s*,\s*/g, ', ');

        if (!normalizedUsername || !sanitizedNextProjects) {
          return;
        }

        setCsvOverrides((current) => {
          const nextOverrides = { ...current };
          let hasChanges = false;

          for (const dataset of rawSurveyDatasets) {
            const nextRows = dataset.rows.map((row) => {
              const rowUsername = (row[SURVEY_USERNAME_COLUMN_INDEX] ?? '').trim().toLowerCase();

              if (rowUsername !== normalizedUsername) {
                return row;
              }

              const currentProjectsValue = row[SURVEY_PROJECTS_COLUMN_INDEX] ?? '';

              if (sanitizedNextProjects === currentProjectsValue) {
                return row;
              }

              hasChanges = true;

              const nextRow = [...row];
              nextRow[SURVEY_PROJECTS_COLUMN_INDEX] = sanitizedNextProjects;
              return nextRow;
            });

            if (!nextRows.some((row, index) => row !== dataset.rows[index])) {
              continue;
            }

            nextOverrides[dataset.id] = stringifyCsv({
              columns: dataset.columns,
              rows: nextRows,
            });
          }

          return hasChanges ? nextOverrides : current;
        });
      },
    }),
    [
      csvOverrides,
      hasResponseData,
      individuals,
      orgAvgScores,
      personNameOverrides,
      rawResponses,
      rawSurveyDatasets,
      resolvePersonName,
    ],
  );

  return (
    <SurveyDataContext.Provider value={value}>
      {children}
    </SurveyDataContext.Provider>
  );
}

export function useSurveyData(): SurveyDataContextValue {
  const context = useContext(SurveyDataContext);

  if (!context) {
    throw new Error('useSurveyData must be used within a SurveyDataProvider.');
  }

  return context;
}
