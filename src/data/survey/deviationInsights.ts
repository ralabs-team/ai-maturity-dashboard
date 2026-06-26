import type { Individual, TechDimension } from '../types';
import { TECH_DIMENSIONS } from '../types';
import { allProjectsList, type RawResponse } from './scoring';
import { buildTeamValidatedView } from './teamValidatedView';

export type DeviationScope = 'department' | 'team';

export type DeviatingPersonFlag =
  | 'Different but isolated'
  | 'Different and spreading'
  | 'Aligned with peers';

export interface DeviatingPersonRow {
  person: Individual;
  projectDeviation: number | null;
  departmentDeviation: number | null;
  combinedDeviation: number;
  sharingEvidence: number | null;
  projectPeerCount: number;
  departmentPeerCount: number;
  flag: DeviatingPersonFlag;
}

export interface DeviationScopeRow {
  name: string;
  respondents: number;
  avgProjectDeviation: number;
  avgDepartmentDeviation: number;
  avgCombinedDeviation: number;
  highDeviationShare: number;
  isolatedHighDeviationShare: number;
  color: string;
}

const HIGH_DEVIATION_THRESHOLD = 0.75;
const LOW_SHARING_THRESHOLD = 3;

function roundToOne(value: number): number {
  return Number(value.toFixed(1));
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function averageNullable(values: Array<number | null>): number | null {
  const validValues = values.filter((value): value is number => typeof value === 'number');

  if (validValues.length === 0) {
    return null;
  }

  return average(validValues);
}

function normalizedProjectNames(projects: string[]): string[] {
  return Array.from(
    new Set(
      projects
        .map((project) => project.trim())
        .filter((project) => project && project.toLowerCase() !== 'n/a' && project !== 'Unassigned'),
    ),
  );
}

function individualProjectScopeNames(person: Individual): string[] {
  return normalizedProjectNames(person.allProjects);
}

function responseProjectScopeNames(response: RawResponse): string[] {
  return normalizedProjectNames(allProjectsList(response.projects));
}

function peerAverageScores(peers: Individual[]): Record<TechDimension, number> | null {
  if (peers.length === 0) {
    return null;
  }

  return TECH_DIMENSIONS.reduce(
    (record, dimension) => {
      record[dimension] = average(peers.map((peer) => peer.scores[dimension]));
      return record;
    },
    {} as Record<TechDimension, number>,
  );
}

function deviationFromPeers(person: Individual, peers: Individual[]): number | null {
  const averages = peerAverageScores(peers);

  if (!averages) {
    return null;
  }

  return roundToOne(
    average(
      TECH_DIMENSIONS.map((dimension) =>
        Math.abs(person.scores[dimension] - averages[dimension]),
      ),
    ),
  );
}

function projectPeers(person: Individual, individuals: Individual[]): Individual[] {
  const projectNames = new Set(individualProjectScopeNames(person));

  if (projectNames.size === 0) {
    return [];
  }

  return individuals.filter(
    (candidate) =>
      candidate.id !== person.id &&
      individualProjectScopeNames(candidate).some((project) => projectNames.has(project)),
  );
}

function departmentPeers(person: Individual, individuals: Individual[]): Individual[] {
  const departmentNames = new Set(person.allDepartments.filter(Boolean));

  if (departmentNames.size === 0) {
    return [];
  }

  return individuals.filter(
    (candidate) =>
      candidate.id !== person.id &&
      candidate.allDepartments.some((department) => departmentNames.has(department)),
  );
}

function projectPeerResponses(response: RawResponse, responses: RawResponse[]): RawResponse[] {
  const projectNames = new Set(responseProjectScopeNames(response));

  if (projectNames.size === 0) {
    return [];
  }

  return responses.filter(
    (candidate) =>
      candidate !== response &&
      responseProjectScopeNames(candidate).some((project) => projectNames.has(project)),
  );
}

function flagForDeviation(
  combinedDeviation: number,
  sharingEvidence: number | null,
): DeviatingPersonFlag {
  if (combinedDeviation < HIGH_DEVIATION_THRESHOLD) {
    return 'Aligned with peers';
  }

  if (typeof sharingEvidence === 'number' && sharingEvidence < LOW_SHARING_THRESHOLD) {
    return 'Different but isolated';
  }

  return 'Different and spreading';
}

function scopeNamesForPerson(person: Individual, scope: DeviationScope): string[] {
  if (scope === 'department') {
    return person.allDepartments.filter(Boolean);
  }

  return individualProjectScopeNames(person);
}

function deviationScopeColor(row: Omit<DeviationScopeRow, 'color'>): string {
  if (row.avgProjectDeviation >= HIGH_DEVIATION_THRESHOLD && row.avgDepartmentDeviation >= HIGH_DEVIATION_THRESHOLD) {
    return '#dc2626';
  }

  if (row.isolatedHighDeviationShare >= 20) {
    return '#f59e0b';
  }

  if (row.highDeviationShare >= 25) {
    return '#2563eb';
  }

  return '#0f766e';
}

export function buildDeviatingPeopleRows(
  individuals: Individual[],
  responses: RawResponse[],
): DeviatingPersonRow[] {
  const responseById = new Map(
    responses.map((response) => [response.username.split('@')[0], response] as const),
  );

  return individuals
    .map((person) => {
      const currentResponse = responseById.get(person.id);
      const projectPeerList = projectPeers(person, individuals);
      const departmentPeerList = departmentPeers(person, individuals);
      const projectDeviation = deviationFromPeers(person, projectPeerList);
      const departmentDeviation = deviationFromPeers(person, departmentPeerList);
      const sharingEvidence =
        currentResponse
          ? buildTeamValidatedView(
              currentResponse,
              projectPeerResponses(currentResponse, responses),
            ).influenceEvidenceScore
          : null;
      const combinedDeviation =
        roundToOne(
          averageNullable([projectDeviation, departmentDeviation]) ?? 0,
        );

      return {
        person,
        projectDeviation,
        departmentDeviation,
        combinedDeviation,
        sharingEvidence,
        projectPeerCount: projectPeerList.length,
        departmentPeerCount: departmentPeerList.length,
        flag: flagForDeviation(combinedDeviation, sharingEvidence),
      };
    })
    .sort(
      (left, right) =>
        right.combinedDeviation - left.combinedDeviation ||
        (right.projectDeviation ?? 0) - (left.projectDeviation ?? 0) ||
        (right.departmentDeviation ?? 0) - (left.departmentDeviation ?? 0) ||
        (left.sharingEvidence ?? 5) - (right.sharingEvidence ?? 5) ||
        left.person.name.localeCompare(right.person.name),
    );
}

export function buildDeviationScopeRows(
  rows: DeviatingPersonRow[],
  scope: DeviationScope,
): DeviationScopeRow[] {
  const grouped = new Map<string, DeviatingPersonRow[]>();

  for (const row of rows) {
    for (const scopeName of scopeNamesForPerson(row.person, scope)) {
      if (!scopeName) continue;
      const existing = grouped.get(scopeName) ?? [];
      existing.push(row);
      grouped.set(scopeName, existing);
    }
  }

  return Array.from(grouped.entries())
    .map(([name, people]) => {
      const avgProjectDeviation = roundToOne(
        average(people.map((person) => person.projectDeviation ?? 0)),
      );
      const avgDepartmentDeviation = roundToOne(
        average(people.map((person) => person.departmentDeviation ?? 0)),
      );
      const avgCombinedDeviation = roundToOne(
        average(people.map((person) => person.combinedDeviation)),
      );
      const highDeviationShare = roundToOne(
        (people.filter((person) => person.combinedDeviation >= HIGH_DEVIATION_THRESHOLD).length /
          Math.max(people.length, 1)) *
          100,
      );
      const isolatedHighDeviationShare = roundToOne(
        (people.filter((person) => person.flag === 'Different but isolated').length /
          Math.max(people.length, 1)) *
          100,
      );

      const rowWithoutColor = {
        name,
        respondents: people.length,
        avgProjectDeviation,
        avgDepartmentDeviation,
        avgCombinedDeviation,
        highDeviationShare,
        isolatedHighDeviationShare,
      };

      return {
        ...rowWithoutColor,
        color: deviationScopeColor(rowWithoutColor),
      };
    })
    .filter((row) => row.respondents > 0)
    .sort(
      (left, right) =>
        right.avgCombinedDeviation - left.avgCombinedDeviation ||
        right.isolatedHighDeviationShare - left.isolatedHighDeviationShare ||
        right.respondents - left.respondents ||
        left.name.localeCompare(right.name),
    );
}
