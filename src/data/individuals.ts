import type { Individual, RoleType, TechDimension } from './types';
import { rawResponses } from './survey/responses';
import {
  computeScores,
  nameFromEmail,
  primaryProject,
  allProjectsList,
  roleFromDepartment,
} from './survey/scoring';

const NON_TECH_ROLES = new Set(['PM', 'Sales', 'HR', 'Marketing', 'Finance']);

function deriveIndividual(
  response: (typeof rawResponses)[number],
  resolvePersonName: (username: string) => string = nameFromEmail,
): Individual {
  const r = response;
  const result = computeScores(r);

  const role = roleFromDepartment(r.department);
  const roleType: RoleType =
    r.surveyType === 'business' || NON_TECH_ROLES.has(role) ? 'non-tech' : 'tech';

  const scores: Record<TechDimension, number> = {
    'Usage': result.dimensions['Usage'].score,
    'Skills': result.dimensions['Skills'].score,
    'Impact': result.dimensions['Impact'].score,
    'Culture': result.dimensions['Culture'].score,
    'Vision': result.dimensions['Vision'].score,
  };

  return {
    id: r.username.split('@')[0],
    name: resolvePersonName(r.username),
    role,
    department: r.department,
    seniority: r.seniority,
    surveyType: r.surveyType ?? 'delivery-engineering',
    roleType,
    project: primaryProject(r.projects),
    allProjects: allProjectsList(r.projects),
    overallLevel: result.overall.level,
    overallScore: result.overall.score,
    scores,
    questionScores: result.questionScores,
    lastUpdated: r.timestamp,
    submissionCount: 1,
    credibilityWarning: result.credibilityWarning,
  };
}

export function deriveIndividualsFromResponses(
  responses: typeof rawResponses,
  resolvePersonName: (username: string) => string = nameFromEmail,
): Individual[] {
  return responses.map((response) => deriveIndividual(response, resolvePersonName));
}

export const individuals: Individual[] = deriveIndividualsFromResponses(rawResponses);
