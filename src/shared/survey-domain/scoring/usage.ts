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

type ToolCategory = 'agentic' | 'ide' | 'chat' | 'research';
type ModelFamily = 'gpt' | 'claude' | 'gemini' | 'self_hosted' | 'codex';
type ModelCostTier = 'cheap' | 'standard' | 'expensive';
type ActivityGroup = 'knowledge_work' | 'engineering_execution' | 'high_leverage';
type DepartmentProfile =
  | 'engineering'
  | 'design'
  | 'qa'
  | 'devops'
  | 'data'
  | 'other';
type WorkflowEvidence = 'none' | 'basic' | 'advanced' | 'unknown';

interface PrimaryToolRule {
  needle: string;
  score: number;
  category: ToolCategory;
}

interface PrimaryModelRule {
  needle: string;
  score: number;
  family: ModelFamily;
  costTier: ModelCostTier;
  latest?: boolean;
}

interface ActivityRule {
  needle: string;
  group: ActivityGroup;
  scores: Record<DepartmentProfile, number>;
}

const SINGLE_SCORES: Record<string, ScoreMap> = {
  '1.1': [
    ['multiple times per day', 5],
    ['daily', 4],
    ['a few times a week', 3],
    ['a few times a month', 2],
    ['never', 1],
  ],
  '1.4': [
    ['use several and have built or configured my own', 5],
    ['favorite agent or skill i use regularly', 4],
    ["tried one or two but don't use them regularly", 3],
    ["heard of them but haven't tried any", 2],
    ["haven't come across these yet", 1],
  ],
  '1.6': [
    ['inseparable from how i work', 5],
    ['deeply integrated', 4],
    ['part of my standard project workflow', 3],
    ['occasionally use it alongside project work', 2],
    ['keep ai separate from project work', 1],
  ],
  '1.7': [
    ['actively update and use to onboard', 5],
    ['documented guidelines or standards', 4],
    ['loose team norms', 3],
    ['informally', 2],
    ['fully individual', 1],
  ],
  '1.8': [
    ['actively maintain project ai configuration', 5],
    ['created or configured project-level ai rules', 4],
    ['use one that someone else on my team configured', 3],
    ["heard of them but haven't set any up", 2],
    ["haven't encountered these yet", 1],
  ],
  '1.9': [
    ['end-to-end', 5],
    ['pair programmer', 4],
    ['first draft, then review and edit significantly', 3],
    ['accept suggestions as-is', 2],
    ["don't use ai for coding", 1],
  ],
  '1.10': [
    ['orchestration patterns', 5],
    ['multi-agent setups', 4],
    ['multi-step automated workflows', 3],
    ['tool calls or web search', 2],
    ['only use chat interfaces', 1],
  ],
  '1.11': [
    ['recurring touchpoint on ai', 5],
    ['occasionally', 4],
    ['come up once or twice', 2],
    ['never', 1],
  ],
};

const PRIMARY_TOOL_RULES: PrimaryToolRule[] = [
  { needle: 'claude code', score: 3.75, category: 'agentic' },
  { needle: 'codex cli', score: 3.75, category: 'agentic' },
  { needle: 'openai codex', score: 3.75, category: 'agentic' },
  { needle: 'codex', score: 3.75, category: 'agentic' },
  { needle: 'manus', score: 3.5, category: 'agentic' },
  { needle: 'windsurf', score: 3.25, category: 'ide' },
  { needle: 'cline', score: 3.25, category: 'ide' },
  { needle: 'antigravity', score: 3.25, category: 'ide' },
  { needle: 'cursor', score: 3.25, category: 'ide' },
  { needle: 'github copilot', score: 2.75, category: 'ide' },
  { needle: 'copilot', score: 2.75, category: 'ide' },
  { needle: 'jetbrains ai assistant', score: 2.75, category: 'ide' },
  { needle: 'jetbrains ai', score: 2.75, category: 'ide' },
  { needle: 'vs code with ai extension', score: 2.75, category: 'ide' },
  { needle: 'continue', score: 2.75, category: 'ide' },
  { needle: 'claude (web)', score: 2.25, category: 'chat' },
  { needle: 'claude (web/app)', score: 2.25, category: 'chat' },
  { needle: 'claude web', score: 2.25, category: 'chat' },
  { needle: 'chatgpt (web)', score: 2.25, category: 'chat' },
  { needle: 'chatgpt (web/app)', score: 2.25, category: 'chat' },
  { needle: 'chatgpt', score: 2.25, category: 'chat' },
  { needle: 'gemini', score: 2.25, category: 'chat' },
  { needle: 'perplexity', score: 1.5, category: 'research' },
];

const PRIMARY_TOOL_NONE_NEEDLES = [
  "i didn't use any ai tool last month",
  'i did not use any ai tool last month',
  "didn't use any ai tool",
  'did not use any ai tool',
];

const PRIMARY_MODEL_NONE_NEEDLES = [
  'no usage',
  "i didn't use any ai model last month",
  'i did not use any ai model last month',
  "didn't use any ai model",
  'did not use any ai model',
];

function sameCategoryBonus(categoryCounts: Map<ToolCategory, number>): number {
  let bonus = 0;

  for (const count of categoryCounts.values()) {
    if (count >= 2) bonus += 0.25;
    if (count >= 3) bonus += 0.25;
  }

  return Math.min(0.5, bonus);
}

function crossCategoryBonus(categories: Set<ToolCategory>): number {
  if (categories.has('chat') && categories.has('ide') && categories.has('agentic')) {
    return 1.0;
  }
  if (categories.has('ide') && categories.has('agentic')) return 0.75;
  if (categories.has('chat') && categories.has('ide')) return 0.5;
  if (categories.has('chat') && categories.has('agentic')) return 0.5;
  return 0;
}

function maxPrimaryToolScore(categoryCounts: Map<ToolCategory, number>): number {
  const ideCount = categoryCounts.get('ide') ?? 0;
  const agenticCount = categoryCounts.get('agentic') ?? 0;
  return ideCount >= 2 && agenticCount >= 2 ? 5 : 4.75;
}

const PRIMARY_MODEL_RULES: PrimaryModelRule[] = [
  { needle: 'gpt-4o', score: 2.25, family: 'gpt', costTier: 'cheap' },
  { needle: 'chatgpt images 2.0', score: 2.25, family: 'gpt', costTier: 'cheap' },
  { needle: 'claude sonnet 4.5 / 4.6', score: 2.25, family: 'claude', costTier: 'cheap' },
  { needle: 'claude sonnet 4.5', score: 2.25, family: 'claude', costTier: 'cheap' },
  { needle: 'claude sonnet 4.6', score: 2.25, family: 'claude', costTier: 'cheap' },
  { needle: 'claude sonnet', score: 2.25, family: 'claude', costTier: 'cheap' },
  { needle: 'claude haiku', score: 2.25, family: 'claude', costTier: 'cheap' },
  { needle: 'gemini 2.5 pro / flash', score: 2.25, family: 'gemini', costTier: 'cheap' },
  { needle: 'gemini 2.5 pro', score: 2.25, family: 'gemini', costTier: 'standard' },
  { needle: 'gemini 2.5 flash', score: 2.25, family: 'gemini', costTier: 'cheap' },
  { needle: 'gemini 3 pro / flash', score: 2.25, family: 'gemini', costTier: 'cheap' },
  { needle: 'gemini 3 pro', score: 2.25, family: 'gemini', costTier: 'standard' },
  { needle: 'gemini 3 flash', score: 2.25, family: 'gemini', costTier: 'cheap' },
  { needle: 'gpt-4.1', score: 3.5, family: 'gpt', costTier: 'standard' },
  { needle: 'o3 / o4-mini', score: 3.5, family: 'gpt', costTier: 'standard' },
  { needle: 'o3', score: 3.5, family: 'gpt', costTier: 'expensive' },
  { needle: 'o4-mini', score: 3.5, family: 'gpt', costTier: 'cheap' },
  { needle: 'gpt-5.4 mini / nano, or gpt-5.5 mini / nano', score: 3.75, family: 'gpt', costTier: 'cheap', latest: true },
  { needle: 'gpt-5.4 / gpt-5.5', score: 4.25, family: 'gpt', costTier: 'expensive', latest: true },
  { needle: 'gpt-5.4 mini / nano', score: 3.75, family: 'gpt', costTier: 'cheap', latest: true },
  { needle: 'gpt-5.4 mini', score: 3.75, family: 'gpt', costTier: 'cheap', latest: true },
  { needle: 'gpt-5.4 nano', score: 3.75, family: 'gpt', costTier: 'cheap', latest: true },
  { needle: 'gpt5.4-mini', score: 3.75, family: 'gpt', costTier: 'cheap', latest: true },
  { needle: 'gpt-5.5 mini / nano', score: 3.75, family: 'gpt', costTier: 'cheap', latest: true },
  { needle: 'gpt-5.5 mini', score: 3.75, family: 'gpt', costTier: 'cheap', latest: true },
  { needle: 'gpt-5.5 nano', score: 3.75, family: 'gpt', costTier: 'cheap', latest: true },
  { needle: 'gpt5.5-mini', score: 3.75, family: 'gpt', costTier: 'cheap', latest: true },
  { needle: 'gpt-5 mini', score: 3.75, family: 'gpt', costTier: 'cheap' },
  { needle: 'gpt-5.4 codex', score: 4.0, family: 'codex', costTier: 'expensive', latest: true },
  { needle: 'gpt-5.3-codex', score: 4.0, family: 'codex', costTier: 'expensive' },
  { needle: 'codex 5.3', score: 4.0, family: 'codex', costTier: 'expensive' },
  { needle: 'claude opus 4.7', score: 4.25, family: 'claude', costTier: 'expensive', latest: true },
  { needle: 'claude opus 4.6', score: 4.25, family: 'claude', costTier: 'expensive' },
  { needle: 'claude opus', score: 4.25, family: 'claude', costTier: 'expensive' },
  { needle: 'gpt-5.4', score: 4.25, family: 'gpt', costTier: 'expensive', latest: true },
  { needle: 'gpt 5.4', score: 4.25, family: 'gpt', costTier: 'expensive', latest: true },
  { needle: 'gpt-5.5', score: 4.25, family: 'gpt', costTier: 'expensive', latest: true },
  { needle: 'gpt 5.5', score: 4.25, family: 'gpt', costTier: 'expensive', latest: true },
  { needle: 'self-hosted', score: 4.0, family: 'self_hosted', costTier: 'expensive' },
  { needle: 'llama 4', score: 4.0, family: 'self_hosted', costTier: 'expensive' },
  { needle: 'deepseek r1', score: 4.0, family: 'self_hosted', costTier: 'expensive' },
  { needle: 'deepseek v3', score: 4.0, family: 'self_hosted', costTier: 'expensive' },
];

function modelBreadthBonus(scores: number[]): number {
  if (scores.length < 2) return 0;

  const highest = Math.max(...scores);
  const nearTopCount = scores.filter((score) => highest - score <= 0.75).length;
  return nearTopCount >= 2 ? 0.25 : 0;
}

function modelFamilyDiversityBonus(families: Set<ModelFamily>): number {
  return families.size >= 2 ? 0.25 : 0;
}

function modelCheapExpensiveMixBonus(costTiers: Set<ModelCostTier>): number {
  return costTiers.has('cheap') && costTiers.has('expensive') ? 0.25 : 0;
}

function canReachModelFive(models: PrimaryModelRule[]): boolean {
  const distinctModelCount = models.length;
  const hasLatestModel = models.some((model) => model.latest);
  const families = new Set(models.map((model) => model.family));
  const costTiers = new Set(models.map((model) => model.costTier));

  return (
    distinctModelCount >= 3 &&
    hasLatestModel &&
    families.size >= 2 &&
    costTiers.has('cheap') &&
    costTiers.has('expensive')
  );
}

export function scorePrimaryToolSelection(raw: string | undefined): QuestionScore {
  if (!raw || raw.trim() === '') return 'SKIP';
  if (raw.trim().toLowerCase().startsWith('n/a')) return 'SKIP';

  const items = splitMulti(raw);
  const sorted = [...PRIMARY_TOOL_RULES].sort((a, b) => b.needle.length - a.needle.length);
  const matchedTools: PrimaryToolRule[] = [];
  let sawNoTool = false;

  for (const item of items) {
    let norm = normalize(item);

    if (PRIMARY_TOOL_NONE_NEEDLES.some((needle) => norm.includes(needle))) {
      sawNoTool = true;
      continue;
    }

    if (norm === 'other (free text)' || norm === 'other:' || norm === 'other') continue;

    norm = norm.replace(/^other:\s*/, '');
    if (!norm) continue;

    for (const rule of sorted) {
      if (norm.includes(rule.needle)) {
        matchedTools.push(rule);
        break;
      }
    }
  }

  if (matchedTools.length > 0) {
    const uniqueMatches = Array.from(
      new Map(matchedTools.map((rule) => [rule.needle, rule])).values(),
    );
    const categories = new Set(uniqueMatches.map((rule) => rule.category));
    const categoryCounts = uniqueMatches.reduce((counts, rule) => {
      counts.set(rule.category, (counts.get(rule.category) ?? 0) + 1);
      return counts;
    }, new Map<ToolCategory, number>());
    const highestScore = Math.max(...uniqueMatches.map((rule) => rule.score));

    const bonus = sameCategoryBonus(categoryCounts) + crossCategoryBonus(categories);

    return finalizeQuestionScore(
      Math.min(maxPrimaryToolScore(categoryCounts), highestScore + bonus),
    );
  }
  if (sawNoTool) return 1;

  console.warn(`[scoring] Unmatched Q1.2: "${raw}"`);
  return 'SKIP';
}

export function scorePrimaryModelSelection(raw: string | undefined): QuestionScore {
  if (!raw || raw.trim() === '') return 'SKIP';
  if (raw.trim().toLowerCase().startsWith('n/a')) return 'SKIP';

  const items = splitMulti(raw);
  const sorted = [...PRIMARY_MODEL_RULES].sort((a, b) => b.needle.length - a.needle.length);
  const matchedModels: PrimaryModelRule[] = [];
  let sawUntracked = false;
  let sawNoUsage = false;

  for (const item of items) {
    let norm = normalize(item);
    let matchedRule = false;
    if (norm === 'other:' || norm === 'other') continue;

    norm = norm.replace(/^other:\s*/, '');
    if (!norm) continue;

    if (
      norm.includes("i don't track specific model names") ||
      norm.includes('i do not track specific model names')
    ) {
      sawUntracked = true;
      continue;
    }

    if (PRIMARY_MODEL_NONE_NEEDLES.some((needle) => norm.includes(needle))) {
      sawNoUsage = true;
      continue;
    }

    for (const rule of sorted) {
      if (norm.includes(rule.needle)) {
        matchedModels.push(rule);
        matchedRule = true;
        break;
      }
    }

    if (matchedRule) continue;

    if (/gpt-5\.(4|5)|gpt 5\.(4|5)/.test(norm)) matchedModels.push({ needle: 'gpt-5.4 / gpt-5.5', score: 4.25, family: 'gpt', costTier: 'expensive', latest: true });
    else if (/gpt-5(\.(4|5))? (mini|nano)|gpt5\.(4|5)-mini/.test(norm)) matchedModels.push({ needle: 'gpt-5.4 mini / nano, or gpt-5.5 mini / nano', score: 3.75, family: 'gpt', costTier: 'cheap', latest: true });
    else if (/chatgpt images? 2\.0/.test(norm)) matchedModels.push({ needle: 'chatgpt images 2.0', score: 2.25, family: 'gpt', costTier: 'cheap' });
    else if (/codex/.test(norm)) matchedModels.push({ needle: 'codex', score: 4.0, family: 'codex', costTier: 'expensive' });
    else if (/claude opus 4\.7/.test(norm)) matchedModels.push({ needle: 'claude opus 4.7', score: 4.25, family: 'claude', costTier: 'expensive', latest: true });
    else if (/claude opus/.test(norm)) matchedModels.push({ needle: 'claude opus', score: 4.25, family: 'claude', costTier: 'expensive' });
    else if (/claude sonnet|claude haiku/.test(norm)) matchedModels.push({ needle: 'claude standard', score: 2.25, family: 'claude', costTier: 'cheap' });
    else if (/gemini/.test(norm)) matchedModels.push({ needle: 'gemini', score: 2.25, family: 'gemini', costTier: 'cheap' });
    else if (/gpt-4o/.test(norm)) matchedModels.push({ needle: 'gpt-4o', score: 2.25, family: 'gpt', costTier: 'cheap' });
    else if (/gpt-4\.1|o3|o4-mini/.test(norm)) matchedModels.push({ needle: 'gpt-advanced', score: 3.5, family: 'gpt', costTier: 'standard' });
    else if (/self-hosted|llama|deepseek/.test(norm)) matchedModels.push({ needle: 'self-hosted', score: 4.0, family: 'self_hosted', costTier: 'expensive' });
  }

  if (matchedModels.length > 0) {
    const uniqueMatches = Array.from(
      new Map(matchedModels.map((rule) => [rule.needle, rule])).values(),
    );
    const scores = uniqueMatches.map((rule) => rule.score);
    const families = new Set(uniqueMatches.map((rule) => rule.family));
    const costTiers = new Set(uniqueMatches.map((rule) => rule.costTier));
    const highestScore = Math.max(...scores);
    const bonus =
      modelBreadthBonus(scores) +
      modelFamilyDiversityBonus(families) +
      modelCheapExpensiveMixBonus(costTiers);

    return finalizeQuestionScore(
      Math.min(canReachModelFive(uniqueMatches) ? 5 : 4.75, highestScore + bonus),
    );
  }
  if (sawUntracked) return 1;
  if (sawNoUsage) return 1;

  console.warn(`[scoring] Unmatched Q1.3: "${raw}"`);
  return 'SKIP';
}

const ACTIVITY_RULES: ActivityRule[] = [
  {
    needle: 'writing / editing / communication',
    group: 'knowledge_work',
    scores: {
      engineering: 2.0,
      design: 3.0,
      qa: 2.5,
      devops: 2.0,
      data: 2.5,
      other: 2.5,
    },
  },
  {
    needle: 'research & summarization',
    group: 'knowledge_work',
    scores: {
      engineering: 2.5,
      design: 3.0,
      qa: 2.5,
      devops: 2.5,
      data: 3.0,
      other: 2.75,
    },
  },
  {
    needle: 'planning, estimation & structuring ideas',
    group: 'knowledge_work',
    scores: {
      engineering: 2.5,
      design: 3.0,
      qa: 2.5,
      devops: 2.5,
      data: 2.75,
      other: 2.75,
    },
  },
  {
    needle: 'code generation',
    group: 'engineering_execution',
    scores: {
      engineering: 3.5,
      design: 1.5,
      qa: 2.75,
      devops: 3.25,
      data: 2.0,
      other: 2.25,
    },
  },
  {
    needle: 'code review (using ai to review prs or assist review)',
    group: 'engineering_execution',
    scores: {
      engineering: 3.75,
      design: 1.25,
      qa: 2.5,
      devops: 3.0,
      data: 1.5,
      other: 2.0,
    },
  },
  {
    needle: 'debugging and troubleshooting',
    group: 'engineering_execution',
    scores: {
      engineering: 3.5,
      design: 1.5,
      qa: 3.25,
      devops: 3.5,
      data: 2.0,
      other: 2.25,
    },
  },
  {
    needle: 'refactoring or improving existing code',
    group: 'engineering_execution',
    scores: {
      engineering: 3.5,
      design: 1.25,
      qa: 2.5,
      devops: 3.25,
      data: 1.75,
      other: 2.0,
    },
  },
  {
    needle: 'writing tests (unit, integration, e2e)',
    group: 'engineering_execution',
    scores: {
      engineering: 3.5,
      design: 1.0,
      qa: 4.0,
      devops: 2.75,
      data: 1.5,
      other: 1.75,
    },
  },
  {
    needle: 'technical design or architecture decisions',
    group: 'high_leverage',
    scores: {
      engineering: 4.0,
      design: 2.75,
      qa: 2.5,
      devops: 4.0,
      data: 3.0,
      other: 3.0,
    },
  },
  {
    needle: 'visual tasks (diagrams, mockups, screenshot analysis, ui generation).',
    group: 'knowledge_work',
    scores: {
      engineering: 2.25,
      design: 4.0,
      qa: 2.0,
      devops: 1.5,
      data: 2.25,
      other: 2.5,
    },
  },
  {
    needle: 'documentation (readmes, adrs, api docs)',
    group: 'knowledge_work',
    scores: {
      engineering: 2.75,
      design: 2.5,
      qa: 2.5,
      devops: 2.75,
      data: 2.5,
      other: 2.5,
    },
  },
  {
    needle: 'devops / infrastructure / ci-cd',
    group: 'high_leverage',
    scores: {
      engineering: 3.25,
      design: 1.0,
      qa: 1.75,
      devops: 4.0,
      data: 1.75,
      other: 2.0,
    },
  },
  {
    needle: 'learning, upskilling, or understanding unfamiliar codebases',
    group: 'knowledge_work',
    scores: {
      engineering: 2.5,
      design: 2.75,
      qa: 2.75,
      devops: 2.5,
      data: 2.75,
      other: 2.75,
    },
  },
];

function departmentProfile(department: string): DepartmentProfile {
  const norm = normalize(department);
  if (norm.includes('software engineering')) return 'engineering';
  if (norm.includes('design')) return 'design';
  if (norm.includes('quality assurance')) return 'qa';
  if (norm.includes('devops')) return 'devops';
  if (norm.includes('data analyst')) return 'data';
  return 'other';
}

function breadthBonus(activityCount: number): number {
  if (activityCount >= 8) return 0.75;
  if (activityCount >= 5) return 0.5;
  if (activityCount >= 3) return 0.25;
  return 0;
}

function coverageBonus(groups: Set<ActivityGroup>): number {
  if (groups.size >= 3) return 0.5;
  if (groups.size === 2) return 0.25;
  return 0;
}

function q15Score(raw: string, department: string): QuestionScore {
  if (!raw || raw.trim() === '') return 'SKIP';
  if (normalize(raw).includes("don't use ai in any workflow")) return 1;

  const items = splitMulti(raw);
  const profile = departmentProfile(department);
  const sortedRules = [...ACTIVITY_RULES].sort((a, b) => b.needle.length - a.needle.length);
  const matchedRules: ActivityRule[] = [];

  for (const item of items) {
    let norm = normalize(item);
    if (norm === 'other (free text)' || norm === 'other:' || norm === 'other') continue;

    norm = norm.replace(/^other:\s*/, '');
    if (!norm) continue;

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

  if (uniqueMatches.length === 0) return 'SKIP';

  const strongestScore = Math.max(...uniqueMatches.map((rule) => rule.scores[profile]));
  const groups = new Set(uniqueMatches.map((rule) => rule.group));
  const totalScore = strongestScore + breadthBonus(uniqueMatches.length) + coverageBonus(groups);

  return finalizeQuestionScore(Math.min(maxDeliveryWorkflowScore(raw), totalScore));
}

function deliveryWorkflowEvidence(raw: string | undefined): WorkflowEvidence {
  if (!raw || raw.trim() === '') return 'unknown';

  const norm = normalize(raw);
  if (norm.includes("don't use ai in any workflow")) return 'none';

  const advancedNeedles = [
    'code generation',
    'code review (using ai to review prs or assist review)',
    'debugging and troubleshooting',
    'refactoring or improving existing code',
    'writing tests (unit, integration, e2e)',
    'technical design or architecture decisions',
    'visual tasks (diagrams, mockups, screenshot analysis, ui generation).',
    'devops / infrastructure / ci-cd',
  ];
  const basicNeedles = [
    'writing / editing / communication',
    'research & summarization',
    'planning, estimation & structuring ideas',
    'documentation (readmes, adrs, api docs)',
    'learning, upskilling, or understanding unfamiliar codebases',
  ];

  const sawAdvanced = advancedNeedles.some((needle) => norm.includes(needle));
  if (sawAdvanced) return 'advanced';

  const sawBasic = basicNeedles.some((needle) => norm.includes(needle));
  return sawBasic ? 'basic' : 'unknown';
}

function maxDeliveryWorkflowScore(raw: string | undefined): number {
  return deliveryWorkflowEvidence(raw) === 'advanced' ? 5 : 4;
}

function harmonizeAgentRegularityScore(
  q14: QuestionScore,
  q15Raw: string | undefined,
): QuestionScore {
  if (typeof q14 !== 'number') return q14;

  const evidence = deliveryWorkflowEvidence(q15Raw);

  if (evidence === 'none') return Math.min(q14, 2);
  if (evidence === 'basic') return Math.min(q14, 4);
  return q14;
}

export function scoreUsageEntries(r: RawResponse): QEntry[] {
  const q14 = rawSingleSelectScore('1.4', SINGLE_SCORES['1.4'], r.q1_4);
  const q15 = q15Score(r.q1_5, r.department);

  return [
    weightedEntry('1.1', rawSingleSelectScore('1.1', SINGLE_SCORES['1.1'], r.q1_1)),
    weightedEntry('1.2', scorePrimaryToolSelection(r.q1_2)),
    weightedEntry('1.3', scorePrimaryModelSelection(r.q1_3)),
    weightedEntry('1.4', harmonizeAgentRegularityScore(q14, r.q1_5)),
    weightedEntry('1.5', q15),
    weightedEntry('1.6', rawSingleSelectScore('1.6', SINGLE_SCORES['1.6'], r.q1_6)),
    weightedEntry('1.7', rawSingleSelectScore('1.7', SINGLE_SCORES['1.7'], r.q1_7)),
    weightedEntry('1.8', rawSingleSelectScore('1.8', SINGLE_SCORES['1.8'], r.q1_8)),
    weightedEntry('1.9', rawSingleSelectScore('1.9', SINGLE_SCORES['1.9'], r.q1_9)),
    weightedEntry('1.10', rawSingleSelectScore('1.10', SINGLE_SCORES['1.10'], r.q1_10)),
    weightedEntry('1.11', rawSingleSelectScore('1.11', SINGLE_SCORES['1.11'], r.q1_11)),
  ];
}
