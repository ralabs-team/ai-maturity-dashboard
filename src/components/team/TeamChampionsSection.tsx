import ChampionVisibilityOptions, {
  type ChampionRow,
} from '../organization/ChampionVisibilityOptions';
import TeamSectionHeader from './TeamSectionHeader';

type TeamChampionsSectionProps = {
  scopeLabelLower: string;
  championRows: ChampionRow[];
};

export default function TeamChampionsSection({
  scopeLabelLower,
  championRows,
}: TeamChampionsSectionProps) {
  return (
    <section id="team-ai-champions" className="mt-8 scroll-mt-24">
      <TeamSectionHeader
        title="Top AI champions"
        subtitle={`People inside the selected ${scopeLabelLower} who stand out for maturity, knowledge spread, and real impact.`}
      />
      <ChampionVisibilityOptions
        topChampionRows={championRows}
        showHeader={false}
        wrapInCard={false}
        emptyStateMessage={`No AI champions in the selected ${scopeLabelLower} meet the current threshold yet.`}
      />
    </section>
  );
}
