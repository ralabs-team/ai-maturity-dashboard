import { useMemo } from 'react';
import type { RawResponse } from '../../data/survey/scoring';
import {
  buildScopedCostMaturityDistribution,
  buildScopedDeliveryPlanningImpactDistribution,
  buildScopedDependencyImpactDistribution,
  buildScopedNonAiBlockerRows,
  COST_MATURITY_SERIES,
  DEPENDENCY_IMPACT_SERIES,
  PLANNING_IMPACT_SERIES,
} from '../../data/survey/teamDimensionInsights';
import { RankedBarCard, StackedDistributionCard } from './TeamDimensionCharts';
import TeamSectionHeader from './TeamSectionHeader';

type TeamDimensionImpactSectionProps = {
  scopeLabelLower: string;
  selectedScopeName: string;
  cohortLabel: string;
  responses: RawResponse[];
};

export default function TeamDimensionImpactSection({
  scopeLabelLower,
  selectedScopeName,
  cohortLabel,
  responses,
}: TeamDimensionImpactSectionProps) {
  const dependencyRows = useMemo(
    () => buildScopedDependencyImpactDistribution(responses, cohortLabel),
    [cohortLabel, responses],
  );
  const costMaturityRows = useMemo(
    () => buildScopedCostMaturityDistribution(responses, cohortLabel),
    [cohortLabel, responses],
  );
  const deliveryPlanningRows = useMemo(
    () => buildScopedDeliveryPlanningImpactDistribution(responses, cohortLabel),
    [cohortLabel, responses],
  );
  const blockerRows = useMemo(() => buildScopedNonAiBlockerRows(responses), [responses]);
  const responseCount = responses.length;

  return (
    <section id="team-dimension-impact" className="mt-8 scroll-mt-24">
      <TeamSectionHeader
        title="Dimension: Impact"
        subtitle={`See how deeply AI value is embedded inside the selected ${scopeLabelLower}, where cost maturity stands, and what still blocks visible impact.`}
      />

      <StackedDistributionCard
        title="Dependency on AI if removed tomorrow"
        description="See whether AI is still a nice-to-have or already embedded deeply enough to create real disruption if removed."
        selectedScopeName={selectedScopeName}
        rows={dependencyRows}
        series={DEPENDENCY_IMPACT_SERIES}
        emptyState={`No responses are available yet for the selected ${scopeLabelLower}.`}
      />

      <StackedDistributionCard
        title="Cost maturity"
        description="Combine pricing understanding with day-to-day cost behavior to see whether the selected scope is cost-aware or still operating passively."
        selectedScopeName={selectedScopeName}
        rows={costMaturityRows}
        series={COST_MATURITY_SERIES}
        emptyState={`No responses are available yet for the selected ${scopeLabelLower}.`}
      />

      <StackedDistributionCard
        title="Delivery-only planning impact"
        description="Focus just on delivery and engineering respondents to see whether AI has started changing how work is estimated, scoped, and planned."
        selectedScopeName={selectedScopeName}
        rows={deliveryPlanningRows}
        series={PLANNING_IMPACT_SERIES}
        emptyState={`No delivery and engineering respondents are available in the selected ${scopeLabelLower}.`}
        cohortBadgeLabel="Delivery & engineering only"
      />

      <RankedBarCard
        title="Biggest non-AI blocker"
        description="Surface the main non-model constraint that still limits AI value in the selected scope."
        selectedScopeName={selectedScopeName}
        rows={blockerRows}
        emptyState={`No blocker responses are available yet for the selected ${scopeLabelLower}.`}
        labelWidth={290}
        chartHeight={420}
        respondentCount={responseCount}
      />
    </section>
  );
}
