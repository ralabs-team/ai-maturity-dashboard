import { X } from 'lucide-react';
import { useSensitiveData } from '../privacy/SensitiveDataContext';
import SensitiveText from '../ui/SensitiveText';
import CompactUsageMultiSelect from './CompactUsageMultiSelect';

export type DepartmentTeamFiltersProps = {
  respondentCount: number;
  departmentOptions: string[];
  teamOptions: string[];
  selectedDepartments: string[];
  selectedTeams: string[];
  departmentAriaLabel: string;
  teamAriaLabel: string;
  onToggleDepartment: (value: string) => void;
  onToggleTeam: (value: string) => void;
  onClearDepartments: () => void;
  onClearTeams: () => void;
  onClearAll: () => void;
  onRemoveDepartment: (value: string) => void;
  onRemoveTeam: (value: string) => void;
};

export default function DepartmentTeamFilters({
  respondentCount,
  departmentOptions,
  teamOptions,
  selectedDepartments,
  selectedTeams,
  departmentAriaLabel,
  teamAriaLabel,
  onToggleDepartment,
  onToggleTeam,
  onClearDepartments,
  onClearTeams,
  onClearAll,
  onRemoveDepartment,
  onRemoveTeam,
}: DepartmentTeamFiltersProps) {
  const { isSensitiveDataHidden } = useSensitiveData();
  const hasActiveFilters = selectedDepartments.length > 0 || selectedTeams.length > 0;

  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-3">
        <CompactUsageMultiSelect
          placeholder="Department"
          singularLabel="department"
          pluralLabel="departments"
          searchPlaceholder="Search departments..."
          ariaLabel={departmentAriaLabel}
          options={departmentOptions}
          selectedValues={selectedDepartments}
          onToggle={onToggleDepartment}
          onClear={onClearDepartments}
        />
        <CompactUsageMultiSelect
          placeholder="Team"
          singularLabel="team"
          pluralLabel="teams"
          searchPlaceholder="Search teams..."
          ariaLabel={teamAriaLabel}
          options={teamOptions}
          selectedValues={selectedTeams}
          onToggle={onToggleTeam}
          onClear={onClearTeams}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <div className="text-[#8b8b8b]">{respondentCount} respondents in current filter</div>
        {hasActiveFilters ? (
          <>
            <button
              type="button"
              onClick={onClearAll}
              className="inline-flex items-center rounded-full border border-[#d8e5de] bg-[#f7fbf8] px-3 py-1.5 text-xs font-medium text-[#2f6f59] transition hover:border-[#c3d9ce] hover:bg-[#eef8f2]"
            >
              Clear filters
            </button>
            {selectedDepartments.map((department) => (
              <span
                key={`department-filter-${department}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-[#f4f4f5] py-1 pl-2.5 pr-1 text-xs font-medium text-[#242424]"
              >
                <span className="text-[#6b7280]">Department</span>
                <SensitiveText as="span" hidden={isSensitiveDataHidden}>
                  {department}
                </SensitiveText>
                <button
                  type="button"
                  onClick={() => onRemoveDepartment(department)}
                  className="rounded-full p-1 text-[#8b8b8b] transition hover:bg-white hover:text-[#242424]"
                  aria-label={
                    isSensitiveDataHidden ? 'Remove department filter' : `Remove department filter ${department}`
                  }
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {selectedTeams.map((team) => (
              <span
                key={`team-filter-${team}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#e5e7eb] bg-[#f4f4f5] py-1 pl-2.5 pr-1 text-xs font-medium text-[#242424]"
              >
                <span className="text-[#6b7280]">Team</span>
                <SensitiveText as="span" hidden={isSensitiveDataHidden}>
                  {team}
                </SensitiveText>
                <button
                  type="button"
                  onClick={() => onRemoveTeam(team)}
                  className="rounded-full p-1 text-[#8b8b8b] transition hover:bg-white hover:text-[#242424]"
                  aria-label={`Remove team filter ${team}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </>
        ) : null}
      </div>
    </div>
  );
}
