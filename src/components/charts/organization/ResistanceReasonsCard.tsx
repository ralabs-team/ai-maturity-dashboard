import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from '../recharts';
import ChartFeedback from '../../analytics/ChartFeedback';
import type { RawResponse } from '../../../data/survey/scoring';

export type ResistanceSummary = {
  score: number;
  respondentCount: number;
  highResistanceCount: number;
  highResistanceShare: number;
};

export const RESISTANCE_SCORE_HELP_TEXT =
  'Calculated from existing survey signals: AI growth momentum, experimentation initiative, organizational support, tool satisfaction, AI enjoyability, access/licensing friction, and open-text blockers. Higher scores mean more resistance to broader AI adoption.';

type Row = {
  label: string;
  businessCount: number;
  businessShare: number;
  deliveryCount: number;
  deliveryShare: number;
};

const BLOCKER_LABELS = [
  'Nothing / mainly AI skills',
  'No team agreement on AI usage',
  'No time to experiment',
  'Access / licensing limits',
  'Data sensitivity / client restrictions',
  'Unclear processes / system context',
  'Missing docs / templates / reference material',
  'Technical environment / tech debt',
  'Unclear role fit',
  'Other',
] as const;

const BLOCKER_LABEL_BY_KEY = {
  nothingMostlySkills: 'Nothing / mainly AI skills',
  noTeamAgreement: 'No team agreement on AI usage',
  noTimeToExperiment: 'No time to experiment',
  accessLicensingLimits: 'Access / licensing limits',
  dataSensitivityOrClient: 'Data sensitivity / client restrictions',
  unclearProcessesOrSystem: 'Unclear processes / system context',
  missingDocsOrReference: 'Missing docs / templates / reference material',
  technicalEnvironment: 'Technical environment / tech debt',
  unclearRoleFit: 'Unclear role fit',
  other: 'Other',
} as const;

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function isNumber(value: number | null): value is number {
  return typeof value === 'number';
}

function resistanceGrowthMomentumScore(rawValue: string | undefined): number | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (value.includes('not actively developing')) return 5;
  if (value.includes('learn when it comes up')) return 4;
  if (value.includes('steady pace')) return 3;
  if (value.includes('actively seek out')) return 2;
  if (value.includes('teach others')) return 1;
  return null;
}

function resistanceExperimentationScore(rawValue: string | undefined): number | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (value === 'no') return 5;
  if (value.includes("thought about it but didn't")) return 4;
  if (value.includes('yes, once')) return 3;
  if (value.includes('yes, multiple')) return 2;
  if (value.includes('regularly')) return 1;
  return null;
}

function resistanceOrganizationalSupportScore(rawValue: string | undefined): number | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (value.includes('not at all')) return 5;
  if (value.includes('minimally')) return 4;
  if (value.includes('somewhat')) return 3;
  if (value.includes('well supported')) return 2;
  if (value.includes('very well supported')) return 1;
  return null;
}

function resistanceToolSatisfactionScore(rawValue: string | undefined): number | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (value.includes('very dissatisfied')) return 5;
  if (value === 'dissatisfied') return 4;
  if (value === 'neutral') return 3;
  if (value === 'satisfied') return 2;
  if (value.includes('very satisfied')) return 1;
  return null;
}

function resistanceEnjoyabilityScore(rawValue: string | undefined): number | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (value.includes('much less enjoyable')) return 5;
  if (value.includes('slightly less enjoyable')) return 4;
  if (value.includes('no change')) return 3;
  if (value === 'more enjoyable') return 2;
  if (value.includes('much more enjoyable')) return 1;
  return null;
}

function resistanceAccessScore(rawValue: string | undefined): number | null {
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;
  if (value.includes('have everything i need')) return 1;
  if (value.includes("haven't thought about it")) return 2;
  if (value.includes('paid tier of a tool i currently use for free')) return 3;
  if (value.includes("there's a specific tool i'd like but don't have access to")) return 4;
  if (value.includes("don't know what's available") || value.includes('could request')) return 4;
  return null;
}

function resistanceOpenBlockerScore(response: RawResponse): number | null {
  const rawValue =
    response.surveyType === 'business'
      ? (response.q_open_final || response.q3_blocker)
      : (response.q4_open || response.q3_12);
  const value = rawValue?.trim().replace(/\s+/g, ' ').toLowerCase();

  if (!value) return null;

  if (
    value.includes('nothing') ||
    value.includes('no blocker') ||
    value.includes('no blockers') ||
    value.includes('no issues') ||
    value.includes('none right now')
  ) {
    return 1;
  }

  if (
    value.includes('take my job') ||
    value.includes('replace me') ||
    value.includes('replace my role') ||
    value.includes('lose my job') ||
    value.includes('job security') ||
    value.includes('fear') ||
    value.includes('afraid')
  ) {
    return 5;
  }

  if (
    value.includes("don't trust") ||
    value.includes('dont trust') ||
    value.includes('hallucinat') ||
    value.includes('wrong output') ||
    value.includes('inaccur') ||
    value.includes('quality concerns')
  ) {
    return 4;
  }

  if (
    value.includes('no time') ||
    value.includes('too busy') ||
    value.includes('time to experiment') ||
    value.includes('lack of time')
  ) {
    return 4;
  }

  if (
    value.includes('data sensitivity') ||
    value.includes('confidential') ||
    value.includes('client restriction') ||
    value.includes('security')
  ) {
    return 4;
  }

  if (
    value.includes("don't know how") ||
    value.includes("dont know how") ||
    value.includes("don't know where to start") ||
    value.includes('not sure where to start') ||
    value.includes("don't know what's possible") ||
    value.includes('need training')
  ) {
    return 4;
  }

  if (
    value.includes('license') ||
    value.includes('licensing') ||
    value.includes('approval') ||
    value.includes('paid plan') ||
    value.includes('access to the right ai tools')
  ) {
    return 4;
  }

  if (
    value.includes('documentation') ||
    value.includes('templates') ||
    value.includes('process') ||
    value.includes('context') ||
    value.includes('team agreement')
  ) {
    return 3;
  }

  return 3;
}

function resistanceScore(response: RawResponse): number | null {
  const organizationalSupportAnswer =
    response.surveyType === 'business' ? response.q4_9 : response.q4_11;
  const toolSatisfactionAnswer =
    response.surveyType === 'business' ? response.q4_7 : response.q4_9;
  const enjoyabilityAnswer =
    response.surveyType === 'business' ? response.q4_8 : response.q4_10;
  const accessAnswer =
    response.surveyType === 'business' ? response.q3_10 : response.q3_7;

  const signals = [
    resistanceGrowthMomentumScore(response.q4_1),
    resistanceExperimentationScore(response.q4_2),
    resistanceOrganizationalSupportScore(organizationalSupportAnswer),
    resistanceToolSatisfactionScore(toolSatisfactionAnswer),
    resistanceEnjoyabilityScore(enjoyabilityAnswer),
    resistanceAccessScore(accessAnswer),
    resistanceOpenBlockerScore(response),
  ].filter(isNumber);

  if (signals.length === 0) return null;

  return average(signals);
}

export function buildResistanceSummary(responses: RawResponse[]): ResistanceSummary {
  const scores = responses.map((response) => resistanceScore(response)).filter(isNumber);
  const respondentCount = scores.length;
  const score = respondentCount > 0 ? average(scores) : 0;
  const highResistanceCount = scores.filter((entry) => entry >= 4).length;
  const highResistanceShare =
    respondentCount > 0 ? Math.round((highResistanceCount / respondentCount) * 100) : 0;

  return {
    score,
    respondentCount,
    highResistanceCount,
    highResistanceShare,
  };
}

function normalizeBlockerLabel(
  surveyType: NonNullable<RawResponse['surveyType']>,
  rawValue: string | undefined,
): string | null {
  const value = rawValue?.trim();
  const lower = value?.replace(/\s+/g, ' ').toLowerCase();

  if (!lower) return null;
  if (lower.includes('nothing') || lower.includes('no blockers')) {
    return BLOCKER_LABEL_BY_KEY.nothingMostlySkills;
  }
  if (lower.includes('no team agreement') || lower.includes('align the team on our process')) {
    return BLOCKER_LABEL_BY_KEY.noTeamAgreement;
  }
  if (lower.includes('no time to experiment')) {
    return BLOCKER_LABEL_BY_KEY.noTimeToExperiment;
  }
  if (
    lower.includes('lack of access to the right ai tools') ||
    lower.includes('cost, licensing, approval')
  ) {
    return BLOCKER_LABEL_BY_KEY.accessLicensingLimits;
  }
  if (
    lower.includes('data sensitivity') ||
    lower.includes('confidentiality concerns') ||
    lower.includes('client restrictions')
  ) {
    return BLOCKER_LABEL_BY_KEY.dataSensitivityOrClient;
  }
  if (
    lower.includes('unclear or undocumented processes') ||
    lower.includes('unclear system boundaries') ||
    lower.includes('hard to give ai the right context')
  ) {
    return BLOCKER_LABEL_BY_KEY.unclearProcessesOrSystem;
  }
  if (
    lower.includes('missing or outdated documentation') ||
    lower.includes('no templates') ||
    lower.includes('reference materials')
  ) {
    return BLOCKER_LABEL_BY_KEY.missingDocsOrReference;
  }
  if (
    lower.includes('legacy code') ||
    lower.includes('tech debt') ||
    lower.includes('ci/cd') ||
    lower.includes('dev environment') ||
    lower.includes('integration between tools')
  ) {
    return BLOCKER_LABEL_BY_KEY.technicalEnvironment;
  }
  if (surveyType === 'business' && lower.includes('unclear what ai can actually help with in my role')) {
    return BLOCKER_LABEL_BY_KEY.unclearRoleFit;
  }
  if (lower.includes('not sure') || lower.includes("hard to answer from the dev's perspective")) {
    return BLOCKER_LABEL_BY_KEY.other;
  }
  return BLOCKER_LABEL_BY_KEY.other;
}

export function buildResistanceReasonComparison(responses: RawResponse[]): Row[] {
  const businessResponses = responses.filter((response) => response.surveyType === 'business');
  const deliveryResponses = responses.filter(
    (response) => response.surveyType === 'delivery-engineering',
  );

  return BLOCKER_LABELS.map((label) => {
    const businessCount = businessResponses.filter((response) => {
      const normalized = normalizeBlockerLabel('business', response.q3_blocker);
      return normalized === label;
    }).length;

    const deliveryCount = deliveryResponses.filter((response) => {
      const normalized = normalizeBlockerLabel('delivery-engineering', response.q3_12);
      return normalized === label;
    }).length;

    return {
      label,
      businessCount,
      businessShare:
        businessResponses.length > 0 ? Number(((businessCount / businessResponses.length) * 100).toFixed(1)) : 0,
      deliveryCount,
      deliveryShare:
        deliveryResponses.length > 0 ? Number(((deliveryCount / deliveryResponses.length) * 100).toFixed(1)) : 0,
    };
  });
}

function ResistanceReasonsTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ payload?: Row }>;
  label?: string;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;

  return (
    <div className="rounded-md bg-[#242424] px-4 py-3 text-sm text-white shadow-lg">
      <div className="mb-2 font-semibold text-white">{label ?? point.label}</div>
      <div className="space-y-1">
        <div>Business: {point.businessShare.toFixed(1)}% ({point.businessCount})</div>
        <div>Delivery & engineering: {point.deliveryShare.toFixed(1)}% ({point.deliveryCount})</div>
      </div>
    </div>
  );
}

export default function ResistanceReasonsCard({
  data,
  businessColor,
  deliveryColor,
  feedbackPage = 'organization',
  feedbackEventProperties,
}: {
  data: Row[];
  businessColor: string;
  deliveryColor: string;
  feedbackPage?: string;
  feedbackEventProperties?: Record<string, unknown>;
}) {
  const [visibleSeries, setVisibleSeries] = useState({
    business: true,
    delivery: true,
  });

  const rows = data
    .filter((row) => row.label !== 'Nothing / mainly AI skills')
    .sort((left, right) => {
      const leftAverage = (left.businessShare + left.deliveryShare) / 2;
      const rightAverage = (right.businessShare + right.deliveryShare) / 2;

      return rightAverage - leftAverage || right.businessCount + right.deliveryCount - (left.businessCount + left.deliveryCount);
    });

  const toggleSeries = (series: 'business' | 'delivery') => {
    setVisibleSeries((current) => {
      if (current[series] && !current[series === 'business' ? 'delivery' : 'business']) {
        return current;
      }

      return {
        ...current,
        [series]: !current[series],
      };
    });
  };

  return (
    <section className="group relative rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <ChartFeedback
        chartTitle="Reasons limiting AI adoption"
        page={feedbackPage}
        eventProperties={feedbackEventProperties}
      />
      <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
        Reasons limiting AI adoption
      </h3>
      <p className="mt-1 text-sm text-[#7a7a7a]">
        Rank the main blockers people describe when they are not using AI more. This turns the free-text blocker question into a clearer adoption-friction view across cohorts.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => toggleSeries('business')}
          aria-pressed={visibleSeries.business}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            visibleSeries.business
              ? 'border-[#dbeafe] bg-[#eff6ff] text-[#1d4ed8]'
              : 'border-[#e5e7eb] bg-white text-[#94a3b8]'
          }`}
        >
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: businessColor }} />
          <span>Business</span>
        </button>
        <button
          type="button"
          onClick={() => toggleSeries('delivery')}
          aria-pressed={visibleSeries.delivery}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
            visibleSeries.delivery
              ? 'border-[#ccfbf1] bg-[#f0fdfa] text-[#0f766e]'
              : 'border-[#e5e7eb] bg-white text-[#94a3b8]'
          }`}
        >
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: deliveryColor }} />
          <span>Delivery & engineering</span>
        </button>
      </div>

      <div className="mt-6 h-[360px]">
        {rows.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rows}
              layout="vertical"
              margin={{ top: 0, right: 12, left: 12, bottom: 0 }}
              barCategoryGap={10}
            >
              <CartesianGrid stroke="#ececec" strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(value) => `${value}%`}
                tick={{ fontSize: 12, fill: '#737373' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={210}
                tick={{ fontSize: 12, fill: '#525252' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip isAnimationActive={false} content={<ResistanceReasonsTooltip />} />
              {visibleSeries.business ? (
                <Bar dataKey="businessShare" name="Business" fill={businessColor} radius={[0, 8, 8, 0]} />
              ) : null}
              {visibleSeries.delivery ? (
                <Bar
                  dataKey="deliveryShare"
                  name="Delivery & engineering"
                  fill={deliveryColor}
                  radius={[0, 8, 8, 0]}
                />
              ) : null}
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-[#d4d4d8] bg-[#fafafa] px-6 text-center text-sm text-[#7a7a7a]">
            No blocker responses are available in the current view.
          </div>
        )}
      </div>
    </section>
  );
}
