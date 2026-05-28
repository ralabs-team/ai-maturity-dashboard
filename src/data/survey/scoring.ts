// AI Adoption Maturity Index — Scoring Engine
//
// Implements the scoring spec:
//   - 5 dimensions (Usage, Skills, Impact, Culture, Vision)
//   - Survey-specific scored question sets
//   - Question scores are calculated on a native 1..5 scale
//   - Per-dimension score = weighted average of its non-SKIP question scores
//   - Overall score = weighted average of the 5 dimensions
//   - Level (1..5) derived from threshold buckets in `scoreToLevel`

import type { TechDimension } from '../types';
import {
  scoreBusinessCultureEntries,
  scoreBusinessImpactEntries,
  scoreBusinessSkillsEntries,
  scoreBusinessUsageEntries,
} from './scoring/business';
import { scoreBusinessVisionEntries } from './scoring/vision.business';
import { scoreCultureEntries } from './scoring/culture';
import { scoreImpactEntries } from './scoring/impact';
import {
  aggregate,
  checkCredibility,
  computeGuardrailedOverallLevel,
  computeOverallScoreFromDimensionScores,
  DIMENSION_WEIGHTS,
  LEVEL_LABELS_INDEX,
  QUESTION_WEIGHTS,
  type DimensionDetail,
  type QEntry,
  type QuestionScore,
  type RawResponse,
  type ScoringResult,
} from './scoring/shared';
import { scoreSkillsEntries } from './scoring/skills';
import { scoreUsageEntries } from './scoring/usage';
import { scoreDeliveryEngineeringVisionEntries } from './scoring/vision.deliveryEngineering';

export {
  computeOverallScoreFromDimensionScores,
  DIMENSION_WEIGHTS,
  LEVEL_LABELS_INDEX,
  QUESTION_WEIGHTS,
};
export type {
  DimensionDetail,
  QuestionScore,
  RawResponse,
  ScoringResult,
};

export function computeScores(r: RawResponse): ScoringResult {
  const surveyType = r.surveyType ?? 'delivery-engineering';
  const questionScores: Record<string, QuestionScore> = {};

  const utilization: QEntry[] = surveyType === 'business'
    ? scoreBusinessUsageEntries(r)
    : scoreUsageEntries(r);
  const competence: QEntry[] = surveyType === 'business'
    ? scoreBusinessSkillsEntries(r)
    : scoreSkillsEntries(r);
  const impact: QEntry[] = surveyType === 'business'
    ? scoreBusinessImpactEntries(r)
    : scoreImpactEntries(r);
  const culture: QEntry[] = surveyType === 'business'
    ? scoreBusinessCultureEntries(r)
    : scoreCultureEntries(r);
  const vision: QEntry[] = surveyType === 'business'
    ? scoreBusinessVisionEntries(r)
    : scoreDeliveryEngineeringVisionEntries(r);

  for (const entry of [...utilization, ...competence, ...impact, ...culture, ...vision]) {
    questionScores[entry.qid] = entry.score;
  }

  const dimensions: Record<TechDimension, DimensionDetail> = {
    'Usage': aggregate(utilization),
    'Skills': aggregate(competence),
    'Impact': aggregate(impact),
    'Culture': aggregate(culture),
    'Vision': aggregate(vision),
  };

  const overallScore = computeOverallScoreFromDimensionScores({
    'Usage': dimensions['Usage'].score,
    'Skills': dimensions['Skills'].score,
    'Impact': dimensions['Impact'].score,
    'Culture': dimensions['Culture'].score,
    'Vision': dimensions['Vision'].score,
  });
  const overallLevel = computeGuardrailedOverallLevel(overallScore, {
    'Usage': dimensions['Usage'].score,
    'Skills': dimensions['Skills'].score,
    'Impact': dimensions['Impact'].score,
    'Culture': dimensions['Culture'].score,
    'Vision': dimensions['Vision'].score,
  });

  return {
    dimensions,
    overall: {
      score: overallScore,
      level: overallLevel,
    },
    credibilityWarning: surveyType === 'delivery-engineering' ? checkCredibility(r.q2_9) : false,
    questionScores,
  };
}

export function computeCompositeQuestionScore(
  questionScores: Record<string, QuestionScore>,
  questionKeys: string[],
): number | null {
  const validScores = questionKeys
    .map((questionKey) => questionScores[questionKey])
    .filter((score): score is number => typeof score === 'number');

  if (validScores.length === 0) {
    return null;
  }

  return validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
}

export function nameFromEmail(email: string): string {
  const local = email.split('@')[0];
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

const PROJECT_ALIASES: Record<string, string> = {
  'OPERA': 'RMSL Opera',
  'OPERAi': 'RMSL Opera',
  'Clover': 'RMSL Clover',
};

function normalizeProject(name: string): string {
  return PROJECT_ALIASES[name] || name;
}

function isSameProjectName(left: string, right: string): boolean {
  return left.localeCompare(right, undefined, { sensitivity: 'base' }) === 0;
}

function splitCommaSeparatedValues(rawValue: string): string[] {
  return rawValue
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

export function allProjectsList(projectsField: string): string[] {
  if (!projectsField) return ['Unassigned'];
  const cleaned = projectsField.replace(/^[A-Z]+:\s*/, '');
  const parts = splitCommaSeparatedValues(cleaned);
  if (parts.length === 0) return ['Unassigned'];
  return Array.from(new Set(parts.map(normalizeProject)));
}

export function primaryProject(projectsField: string): string {
  return allProjectsList(projectsField)[0];
}

export function allDepartmentsList(departmentsField: string): string[] {
  if (!departmentsField) return ['Unassigned'];
  const parts = splitCommaSeparatedValues(departmentsField);
  if (parts.length === 0) return ['Unassigned'];
  return Array.from(new Set(parts));
}

export function primaryDepartment(departmentsField: string): string {
  return allDepartmentsList(departmentsField)[0];
}

export function renameProjectInProjectsField(
  projectsField: string,
  previousName: string,
  nextName: string,
): string {
  const sanitizedPreviousName = previousName.trim();
  const sanitizedNextName = nextName.trim().replace(/\s+/g, ' ');

  if (!sanitizedPreviousName || !sanitizedNextName) {
    return projectsField;
  }

  const prefixMatch = projectsField.match(/^([A-Z]+:\s*)/);
  const prefix = prefixMatch?.[1] ?? '';
  const cleanedProjectsField = prefix ? projectsField.slice(prefix.length) : projectsField;
  const projectParts = cleanedProjectsField
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (projectParts.length === 0) {
    return projectsField;
  }

  let hasChanges = false;

  const renamedProjects = projectParts.map((projectName) => {
    if (!isSameProjectName(normalizeProject(projectName), sanitizedPreviousName)) {
      return projectName;
    }

    hasChanges = true;
    return sanitizedNextName;
  });

  return hasChanges ? `${prefix}${renamedProjects.join(', ')}` : projectsField;
}

export function renameDepartmentInDepartmentsField(
  departmentsField: string,
  previousName: string,
  nextName: string,
): string {
  const sanitizedPreviousName = previousName.trim();
  const sanitizedNextName = nextName.trim().replace(/\s+/g, ' ');

  if (!sanitizedPreviousName || !sanitizedNextName) {
    return departmentsField;
  }

  const departmentParts = splitCommaSeparatedValues(departmentsField);

  if (departmentParts.length === 0) {
    return departmentsField;
  }

  let hasChanges = false;

  const renamedDepartments = departmentParts.map((departmentName) => {
    if (!isSameProjectName(departmentName, sanitizedPreviousName)) {
      return departmentName;
    }

    hasChanges = true;
    return sanitizedNextName;
  });

  return hasChanges ? Array.from(new Set(renamedDepartments)).join(', ') : departmentsField;
}

export function roleFromDepartment(dept: string): string {
  const primaryDept = primaryDepartment(dept);
  const map: Record<string, string> = {
    'Software Engineering': 'Engineer',
    'Quality Assurance (Manual / Automated)': 'QA Engineer',
    'DevOps': 'DevOps',
    'Design (UI/UX)': 'Designer',
    'Data Analyst': 'Data Analyst',
  };
  return map[primaryDept] || primaryDept;
}
