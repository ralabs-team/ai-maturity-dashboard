import type {
  TeamSupportDemandPoint,
  TeamToolAccessPoint,
  TeamUsageImpactPoint,
  TeamWorkflowTransformationPoint,
} from './gapInsights';
import { getQuestionsForSurveyType } from './questions';
import type { SurveyType } from '../../shared/survey-domain';
import type { Individual, MaturityLevel, TechDimension } from '../types';
import { scoreToLevel, TECH_DIMENSIONS } from '../types';

export type SuggestedGoalAudience = 'individual' | 'team';

export type SuggestedGoal = {
  id: string;
  audience: SuggestedGoalAudience;
  dimension: TechDimension;
  title: string;
  description: string;
  currentScore: number;
  targetScore: number;
  priorityScore: number;
  rationale: string;
  supportingSignals: string[];
};

export type IndividualGoalCatalogEntry = {
  id: string;
  dimension: TechDimension;
  title: string;
  description: string;
  bestFitLevels: MaturityLevel[];
  questionKeysBySurveyType: Partial<Record<SurveyType, string[]>>;
};

export type TeamGoalCatalogEntry = {
  id: string;
  dimension: TechDimension;
  title: string;
  description: string;
  bestFitLevels: MaturityLevel[];
};

type IndividualGoalContext = {
  person: Individual;
  orgAvgScores: Record<TechDimension, number>;
  roleAverageScores: Record<TechDimension, number> | null;
  teamAverageScores: Record<TechDimension, number> | null;
};

type TeamGoalContext = {
  scopedIndividuals: Individual[];
  allIndividuals: Individual[];
  championShare: number;
  resistanceSummary: {
    score: number;
    highResistanceShare: number;
  };
  usageImpactData: TeamUsageImpactPoint[];
  supportDemandRows: TeamSupportDemandPoint[];
  toolAccessRows: TeamToolAccessPoint[];
  workflowRows: TeamWorkflowTransformationPoint[];
};

export const INDIVIDUAL_GOAL_CATALOG: IndividualGoalCatalogEntry[] = [
  {
    id: 'individual-usage-use-ai-once-real-task',
    dimension: 'Usage',
    title: 'Pick and try one low-risk AI task',
    description:
      'Choose one simple, low-risk real work task where AI is safe to use, try it once, and note whether it helped.',
    bestFitLevels: [1],
    questionKeysBySurveyType: {
      'delivery-engineering': ['1.1', '1.4', '1.6'],
      business: ['1.1', '1.4', '1.6'],
    },
  },
  {
    id: 'individual-skills-approved-tool-basics',
    dimension: 'Skills',
    title: 'Learn the basics of one approved AI tool',
    description:
      'Open one approved AI tool, learn what it can and cannot do, and try one basic prompt related to your work.',
    bestFitLevels: [1],
    questionKeysBySurveyType: {
      'delivery-engineering': ['2.1', '2.2'],
      business: ['2.1', '2.2'],
    },
  },
  {
    id: 'individual-skills-what-not-to-paste',
    dimension: 'Skills',
    title: 'Learn what not to paste into AI',
    description:
      'Understand the basic safety rule: do not paste passwords, credentials, personal data, sensitive client data, or private internal documents unless the tool is approved for it.',
    bestFitLevels: [1, 2],
    questionKeysBySurveyType: {
      'delivery-engineering': ['2.12', '3.11'],
      business: ['2.9'],
    },
  },
  {
    id: 'individual-usage',
    dimension: 'Usage',
    title: 'Make AI part of one recurring weekly workflow',
    description:
      'Move from occasional use to a repeatable habit in one high-frequency task so usage becomes consistent instead of situational.',
    bestFitLevels: [2, 3],
    questionKeysBySurveyType: {
      'delivery-engineering': ['1.1', '1.4', '1.6', '1.8', '1.11'],
      business: ['1.1', '1.4', '1.6', '1.9', '1.10'],
    },
  },
  {
    id: 'individual-usage-three-real-tasks',
    dimension: 'Usage',
    title: 'Try AI on three real tasks this month',
    description:
      'Use AI on three real work tasks, not just curiosity or generic search, and note which one felt most useful.',
    bestFitLevels: [1, 2],
    questionKeysBySurveyType: {
      'delivery-engineering': ['1.1', '1.4', '1.6'],
      business: ['1.1', '1.4', '1.6'],
    },
  },
  {
    id: 'individual-usage-agent-automation',
    dimension: 'Usage',
    title: 'Adopt one repeatable AI workflow to use every week',
    description:
      'Move beyond chat-only usage by setting up one agent, custom GPT, skill, prompt chain, or automation that saves time in a repeated part of your work.',
    bestFitLevels: [3, 4],
    questionKeysBySurveyType: {
      'delivery-engineering': ['1.4', '1.8', '1.10'],
      business: ['1.4', '1.10', '1.11'],
    },
  },
  {
    id: 'individual-usage-team-ritual',
    dimension: 'Culture',
    title: 'Introduce AI into one recurring team ritual',
    description:
      'Bring one practical AI example, experiment, or workflow into planning, retrospectives, reviews, or a weekly sync so AI becomes visible in team behavior.',
    bestFitLevels: [3, 4],
    questionKeysBySurveyType: {
      'delivery-engineering': ['1.6', '1.7', '1.11'],
      business: ['1.7', '1.9', '1.10'],
    },
  },
  {
    id: 'individual-skills-model-experiment',
    dimension: 'Skills',
    title: 'Compare two AI tools on the same real task',
    description:
      'Run the same real task through two tools or models, compare the result, and decide which one works better for that task.',
    bestFitLevels: [3, 4],
    questionKeysBySurveyType: {
      'delivery-engineering': ['2.4', '2.6', '2.11'],
      business: ['2.4', '2.6', '2.10'],
    },
  },
  {
    id: 'individual-skills-better-prompting',
    dimension: 'Skills',
    title: 'Practice better prompting on one task',
    description:
      'Take one task where AI gave a weak answer, improve the prompt with context, examples, and constraints, then compare the output.',
    bestFitLevels: [2],
    questionKeysBySurveyType: {
      'delivery-engineering': ['2.3', '2.6', '2.10'],
      business: ['2.3', '2.4', '2.5'],
    },
  },
  {
    id: 'individual-skills-learn-when-checking-needed',
    dimension: 'Skills',
    title: 'Learn when AI output needs checking',
    description:
      'Identify three situations where AI output should not be trusted without review, such as facts, client data, calculations, legal or medical claims, or production changes.',
    bestFitLevels: [2],
    questionKeysBySurveyType: {
      'delivery-engineering': ['2.2', '2.10', '2.12', '3.11'],
      business: ['2.2', '2.5', '2.9'],
    },
  },
  {
    id: 'individual-skills-validation-checklist',
    dimension: 'Skills',
    title: 'Create a personal AI validation checklist',
    description:
      'Define how you check AI output before using it: facts, logic, sensitive data, tone, edge cases, and whether the answer is too generic.',
    bestFitLevels: [3],
    questionKeysBySurveyType: {
      'delivery-engineering': ['2.2', '2.10', '2.12'],
      business: ['2.2', '2.5', '2.9'],
    },
  },
  {
    id: 'individual-impact-role-specific-use-case',
    dimension: 'Impact',
    title: 'Document one role-specific AI use case',
    description:
      'Capture one real example where AI helped with a task specific to your role, including what you tried, what changed, and what you would repeat.',
    bestFitLevels: [3],
    questionKeysBySurveyType: {
      'delivery-engineering': ['3.1', '3.2', '3.3', '3.5'],
      business: ['3.1', '3.2', '3.4', '3.5'],
    },
  },
  {
    id: 'individual-impact-find-visible-time-savings',
    dimension: 'Impact',
    title: 'Find one task where AI saves visible time',
    description:
      'Pick one repeated task and test whether AI can save at least 15–30 minutes compared with your usual approach.',
    bestFitLevels: [2],
    questionKeysBySurveyType: {
      'delivery-engineering': ['3.1', '3.4', '3.5'],
      business: ['3.1', '3.4', '3.7'],
    },
  },
  {
    id: 'individual-impact-measure-two-weeks',
    dimension: 'Impact',
    title: 'Measure one AI workflow for two weeks',
    description:
      'Track one recurring AI-assisted workflow for two weeks and compare effort, quality, speed, or rework against your previous non-AI approach.',
    bestFitLevels: [4],
    questionKeysBySurveyType: {
      'delivery-engineering': ['3.1', '3.3', '3.4', '3.5'],
      business: ['3.1', '3.4', '3.5', '3.7'],
    },
  },
  {
    id: 'individual-impact-prove-before-after',
    dimension: 'Impact',
    title: 'Prove impact with a before/after example',
    description:
      'Show a concrete before-and-after outcome from AI use, such as reduced research time, faster PR review, better test coverage, quicker estimation, fewer back-and-forth messages, or stronger client reporting, and use the evidence to improve how the team plans or works.',
    bestFitLevels: [5],
    questionKeysBySurveyType: {
      'delivery-engineering': ['3.1', '3.3', '3.4', '3.5'],
      business: ['3.1', '3.4', '3.5', '3.7'],
    },
  },
  {
    id: 'individual-skills-define-where-ai-should-not-be-used',
    dimension: 'Skills',
    title: 'Create a team-facing AI risk and validation guide',
    description:
      'Create a reusable guide that clarifies where AI should be avoided, where extra validation is required, and how to handle sensitive data, hallucination risk, production changes, client data, and IP restrictions.',
    bestFitLevels: [5],
    questionKeysBySurveyType: {
      'delivery-engineering': ['2.2', '2.10', '2.12', '3.11'],
      business: ['2.2', '2.5', '2.9'],
    },
  },
  {
    id: 'individual-culture',
    dimension: 'Culture',
    title: 'Share and document one reusable team practice',
    description:
      'Convert personal know-how into something teammates can reuse without depending on memory, side chats, or one specific person.',
    bestFitLevels: [3, 4],
    questionKeysBySurveyType: {
      'delivery-engineering': ['4.2', '4.3', '4.6', '4.7', '4.14'],
      business: ['4.2', '4.3', '4.12', '4.13', '4.14'],
    },
  },
  {
    id: 'individual-culture-share-weekly-ai-news',
    dimension: 'Culture',
    title: 'Share one practical AI learning per week',
    description:
      'Share one AI insight, tool update, or workflow example each week, with a short note on how it could apply to real team work.',
    bestFitLevels: [1, 2, 3],
    questionKeysBySurveyType: {
      'delivery-engineering': ['4.2', '4.3', '4.11'],
      business: ['4.2', '4.3', '4.9'],
    },
  },
  {
    id: 'individual-culture-ask-teammate-example',
    dimension: 'Culture',
    title: 'Ask a teammate to show one useful AI example',
    description:
      'Ask someone in your team to show one practical AI example they use in real work.',
    bestFitLevels: [1],
    questionKeysBySurveyType: {
      'delivery-engineering': ['4.1', '4.3', '4.11'],
      business: ['4.1', '4.3', '4.9'],
    },
  },
  {
    id: 'individual-culture-help-teammate',
    dimension: 'Culture',
    title: 'Help one teammate adopt an AI workflow end-to-end',
    description:
      'Go beyond sharing tips by helping one teammate apply AI through a full workflow, from setup and first use to a repeatable way of working.',
    bestFitLevels: [3, 4],
    questionKeysBySurveyType: {
      'delivery-engineering': ['4.3', '4.4', '4.5', '4.7'],
      business: ['4.3', '4.4', '4.5', '4.13'],
    },
  },
  {
    id: 'individual-culture-build-for-others',
    dimension: 'Culture',
    title: 'Build for others, not only for yourself',
    description:
      'Create an AI workflow, automation, prompt set, agent, GPT, Claude Skill, or config that at least 2–3 other people actively use in their real work.',
    bestFitLevels: [5],
    questionKeysBySurveyType: {
      'delivery-engineering': ['4.4', '4.5', '4.6', '4.7', '4.14'],
      business: ['4.4', '4.5', '4.12', '4.13', '4.14'],
    },
  },
  {
    id: 'individual-culture-transfer-knowledge-deliberately',
    dimension: 'Culture',
    title: 'Transfer knowledge deliberately',
    description:
      'Mentor others by running a short workshop, pairing with colleagues, recording a demo, or creating a guide, so at least 2–3 people can repeat the workflow without depending on you directly.',
    bestFitLevels: [5],
    questionKeysBySurveyType: {
      'delivery-engineering': ['4.3', '4.4', '4.5', '4.6', '4.14'],
      business: ['4.3', '4.4', '4.5', '4.13', '4.14'],
    },
  },
  {
    id: 'individual-vision',
    dimension: 'Vision',
    title: 'Choose and scope one next-step AI opportunity',
    description:
      'Identify one practical AI opportunity worth pursuing next, define what success looks like, and connect it to a real team or role need.',
    bestFitLevels: [2, 3],
    questionKeysBySurveyType: {
      'delivery-engineering': ['5.1', '5.3', '5.4', '5.6'],
      business: ['5.1', '5.3', '5.4', '5.6'],
    },
  },
  {
    id: 'individual-vision-map-role-fit',
    dimension: 'Vision',
    title: 'Map where AI could fit your role',
    description:
      'List 5 tasks you do often, mark where AI could help, and choose one low-risk task to try first.',
    bestFitLevels: [2],
    questionKeysBySurveyType: {
      'delivery-engineering': ['5.1', '5.3', '5.6'],
      business: ['5.1', '5.3', '5.6'],
    },
  },
  {
    id: 'individual-vision-rank-opportunities',
    dimension: 'Vision',
    title: 'Prioritize the top 3 AI opportunities for your role',
    description:
      'Identify the three highest-value AI opportunities in your role, compare them by effort, expected impact, risk, and reusability, then choose one to test first.',
    bestFitLevels: [3, 4],
    questionKeysBySurveyType: {
      'delivery-engineering': ['5.1', '5.4', '5.5', '5.6'],
      business: ['5.1', '5.4', '5.5', '5.6'],
    },
  },
];

export const TEAM_GOAL_CATALOG: TeamGoalCatalogEntry[] = [
  {
    id: 'team-skills-starting-guide',
    dimension: 'Skills',
    title: 'Give the team a basic AI starting guide',
    description:
      'Share a short written guide with approved tools, safe-use rules, and 3–5 beginner-friendly examples the team can reuse later.',
    bestFitLevels: [1],
  },
  {
    id: 'team-culture-safe-questions',
    dimension: 'Culture',
    title: 'Open a beginner AI Q&A thread or session',
    description:
      'Create one place where teammates can ask beginner AI questions without judgment, so low-confidence people can get help early.',
    bestFitLevels: [1, 2],
  },
  {
    id: 'team-culture-retro-ai-question',
    dimension: 'Culture',
    title: 'Ask one AI question in the next retro',
    description:
      'Add one lightweight retro question: "Where could AI have helped us this sprint?"',
    bestFitLevels: [2, 3],
  },
  {
    id: 'team-usage-beginner-demo',
    dimension: 'Usage',
    title: 'Run one beginner AI demo',
    description:
      'Show one simple real-work example of AI helping with writing, summarizing, planning, coding, QA, reporting, or research.',
    bestFitLevels: [1, 2],
  },
  {
    id: 'team-usage-possible-use-cases',
    dimension: 'Usage',
    title: 'Create a team list of possible AI use cases',
    description:
      'Collect practical ideas from the team and group them by writing, research, coding, QA, planning, reporting, or communication.',
    bestFitLevels: [2],
  },
  {
    id: 'team-usage-shared-workflow',
    dimension: 'Usage',
    title: 'Agree on one shared AI-assisted workflow',
    description:
      'Pick one workflow the team repeats often and agree how AI should be used in that workflow.',
    bestFitLevels: [3],
  },
  {
    id: 'team-usage',
    dimension: 'Usage',
    title: 'Standardize 2–3 recurring AI-assisted workflows',
    description:
      'Pick a small number of workflows the whole team repeats often and make AI usage part of the default way those workflows are executed.',
    bestFitLevels: [3, 4],
  },
  {
    id: 'team-skills',
    dimension: 'Skills',
    title: 'Run targeted enablement for low-confidence teammates',
    description:
      'Identify 2–3 teammates with the lowest AI confidence or highest friction, then run a practical pairing, demo, or support session using their real work tasks.',
    bestFitLevels: [1, 2, 3],
  },
  {
    id: 'team-skills-tools-overview',
    dimension: 'Skills',
    title: 'Run a basic AI tools overview for the team',
    description:
      'Walk the team through available tools, when to use each, and what to avoid because of privacy, quality, or client restrictions.',
    bestFitLevels: [1, 2],
  },
  {
    id: 'team-culture',
    dimension: 'Culture',
    title: 'Create shared practices that survive individual champions',
    description:
      'Turn knowledge, prompts, working norms, and safeguards into team assets so AI practices survive staffing changes instead of collapsing when one strong adopter leaves.',
    bestFitLevels: [4, 5],
  },
  {
    id: 'team-culture-weekly-ai-sync',
    dimension: 'Culture',
    title: 'Add a recurring AI improvement slot to team rituals',
    description:
      'Use an existing retro, planning session, or weekly meeting to review one AI experiment, one practical lesson, or one workflow improvement.',
    bestFitLevels: [3, 4],
  },
  {
    id: 'team-culture-pair-mob-experimentation',
    dimension: 'Culture',
    title: 'Use pair/mob sessions to build repeatable AI workflows',
    description:
      'Let teammates solve real work together with AI and capture what becomes reusable.',
    bestFitLevels: [3, 4],
  },
  {
    id: 'team-culture-prevent-shadow-ai',
    dimension: 'Culture',
    title: 'Create and maintain clear AI use boundaries for the team',
    description:
      'Define which AI tools, data types, integrations, and use cases are approved, restricted, or prohibited, so the team avoids risky unapproved tools or data sharing.',
    bestFitLevels: [3, 4, 5],
  },
  {
    id: 'team-skills-agent-workshop',
    dimension: 'Skills',
    title: 'Run a hands-on workshop where everyone builds one AI workflow',
    description:
      'Create a practical workshop where every participant leaves with one working prompt, agent, skill, automation, or reusable workflow they can apply to real work.',
    bestFitLevels: [3, 4],
  },
  {
    id: 'team-impact-collect-real-wins',
    dimension: 'Impact',
    title: 'Collect 3 real AI wins or failures from the team',
    description:
      'Capture three real examples of AI usage from recent work, including what worked, what failed, and what the team should repeat or avoid.',
    bestFitLevels: [3],
  },
  {
    id: 'team-impact-low-risk-experiment',
    dimension: 'Impact',
    title: 'Test one low-risk AI experiment as a team',
    description:
      'Choose one simple workflow, try AI for one sprint or week, and decide whether it is worth repeating.',
    bestFitLevels: [2, 3],
  },
  {
    id: 'team-impact-go-deep-high-impact-workflows',
    dimension: 'Impact',
    title: 'Go deep on 2–3 high-impact workflows',
    description:
      'Do not push AI everywhere. Pick 2–3 workflows where the value is clearly real, such as test generation, code review, debugging, estimation, client reporting, requirements analysis, or documentation, and improve those deeply.',
    bestFitLevels: [5],
  },
  {
    id: 'team-impact-measure-before-after',
    dimension: 'Impact',
    title: 'Track impact on one team AI workflow',
    description:
      'Choose one AI-assisted workflow and track a simple before/after signal, such as time saved, review speed, rework, test coverage, reporting quality, or communication load.',
    bestFitLevels: [4, 5],
  },
  {
    id: 'team-culture-ai-playbook',
    dimension: 'Culture',
    title: 'Create and maintain a team AI playbook',
    description:
      'Build a living team playbook that covers tools, prompts, examples, project configs, review rules, data and privacy rules, onboarding notes, and what works versus what does not work.',
    bestFitLevels: [5],
  },
  {
    id: 'team-impact-internal-case-study',
    dimension: 'Impact',
    title: 'Turn the team into an internal case study',
    description:
      'Be able to show other teams how AI is used, what impact it created, which safeguards are in place, and what practices others can copy, with the option to turn that proof into client-facing evidence too.',
    bestFitLevels: [5],
  },
  {
    id: 'team-vision',
    dimension: 'Vision',
    title: 'Pick one team AI bet for the next quarter',
    description:
      'Create focus by agreeing on one realistic next-step opportunity, why it matters, and how the team will judge whether it worked.',
    bestFitLevels: [3, 4],
  },
];

function roundToOne(value: number): number {
  return Number(value.toFixed(1));
}

function roundToWhole(value: number): number {
  return Math.round(value);
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function share(count: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return count / total;
}

function formatScore(value: number): string {
  return `${value.toFixed(1)} / 5`;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function computeTargetLift(score: number, audience: SuggestedGoalAudience): number {
  if (audience === 'individual') {
    if (score < 2.5) return 0.6;
    if (score < 3.5) return 0.4;
    return 0.2;
  }

  if (score < 2.5) return 0.4;
  if (score < 3.5) return 0.3;
  return 0.2;
}

function targetScoreFromCurrent(score: number, audience: SuggestedGoalAudience): number {
  return roundToOne(clamp(score + computeTargetLift(score, audience), 1, 5));
}

function averageDimensionScores(members: Individual[]): Record<TechDimension, number> {
  return TECH_DIMENSIONS.reduce(
    (scores, dimension) => ({
      ...scores,
      [dimension]: roundToOne(average(members.map((member) => member.scores[dimension]))),
    }),
    {} as Record<TechDimension, number>,
  );
}

function scoreDeficit(score: number): number {
  return clamp01((4 - score) / 3);
}

function benchmarkGap(currentScore: number, benchmarkScore: number): number {
  return clamp01((benchmarkScore - currentScore) / 1.5);
}

function questionWeakness(questionScores: Individual['questionScores'], questionKeys: string[]): number {
  const relevantScores = questionKeys
    .map((questionKey) => questionScores[questionKey])
    .filter((score): score is number => typeof score === 'number');

  if (relevantScores.length === 0) {
    return 0.35;
  }

  return clamp01(average(relevantScores.map((score) => (5 - score) / 4)));
}

function questionLabelMap(surveyType: SurveyType): Map<string, string> {
  return new Map(
    getQuestionsForSurveyType(surveyType).map((question) => [
      question.scoreKey ?? question.number,
      question.text,
    ]),
  );
}

function lowestQuestionSignals(
  person: Individual,
  questionKeys: string[],
): Array<{ label: string; score: number }> {
  const labels = questionLabelMap(person.surveyType);

  return questionKeys
    .map((questionKey) => {
      const score = person.questionScores[questionKey];
      if (typeof score !== 'number') {
        return null;
      }

      return {
        label: labels.get(questionKey) ?? `Question ${questionKey}`,
        score,
      };
    })
    .filter((entry): entry is { label: string; score: number } => Boolean(entry))
    .sort((left, right) => left.score - right.score)
    .slice(0, 2);
}

function benchmarkSignals(
  dimension: TechDimension,
  currentScore: number,
  orgAvgScores: Record<TechDimension, number>,
  roleAverageScores: Record<TechDimension, number> | null,
  teamAverageScores: Record<TechDimension, number> | null,
) {
  const benchmarks = [
    {
      label: 'org average',
      score: orgAvgScores[dimension],
    },
    ...(roleAverageScores
      ? [
          {
            label: 'same-role peers',
            score: roleAverageScores[dimension],
          },
        ]
      : []),
    ...(teamAverageScores
      ? [
          {
            label: 'current team peers',
            score: teamAverageScores[dimension],
          },
        ]
      : []),
  ];

  const strongestGap = benchmarks.reduce<{
    label: string;
    gap: number;
    score: number;
  }>(
    (best, benchmark) => {
      const gap = benchmark.score - currentScore;

      if (gap > best.gap) {
        return {
          label: benchmark.label,
          gap,
          score: benchmark.score,
        };
      }

      return best;
    },
    {
        label: 'org average',
        gap: 0,
        score: orgAvgScores[dimension],
      },
  );

  return {
    normalizedGap: benchmarkGap(currentScore, strongestGap.score),
    label: strongestGap.label,
    gap: strongestGap.gap,
    score: strongestGap.score,
  };
}

function priorityBand(score: number): string {
  if (score >= 80) return 'Highest priority';
  if (score >= 65) return 'High priority';
  if (score >= 50) return 'Medium priority';
  return 'Low priority';
}

function allowedRecommendationLevels(currentLevel: MaturityLevel): MaturityLevel[] {
  if (currentLevel === 1) return [1, 2];
  if (currentLevel === 2) return [2, 3];
  if (currentLevel === 3) return [3, 4];
  if (currentLevel === 4) return [4, 5];
  return [5];
}

function levelFitBoost(goalLevels: MaturityLevel[], allowedLevels: MaturityLevel[]): number {
  if (goalLevels.some((level) => allowedLevels.includes(level))) {
    return 1;
  }

  return 0.35;
}

export function buildIndividualSuggestedGoals({
  person,
  orgAvgScores,
  roleAverageScores,
  teamAverageScores,
}: IndividualGoalContext): SuggestedGoal[] {
  const readiness = clamp01(average([person.scores.Culture / 5, person.scores.Vision / 5]));
  const allowedLevels = allowedRecommendationLevels(person.overallLevel);

  return INDIVIDUAL_GOAL_CATALOG.map((goal) => {
    const currentScore = person.scores[goal.dimension];
    const questionKeys = goal.questionKeysBySurveyType[person.surveyType] ?? [];
    const benchmark = benchmarkSignals(
      goal.dimension,
      currentScore,
      orgAvgScores,
      roleAverageScores,
      teamAverageScores,
    );
    const weakQuestionSignals = lowestQuestionSignals(person, questionKeys);
    const weakQuestionSummary =
      weakQuestionSignals.length > 0
        ? weakQuestionSignals.map((signal) => signal.label).join(' and ')
        : null;
    const baseScore =
      0.45 * scoreDeficit(currentScore) +
      0.25 * benchmark.normalizedGap +
      0.2 * questionWeakness(person.questionScores, questionKeys) +
      0.1 * readiness;
    const score = baseScore * levelFitBoost(goal.bestFitLevels, allowedLevels);
    const priorityScore = roundToWhole(clamp(score * 100, 1, 99));

    return {
      id: goal.id,
      audience: 'individual' as const,
      dimension: goal.dimension,
      title: goal.title,
      description: goal.description,
      currentScore,
      targetScore: targetScoreFromCurrent(currentScore, 'individual'),
      priorityScore,
      rationale:
        benchmark.gap >= 0.2
          ? `${goal.dimension} is at ${formatScore(currentScore)}, which is ${benchmark.gap.toFixed(1)} below ${benchmark.label}. ${weakQuestionSummary ? `The weakest signals are around ${weakQuestionSummary.toLowerCase()}.` : ''}`.trim()
          : `${goal.dimension} is one of the softest parts of this profile at ${formatScore(currentScore)}. ${weakQuestionSummary ? `The weakest signals are around ${weakQuestionSummary.toLowerCase()}.` : ''}`.trim(),
      supportingSignals: [
        `${priorityBand(priorityScore)} for this profile`,
        benchmark.gap >= 0.2
          ? `${benchmark.gap.toFixed(1)} below ${benchmark.label}`
          : `Current ${goal.dimension} score: ${formatScore(currentScore)}`,
        weakQuestionSignals.length > 0
          ? `Weakest survey signal: ${weakQuestionSignals[0]?.label}`
          : `Target next-step score: ${formatScore(targetScoreFromCurrent(currentScore, 'individual'))}`,
      ],
    };
  })
    .filter((goal) => goal.priorityScore >= 15)
    .sort((left, right) => right.priorityScore - left.priorityScore || left.currentScore - right.currentScore)
    .slice(0, 3);
}

function teamLowScoreShare(individuals: Individual[], dimension: TechDimension): number {
  return share(
    individuals.filter((person) => person.scores[dimension] < 3).length,
    individuals.length,
  );
}

export function buildTeamSuggestedGoals({
  scopedIndividuals,
  allIndividuals,
  championShare,
  resistanceSummary,
  usageImpactData,
  supportDemandRows,
  toolAccessRows,
  workflowRows,
}: TeamGoalContext): SuggestedGoal[] {
  if (scopedIndividuals.length === 0) {
    return [];
  }

  const teamScores = averageDimensionScores(scopedIndividuals);
  const teamOverallLevel = scoreToLevel(
    average(scopedIndividuals.map((member) => member.overallScore)),
  );
  const allowedLevels = allowedRecommendationLevels(teamOverallLevel);
  const orgScores = averageDimensionScores(allIndividuals);
  const resistancePressure = clamp01((resistanceSummary.score - 2.2) / 1.8);
  const championCoverage = clamp01(championShare / 100);
  const accessBlockedShare = share(
    toolAccessRows.filter((row) => row.access < 3 || !row.fundedAccess).length,
    toolAccessRows.length,
  );
  const supportDemandHighShare = share(
    supportDemandRows.filter((row) => row.supportDemand >= 50).length,
    supportDemandRows.length,
  );
  const baselineSkillsLowShare = share(
    supportDemandRows.filter((row) => row.baselineSkills < 3).length,
    supportDemandRows.length,
  );
  const impactUnderRealizedShare = share(
    usageImpactData.filter((row) => row.usage >= 3 && row.impact < 3).length,
    usageImpactData.length,
  );
  const workflowTransformationLowShare = share(
    workflowRows.filter((row) => row.transformation < 3).length,
    workflowRows.length,
  );
  const readiness = clamp01(
    average([
      championCoverage,
      teamScores.Usage / 5,
      teamScores.Vision / 5,
    ]),
  );

  return TEAM_GOAL_CATALOG.map((goal) => {
    const currentScore = teamScores[goal.dimension];
    const normalizedOrgGap = benchmarkGap(currentScore, orgScores[goal.dimension]);
    const severity = average([scoreDeficit(currentScore), normalizedOrgGap]);
    const lowScoreShare = teamLowScoreShare(scopedIndividuals, goal.dimension);

    const affectedShare =
      goal.dimension === 'Skills'
        ? Math.max(lowScoreShare, baselineSkillsLowShare)
        : goal.dimension === 'Impact'
          ? Math.max(lowScoreShare, impactUnderRealizedShare, workflowTransformationLowShare)
          : goal.dimension === 'Culture'
            ? Math.max(lowScoreShare, 1 - championCoverage)
            : lowScoreShare;

    const blockerDrag =
      goal.dimension === 'Usage'
        ? resistancePressure
        : goal.dimension === 'Skills'
          ? average([supportDemandHighShare, baselineSkillsLowShare])
          : goal.dimension === 'Impact'
            ? average([accessBlockedShare, workflowTransformationLowShare, resistancePressure])
            : goal.dimension === 'Culture'
              ? average([1 - championCoverage, resistancePressure])
              : average([lowScoreShare, resistancePressure]);

    const baseScore =
      0.35 * severity +
      0.3 * affectedShare +
      0.2 * blockerDrag +
      0.15 * readiness;
    const score = baseScore * levelFitBoost(goal.bestFitLevels, allowedLevels);
    const priorityScore = roundToWhole(clamp(score * 100, 1, 99));

    const dominantSignal =
      goal.dimension === 'Skills'
        ? `${formatPercent(baselineSkillsLowShare)} of members show low baseline AI skills`
        : goal.dimension === 'Impact'
          ? `${formatPercent(impactUnderRealizedShare)} show high usage without matching impact`
          : goal.dimension === 'Culture'
            ? `${formatPercent(1 - championCoverage)} are outside the current champion base`
            : `${formatPercent(lowScoreShare)} of members score below 3 in ${goal.dimension}`;

    const secondarySignal =
      goal.dimension === 'Impact'
        ? `${formatPercent(accessBlockedShare)} report access or licensing friction`
        : goal.dimension === 'Skills'
          ? `${formatPercent(supportDemandHighShare)} show high support demand`
          : goal.dimension === 'Culture'
            ? `Resistance score is ${resistanceSummary.score.toFixed(1)} / 5`
            : `${goal.dimension} trails the org average by ${Math.max(0, orgScores[goal.dimension] - currentScore).toFixed(1)}`;

    return {
      id: goal.id,
      audience: 'team' as const,
      dimension: goal.dimension,
      title: goal.title,
      description: goal.description,
      currentScore,
      targetScore: targetScoreFromCurrent(currentScore, 'team'),
      priorityScore,
      rationale: `${goal.dimension} is at ${formatScore(currentScore)} for this scope. ${dominantSignal}. ${secondarySignal}.`,
      supportingSignals: [
        `${priorityBand(priorityScore)} for this scope`,
        dominantSignal,
        secondarySignal,
      ],
    };
  })
    .filter((goal) => goal.priorityScore >= 15)
    .sort((left, right) => right.priorityScore - left.priorityScore || left.currentScore - right.currentScore)
    .slice(0, 3);
}
