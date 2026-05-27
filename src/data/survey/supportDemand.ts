export type SupportDemandSeriesKey =
  | 'advanced'
  | 'overview'
  | 'prompting'
  | 'setup'
  | 'peer'
  | 'pairing'
  | 'handsOn';

export const SUPPORT_DEMAND_SERIES: Array<{
  key: SupportDemandSeriesKey;
  label: string;
  color: string;
  detail: string;
}> = [
  {
    key: 'handsOn',
    label: 'Wants hands-on training',
    color: '#475569',
    detail: 'People who said yes to receiving hands-on AI help or training in any format.',
  },
  {
    key: 'advanced',
    label: 'Advanced workflows',
    color: '#0f766e',
    detail: 'Selected “Advanced session” support for agents, automation, MCP, or custom workflows.',
  },
  {
    key: 'prompting',
    label: 'Prompt engineering',
    color: '#14b8a6',
    detail: 'Selected support for prompt engineering and getting better results from AI.',
  },
  {
    key: 'setup',
    label: 'Task setup',
    color: '#2dd4bf',
    detail: 'Selected help with setting up AI tools for specific tasks or project workflows.',
  },
  {
    key: 'overview',
    label: 'Tool overview',
    color: '#93c5fd',
    detail: 'Selected an overview of available AI tools and when to use which.',
  },
  {
    key: 'peer',
    label: 'Peer learning',
    color: '#c4b5fd',
    detail: 'Selected peer learning by seeing how colleagues use AI in practice on other projects.',
  },
  {
    key: 'pairing',
    label: '1:1 pairing',
    color: '#a78bfa',
    detail: 'People who asked for 1:1 pairing with someone experienced through shadowing or pair sessions.',
  },
];
