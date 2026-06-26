import type { TechDimension } from './maturity';
import {
  scoreBusinessCultureEntries,
  scoreBusinessImpactEntries,
  scoreBusinessSkillsEntries,
  scoreBusinessUsageEntries,
} from './scoring/business';
import { scoreCultureEntries } from './scoring/culture';
import { scoreDeliveryEngineeringVisionEntries } from './scoring/deliveryEngineeringVision';
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
  type SurveyType,
} from './scoring/shared';
import { scoreSkillsEntries } from './scoring/skills';
import { scoreUsageEntries } from './scoring/usage';
import { scoreBusinessVisionEntries } from './scoring/businessVision';

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
  SurveyType,
};

export function computeScores(r: RawResponse): ScoringResult {
  const surveyType = r.surveyType ?? 'delivery-engineering';
  const questionScores: Record<string, QuestionScore> = {};

  const utilization: QEntry[] =
    surveyType === 'business' ? scoreBusinessUsageEntries(r) : scoreUsageEntries(r);
  const competence: QEntry[] =
    surveyType === 'business' ? scoreBusinessSkillsEntries(r) : scoreSkillsEntries(r);
  const impact: QEntry[] =
    surveyType === 'business' ? scoreBusinessImpactEntries(r) : scoreImpactEntries(r);
  const culture: QEntry[] =
    surveyType === 'business' ? scoreBusinessCultureEntries(r) : scoreCultureEntries(r);
  const vision: QEntry[] =
    surveyType === 'business'
      ? scoreBusinessVisionEntries(r)
      : scoreDeliveryEngineeringVisionEntries(r);

  for (const entry of [...utilization, ...competence, ...impact, ...culture, ...vision]) {
    questionScores[entry.qid] = entry.score;
  }

  const dimensions: Record<TechDimension, DimensionDetail> = {
    Usage: aggregate(utilization),
    Skills: aggregate(competence),
    Impact: aggregate(impact),
    Culture: aggregate(culture),
    Vision: aggregate(vision),
  };

  const overallScore = computeOverallScoreFromDimensionScores({
    Usage: dimensions.Usage.score,
    Skills: dimensions.Skills.score,
    Impact: dimensions.Impact.score,
    Culture: dimensions.Culture.score,
    Vision: dimensions.Vision.score,
  });
  const overallLevel = computeGuardrailedOverallLevel(overallScore, {
    Usage: dimensions.Usage.score,
    Skills: dimensions.Skills.score,
    Impact: dimensions.Impact.score,
    Culture: dimensions.Culture.score,
    Vision: dimensions.Vision.score,
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
