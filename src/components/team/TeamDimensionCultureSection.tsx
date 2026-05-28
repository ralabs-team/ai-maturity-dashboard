import { useMemo } from 'react';
import type { RawResponse } from '../../data/survey/scoring';
import {
  buildScopedEnjoyabilityDistribution,
  buildScopedInfluenceScoreDistribution,
  buildScopedKnowledgeSharingDistribution,
  buildScopedOrganizationalSupportDistribution,
  buildScopedSupportNeededRows,
  buildScopedTeamAiMaturityDistribution,
  buildScopedToolSatisfactionDistribution,
  ENJOYABILITY_SERIES,
  INFLUENCE_SCORE_SERIES,
  KNOWLEDGE_SHARING_SERIES,
  ORGANIZATIONAL_SUPPORT_SERIES,
  TEAM_AI_MATURITY_SERIES,
  TOOL_SATISFACTION_SERIES,
} from '../../data/survey/teamDimensionInsights';
import { RankedBarCard, StackedDistributionCard } from './TeamDimensionCharts';
import TeamSectionHeader from './TeamSectionHeader';

type TeamDimensionCultureSectionProps = {
  scopeLabelLower: string;
  selectedScopeName: string;
  cohortLabel: string;
  responses: RawResponse[];
};

export default function TeamDimensionCultureSection({
  scopeLabelLower,
  selectedScopeName,
  cohortLabel,
  responses,
}: TeamDimensionCultureSectionProps) {
  const knowledgeSharingRows = useMemo(
    () => buildScopedKnowledgeSharingDistribution(responses, cohortLabel),
    [cohortLabel, responses],
  );
  const influenceRows = useMemo(
    () => buildScopedInfluenceScoreDistribution(responses, cohortLabel),
    [cohortLabel, responses],
  );
  const teamAiMaturityRows = useMemo(
    () => buildScopedTeamAiMaturityDistribution(responses, cohortLabel),
    [cohortLabel, responses],
  );
  const organizationalSupportRows = useMemo(
    () => buildScopedOrganizationalSupportDistribution(responses, cohortLabel),
    [cohortLabel, responses],
  );
  const toolSatisfactionRows = useMemo(
    () => buildScopedToolSatisfactionDistribution(responses, cohortLabel),
    [cohortLabel, responses],
  );
  const enjoyabilityRows = useMemo(
    () => buildScopedEnjoyabilityDistribution(responses, cohortLabel),
    [cohortLabel, responses],
  );
  const supportNeededRows = useMemo(
    () => buildScopedSupportNeededRows(responses),
    [responses],
  );
  const responseCount = responses.length;

  return (
    <section id="team-dimension-culture" className="mt-8 scroll-mt-24">
      <TeamSectionHeader
        title="Dimension 4: Culture"
        subtitle={`See whether AI practice inside the selected ${scopeLabelLower} is spreading socially, feels supported, and is becoming enjoyable and durable rather than isolated.`}
      />

      <StackedDistributionCard
        title="Knowledge sharing behavior"
        description="See whether AI know-how stays private or is becoming a regular shared behavior inside the selected scope."
        selectedScopeName={selectedScopeName}
        rows={knowledgeSharingRows}
        series={KNOWLEDGE_SHARING_SERIES}
        emptyState={`No responses are available yet for the selected ${scopeLabelLower}.`}
      />

      <StackedDistributionCard
        title="Adoption influence on others"
        description="Track whether people in the selected scope are only giving advice or actually changing how teammates work."
        selectedScopeName={selectedScopeName}
        rows={influenceRows}
        series={INFLUENCE_SCORE_SERIES}
        emptyState={`No responses are available yet for the selected ${scopeLabelLower}.`}
      />

      <StackedDistributionCard
        title="Team AI maturity around me"
        description="Get the local climate read: do people feel surrounded by stronger AI practice or still relatively alone in it?"
        selectedScopeName={selectedScopeName}
        rows={teamAiMaturityRows}
        series={TEAM_AI_MATURITY_SERIES}
        emptyState={`No responses are available yet for the selected ${scopeLabelLower}.`}
      />

      <StackedDistributionCard
        title="Organizational support for adoption"
        description="Show whether the org feels like an enabler or a drag on AI practice for this selected scope."
        selectedScopeName={selectedScopeName}
        rows={organizationalSupportRows}
        series={ORGANIZATIONAL_SUPPORT_SERIES}
        emptyState={`No responses are available yet for the selected ${scopeLabelLower}.`}
      />

      <StackedDistributionCard
        title="Tool satisfaction"
        description="Measure whether the current tool stack around the selected scope feels frustrating, neutral, or genuinely supportive."
        selectedScopeName={selectedScopeName}
        rows={toolSatisfactionRows}
        series={TOOL_SATISFACTION_SERIES}
        emptyState={`No responses are available yet for the selected ${scopeLabelLower}.`}
      />

      <StackedDistributionCard
        title="Does AI make work more enjoyable?"
        description="See whether AI feels energizing for the selected scope or whether the experience is mostly flat or negative."
        selectedScopeName={selectedScopeName}
        rows={enjoyabilityRows}
        series={ENJOYABILITY_SERIES}
        emptyState={`No responses are available yet for the selected ${scopeLabelLower}.`}
      />

      <RankedBarCard
        title="Support needed right now"
        description="See what kind of practical enablement people in the selected scope are asking for most right now."
        selectedScopeName={selectedScopeName}
        rows={supportNeededRows}
        emptyState={`No support-needs responses are available yet for the selected ${scopeLabelLower}.`}
        chartHeight={280}
        labelWidth={220}
        respondentCount={responseCount}
      />
    </section>
  );
}
