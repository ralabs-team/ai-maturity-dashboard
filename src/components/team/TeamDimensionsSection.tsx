import type { RawResponse } from '../../data/survey/scoring';
import TeamDimensionCultureSection from './TeamDimensionCultureSection';
import TeamDimensionImpactSection from './TeamDimensionImpactSection';
import TeamDimensionVisionSection from './TeamDimensionVisionSection';
import TeamSectionHeader from './TeamSectionHeader';

type TeamDimensionsSectionProps = {
  scopeLabelLower: string;
  selectedScopeName: string;
  responses: RawResponse[];
};

export default function TeamDimensionsSection({
  scopeLabelLower,
  selectedScopeName,
  responses,
}: TeamDimensionsSectionProps) {
  const cohortLabel = `Selected ${scopeLabelLower}`;

  return (
    <>
      <section id="team-dimensions" className="mt-8 scroll-mt-24">
        <TeamSectionHeader
          title="Dimension breakdown"
          subtitle={`Deeper dimension-level readings for the currently selected ${scopeLabelLower}, using only responses from that ${scopeLabelLower}.`}
        />
      </section>

      <TeamDimensionImpactSection
        scopeLabelLower={scopeLabelLower}
        selectedScopeName={selectedScopeName}
        cohortLabel={cohortLabel}
        responses={responses}
      />

      <TeamDimensionCultureSection
        scopeLabelLower={scopeLabelLower}
        selectedScopeName={selectedScopeName}
        cohortLabel={cohortLabel}
        responses={responses}
      />

      <TeamDimensionVisionSection
        scopeLabelLower={scopeLabelLower}
        selectedScopeName={selectedScopeName}
        cohortLabel={cohortLabel}
        responses={responses}
      />
    </>
  );
}
