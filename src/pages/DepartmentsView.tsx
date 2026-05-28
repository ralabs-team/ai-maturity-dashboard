import { useMemo, useState, type KeyboardEvent } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Check, Pencil, X } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import { useSensitiveData } from '../components/privacy/SensitiveDataContext';
import PersonAvatar from '../components/ui/PersonAvatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '../components/ui/tooltip';
import { useSurveyData } from '../data/survey/SurveyDataContext';
import { allDepartmentsList } from '../data/survey/scoring';

interface DepartmentRow {
  name: string;
  peopleAssigned: number;
  recentMembers: Array<{
    id: string;
    name: string;
  }>;
}

const DEPARTMENT_NAME_COLLATOR = new Intl.Collator('en', {
  sensitivity: 'base',
  numeric: true,
});

type SortKey = 'name' | 'peopleAssigned';
type SortDirection = 'asc' | 'desc';

export default function DepartmentsView() {
  const { rawResponses, renameDepartment, resolvePersonName } = useSurveyData();
  const { isSensitiveDataHidden } = useSensitiveData();
  const [editingDepartmentName, setEditingDepartmentName] = useState<string | null>(null);
  const [draftDepartmentName, setDraftDepartmentName] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const departmentRows = useMemo<DepartmentRow[]>(() => {
    const departmentMembers = new Map<
      string,
      Map<
        string,
        {
          id: string;
          name: string;
          timestamp: number;
        }
      >
    >();

    for (const response of rawResponses) {
      const respondentKey = response.username.trim().toLowerCase();
      const respondentName = resolvePersonName(response.username);
      const responseTimestamp = Number.isNaN(new Date(response.timestamp).getTime())
        ? 0
        : new Date(response.timestamp).getTime();

      for (const departmentName of allDepartmentsList(response.department)) {
        if (!departmentMembers.has(departmentName)) {
          departmentMembers.set(departmentName, new Map());
        }

        const currentDepartmentMembers = departmentMembers.get(departmentName);
        const existingMember = currentDepartmentMembers?.get(respondentKey);

        if (!existingMember || responseTimestamp >= existingMember.timestamp) {
          currentDepartmentMembers?.set(respondentKey, {
            id: respondentKey,
            name: respondentName,
            timestamp: responseTimestamp,
          });
        }
      }
    }

    return Array.from(departmentMembers.entries())
      .map(([name, members]) => {
        const sortedMembers = Array.from(members.values()).sort(
          (left, right) => right.timestamp - left.timestamp,
        );

        return {
          name,
          peopleAssigned: members.size,
          recentMembers: sortedMembers.slice(0, 10).map(({ id, name: memberName }) => ({
            id,
            name: memberName,
          })),
        };
      })
      .sort((left, right) => {
        if (sortKey === 'peopleAssigned') {
          const difference = left.peopleAssigned - right.peopleAssigned;
          if (difference !== 0) {
            return sortDirection === 'asc' ? difference : -difference;
          }
        }

        const nameComparison = DEPARTMENT_NAME_COLLATOR.compare(left.name, right.name);
        return sortDirection === 'asc' || sortKey === 'peopleAssigned'
          ? nameComparison
          : -nameComparison;
      });
  }, [rawResponses, resolvePersonName, sortDirection, sortKey]);

  const toggleSort = (nextSortKey: SortKey) => {
    if (sortKey === nextSortKey) {
      setSortDirection((currentDirection) => (currentDirection === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection(nextSortKey === 'peopleAssigned' ? 'asc' : 'asc');
  };

  const resetEditingState = () => {
    setEditingDepartmentName(null);
    setDraftDepartmentName('');
    setValidationMessage('');
  };

  const startEditing = (departmentName: string) => {
    setEditingDepartmentName(departmentName);
    setDraftDepartmentName(departmentName);
    setValidationMessage('');
  };

  const saveDepartmentName = () => {
    if (!editingDepartmentName) {
      return;
    }

    const sanitizedDraftDepartmentName = draftDepartmentName.trim().replace(/\s+/g, ' ');

    if (!sanitizedDraftDepartmentName) {
      setValidationMessage('Department name cannot be empty.');
      return;
    }

    if (sanitizedDraftDepartmentName === editingDepartmentName) {
      resetEditingState();
      return;
    }

    renameDepartment(editingDepartmentName, sanitizedDraftDepartmentName);
    resetEditingState();
  };

  const handleDepartmentNameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveDepartmentName();
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      resetEditingState();
    }
  };

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle="Directory of departments across all survey responses."
        badge={departmentRows.length}
      />

      <div className="overflow-hidden rounded-2xl border border-[#eaeaea] bg-white shadow-sm">
        <table className="min-w-full divide-y divide-[#ececec] text-sm">
          <thead className="bg-white">
            <tr className="border-b border-[#e5e7eb] transition-colors">
              <th className="h-10 w-[320px] whitespace-nowrap px-2 pl-4 text-left align-middle text-[13px] font-medium text-[#242424]">
                Department Name
              </th>
              <th className="h-10 whitespace-nowrap px-2 text-left align-middle text-[13px] font-medium text-[#242424]">
                <button
                  type="button"
                  onClick={() => toggleSort('peopleAssigned')}
                  className="inline-flex items-center gap-1 transition-colors hover:text-[#111827]"
                >
                  People Assigned
                  {sortKey === 'peopleAssigned' ? (
                    sortDirection === 'asc' ? (
                      <ArrowUp className="h-3.5 w-3.5" />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5" />
                    )
                  ) : (
                    <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />
                  )}
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f1f1]">
            {departmentRows.map((department) => {
              const isEditing = editingDepartmentName === department.name;

              return (
                <tr key={department.name} className="align-top">
                  <td className="px-5 py-4">
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-start gap-2">
                          <input
                            value={draftDepartmentName}
                            onChange={(event) => {
                              setDraftDepartmentName(event.target.value);
                              if (validationMessage) {
                                setValidationMessage('');
                              }
                            }}
                            onKeyDown={handleDepartmentNameKeyDown}
                            autoFocus
                            className="min-w-[260px] flex-1 rounded-lg border border-[#d6d6d6] bg-white px-3 py-2 text-sm text-[#242424] outline-none transition-colors focus:border-[#1d4ed8]"
                          />
                          <button
                            type="button"
                            onClick={saveDepartmentName}
                            className="inline-flex items-center gap-2 rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 text-xs font-semibold text-[#1d4ed8] transition-colors hover:bg-[#dbeafe]"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={resetEditingState}
                            className="inline-flex items-center gap-2 rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs font-semibold text-[#4b5563] transition-colors hover:bg-[#f9fafb]"
                          >
                            <X className="h-3.5 w-3.5" />
                            Cancel
                          </button>
                        </div>
                        {validationMessage && (
                          <p className="text-xs text-[#b42318]">{validationMessage}</p>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-3">
                        <div
                          title={department.name}
                          className="max-w-[180px] truncate font-medium text-[#242424]"
                        >
                          {department.name}
                        </div>
                        <button
                          type="button"
                          onClick={() => startEditing(department.name)}
                          aria-label={`Rename ${department.name}`}
                          title={`Rename ${department.name}`}
                          className="inline-flex items-center rounded-full border border-[#d9d9d9] bg-[#fafafa] p-1.5 text-[#242424] transition-colors hover:border-[#c8c8c8] hover:bg-white"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-[#4b5563]">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex -space-x-2">
                        {department.recentMembers.map((member) =>
                          isSensitiveDataHidden ? (
                            <div key={member.id} className="rounded-full ring-2 ring-white">
                              <PersonAvatar
                                name={member.name}
                                className="h-8 w-8"
                                textClassName="text-[10px]"
                              />
                            </div>
                          ) : (
                            <Tooltip key={member.id}>
                              <TooltipTrigger asChild>
                                <div className="rounded-full ring-2 ring-white">
                                  <PersonAvatar
                                    name={member.name}
                                    className="h-8 w-8"
                                    textClassName="text-[10px]"
                                  />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent sideOffset={6}>{member.name}</TooltipContent>
                            </Tooltip>
                          ),
                        )}
                      </div>
                      <span className="text-sm text-[#4b5563]">{department.peopleAssigned}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
