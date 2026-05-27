import type { RawResponse } from './scoring';
import { rawSurveyDatasets, type RawSurveyDataset } from './rawDatasets';

type RawResponseField = Exclude<keyof RawResponse, 'surveyType'>;
type SurveyType = NonNullable<RawResponse['surveyType']>;

const DELIVERY_ENGINEERING_FIELDS = [
  'timestamp',
  'username',
  'consent',
  'department',
  'seniority',
  'projects',
  'q1_1',
  'q1_2',
  'q1_3',
  'q1_4',
  'q1_5',
  'q1_6',
  'q1_7',
  'q1_8',
  'q1_9',
  'q1_10',
  'q1_11',
  'q2_1',
  'q2_2',
  'q2_3',
  'q2_4',
  'q2_5',
  'q2_6',
  'q2_7',
  'q2_8',
  'q2_9',
  'q2_10',
  'q2_11',
  'q2_12',
  'q2_13',
  'q2_14',
  'q2_15',
  'q3_1',
  'q3_2',
  'q3_3',
  'q3_4',
  'q3_5',
  'q3_6',
  'q3_7',
  'q3_8',
  'q3_9',
  'q3_10',
  'q3_11',
  'q3_12',
  'q4_1',
  'q4_2',
  'q4_3',
  'q4_4',
  'q4_5',
  'q4_6',
  'q4_7',
  'q4_8',
  'q4_9',
  'q4_10',
  'q4_11',
  'q4_12',
  'q4_13',
  'q4_14',
  'q5_1',
  'q5_2',
  'q5_3',
  'q5_4',
  'q5_5',
  'q5_6',
  'q4_open',
] as const satisfies ReadonlyArray<RawResponseField>;

function toIsoTimestamp(rawValue: string): string {
  const normalized = rawValue.replace(/ GMT([+-]\d{1,2})$/, (_, hours: string) => {
    const sign = hours.startsWith('-') ? '-' : '+';
    const digits = hours.replace(/[+-]/, '').padStart(2, '0');
    return ` GMT${sign}${digits}:00`;
  });

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? rawValue : date.toISOString();
}

function mapRowToResponse(
  row: string[],
  fields: ReadonlyArray<RawResponseField>,
  surveyType: SurveyType,
): RawResponse {
  const response = {} as RawResponse;

  fields.forEach((field, index) => {
    response[field] = row[index] ?? '';
  });

  response.surveyType = surveyType;

  if (response.timestamp) {
    response.timestamp = toIsoTimestamp(response.timestamp);
  }

  return response;
}

function pick(row: string[], index: number): string {
  return row[index] ?? '';
}

function mapBusinessRow(row: string[]): RawResponse {
  const response: RawResponse = {
    surveyType: 'business',
    timestamp: pick(row, 0),
    username: pick(row, 1),
    consent: pick(row, 2),
    department: pick(row, 3),
    seniority: pick(row, 4),
    projects: pick(row, 5),

    // Dimension 1: Usage
    q1_1: pick(row, 6),
    q1_2: pick(row, 7),
    q1_3: pick(row, 8),
    q1_4: pick(row, 9),
    q1_5: pick(row, 10),
    q1_6: pick(row, 11),
    q1_7: pick(row, 12),
    q1_8: pick(row, 13),
    q1_9: pick(row, 14),
    q1_10: pick(row, 15),
    q1_11: pick(row, 16),

    // Dimension 2: Skills
    q2_1: pick(row, 17),
    q2_2: pick(row, 18),
    q2_3: pick(row, 19),
    q2_4: pick(row, 20),
    q2_5: pick(row, 21),
    q2_6: pick(row, 22),
    q2_7: pick(row, 23),
    q2_8: pick(row, 24),
    q2_9: pick(row, 25),
    q2_10: pick(row, 26),
    q2_11: pick(row, 27),
    q2_12: '',
    q2_13: '',
    q2_14: '',
    q2_15: '',

    // Dimension 3: Impact
    q3_1: pick(row, 28),
    q3_2: pick(row, 29),
    q3_3: pick(row, 30),
    q3_4: pick(row, 31),
    q3_5: pick(row, 32),
    q3_6: pick(row, 33),
    q3_7: pick(row, 34),
    q3_8: pick(row, 35),
    q3_9: pick(row, 36),
    q3_10: pick(row, 37),
    q3_11: pick(row, 38),
    q3_12: pick(row, 39),
    q3_blocker: pick(row, 40),

    // Dimension 4: Culture
    q4_1: pick(row, 41),
    q4_2: pick(row, 42),
    q4_3: pick(row, 43),
    q4_4: pick(row, 44),
    q4_5: pick(row, 45),
    q4_6: pick(row, 46),
    q4_7: pick(row, 47),
    q4_8: pick(row, 48),
    q4_9: pick(row, 49),
    q4_10: pick(row, 50),
    q4_11: pick(row, 51),
    q4_12: pick(row, 52),
    q4_13: pick(row, 53),
    q4_14: pick(row, 54),

    // Dimension 5: Vision
    q5_1: pick(row, 55),
    q5_2: pick(row, 56),
    q5_3: pick(row, 57),
    q5_4: pick(row, 58),
    q5_5: pick(row, 59),
    q5_6: pick(row, 60),

    // Open text
    q4_open: '',
    q_open_final: pick(row, 61),
  };

  if (response.timestamp) {
    response.timestamp = toIsoTimestamp(response.timestamp);
  }

  return response;
}

function shouldIncludeResponse(response: RawResponse): boolean {
  if (!response.username) return false;
  if (!response.consent) return true;
  return !response.consent.toLowerCase().startsWith('no');
}

export function buildRawResponsesFromDatasets(datasets: RawSurveyDataset[]): RawResponse[] {
  const deliveryEngineeringDataset = datasets.find((dataset) => dataset.id === 'delivery-engineering');
  const businessDataset = datasets.find((dataset) => dataset.id === 'business');

  if (!deliveryEngineeringDataset) {
    throw new Error('Delivery & Engineering raw survey dataset is missing.');
  }

  if (!businessDataset) {
    throw new Error('Business raw survey dataset is missing.');
  }

  return [
    ...deliveryEngineeringDataset.rows.map((row) =>
      mapRowToResponse(row, DELIVERY_ENGINEERING_FIELDS, 'delivery-engineering'),
    ),
    ...businessDataset.rows.map(mapBusinessRow),
  ].filter(shouldIncludeResponse);
}

export const rawResponses: RawResponse[] = buildRawResponsesFromDatasets(rawSurveyDatasets);
