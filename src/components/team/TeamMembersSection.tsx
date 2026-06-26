import { Loader2 } from 'lucide-react';
import TeamSectionHeader from './TeamSectionHeader';
import { useSensitiveData } from '../privacy/SensitiveDataContext';
import SensitiveText from '../ui/SensitiveText';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
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

function splitNameParts(name: string): { firstName: string; remainder: string } {
  const trimmedName = name.trim();
  const firstSpaceIndex = trimmedName.indexOf(' ');

  if (firstSpaceIndex === -1) {
    return { firstName: trimmedName, remainder: '' };
  }

  return {
    firstName: trimmedName.slice(0, firstSpaceIndex),
    remainder: trimmedName.slice(firstSpaceIndex),
  };
}

function PersonNameText({ name, hideSurname = false }: { name: string; hideSurname?: boolean }) {
  if (hideSurname) {
    return (
      <SensitiveText as="span" hidden>
        {name || 'Unknown'}
      </SensitiveText>
    );
  }

  const { firstName, remainder } = splitNameParts(name);

  return (
    <span title={hideSurname ? undefined : name}>
      <span>{firstName || 'Unknown'}</span>
      {remainder ? <span>{remainder}</span> : null}
    </span>
  );
}

type TeamMembersSectionProps = {
  scopeLabel: string;
  scopeLabelLower: string;
  members: TeamMemberRecord[];
  onToggleSort: (key: TeamMemberSortKey) => void;
  sortIndicator: (key: TeamMemberSortKey) => string;
  activeSortKey: TeamMemberSortKey;
  isSortPending: boolean;
};

export default function TeamMembersSection({
  scopeLabel,
  scopeLabelLower,
  members,
  onToggleSort,
  sortIndicator,
  activeSortKey,
  isSortPending,
}: TeamMembersSectionProps) {
  const { isSensitiveDataHidden } = useSensitiveData();

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
                  { key: 'archetype' as const, label: 'Archetype' },
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
                      <span className="inline-flex h-4 w-4 items-center justify-center text-[11px]">
                        {isSortPending && activeSortKey === header.key ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          sortIndicator(header.key)
                        )}
                      </span>
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
                        {isSensitiveDataHidden ? '--' : initialsLabel(member.name)}
                      </div>
                      <PersonNameText
                        name={member.name}
                        hideSurname={isSensitiveDataHidden}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#5b5b5b]">{member.role}</td>
                  <td className="px-4 py-3 text-sm text-[#242424]">{formatScore(member.overall)}</td>
                  <td className="px-4 py-3 text-sm text-[#242424]">{formatLevelLabel(member.level)}</td>
                  <td className="px-4 py-3 text-sm text-[#242424]">
                    {member.archetype ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex max-w-full items-center rounded-full border border-[#dbe6ff] bg-[#f5f8ff] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
                            <span className="truncate">{member.archetype.label}</span>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" sideOffset={8} className="max-w-[280px] px-3 py-2 text-[12px] leading-relaxed">
                          <div className="font-medium text-white">{member.archetype.label}</div>
                          <div className="mt-1 text-white/80">{member.archetype.signal}</div>
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <span className="text-[#a3a3a3]">-</span>
                    )}
                  </td>
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
