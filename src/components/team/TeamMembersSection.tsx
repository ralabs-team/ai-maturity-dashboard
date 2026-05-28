import TeamSectionHeader from './TeamSectionHeader';
import {
  INDIVIDUAL_MEMBER_DIMENSIONS,
  initialsLabel,
  lowScoreBadgeTone,
  formatLevelLabel,
  formatScore,
  TEAM_MAP_DIMENSION_LABELS,
  type TeamMemberRecord,
  type TeamMemberSortKey,
} from './teamViewShared';

type TeamMembersSectionProps = {
  scopeLabel: string;
  scopeLabelLower: string;
  members: TeamMemberRecord[];
  onToggleSort: (key: TeamMemberSortKey) => void;
  sortIndicator: (key: TeamMemberSortKey) => string;
};

export default function TeamMembersSection({
  scopeLabel,
  scopeLabelLower,
  members,
  onToggleSort,
  sortIndicator,
}: TeamMembersSectionProps) {
  return (
    <section id="team-members" className="mt-8 scroll-mt-24">
      <TeamSectionHeader
        title={`${scopeLabel} members`}
        subtitle={`An employee-level view for the currently selected ${scopeLabelLower}, showing individual maturity patterns beneath the aggregate.`}
      />

      <section className="rounded-2xl border border-[#eaeaea] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1280px]">
            <thead>
              <tr className="border-b border-[#eaeaea] text-left text-xs text-[#8b8b8b]">
                {[
                  { key: 'name' as const, label: 'Employee' },
                  { key: 'role' as const, label: 'Role' },
                  { key: 'overall' as const, label: 'Overall' },
                  { key: 'level' as const, label: 'Level' },
                  ...INDIVIDUAL_MEMBER_DIMENSIONS.map((dimension) => ({
                    key: dimension,
                    label: TEAM_MAP_DIMENSION_LABELS[dimension],
                  })),
                ].map((header) => (
                  <th key={header.key} className="px-4 py-3 font-medium">
                    <button
                      type="button"
                      onClick={() => onToggleSort(header.key)}
                      className="inline-flex items-center gap-1 transition-colors hover:text-[#525252]"
                    >
                      <span>{header.label}</span>
                      <span className="text-[11px]">{sortIndicator(header.key)}</span>
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.name} className="border-b border-[#eaeaea] last:border-b-0">
                  <td className="px-4 py-3 font-medium text-[#242424]">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex h-8 w-8 shrink-0 items-center justify-center select-none text-[11px] font-semibold text-white">
                        {initialsLabel(member.name)}
                      </div>
                      <span>{member.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#5b5b5b]">{member.role}</td>
                  <td className="px-4 py-3 text-sm text-[#242424]">{formatScore(member.overall)}</td>
                  <td className="px-4 py-3 text-sm text-[#242424]">{formatLevelLabel(member.level)}</td>
                  {INDIVIDUAL_MEMBER_DIMENSIONS.map((dimension) => (
                    <td key={`${member.name}-${dimension}`} className="px-4 py-3 text-sm text-[#242424]">
                      <span
                        className={`inline-flex min-w-[3rem] items-center justify-center rounded-md px-2 py-1 font-medium ${lowScoreBadgeTone(member.dimensions[dimension])}`}
                      >
                        {member.dimensions[dimension].toFixed(1)}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  );
}
