import { useMemo } from 'react';
import type { RawResponse } from '../../data/survey/scoring';
import {
  buildScopedBusinessValueConnectionDistribution,
  buildScopedWorkChangeImaginationDistribution,
  BUSINESS_VALUE_CONNECTION_SERIES,
  WORK_CHANGE_IMAGINATION_SERIES,
} from '../../data/survey/teamDimensionInsights';
import { StackedDistributionCard } from './TeamDimensionCharts';
import TeamSectionHeader from './TeamSectionHeader';

type TeamDimensionVisionSectionProps = {
  scopeLabelLower: string;
  selectedScopeName: string;
  cohortLabel: string;
  responses: RawResponse[];
};

export default function TeamDimensionVisionSection({
  scopeLabelLower,
  selectedScopeName,
  cohortLabel,
  responses,
}: TeamDimensionVisionSectionProps) {
  const workChangeRows = useMemo(
    () => buildScopedWorkChangeImaginationDistribution(responses, cohortLabel),
    [cohortLabel, responses],
  );
  const businessValueRows = useMemo(
    () => buildScopedBusinessValueConnectionDistribution(responses, cohortLabel),
    [cohortLabel, responses],
  );

  return (
    <section id="team-dimension-vision" className="mt-8 scroll-mt-24">
      <TeamSectionHeader
        title="Dimension: Vision"
        subtitle={`See how clearly people inside the selected ${scopeLabelLower} can imagine future AI-enabled workflows and connect them to real business value.`}
      />

      <StackedDistributionCard
        title="How people imagine work changing"
        description="See whether people still frame AI as task acceleration or can already picture genuinely different workflows."
        selectedScopeName={selectedScopeName}
        rows={workChangeRows}
        series={WORK_CHANGE_IMAGINATION_SERIES}
        emptyState={`No responses are available yet for the selected ${scopeLabelLower}.`}
      />

      <StackedDistributionCard
        title="Ability to connect AI to business value"
        description="Show whether AI is seen mainly as personal productivity help or as a lever for delivery, client, and business outcomes."
        selectedScopeName={selectedScopeName}
        rows={businessValueRows}
        series={BUSINESS_VALUE_CONNECTION_SERIES}
        emptyState={`No responses are available yet for the selected ${scopeLabelLower}.`}
      />
    </section>
  );
}
