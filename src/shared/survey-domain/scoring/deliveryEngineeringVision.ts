import {
  finalizeQuestionScore,
  normalize,
  rawSingleSelectScore,
  type QEntry,
  type QuestionScore,
  type RawResponse,
  type ScoreMap,
  splitMulti,
  weightedEntry,
} from './shared';

type ActionCategory = 'enablement' | 'workflow' | 'governance' | 'strategy';

interface ActionRule {
  needle: string;
  score: number;
  category: ActionCategory;
}

const SINGLE_SCORES: Record<string, ScoreMap> = {
  '5.1': [
    ['prioritize ai opportunities by value, feasibility, responsible use, and expected impact', 5],
    ['identify specific workflows where ai could improve speed, quality, or consistency', 4],
    ['can name 1–2 specific recurring tasks where AI could help more', 3],
    ['see general opportunities', 2],
    ['still exploring where ai could create value', 1],
  ],
  '5.3': [
    ['future ai-assisted working model', 5],
    ['at least one workflow that could work differently', 4],
    ['improve some parts of my daily workflow', 3],
    ['speed up small tasks', 2],
    ['still exploring this', 1],
  ],
  '5.4': [
    ['value, feasibility, cost, privacy, adoption effort, and expected impact', 5],
    ['solves a real workflow problem', 4],
    ['seem useful for my own tasks', 3],
    ['when someone else suggests them', 2],
    ['general recommendations or trends', 1],
  ],
  '5.5': [
    ['change delivery models, staffing, pricing, client experience, or competitive advantage', 5],
    ['improve delivery speed, quality, communication, or decision-making', 4],
    ['improve internal efficiency', 3],
    ['personal productivity help', 2],
    ['still learning how ai connects to broader value', 1],
  ],
  '5.6': [
    ['clear personal ai development direction connected to my role, team, or future opportunities', 5],
    ['which ai capabilities would help me become stronger in my role', 4],
    ['one specific ai skill or workflow i want to improve', 3],
    ['learn general ai basics and available tools', 2],
    ['still figuring out what would be useful', 1],
  ],
};

const ACTION_RULES: ActionRule[] = [
  { needle: 'organize practical training based on real team tasks', score: 4, category: 'enablement' },
  { needle: 'ask everyone to experiment independently and see what happens', score: 2, category: 'strategy' },
  { needle: 'create simple team guidelines for safe and effective ai usage', score: 4, category: 'governance' },
  { needle: 'pick 1-2 recurring workflows and run a small ai improvement pilot', score: 5, category: 'workflow' },
  { needle: 'share practical examples of how teammates already use ai successfully', score: 4, category: 'enablement' },
  { needle: 'improve documentation, templates, or context so ai tools can work better', score: 4, category: 'workflow' },
  { needle: 'agree on recommended ai tools for common team workflows', score: 4, category: 'governance' },
  { needle: 'create reusable prompts, templates, checklists, or project instructions', score: 5, category: 'workflow' },
  { needle: 'set up peer learning sessions based on real team tasks', score: 4, category: 'enablement' },
  { needle: 'buy access to the most advanced ai tool for everyone', score: 2, category: 'strategy' },
  { needle: 'give people access to the right ai tools or paid plans where needed', score: 4, category: 'enablement' },
  { needle: 'define where ai should not be used, or where human review is required', score: 5, category: 'governance' },
  { needle: 'create a small backlog of ai improvement ideas for the team or department', score: 4, category: 'strategy' },
  { needle: 'wait until the company creates a full ai strategy before trying anything', score: 1, category: 'strategy' },
  { needle: 'i am not sure yet what would help most', score: 1, category: 'strategy' },
];

function actionMixBonus(categories: Set<ActionCategory>): number {
  if (
    categories.has('workflow') &&
    categories.has('governance') &&
    (categories.has('enablement') || categories.has('strategy'))
  ) {
    return 1;
  }
  if (categories.has('workflow') && categories.has('governance')) return 0.5;
  if (categories.size >= 2) return 0.25;
  return 0;
}

function q52Score(raw: string | undefined): QuestionScore {
  if (!raw || raw.trim() === '') return 'SKIP';

  const items = splitMulti(raw);
  const sortedRules = [...ACTION_RULES].sort((a, b) => b.needle.length - a.needle.length);
  const matchedRules: ActionRule[] = [];

  for (const item of items) {
    const norm = normalize(item);
    for (const rule of sortedRules) {
      if (norm.includes(rule.needle)) {
        matchedRules.push(rule);
        break;
      }
    }
  }

  const uniqueMatches = Array.from(
    new Map(matchedRules.map((rule) => [rule.needle, rule])).values(),
  );

  if (uniqueMatches.length === 0) {
    console.warn(`[scoring] Unmatched Q5.2: "${raw}"`);
    return 'SKIP';
  }

  const avgScore =
    uniqueMatches.reduce((sum, rule) => sum + rule.score, 0) / uniqueMatches.length;
  const categories = new Set(uniqueMatches.map((rule) => rule.category));
  const hasWeakAction = uniqueMatches.some((rule) => rule.score <= 2);
  const weakPenalty = hasWeakAction ? 0.5 : 0;
  const bonus = Math.min(actionMixBonus(categories), 0.5);

  return finalizeQuestionScore(
    Math.min(5, Math.max(1, avgScore + bonus - weakPenalty)),
  );
}

export function scoreDeliveryEngineeringVisionEntries(r: RawResponse): QEntry[] {
  return [
    weightedEntry('5.1', rawSingleSelectScore('5.1', SINGLE_SCORES['5.1'], r.q5_1)),
    weightedEntry('5.2', q52Score(r.q5_2)),
    weightedEntry('5.3', rawSingleSelectScore('5.3', SINGLE_SCORES['5.3'], r.q5_3)),
    weightedEntry('5.4', rawSingleSelectScore('5.4', SINGLE_SCORES['5.4'], r.q5_4)),
    weightedEntry('5.5', rawSingleSelectScore('5.5', SINGLE_SCORES['5.5'], r.q5_5)),
    weightedEntry('5.6', rawSingleSelectScore('5.6', SINGLE_SCORES['5.6'], r.q5_6)),
  ];
}
