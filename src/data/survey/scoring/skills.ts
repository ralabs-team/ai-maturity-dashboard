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

type PromptTechniqueTier = 'foundational' | 'control' | 'advanced';

const SINGLE_SCORES: Record<string, ScoreMap> = {
  '2.1': [
    ['could teach someone else', 5],
    ['can explain how inference works', 4],
    ['high-level architecture', 3],
    ['neural networks but not the details', 2],
    ["haven't explored this yet", 1],
  ],
  '2.2': [
    ['identify subtle issues', 5],
    ['systematic approach to validation', 4],
    ['verify facts and logic', 3],
    ['catch obvious errors', 2],
    ['not confident at all', 1],
  ],
  '2.3': [
    ['manage context strategically', 5],
    ['structure my context carefully', 4],
    ['deliberately provide relevant context', 3],
    ["don't think much about what to include", 2],
    ['hope for the best', 1],
  ],
  '2.4': [
    ['make technical decisions based on these concepts', 5],
    ['can explain and apply them in practice', 4],
    ['understand most of them', 3],
    ['heard the terms', 2],
    ['not familiar with these yet', 1],
  ],
  '2.5': [
    ['built or configured mcp servers', 5],
    ['used it in a project', 4],
    ['understand the concept', 3],
    ['heard the term', 2],
    ['not familiar with it yet', 1],
  ],
  '2.7': [
    ['clear mental model of where ai adds value', 5],
    ['stopped using ai for one or two specific tasks', 4],
    ["vague sense of where ai doesn't help", 3],
    ['use ai whenever i can', 2],
    ['still figuring out where ai helps', 1],
  ],
  '2.10': [
    ['consistent review process', 5],
    ['sometimes regenerate with better instructions', 4],
    ['same rigor as human-written code', 3],
    ['quick scan for obvious issues', 2],
    ['commit it as-is', 1],
  ],
  '2.11': [
    ['systematic evaluation process', 5],
    ['evaluate against specific criteria', 4],
    ['test it on a real task and compare', 3],
    ['hype or recommendations', 2],
    ["don't usually try new tools", 1],
  ],
  '2.12': [
    ['follow documented guidelines and actively flag risks', 5],
    ["mental checklist of what can and can't go", 4],
    ['know the basics', 3],
    ['cautious but not sure where the line is', 2],
    ["don't think about it", 1],
  ],
};

interface VerificationRule {
  clear: string[];
  partial: string[];
}

const VERIFICATION_RULES: Record<'2.14' | '2.15', VerificationRule> = {
  '2.14': {
    clear: [
      'maximum amount of text the model can process',
      'amount of text the model can process at once',
      'amount of text the model can handle at once',
      'number of tokens the model can process',
      'number of tokens the model can handle',
      'how much text the model can see at once',
    ],
    partial: [
      'amount of context',
      'how much context',
      'conversation history',
      'prompt size',
      'token limit',
      'number of tokens',
      'memory of the conversation',
    ],
  },
  '2.15': {
    clear: [
      'calling external functions or apis',
      'calling external functions',
      'calling external apis',
      'use external functions',
      'use external apis',
      'invoke external tools',
      'interact with external tools',
    ],
    partial: [
      'use tools',
      'using tools',
      'external tools',
      'integrations',
      'plugins',
      'actions outside the chat',
      'take actions',
    ],
  },
};

const PROMPT_TECHNIQUE_RULES: Array<{ needle: string; tier: PromptTechniqueTier }> = [
  { needle: 'system prompts or custom instructions', tier: 'control' },
  { needle: 'role or persona assignment', tier: 'foundational' },
  { needle: 'examples in the prompt', tier: 'control' },
  { needle: 'structured output formatting', tier: 'foundational' },
  { needle: 'chain-of-thought or step-by-step instructions', tier: 'foundational' },
  { needle: 'explicit constraints or boundaries', tier: 'control' },
  { needle: 'providing reference documents or files as context', tier: 'control' },
  { needle: 'asking ai to critique or review its own output', tier: 'advanced' },
  { needle: 'multi-turn iteration', tier: 'foundational' },
  { needle: 'negative examples', tier: 'control' },
  { needle: 'task decomposition', tier: 'advanced' },
  { needle: 'using different models for different subtasks', tier: 'advanced' },
  { needle: 'prompt templates or saved/reusable prompts', tier: 'foundational' },
  { needle: 'asking ai to ask clarifying questions before answering', tier: 'foundational' },
];

const REAL_PROJECT_CONFIG_NEEDLES = [
  'claude.md',
  '.cursorrules',
  '.github/copilot-instructions.md',
  'system prompts saved per repo',
  'agents.md',
];

const FAKE_PROJECT_CONFIG_NEEDLES = [
  '.aicontext',
  '.llmconfig.yaml',
  '.prompt-rules',
];

function q26Score(raw: string): QuestionScore {
  if (!raw || raw.trim() === '') return 'SKIP';

  const map: ScoreMap = [
    ['rarely get bad results', 5],
    ['break the task into smaller steps', 4],
    ['iterate', 3],
    ['try rephrasing once', 2],
    ['give up', 1],
  ];

  const scores: number[] = [];
  let selectedGiveUp = false;
  let selectedRephrase = false;
  for (const item of splitMulti(raw)) {
    const norm = normalize(item);
    for (const [needle, score] of map) {
      if (norm.includes(needle)) {
        scores.push(score);
        if (needle === 'give up') selectedGiveUp = true;
        if (needle === 'try rephrasing once') selectedRephrase = true;
        break;
      }
    }
  }

  if (scores.length === 0) return 'SKIP';

  const strongest = Math.max(...scores);
  let adjusted = strongest;

  if (strongest >= 3 && selectedRephrase) adjusted -= 0.5;
  if (strongest >= 3 && selectedGiveUp) adjusted -= 1;

  return finalizeQuestionScore(adjusted);
}

function q28Score(raw: string): QuestionScore {
  if (!raw || raw.trim() === '') return 'SKIP';

  const sortedRules = [...PROMPT_TECHNIQUE_RULES].sort((a, b) => b.needle.length - a.needle.length);
  const matched = new Map<string, PromptTechniqueTier>();
  let sawNone = false;

  for (const item of splitMulti(raw)) {
    const norm = normalize(item);

    if (norm.includes('none of the above')) {
      sawNone = true;
      continue;
    }

    if (norm === 'other:' || norm === 'other') continue;

    for (const rule of sortedRules) {
      if (norm.includes(rule.needle)) {
        matched.set(rule.needle, rule.tier);
        break;
      }
    }
  }

  if (matched.size === 0) return sawNone ? 1 : 'SKIP';

  const tiers = new Set(matched.values());
  let base = 2;
  if (tiers.has('advanced')) base = 4;
  else if (tiers.has('control')) base = 3;

  let bonus = 0;
  if (tiers.size >= 2) bonus += 0.5;
  if (matched.size >= 6) bonus += 0.5;

  return finalizeQuestionScore(Math.min(5, base + bonus));
}

function q29Score(raw: string | undefined): QuestionScore {
  if (!raw || raw.trim() === '') return 'SKIP';

  const realMatches = new Set<string>();
  let sawNone = false;
  let sawFake = false;

  for (const item of splitMulti(raw)) {
    const norm = normalize(item);

    if (norm.includes('none of the above') || norm.includes("haven't used any")) {
      sawNone = true;
      continue;
    }

    if (norm === 'other:' || norm === 'other') continue;

    for (const needle of REAL_PROJECT_CONFIG_NEEDLES) {
      if (norm.includes(needle)) {
        realMatches.add(needle);
        break;
      }
    }

    if (FAKE_PROJECT_CONFIG_NEEDLES.some((needle) => norm.includes(needle))) {
      sawFake = true;
    }
  }

  if (realMatches.size === 0) {
    return sawNone || sawFake ? 1 : 'SKIP';
  }

  let base = 2;
  if (realMatches.size === 2) base = 3;
  else if (realMatches.size <= 4) base = 4;
  else base = 5;

  return finalizeQuestionScore(Math.max(1, sawFake ? base - 1 : base));
}

function verificationScore(qid: '2.14' | '2.15', raw: string): QuestionScore {
  if (!raw || raw.trim() === '') return 'SKIP';

  const norm = normalize(raw);
  const rule = VERIFICATION_RULES[qid];

  if (rule.clear.some((needle) => norm.includes(needle))) return 5;
  if (rule.partial.some((needle) => norm.includes(needle))) return 3;
  return 1;
}

export function scoreSkillsEntries(r: RawResponse): QEntry[] {
  return [
    weightedEntry('2.1', rawSingleSelectScore('2.1', SINGLE_SCORES['2.1'], r.q2_1)),
    weightedEntry('2.2', rawSingleSelectScore('2.2', SINGLE_SCORES['2.2'], r.q2_2)),
    weightedEntry('2.3', rawSingleSelectScore('2.3', SINGLE_SCORES['2.3'], r.q2_3)),
    weightedEntry('2.4', rawSingleSelectScore('2.4', SINGLE_SCORES['2.4'], r.q2_4)),
    weightedEntry('2.5', rawSingleSelectScore('2.5', SINGLE_SCORES['2.5'], r.q2_5)),
    weightedEntry('2.6', q26Score(r.q2_6)),
    weightedEntry('2.7', rawSingleSelectScore('2.7', SINGLE_SCORES['2.7'], r.q2_7)),
    weightedEntry('2.8', q28Score(r.q2_8)),
    weightedEntry('2.9', q29Score(r.q2_9)),
    weightedEntry('2.10', rawSingleSelectScore('2.10', SINGLE_SCORES['2.10'], r.q2_10)),
    weightedEntry('2.11', rawSingleSelectScore('2.11', SINGLE_SCORES['2.11'], r.q2_11)),
    weightedEntry('2.12', rawSingleSelectScore('2.12', SINGLE_SCORES['2.12'], r.q2_12)),
    weightedEntry('2.14', verificationScore('2.14', r.q2_14)),
    weightedEntry('2.15', verificationScore('2.15', r.q2_15)),
  ];
}
