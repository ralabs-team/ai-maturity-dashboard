export interface SurveyCardMeta {
  id: string;
  title: string;
  description: string;
  googleFormUrl: string;
  updatedAt?: string;
  questionCountLabel: string;
  estimatedDurationLabel: string;
  dimensions: string[];
}

export const SURVEYS: SurveyCardMeta[] = [
  {
    id: 'delivery-engineering',
    title: 'AI Score - Delivery & Engineering Survey',
    description:
      'Measures how delivery and engineering teams use AI in daily work, how strong their practical skills are, how that translates into delivery impact and team habits, and how clearly they can spot future AI opportunities.',
    googleFormUrl: 'https://docs.google.com/forms/d/1K3f8RhvEBSrfjCKTACcBfqVRK94jIao1naqF0X9dYxI/edit',
    updatedAt: '2026-05-09T11:24:39',
    questionCountLabel: '59 questions',
    estimatedDurationLabel: 'Approx. 15 min',
    dimensions: ['Usage', 'Skills', 'Impact', 'Culture', 'Vision'],
  },
  {
    id: 'business',
    title: 'AI Score - Business Survey',
    description:
    'Measures how business teams apply AI across planning, communication, analysis, and execution, with a focus on adoption habits, judgment, real work impact, and forward-looking AI opportunities.',
    googleFormUrl: 'https://docs.google.com/forms/d/1gtc9OlHvREEbrKRq0aJ7DHJWP1nfnbuDRGEgg2mRqzA/edit',
    updatedAt: '2026-05-09T11:24:39',
    questionCountLabel: '56 questions',
    estimatedDurationLabel: 'Approx. 15 min',
    dimensions: ['Usage', 'Skills', 'Impact', 'Culture', 'Vision'],
  },
  {
    id: 'client-survey',
    title: 'AI Score - Client Survey',
    description:
      'Captures the client voice on how visible, valuable, trustworthy, and future-shaping the team’s AI usage feels throughout delivery.',
    googleFormUrl: 'https://docs.google.com/forms/d/1DX1IBde38sbRqOZdZ3TKRxSWuhCy51SbfrLPjJZR8WY/edit',
    updatedAt: '2026-05-05T15:37:39',
    questionCountLabel: '29 questions',
    estimatedDurationLabel: 'Approx. 5 min',
    dimensions: ['Visibility', 'Value', 'Trust', 'Future'],
  },
];
