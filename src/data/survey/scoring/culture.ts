import {
  rawSingleSelectScore,
  type QEntry,
  type RawResponse,
  type ScoreMap,
  weightedEntry,
} from './shared';

const SINGLE_SCORES: Record<string, ScoreMap> = {
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
    ['helped people on other teams', 5],
    ['multiple people across my team', 4],
    ['name one person whose workflow changed', 3],
    ['given advice but', 2],
    ["haven't directly helped someone", 1],
  ],
  '4.6': [
    ['multiple knowledge artifacts', 5],
    ['substantial guide, presentation, or training material', 4],
    ['shared prompt collection or short how-to', 3],
    ['slack messages or informal notes', 2],
    ['no', 1],
  ],
  '4.7': [
    ['used across teams or projects', 5],
    ['my team uses regularly', 4],
    ['few people tried', 3],
    ['only i use it', 2],
    ['use ai for my own tasks only', 1],
  ],
  '4.8': [
    ['very high', 5],
    ['above average', 4],
    ['average', 3],
    ['below average', 2],
    ['very low', 1],
  ],
  '4.14': [
    ['documented ai onboarding', 5],
    ['team property, not individual habits', 4],
    ['partially', 3],
    ['probably not', 2],
    ['main person driving ai usage', 2],
    ["i'm the one who's been driving", 2],
    ['no team ai practices to continue', 1],
  ],
};

export function scoreCultureEntries(r: RawResponse): QEntry[] {
  return [
    weightedEntry('4.1', rawSingleSelectScore('4.1', SINGLE_SCORES['4.1'], r.q4_1)),
    weightedEntry('4.2', rawSingleSelectScore('4.2', SINGLE_SCORES['4.2'], r.q4_2)),
    weightedEntry('4.3', rawSingleSelectScore('4.3', SINGLE_SCORES['4.3'], r.q4_3)),
    weightedEntry('4.4', rawSingleSelectScore('4.4', SINGLE_SCORES['4.4'], r.q4_4)),
    weightedEntry('4.5', rawSingleSelectScore('4.5', SINGLE_SCORES['4.5'], r.q4_5)),
    weightedEntry('4.6', rawSingleSelectScore('4.6', SINGLE_SCORES['4.6'], r.q4_6)),
    weightedEntry('4.7', rawSingleSelectScore('4.7', SINGLE_SCORES['4.7'], r.q4_7)),
    weightedEntry('4.8', rawSingleSelectScore('4.8', SINGLE_SCORES['4.8'], r.q4_8)),
    weightedEntry('4.14', rawSingleSelectScore('4.14', SINGLE_SCORES['4.14'], r.q4_14)),
  ];
}
