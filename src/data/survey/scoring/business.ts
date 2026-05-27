import {
  finalizeQuestionScore,
  normalize,
  rawSingleSelectScore,
  splitMulti,
  type QEntry,
  type QuestionScore,
  type RawResponse,
  type ScoreMap,
  weightedEntry,
} from './shared';
import {
  scorePrimaryModelSelection,
  scorePrimaryToolSelection,
} from './usage';

type BusinessUsageGroup = 'communication' | 'research' | 'planning' | 'execution' | 'enablement';
type WorkflowEvidence = 'none' | 'basic' | 'advanced' | 'unknown';

interface BusinessActivityRule {
  needle: string;
  base: number;
  group: BusinessUsageGroup;
}

const USAGE_SINGLE_SCORES: Record<string, ScoreMap> = {
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
    ['part of my standard workflow', 3],
    ['occasionally use it alongside my work', 2],
    ['keep ai separate from project work', 1],
  ],
  '1.7': [
    ['documented guidelines or expectations', 4],
    ['loose team norms', 3],
    ['informally', 2],
    ['everyone uses whatever they want', 1],
    ['fully individual', 1],
  ],
  '1.9': [
    ['standard agenda item', 5],
    ['recurring touchpoint on ai', 4],
    ['occasionally', 3],
    ['come up once or twice', 2],
    ['never', 1],
  ],
  '1.10': [
    ['maintain a shared ai playbook that we actively update', 5],
    ['shared configuration, prompts, or templates', 4],
    ["explicitly agreed on tools for specific tasks", 3],
    ['informally settled on one or two tools', 2],
    ['everyone uses whatever they want', 1],
  ],
  '1.11': [
    ['team uses regularly', 4],
    ['shared a prompt template or workflow that a few people tried', 3],
    ['customized my personal setup but only i use it', 2],
    ['use ai for my own tasks only', 1],
  ],
};

const WORKFLOW_USAGE_RULES: BusinessActivityRule[] = [
  { needle: 'writing / editing', base: 2.0, group: 'communication' },
  { needle: 'communication (emails, messages, client comms)', base: 2.5, group: 'communication' },
  { needle: 'research & summarization', base: 3.0, group: 'research' },
  { needle: 'planning & structuring ideas', base: 3.0, group: 'planning' },
  { needle: 'presentations & slide creation', base: 2.5, group: 'communication' },
  { needle: 'data analysis or reporting', base: 3.5, group: 'execution' },
  { needle: 'design or visual content', base: 3.0, group: 'execution' },
  { needle: 'hiring, sourcing, or screening', base: 3.0, group: 'execution' },
  { needle: 'learning or upskilling', base: 2.5, group: 'enablement' },
  { needle: 'transcribing', base: 2.5, group: 'communication' },
  { needle: 'call summarizing', base: 2.5, group: 'communication' },
];

const DEPARTMENT_USAGE_RULES: BusinessActivityRule[] = [
  { needle: 'client or stakeholder communication', base: 3.0, group: 'communication' },
  { needle: 'reporting or status updates', base: 2.5, group: 'communication' },
  { needle: 'research or competitive analysis', base: 3.5, group: 'research' },
  { needle: 'planning, scheduling, or estimation', base: 3.5, group: 'planning' },
  { needle: 'proposals, briefs, or pitch preparation', base: 3.5, group: 'execution' },
  { needle: 'content creation (marketing, blog, social)', base: 3.0, group: 'execution' },
  { needle: 'hiring, onboarding, or people processes', base: 3.0, group: 'execution' },
  { needle: 'design or prototyping', base: 3.0, group: 'execution' },
];

const SKILLS_SINGLE_SCORES: Record<string, ScoreMap> = {
  '2.1': [
    ['explain to a colleague when to use ai and when not to', 5],
    ['strengths and limitations well', 4],
    ['know the basics', 2],
    ["don't know", 1],
  ],
  '2.2': [
    ['subtle issues', 5],
    ['always review critically', 4],
    ['confident', 3],
    ['not confident', 1],
  ],
  '2.3': [
    ['manage context carefully', 5],
    ['structure my context carefully', 4],
    ['deliberately provide relevant context', 3],
    ["don't think much about what to include", 2],
    ['hope for the best', 1],
  ],
  '2.5': [
    ['consistent review process', 5],
    ['cross-reference with other sources', 4],
    ['review it critically', 3],
    ['skim it and use it if it looks reasonable', 2],
    ['mostly trust the content', 2],
  ],
  '2.6': [
    ['clear mental model of where ai adds value', 5],
    ['stopped using ai for one or two specific tasks', 4],
    ["vague sense of where ai doesn't help", 3],
    ['use ai whenever i can', 2],
    ['still figuring out where ai helps', 1],
  ],
  '2.8': [
    ['actively choose thinking mode, model, and context strategy together', 5],
    ['understand the difference and choose based on the task', 4],
    ["i've seen it but don't know when to use which", 3],
    ["heard of it but haven't tried", 2],
    ['not familiar with it yet', 1],
  ],
  '2.9': [
    ['follow documented guidelines and actively flag risks', 5],
    ["clear mental checklist of what can and can't go", 4],
    ['know the basics', 3],
    ['cautious but not sure where the line is', 2],
    ["don't think about it", 1],
  ],
  '2.11': [
    ['section by section', 5],
    ['write the document from the summary', 3],
    ['paste everything into ai and ask it to organize it', 1],
  ],
};

const IMPACT_SINGLE_SCORES: Record<string, ScoreMap> = {
  '3.1': [
    ['transformative', 5],
    ["couldn't imagine working without it", 4],
    ['noticeable improvement', 3],
    ['slight improvement', 2],
    ['no change', 1],
  ],
  '3.2': [
    ["built or shared role-specific ai workflows that others use", 5],
    ['essential for how i do my specific job', 4],
    ['regularly use ai for tasks unique to my function', 3],
    ["tried once or twice for something role-specific", 2],
    ['no', 1],
  ],
  '3.4': [
    ['multiple examples and could teach others', 5],
    ['clear example i could share', 4],
    ['maybe, but it was minor', 2],
    ['no', 1],
  ],
  '3.5': [
    ["introduced a new process that didn't exist before", 5],
    ['meaningfully changed how one workflow operates', 4],
    ['tweaked how i do a few tasks', 2],
    ['same tasks faster', 1],
  ],
  '3.6': [
    ['compare them against my workflow needs, and share recommendations with my team', 5],
    ['actively evaluate and choose the best tool per task', 4],
    ['use 2-3 different tools depending on the task', 3],
    ['know there are different tools but i stick with one', 2],
    ['use one tool for everything', 1],
  ],
  '3.7': [
    ['more than 5 hours', 5],
    ['3-5 hours', 4],
    ['1-3 hours', 3],
    ['less than 1 hour', 2],
    ['0 hours', 1],
  ],
  '3.8': [
    ['major disruption', 5],
    ['significant impact', 4],
    ['noticeable setback', 3],
    ['minor inconvenience', 2],
    ['no real impact', 1],
  ],
  '3.9': [
    ['make informed decisions about which model/tool to use based on cost vs quality tradeoffs', 5],
    ['understand token-based pricing', 4],
    ['roughly estimate cost of a task', 4],
    ['understand the basics', 3],
    ['some tools are free and some are paid', 2],
    ['i have no idea how pricing works', 1],
    ["don't know", 1],
  ],
  '3.10': [
    ['have everything i need', 4],
    ["benefit from a paid tier", 3],
    ["there's a specific tool i'd like but don't have access to", 2],
    ["haven't thought about it", 2],
    ["don't know what's available", 1],
    ['limited by cost', 1],
  ],
  '3.11': [
    ['company provides it, and i also pay for additional tools myself', 4],
    ['the client provides or pays for ai tools', 3],
    ['company provides a subscription', 3],
    ['i pay out of my own pocket', 2],
    ['i only use free tiers', 1],
    ["i'm not sure", 1],
  ],
  '3.11_cost': [
    ['actively optimize', 5],
    ['sometimes choose a cheaper option', 4],
    ["aware of cost differences but it doesn't change my behavior", 2],
    ["use whatever's available without comparing", 2],
    ["don't think about cost at all", 1],
  ],
};

const CULTURE_SINGLE_SCORES: Record<string, ScoreMap> = {
  '4.1': [
    ['actively teach others', 5],
    ['actively seek out new tools', 4],
    ['learning at a steady pace', 3],
    ["learn when something comes up, but don't seek it out", 2],
    ['not actively developing my ai skills', 1],
  ],
  '4.2': [
    ['regularly experiment with new tools', 5],
    ['multiple times', 4],
    ['yes, once', 3],
    ["thought about it but didn't", 2],
    ['no', 1],
  ],
  '4.3': [
    ['go-to resource', 5],
    ['actively share', 4],
    ['occasionally when it comes up', 3],
    ['rarely', 2],
    ['never', 1],
  ],
  '4.4': [
    ['helped other teams or projects adopt', 5],
    ['became a team practice', 4],
    ['at least one person adopted', 3],
    ["suggested something but it didn't stick", 2],
    ['no', 1],
  ],
  '4.5': [
    ['helped people on other teams or projects', 5],
    ['multiple people across my team', 4],
    ['name one person whose workflow changed', 3],
    ['given advice but', 2],
    ["haven't directly helped someone", 1],
  ],
  '4.6': [
    ['very high', 5],
    ['above average', 4],
    ['average', 3],
    ['below average', 2],
    ['very low', 1],
  ],
  '4.7': [
    ['very satisfied', 5],
    ['satisfied', 4],
    ['neutral', 3],
    ['dissatisfied', 2],
    ['very dissatisfied', 1],
  ],
  '4.8': [
    ['much more enjoyable', 5],
    ['more enjoyable', 4],
    ['no change', 3],
    ['slightly less', 2],
    ['much less', 1],
  ],
  '4.9': [
    ['very well supported', 5],
    ['well supported', 4],
    ['somewhat', 3],
    ['somewhat supported', 3],
    ['not very supported', 2],
    ['not supported', 1],
  ],
  '4.12': [
    ['team property, not individual habits', 4],
    ['partially', 3],
    ['probably not', 2],
    ['main person driving ai usage', 2],
    ["i'm the one who's been driving", 2],
    ['no team ai practices to continue', 1],
  ],
  '4.13': [
    ['multiple knowledge artifacts', 5],
    ['substantial guide, presentation, or training material', 4],
    ['shared prompt collection or short how-to', 3],
    ['slack messages or informal notes', 2],
    ['no', 1],
  ],
  '4.14': [
    ['part of onboarding', 5],
    ['informally', 3],
    ['there are no ai practices to onboard on', 1],
    ['figure it out themselves', 1],
  ],
};

function activityBreadthBonus(count: number): number {
  if (count >= 6) return 1;
  if (count >= 4) return 0.75;
  if (count >= 2) return 0.5;
  return 0;
}

function activityGroupBonus(groups: Set<BusinessUsageGroup>): number {
  if (groups.size >= 4) return 0.75;
  if (groups.size >= 3) return 0.5;
  if (groups.size >= 2) return 0.25;
  return 0;
}

function scoreBusinessActivities(
  raw: string,
  rules: BusinessActivityRule[],
): QuestionScore {
  if (!raw || raw.trim() === '') return 'SKIP';
  if (normalize(raw).includes("don't use ai in any workflow")) return 1;
  if (normalize(raw) === 'none') return 1;

  const sortedRules = [...rules].sort((a, b) => b.needle.length - a.needle.length);
  const matchedRules: BusinessActivityRule[] = [];

  for (const item of splitMulti(raw)) {
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

  const base = Math.max(...uniqueMatches.map((rule) => rule.base));
  const groups = new Set(uniqueMatches.map((rule) => rule.group));
  return finalizeQuestionScore(
    Math.min(
      maxBusinessWorkflowScore(raw),
      base + activityBreadthBonus(uniqueMatches.length) + activityGroupBonus(groups),
    ),
  );
}

function scoreDepartmentActivities(raw: string): QuestionScore {
  const baseScore = scoreBusinessActivities(raw, DEPARTMENT_USAGE_RULES);
  if (typeof baseScore !== 'number') return baseScore;

  const norm = normalize(raw);
  if (norm.includes("don't use ai in any workflow") || norm === 'none') return 1;

  const matchedRules: BusinessActivityRule[] = [];
  const sortedRules = [...DEPARTMENT_USAGE_RULES].sort((a, b) => b.needle.length - a.needle.length);

  for (const item of splitMulti(raw)) {
    let itemNorm = normalize(item);
    if (itemNorm === 'other (free text)' || itemNorm === 'other:' || itemNorm === 'other') continue;

    itemNorm = itemNorm.replace(/^other:\s*/, '');
    if (!itemNorm) continue;

    for (const rule of sortedRules) {
      if (itemNorm.includes(rule.needle)) {
        matchedRules.push(rule);
        break;
      }
    }
  }

  const uniqueCount = new Set(matchedRules.map((rule) => rule.needle)).size;
  if (uniqueCount <= 1) return Math.min(baseScore, 2);

  return baseScore;
}

function businessWorkflowEvidence(raw: string | undefined): WorkflowEvidence {
  if (!raw || raw.trim() === '') return 'unknown';

  const norm = normalize(raw);
  if (norm.includes("don't use ai in any workflow")) return 'none';

  const advancedNeedles = [
    'data analysis or reporting',
    'design or visual content',
    'hiring, sourcing, or screening',
    'transcribing',
    'call summarizing',
  ];
  const basicNeedles = [
    'writing / editing',
    'communication (emails, messages, client comms)',
    'research & summarization',
    'planning & structuring ideas',
    'presentations & slide creation',
    'learning or upskilling',
  ];

  const sawAdvanced = advancedNeedles.some((needle) => norm.includes(needle));
  if (sawAdvanced) return 'advanced';

  const sawBasic = basicNeedles.some((needle) => norm.includes(needle));
  return sawBasic ? 'basic' : 'unknown';
}

function maxBusinessWorkflowScore(raw: string | undefined): number {
  return businessWorkflowEvidence(raw) === 'advanced' ? 5 : 4;
}

function harmonizeAgentRegularityScore(
  q14: QuestionScore,
  q15Raw: string | undefined,
): QuestionScore {
  if (typeof q14 !== 'number') return q14;

  const evidence = businessWorkflowEvidence(q15Raw);

  if (evidence === 'none') return Math.min(q14, 2);
  if (evidence === 'basic') return Math.min(q14, 4);
  return q14;
}

function scoreRecoveryStrategies(raw: string): QuestionScore {
  if (!raw || raw.trim() === '') return 'SKIP';

  const scores: number[] = [];
  let selectedRephrase = false;

  for (const item of splitMulti(raw)) {
    const norm = normalize(item);

    if (norm.includes('diagnose why it failed')) scores.push(5);
    else if (norm.includes('decompose the task')) scores.push(4);
    else if (norm.includes('iterate on the prompt')) scores.push(3);
    else if (norm.includes('try rephrasing once')) {
      scores.push(2);
      selectedRephrase = true;
    } else if (norm.includes('give up')) {
      scores.push(1);
    }
  }

  if (scores.length === 0) return 'SKIP';

  const strongest = Math.max(...scores);
  const adjusted = strongest >= 3 && selectedRephrase ? strongest - 0.5 : strongest;
  return finalizeQuestionScore(adjusted);
}

function scorePromptTechniques(raw: string): QuestionScore {
  if (!raw || raw.trim() === '') return 'SKIP';

  const foundationalNeedles = [
    'role or persona assignment',
    'structured output formatting',
    'chain-of-thought or step-by-step instructions',
    'multi-turn iteration',
    'prompt templates',
  ];
  const controlNeedles = [
    'system prompts or custom instructions',
    'examples in the prompt',
    'explicit constraints or boundaries',
    'providing reference documents or files as context',
    'negative examples',
  ];
  const advancedNeedles = [
    'asking ai to critique or review its own output',
    'task decomposition',
    'using different models for different subtasks',
  ];

  const matchedTiers = new Set<'foundational' | 'control' | 'advanced'>();
  let matchCount = 0;

  for (const item of splitMulti(raw)) {
    const norm = normalize(item);
    if (norm.includes('none of the above')) return 1;

    if (advancedNeedles.some((needle) => norm.includes(needle))) {
      matchedTiers.add('advanced');
      matchCount += 1;
      continue;
    }
    if (controlNeedles.some((needle) => norm.includes(needle))) {
      matchedTiers.add('control');
      matchCount += 1;
      continue;
    }
    if (foundationalNeedles.some((needle) => norm.includes(needle))) {
      matchedTiers.add('foundational');
      matchCount += 1;
    }
  }

  if (matchCount === 0) return 'SKIP';

  let base = 2;
  if (matchedTiers.has('advanced')) base = 4;
  else if (matchedTiers.has('control')) base = 3;

  let bonus = 0;
  if (matchedTiers.size >= 2) bonus += 0.5;
  if (matchCount >= 6) bonus += 0.5;

  return finalizeQuestionScore(Math.min(5, base + bonus));
}

function scoreConceptFamiliarity(raw: string): QuestionScore {
  if (!raw || raw.trim() === '') return 'SKIP';

  const items = splitMulti(raw);
  if (items.some((item) => normalize(item).includes('none of these'))) return 1;

  const unique = new Set(
    items.filter(Boolean).map((item) => normalize(item)).filter((item) => item !== 'other'),
  );

  if (unique.size >= 3) return 4;
  if (unique.size === 2) return 3;
  if (unique.size === 1) return 2;
  return 'SKIP';
}

function harmonizeSharedWorkflowBuildScore(
  q111: QuestionScore,
  q111Raw: string | undefined,
  q210: QuestionScore,
): QuestionScore {
  if (typeof q111 !== 'number' || !q111Raw || q111Raw.trim() === '') return q111;

  const norm = normalize(q111Raw);
  const claimsBuiltSomethingShared =
    norm.includes("i've built something") || norm.includes('i have built something');

  if (!claimsBuiltSomethingShared) return q111;

  if (q210 === 'SKIP') return Math.min(q111, 2);
  if (typeof q210 === 'number' && q210 <= 2) return Math.min(q111, 2);

  return q111;
}

function scoreRoleSpecificUseCases(raw: string): QuestionScore {
  if (!raw || raw.trim() === '') return 'SKIP';

  const count = new Set(splitMulti(raw).map((item) => normalize(item))).size;
  if (count >= 6) return 5;
  if (count >= 4) return 4;
  if (count >= 2) return 3;
  if (count === 1) return 2;
  return 'SKIP';
}

function scoreBusinessNonAiBlocker(raw: string | undefined): QuestionScore {
  if (!raw || raw.trim() === '') return 'SKIP';

  const norm = normalize(raw);

  if (
    norm.includes('nothing - the blockers are mostly about ai skills') ||
    norm.includes('generally, no blockers')
  ) {
    return 5;
  }

  if (
    norm.includes('unclear or undocumented processes') ||
    norm.includes('no team agreement on how/where to use ai') ||
    norm.includes('unclear what ai can actually help with') ||
    norm.includes("we need to align the team on our process")
  ) {
    return 2;
  }

  if (
    norm.includes('no templates, examples, or reference materials') ||
    norm.includes('data sensitivity or confidentiality concerns') ||
    norm.includes('client restrictions or lack of client buy-in') ||
    norm.includes('lack of access to the right ai tools') ||
    norm.includes('no time to experiment') ||
    norm.includes('integration between tools takes some time')
  ) {
    return 3;
  }

  if (norm === 'other') return 'SKIP';

  return 'SKIP';
}

export function scoreBusinessUsageEntries(r: RawResponse): QEntry[] {
  const q14 = rawSingleSelectScore('1.4', USAGE_SINGLE_SCORES['1.4'], r.q1_4);
  const q15 = scoreBusinessActivities(r.q1_5, WORKFLOW_USAGE_RULES);
  const q210 = scoreConceptFamiliarity(r.q2_10);
  const q111 = rawSingleSelectScore('1.11', USAGE_SINGLE_SCORES['1.11'], r.q1_11);

  return [
    weightedEntry('1.1', rawSingleSelectScore('1.1', USAGE_SINGLE_SCORES['1.1'], r.q1_1)),
    weightedEntry('1.2', scorePrimaryToolSelection(r.q1_2)),
    weightedEntry('1.3', scorePrimaryModelSelection(r.q1_3)),
    weightedEntry('1.4', harmonizeAgentRegularityScore(q14, r.q1_5)),
    weightedEntry('1.5', q15),
    weightedEntry('1.6', rawSingleSelectScore('1.6', USAGE_SINGLE_SCORES['1.6'], r.q1_6)),
    weightedEntry('1.7', rawSingleSelectScore('1.7', USAGE_SINGLE_SCORES['1.7'], r.q1_7)),
    weightedEntry('1.8', scoreDepartmentActivities(r.q1_8)),
    weightedEntry('1.9', rawSingleSelectScore('1.9', USAGE_SINGLE_SCORES['1.9'], r.q1_9)),
    weightedEntry('1.10', rawSingleSelectScore('1.10', USAGE_SINGLE_SCORES['1.10'], r.q1_10)),
    weightedEntry('1.11', harmonizeSharedWorkflowBuildScore(q111, r.q1_11, q210)),
  ];
}

export function scoreBusinessSkillsEntries(r: RawResponse): QEntry[] {
  return [
    weightedEntry('2.1', rawSingleSelectScore('2.1', SKILLS_SINGLE_SCORES['2.1'], r.q2_1)),
    weightedEntry('2.2', rawSingleSelectScore('2.2', SKILLS_SINGLE_SCORES['2.2'], r.q2_2)),
    weightedEntry('2.3', rawSingleSelectScore('2.3', SKILLS_SINGLE_SCORES['2.3'], r.q2_3)),
    weightedEntry('2.4', scoreRecoveryStrategies(r.q2_4)),
    weightedEntry('2.5', rawSingleSelectScore('2.5', SKILLS_SINGLE_SCORES['2.5'], r.q2_5)),
    weightedEntry('2.6', rawSingleSelectScore('2.6', SKILLS_SINGLE_SCORES['2.6'], r.q2_6)),
    weightedEntry('2.7', scorePromptTechniques(r.q2_7)),
    weightedEntry('2.8', rawSingleSelectScore('2.8', SKILLS_SINGLE_SCORES['2.8'], r.q2_8)),
    weightedEntry('2.9', rawSingleSelectScore('2.9', SKILLS_SINGLE_SCORES['2.9'], r.q2_9)),
    weightedEntry('2.10', scoreConceptFamiliarity(r.q2_10)),
    weightedEntry('2.11', rawSingleSelectScore('2.11', SKILLS_SINGLE_SCORES['2.11'], r.q2_11)),
  ];
}

export function scoreBusinessImpactEntries(r: RawResponse): QEntry[] {
  return [
    weightedEntry('3.1', rawSingleSelectScore('3.1', IMPACT_SINGLE_SCORES['3.1'], r.q3_1)),
    weightedEntry('3.2', rawSingleSelectScore('3.2', IMPACT_SINGLE_SCORES['3.2'], r.q3_2)),
    weightedEntry('3.3', scoreRoleSpecificUseCases(r.q3_3)),
    weightedEntry('3.4', rawSingleSelectScore('3.4', IMPACT_SINGLE_SCORES['3.4'], r.q3_4)),
    weightedEntry('3.5', rawSingleSelectScore('3.5', IMPACT_SINGLE_SCORES['3.5'], r.q3_5)),
    weightedEntry('3.6', rawSingleSelectScore('3.6', IMPACT_SINGLE_SCORES['3.6'], r.q3_6)),
    weightedEntry('3.7', rawSingleSelectScore('3.7', IMPACT_SINGLE_SCORES['3.7'], r.q3_7)),
    weightedEntry('3.8', rawSingleSelectScore('3.8', IMPACT_SINGLE_SCORES['3.8'], r.q3_8)),
    weightedEntry('3.9', rawSingleSelectScore('3.9', IMPACT_SINGLE_SCORES['3.9'], r.q3_9)),
    weightedEntry('3.10', rawSingleSelectScore('3.10', IMPACT_SINGLE_SCORES['3.10'], r.q3_10)),
    weightedEntry('3.11', rawSingleSelectScore('3.11', IMPACT_SINGLE_SCORES['3.11'], r.q3_11)),
    weightedEntry('3.11_cost', rawSingleSelectScore('3.11_cost', IMPACT_SINGLE_SCORES['3.11_cost'], r.q3_12)),
    weightedEntry('3.12', scoreBusinessNonAiBlocker(r.q3_blocker)),
  ];
}

export function scoreBusinessCultureEntries(r: RawResponse): QEntry[] {
  return [
    weightedEntry('4.1', rawSingleSelectScore('4.1', CULTURE_SINGLE_SCORES['4.1'], r.q4_1)),
    weightedEntry('4.2', rawSingleSelectScore('4.2', CULTURE_SINGLE_SCORES['4.2'], r.q4_2)),
    weightedEntry('4.3', rawSingleSelectScore('4.3', CULTURE_SINGLE_SCORES['4.3'], r.q4_3)),
    weightedEntry('4.4', rawSingleSelectScore('4.4', CULTURE_SINGLE_SCORES['4.4'], r.q4_4)),
    weightedEntry('4.5', rawSingleSelectScore('4.5', CULTURE_SINGLE_SCORES['4.5'], r.q4_5)),
    weightedEntry('4.6', rawSingleSelectScore('4.6', CULTURE_SINGLE_SCORES['4.6'], r.q4_6)),
    weightedEntry('4.7', rawSingleSelectScore('4.7', CULTURE_SINGLE_SCORES['4.7'], r.q4_7)),
    weightedEntry('4.8', rawSingleSelectScore('4.8', CULTURE_SINGLE_SCORES['4.8'], r.q4_8)),
    weightedEntry('4.9', rawSingleSelectScore('4.9', CULTURE_SINGLE_SCORES['4.9'], r.q4_9)),
    weightedEntry('4.12', rawSingleSelectScore('4.12', CULTURE_SINGLE_SCORES['4.12'], r.q4_12)),
    weightedEntry('4.13', rawSingleSelectScore('4.13', CULTURE_SINGLE_SCORES['4.13'], r.q4_13)),
    weightedEntry('4.14', rawSingleSelectScore('4.14', CULTURE_SINGLE_SCORES['4.14'], r.q4_14)),
  ];
}
