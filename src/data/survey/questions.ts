import type { TechDimension } from '../types';
import type { RawResponse } from './scoring';

type SurveyType = NonNullable<RawResponse['surveyType']>;

export interface QuestionMeta {
  id: keyof RawResponse;
  number: string;
  text: string;
  dimension: TechDimension;
  scoreKey?: string;
  isMulti?: boolean;
  isVerification?: boolean;
}

export interface OpenQuestionMeta {
  id: keyof RawResponse | string;
  number: string;
  text: string;
}

export interface SurveyQuestionDefinition {
  questions: QuestionMeta[];
  openQuestions: OpenQuestionMeta[];
}

export const DELIVERY_ENGINEERING_QUESTIONS: QuestionMeta[] = [
  // Dimension 1: Usage
  { id: 'q1_1', number: '1.1', text: 'How often do you use AI tools in your work?', dimension: 'Usage' },
  { id: 'q1_2', number: '1.2', text: 'What is your primary (most-used) AI tool over the last month?', dimension: 'Usage', isMulti: true },
  { id: 'q1_3', number: '1.3', text: 'What is the LLM model you used most over the last month?', dimension: 'Usage', isMulti: true },
  { id: 'q1_4', number: '1.4', text: 'Do you use any AI agents, custom GPTs, Claude Skills, or automation workflows regularly?', dimension: 'Usage' },
  { id: 'q1_5', number: '1.5', text: 'In which activities do you currently use AI? (at work, in personal projects, or both)', dimension: 'Usage', isMulti: true },
  { id: 'q1_6', number: '1.6', text: 'How embedded is AI in your actual project work?', dimension: 'Usage' },
  { id: 'q1_7', number: '1.7', text: 'Does your team have any shared AI practices, tools, or guidelines on projects?', dimension: 'Usage' },
  { id: 'q1_8', number: '1.8', text: 'Do you use project-level AI configuration files (e.g. CLAUDE.md, .cursorrules, system prompts per repo, or similar)?', dimension: 'Usage' },
  { id: 'q1_9', number: '1.9', text: 'When writing code with AI assistance, what best describes your approach?', dimension: 'Usage' },
  { id: 'q1_10', number: '1.10', text: 'What is the most advanced AI agent setup you\'ve built or worked with? (including personal projects, previous jobs, and current work)', dimension: 'Usage' },
  { id: 'q1_11', number: '1.11', text: 'Is AI usage discussed in your team\'s sprint planning, retros, or other ceremonies?', dimension: 'Usage' },

  // Dimension 2: Skills
  { id: 'q2_1', number: '2.1', text: 'How would you describe your understanding of how LLMs work under the hood (Transformers, tokenization, inference, attention mechanism, etc)?', dimension: 'Skills' },
  { id: 'q2_2', number: '2.2', text: 'How confident are you in identifying when an AI output is wrong, hallucinated, or unreliable?', dimension: 'Skills' },
  { id: 'q2_3', number: '2.3', text: 'When giving AI a complex task, how do you handle providing context?', dimension: 'Skills' },
  { id: 'q2_4', number: '2.4', text: 'How well do you understand concepts like context windows, temperature, RAG, or fine-tuning?', dimension: 'Skills' },
  { id: 'q2_5', number: '2.5', text: 'How well do you understand MCP (Model Context Protocol)?', dimension: 'Skills' },
  { id: 'q2_6', number: '2.6', text: 'When you don\'t get a good result from AI, what do you typically do?', dimension: 'Skills', isMulti: true },
  { id: 'q2_7', number: '2.7', text: 'Have you deliberately stopped using AI for a task where you previously used it, because you concluded it wasn\'t adding value?', dimension: 'Skills' },
  { id: 'q2_8', number: '2.8', text: 'Do you use any of the following when working with AI?', dimension: 'Skills', isMulti: true },
  { id: 'q2_9', number: '2.9', text: 'Which project-level AI configuration approaches have you worked with?', dimension: 'Skills', isMulti: true },
  { id: 'q2_10', number: '2.10', text: 'How do you handle AI-generated code before committing it?', dimension: 'Skills' },
  { id: 'q2_11', number: '2.11', text: 'When a new AI tool or model is released, how do you evaluate whether to adopt it?', dimension: 'Skills' },
  { id: 'q2_12', number: '2.12', text: 'When using AI tools, how do you handle sensitive data (client information, credentials, proprietary code, personal data)?', dimension: 'Skills' },
  { id: 'q2_13', number: '2.13', text: 'In which situations would you consider using a self-hosted or locally-run AI model instead of a cloud API?', dimension: 'Skills', isMulti: true },
  { id: 'q2_14', number: '2.14', text: 'When someone mentions "context window" in an AI tool, what does that mean to you?', dimension: 'Skills', isVerification: true },
  { id: 'q2_15', number: '2.15', text: 'When you hear "tool use" in the context of AI agents, what comes to mind?', dimension: 'Skills', isVerification: true },

  // Dimension 3: Impact
  { id: 'q3_1', number: '3.1', text: 'Has AI changed your personal output speed or quality?', dimension: 'Impact' },
  { id: 'q3_2', number: '3.2', text: 'Has AI changed how you approach estimation or technical planning on projects?', dimension: 'Impact' },
  { id: 'q3_3', number: '3.3', text: 'Has AI led you to change, redesign, or eliminate a process or workflow (not just speed it up)?', dimension: 'Impact' },
  { id: 'q3_4', number: '3.4', text: 'Roughly how many hours per week do you estimate AI saves you in your Ralabs work?', dimension: 'Impact' },
  { id: 'q3_5', number: '3.5', text: 'Can you point to a specific, measurable improvement that AI delivered on your project?', dimension: 'Impact' },
  { id: 'q3_6', number: '3.6', text: 'How well do you understand how AI tools are priced (tokens, API costs, subscription tiers)?', dimension: 'Impact' },
  { id: 'q3_7', number: '3.7', text: 'Do you feel you have access to the AI tools you need, or are you limited by cost/licensing?', dimension: 'Impact' },
  { id: 'q3_8', number: '3.8', text: 'If AI tools were taken away tomorrow, how would it affect your work?', dimension: 'Impact' },
  { id: 'q3_9', number: '3.9', text: 'Who pays for the AI tools you use at work?', dimension: 'Impact' },
  { id: 'q3_10', number: '3.10', text: 'When choosing between AI tools or models for a task, do you consider cost?', dimension: 'Impact' },
  { id: 'q3_11', number: '3.11', text: 'When you use AI to generate code that modifies production data or infrastructure, and the code looks correct syntactically, what should you do before running it?', dimension: 'Impact', isVerification: true },

  // Dimension 4: Culture
  { id: 'q4_1', number: '4.1', text: 'How do you feel about your AI skill growth right now?', dimension: 'Culture' },
  { id: 'q4_2', number: '4.2', text: 'In the last 30 days, did you try a new AI tool, model, or workflow on your own initiative?', dimension: 'Culture' },
  { id: 'q4_3', number: '4.3', text: 'Do you share AI tips, prompts, or discoveries with your teammates?', dimension: 'Culture' },
  { id: 'q4_4', number: '4.4', text: 'Have you introduced or recommended an AI tool or workflow that others on your team now use?', dimension: 'Culture' },
  { id: 'q4_5', number: '4.5', text: 'Can you name a specific Ralabs colleague or team whose AI usage changed because of your direct help?', dimension: 'Culture' },
  { id: 'q4_6', number: '4.6', text: 'Have you created any AI-related knowledge artifact at Ralabs that exists independently of you?', dimension: 'Culture' },
  { id: 'q4_7', number: '4.7', text: 'Have you built or configured an AI-powered workflow or automation that other people at Ralabs now use?', dimension: 'Culture' },
  { id: 'q4_8', number: '4.8', text: 'How would you rate the overall AI knowledge and adoption level of your immediate team / closest colleagues?', dimension: 'Culture' },
  { id: 'q4_9', number: '4.9', text: 'How satisfied are you with the AI tools available to you at work?', dimension: 'Culture' },
  { id: 'q4_10', number: '4.10', text: 'Does using AI make your work more or less enjoyable?', dimension: 'Culture' },
  { id: 'q4_11', number: '4.11', text: 'Do you feel supported by your organization in adopting AI?', dimension: 'Culture' },
  { id: 'q4_12', number: '4.12', text: 'What kind of AI support would be most helpful to you right now?', dimension: 'Culture', isMulti: true },
  { id: 'q4_13', number: '4.13', text: 'Would you like to receive hands-on AI help or training?', dimension: 'Culture' },
  { id: 'q4_14', number: '4.14', text: 'If you left this project tomorrow, would your team\'s AI practices continue without you?', dimension: 'Culture' },

  // Dimension 5: Vision
  { id: 'q5_1', number: '5.1', text: 'How clearly can you identify where AI could create more value in your role over the next 6 months?', dimension: 'Vision' },
  { id: 'q5_2', number: '5.2', text: 'Which actions would help your team get more value from AI next quarter? Select up to 3.', dimension: 'Vision', isMulti: true },
  { id: 'q5_3', number: '5.3', text: 'How do you think AI could change the way your work is done, not just make existing tasks faster?', dimension: 'Vision' },
  { id: 'q5_4', number: '5.4', text: 'How do you decide which AI improvement opportunities are worth exploring?', dimension: 'Vision' },
  { id: 'q5_5', number: '5.5', text: 'How well can you connect AI adoption to business, project, client, or team value?', dimension: 'Vision' },
  { id: 'q5_6', number: '5.6', text: 'How clearly do you know what AI capability you personally want to develop next?', dimension: 'Vision' },
];

export const DELIVERY_ENGINEERING_OPEN_QUESTIONS: OpenQuestionMeta[] = [
  { id: 'q3_12', number: '3.open', text: 'What is the biggest non-AI blocker preventing your team from getting more value from AI tools?' },
  { id: 'q4_open', number: 'open', text: 'What is the biggest thing stopping you from using AI more in your work?' },
];

export const BUSINESS_QUESTIONS: QuestionMeta[] = [
  // Dimension 1: Usage
  { id: 'q1_1', number: '1.1', text: 'How often do you use AI tools in your work?', dimension: 'Usage' },
  { id: 'q1_2', number: '1.2', text: 'What is your primary (most-used) AI tools over the last month?', dimension: 'Usage', isMulti: true },
  { id: 'q1_3', number: '1.3', text: 'What is the LLM model you used most over the last month?', dimension: 'Usage', isMulti: true },
  { id: 'q1_4', number: '1.4', text: 'Do you use any AI agents, custom GPTs, Claude Skills, or automation workflows regularly?', dimension: 'Usage' },
  { id: 'q1_5', number: '1.5', text: 'Which workflows do you currently use AI for?', dimension: 'Usage', isMulti: true },
  { id: 'q1_6', number: '1.6', text: 'How embedded is AI in your actual daily work?', dimension: 'Usage' },
  { id: 'q1_7', number: '1.7', text: 'Does your project team (the people you work with day-to-day) have any shared AI practices, tools, or guidelines?', dimension: 'Usage' },
  { id: 'q1_8', number: '1.8', text: 'In your department, on most recent tasks, which of these did you personally use AI for?', dimension: 'Usage', isMulti: true },
  { id: 'q1_9', number: '1.9', text: 'Is AI usage discussed in your team\'s regular meetings, planning sessions, or retrospectives?', dimension: 'Usage' },
  { id: 'q1_10', number: '1.10', text: 'Has your team agreed on specific AI tools to use together for any workflow?', dimension: 'Usage' },
  { id: 'q1_11', number: '1.11', text: 'Have you built or configured an AI-powered workflow or automation that other people at Ralabs now use?', dimension: 'Usage' },

  // Dimension 2: Skills
  { id: 'q2_1', number: '2.1', text: 'How would you describe your understanding of what AI tools like ChatGPT, Claude, or Copilot can and can\'t do?', dimension: 'Skills' },
  { id: 'q2_2', number: '2.2', text: 'How confident are you in identifying when an AI output is wrong, misleading, or too generic?', dimension: 'Skills' },
  { id: 'q2_3', number: '2.3', text: 'When giving AI a complex task, how do you handle providing context?', dimension: 'Skills' },
  { id: 'q2_4', number: '2.4', text: 'When you get a poor or irrelevant result from AI, what do you typically do?', dimension: 'Skills', isMulti: true },
  { id: 'q2_5', number: '2.5', text: 'When AI generates a long or complex output (a document, analysis, or presentation), how do you typically validate it?', dimension: 'Skills' },
  { id: 'q2_6', number: '2.6', text: 'Have you deliberately stopped using AI for a task where you previously used it, because you concluded it wasn\'t adding value?', dimension: 'Skills' },
  { id: 'q2_7', number: '2.7', text: 'Do you use any of the following when working with AI?', dimension: 'Skills', isMulti: true },
  { id: 'q2_8', number: '2.8', text: 'Some AI tools let you ask it to think through an approach before generating output — are you aware of this?', dimension: 'Skills' },
  { id: 'q2_9', number: '2.9', text: 'When using AI tools, how do you handle sensitive data (client information, credentials, personal data, internal documents, or financial data)?', dimension: 'Skills' },
  { id: 'q2_10', number: '2.10', text: 'Which of these AI/LLM concepts are you familiar with?', dimension: 'Skills', isMulti: true },
  { id: 'q2_11', number: '2.11', text: 'Imagine you have a long, messy set of notes and you need to turn them into a well-organized document (a report, plan, or brief). What would be your approach?', dimension: 'Skills' },

  // Dimension 3: Impact
  { id: 'q3_1', number: '3.1', text: 'Has AI changed your personal output speed or quality?', dimension: 'Impact' },
  { id: 'q3_2', number: '3.2', text: 'Do you use AI for tasks specific to your role (not just general writing or search)?', dimension: 'Impact' },
  { id: 'q3_3', number: '3.3', text: 'Which role-specific AI use cases have you tried?', dimension: 'Impact', isMulti: true },
  { id: 'q3_4', number: '3.4', text: 'Could you describe a specific example of how AI improved a task unique to your role?', dimension: 'Impact' },
  { id: 'q3_5', number: '3.5', text: 'Has AI led you to change, redesign, or eliminate a process or workflow (not just speed it up)?', dimension: 'Impact' },
  { id: 'q3_6', number: '3.6', text: 'How well do you know which AI tool is best suited for different tasks in your role?', dimension: 'Impact' },
  { id: 'q3_7', number: '3.7', text: 'Roughly how many hours per week do you estimate AI saves you in your Ralabs work?', dimension: 'Impact' },
  { id: 'q3_8', number: '3.8', text: 'If AI tools were taken away tomorrow, how would it affect your work?', dimension: 'Impact' },
  { id: 'q3_9', number: '3.9', text: 'How well do you understand how AI tools are priced (tokens, costs, subscription tiers)?', dimension: 'Impact' },
  { id: 'q3_10', number: '3.10', text: 'Do you feel you have access to the AI tools you need, or are you limited by cost/licensing?', dimension: 'Impact' },
  { id: 'q3_11', number: '3.11', text: 'Who pays for the AI tools you use at work?', dimension: 'Impact' },
  { id: 'q3_12', number: '3.11', text: 'When choosing between AI tools or models for a task, do you consider cost?', dimension: 'Impact', scoreKey: '3.11_cost' },
  { id: 'q3_blocker', number: '3.12', text: 'What is the biggest non-AI blocker preventing you or your team from getting more value from AI tools?', dimension: 'Impact' },

  // Dimension 4: Culture
  { id: 'q4_1', number: '4.1', text: 'How do you feel about your AI skill growth right now?', dimension: 'Culture' },
  { id: 'q4_2', number: '4.2', text: 'In the last 30 days, did you try a new AI tool, model, or workflow on your own initiative?', dimension: 'Culture' },
  { id: 'q4_3', number: '4.3', text: 'Do you share AI tips, prompts, or discoveries with your teammates?', dimension: 'Culture' },
  { id: 'q4_4', number: '4.4', text: 'Have you introduced or recommended an AI tool or workflow that others on your team now use?', dimension: 'Culture' },
  { id: 'q4_5', number: '4.5', text: 'Can you name a specific Ralabs colleague or team whose AI usage changed because of your direct help?', dimension: 'Culture' },
  { id: 'q4_6', number: '4.6', text: 'How would you rate the overall AI knowledge and adoption level of your immediate team / closest colleagues?', dimension: 'Culture' },
  { id: 'q4_7', number: '4.7', text: 'How satisfied are you with the AI tools available to you at work?', dimension: 'Culture' },
  { id: 'q4_8', number: '4.8', text: 'Does using AI make your work more or less enjoyable?', dimension: 'Culture' },
  { id: 'q4_9', number: '4.9', text: 'Do you feel supported by your organization in adopting AI?', dimension: 'Culture' },
  { id: 'q4_10', number: '4.10', text: 'What kind of AI support would be most helpful to you right now?', dimension: 'Culture', isMulti: true },
  { id: 'q4_11', number: '4.11', text: 'Would you like to receive hands-on AI help or training?', dimension: 'Culture' },
  { id: 'q4_12', number: '4.12', text: 'If you left this project tomorrow, would your team\'s AI practices continue without you?', dimension: 'Culture' },
  { id: 'q4_13', number: '4.13', text: 'Have you created any AI-related knowledge artifact at Ralabs that exists independently of you?', dimension: 'Culture' },
  { id: 'q4_14', number: '4.14', text: 'When new people join your team or project, are they onboarded on the team\'s AI practices?', dimension: 'Culture' },

  // Dimension 5: Vision
  { id: 'q5_1', number: '5.1', text: 'How clearly can you identify where AI could create more value in your role over the next 6 months?', dimension: 'Vision' },
  { id: 'q5_2', number: '5.2', text: 'Which actions would help your team get more value from AI next quarter? Select up to 3.', dimension: 'Vision', isMulti: true },
  { id: 'q5_3', number: '5.3', text: 'How do you think AI could change the way your work is done, not just make existing tasks faster?', dimension: 'Vision' },
  { id: 'q5_4', number: '5.4', text: 'How do you decide which AI improvement opportunities are worth exploring?', dimension: 'Vision' },
  { id: 'q5_5', number: '5.5', text: 'How well can you connect AI adoption to business, project, client, or team value?', dimension: 'Vision' },
  { id: 'q5_6', number: '5.6', text: 'How clearly do you know what AI capability you personally want to develop next?', dimension: 'Vision' },
];

export const BUSINESS_OPEN_QUESTIONS: OpenQuestionMeta[] = [
  { id: 'q_open_final', number: 'open', text: 'What is the biggest thing stopping you from using AI more in your work? (free text)' },
];

export const DELIVERY_ENGINEERING_SURVEY_DEFINITION: SurveyQuestionDefinition = {
  questions: DELIVERY_ENGINEERING_QUESTIONS,
  openQuestions: DELIVERY_ENGINEERING_OPEN_QUESTIONS,
};

export const BUSINESS_SURVEY_DEFINITION: SurveyQuestionDefinition = {
  questions: BUSINESS_QUESTIONS,
  openQuestions: BUSINESS_OPEN_QUESTIONS,
};

export const QUESTIONS = DELIVERY_ENGINEERING_QUESTIONS;

export function getQuestionsForSurveyType(surveyType: SurveyType | undefined): QuestionMeta[] {
  return surveyType === 'business' ? BUSINESS_QUESTIONS : DELIVERY_ENGINEERING_QUESTIONS;
}

export function getOpenQuestionsForSurveyType(
  surveyType: SurveyType | undefined,
): OpenQuestionMeta[] {
  return surveyType === 'business'
    ? BUSINESS_OPEN_QUESTIONS
    : DELIVERY_ENGINEERING_OPEN_QUESTIONS;
}
