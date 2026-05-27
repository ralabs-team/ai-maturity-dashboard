// Profile insights — generates a personalized summary, strengths,
// growth areas, and action items based on the person's dimension scores.
//
// This is rule-based "AI-style" content for now. Later it can be replaced
// with a real LLM call against a prompt template.

import type { Individual, TechDimension } from '../types';
import { LEVEL_LABELS } from '../types';
import { computeOverallScoreFromDimensionScores } from './scoring';

export interface ProfileInsights {
  summary: string;
  strengths: { dimension: TechDimension; note: string }[];
  weaknesses: { dimension: TechDimension; note: string }[];
  actions: string[];
}

const STRENGTH_NOTES: Record<TechDimension, string> = {
  'Usage':
    'AI is woven into daily workflows — high frequency and broad tool coverage.',
  'Skills':
    'Strong technical grasp of how LLMs and AI tools work under the hood.',
  'Impact':
    'AI is delivering measurable value to delivery speed and quality.',
  'Culture':
    'Actively sharing knowledge and shaping team-level adoption.',
  'Vision':
    'Strong forward-looking judgment about where AI can create practical, responsible value next.',
};

const WEAKNESS_NOTES: Record<TechDimension, string> = {
  'Usage':
    'AI usage is occasional or limited to a narrow set of tools — room to broaden and deepen adoption.',
  'Skills':
    'Skill gaps in prompt engineering, context handling, or core LLM concepts (RAG, MCP, agents).',
  'Impact':
    'AI is in the toolbox but its value isn\'t yet visible in delivery outcomes or measurable improvements.',
  'Culture':
    'Working in relative isolation — not sharing tips, building artifacts, or shaping team practice.',
  'Vision':
    'Near-term AI opportunities are still fuzzy, making it harder to prioritize experiments that create meaningful value.',
};

const ACTION_LIBRARY: Record<TechDimension, string[]> = {
  'Usage': [
    'Embed AI into 2-3 specific daily workflows over the next month (start with one repetitive task)',
    'Try a coding-focused AI tool like Claude Code or Cursor for your next feature',
    'Set up a project-level CLAUDE.md or .cursorrules for your current project',
    'Pick one task you do weekly and rebuild it as an AI-assisted workflow',
  ],
  'Skills': [
    'Complete a structured workshop on prompt engineering and context strategies',
    'Practice giving AI structured context: explicit constraints, examples, and reference docs',
    'Spend 30 minutes learning about MCP and try setting up one MCP server',
    'Read the Anthropic prompting guide and practice 5 advanced techniques this week',
  ],
  'Impact': [
    'Pick one recurring task and measure its before/after time savings with AI',
    'Share one concrete AI win (with rough numbers) in your next sprint retro',
    'Identify one workflow you could redesign — not just speed up — using AI',
    'Bring AI usage into your next estimation: explicitly factor it into the plan',
  ],
  'Culture': [
    'Share one AI tip, prompt, or discovery in your team channel this week',
    'Document your AI workflow as a shared guide or CLAUDE.md template',
    'Pair with a less AI-literate teammate for 30 minutes to transfer one skill',
    'Bring an "AI moment" or demo to your next team retro',
  ],
  'Vision': [
    'List 3 recurring workflows in your role and rank them by value, feasibility, and risk',
    'Turn one promising AI opportunity into a small pilot with a clear success metric',
    'Write down one workflow that could work differently with AI, not just faster',
    'Define one AI capability you want to build next and connect it to a real team need',
  ],
};

function firstName(name: string): string {
  return name.split(' ')[0];
}

export function generateInsights(person: Individual): ProfileInsights {
  const dims = (Object.keys(person.scores) as TechDimension[])
    .map((d) => ({ dimension: d, score: person.scores[d] }))
    .sort((a, b) => b.score - a.score);

  const top = dims[0];
  const bottom = dims[dims.length - 1];
  const secondBottom = dims[dims.length - 2];

  const usage = person.scores['Usage'];
  const skills = person.scores['Skills'];
  const impact = person.scores['Impact'];
  const culture = person.scores['Culture'];
  const vision = person.scores['Vision'];
  const overall = person.overallScore ?? computeOverallScoreFromDimensionScores({
    'Usage': usage,
    'Skills': skills,
    'Impact': impact,
    'Culture': culture,
    'Vision': vision,
  });
  const level = person.overallLevel;
  const levelLabel = LEVEL_LABELS[level];
  const fn = firstName(person.name);

  // ----- Summary paragraph -----
  let summary = `**${person.name}** is currently at **Level ${level} — ${levelLabel}** with an overall maturity score of **${overall.toFixed(1)}**. `;

  if (level >= 4) {
    summary += `This places ${fn} among the most mature AI adopters in the organization. `;
  } else if (level === 3) {
    summary += `${fn} has built a consistent practice and is using AI as a regular part of daily work. `;
  } else if (level === 2) {
    summary += `${fn} is actively exploring AI tools but hasn't yet built deep, systematic workflows. `;
  } else {
    summary += `${fn} is in the early stages of AI adoption and would benefit from targeted onboarding and structured guidance. `;
  }

  // Pattern-specific framing
  if (usage > skills + 0.5 && impact < skills - 0.4) {
    summary += `The profile shows **broad usage with shallow impact** — AI is being used frequently but isn\'t translating into measurable delivery improvements. The next step is depth, not breadth.`;
  } else if (skills > usage + 0.75) {
    summary += `There\'s a notable gap between **technical understanding and daily practice** — the knowledge is there, but it isn\'t yet flowing into everyday workflows.`;
  } else if (culture < 2.5 && top.score >= 3.5) {
    summary += `The clearest gap is **cultural**: this is a capable solo practitioner who isn\'t yet sharing knowledge or shaping team practice.`;
  } else if (impact < 2.5 && level >= 2) {
    summary += `**Impact** is the clearest blocker: AI is in the toolbox, but its value isn\'t yet visible to stakeholders or quantifiable in outcomes.`;
  } else if (top.score >= 4.0 && bottom.score >= 3.0) {
    summary += `The profile is **well-balanced** across all five dimensions, which makes targeted improvement straightforward.`;
  } else if (top.score - bottom.score > 1.75) {
    summary += `The profile shows a **wide spread** between strongest and weakest dimensions — focused work on the gap will lift the overall level the fastest.`;
  }

  // ----- Strengths (top 1-2) -----
  const strengths: { dimension: TechDimension; note: string }[] = [];
  if (top.score >= 3.0) {
    strengths.push({ dimension: top.dimension, note: STRENGTH_NOTES[top.dimension] });
  }
  if (dims[1].score >= 3.0 && dims[1].score >= top.score - 0.5) {
    strengths.push({ dimension: dims[1].dimension, note: STRENGTH_NOTES[dims[1].dimension] });
  }

  // ----- Weaknesses (bottom 1-2) -----
  const weaknesses: { dimension: TechDimension; note: string }[] = [];
  if (bottom.score < 2.5) {
    weaknesses.push({ dimension: bottom.dimension, note: WEAKNESS_NOTES[bottom.dimension] });
  }
  if (secondBottom.score < 2.5 && secondBottom.score <= bottom.score + 0.5) {
    weaknesses.push({ dimension: secondBottom.dimension, note: WEAKNESS_NOTES[secondBottom.dimension] });
  }

  // ----- Action items (prioritized from weaknesses) -----
  const actions: string[] = [];
  for (const w of weaknesses) {
    const lib = ACTION_LIBRARY[w.dimension];
    if (lib) actions.push(...lib.slice(0, 2));
  }
  // If still few actions, fill from the bottom dim's library
  if (actions.length < 4) {
    const lib = ACTION_LIBRARY[bottom.dimension];
    for (const a of lib) {
      if (!actions.includes(a) && actions.length < 4) actions.push(a);
    }
  }

  return {
    summary,
    strengths,
    weaknesses,
    actions: actions.slice(0, 5),
  };
}
