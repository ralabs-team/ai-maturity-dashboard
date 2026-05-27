import { useMemo, useState, type KeyboardEvent } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Check, Pencil, X } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import { useSensitiveData } from '../components/privacy/SensitiveDataContext';
import PersonAvatar from '../components/ui/PersonAvatar';
import SensitiveText from '../components/ui/SensitiveText';
import { useSurveyData } from '../data/survey/SurveyDataContext';
import { allProjectsList } from '../data/survey/scoring';

type EditableField = 'name' | 'department' | 'projects';
type SortKey = 'name' | 'department' | 'projects';
type SortDirection = 'asc' | 'desc';

interface PersonDirectoryRow {
  username: string;
  name: string;
  department: string;
  projects: string;
  timestamp: number;
}

interface EditState {
  username: string;
  field: EditableField;
}

const PERSON_NAME_COLLATOR = new Intl.Collator('en', {
  sensitivity: 'base',
  numeric: true,
});

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

export default function OverviewPeopleView() {
  const {
    rawResponses,
    resolvePersonName,
    renamePerson,
    updatePersonDepartment,
    updatePersonProjects,
  } = useSurveyData();
  const { isSensitiveDataHidden } = useSensitiveData();
  const [editing, setEditing] = useState<EditState | null>(null);
  const [draftValue, setDraftValue] = useState('');
  const [validationMessage, setValidationMessage] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const peopleRows = useMemo<PersonDirectoryRow[]>(() => {
    const rowsByUsername = new Map<string, PersonDirectoryRow>();

    for (const response of rawResponses) {
      const normalizedUsername = response.username.trim().toLowerCase();
      const responseTimestamp = Number.isNaN(new Date(response.timestamp).getTime())
        ? 0
        : new Date(response.timestamp).getTime();
      const normalizedProjects = allProjectsList(response.projects)
        .filter((project) => project !== 'Unassigned')
        .join(', ') || 'Unassigned';

      const nextRow: PersonDirectoryRow = {
        username: response.username,
        name: resolvePersonName(response.username),
        department: response.department.trim() || 'Unassigned',
        projects: normalizedProjects,
        timestamp: responseTimestamp,
      };

      const existingRow = rowsByUsername.get(normalizedUsername);

      if (!existingRow || responseTimestamp >= existingRow.timestamp) {
        rowsByUsername.set(normalizedUsername, nextRow);
      }
    }

    return Array.from(rowsByUsername.values()).sort((left, right) => {
      const leftValue = left[sortKey];
      const rightValue = right[sortKey];
      const comparison = PERSON_NAME_COLLATOR.compare(leftValue, rightValue);

      if (comparison !== 0) {
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      return PERSON_NAME_COLLATOR.compare(left.name, right.name);
    });
  }, [rawResponses, resolvePersonName, sortDirection, sortKey]);

  const toggleSort = (nextSortKey: SortKey) => {
    if (sortKey === nextSortKey) {
      setSortDirection((currentDirection) => (currentDirection === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection('asc');
  };

  const resetEditingState = () => {
    setEditing(null);
    setDraftValue('');
    setValidationMessage('');
  };

  const startEditing = (username: string, field: EditableField, currentValue: string) => {
    setEditing({ username, field });
    setDraftValue(currentValue);
    setValidationMessage('');
  };

  const saveField = () => {
    if (!editing) {
      return;
    }

    const sanitizedDraftValue =
      editing.field === 'projects'
        ? draftValue.trim().replace(/\s*,\s*/g, ', ')
        : draftValue.trim().replace(/\s+/g, ' ');

    if (!sanitizedDraftValue) {
      setValidationMessage('This field cannot be empty.');
      return;
    }

    if (editing.field === 'name') {
      renamePerson(editing.username, sanitizedDraftValue);
    }

    if (editing.field === 'department') {
      updatePersonDepartment(editing.username, sanitizedDraftValue);
    }

    if (editing.field === 'projects') {
      updatePersonProjects(editing.username, sanitizedDraftValue);
    }

    resetEditingState();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      saveField();
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      resetEditingState();
    }
  };

  const renderEditableCell = (
    username: string,
    field: EditableField,
    value: string,
    options?: { withAvatar?: boolean; wide?: boolean },
  ) => {
    const isEditing = editing?.username === username && editing.field === field;

    if (isEditing) {
      return (
        <div className="space-y-2">
          <div className="flex flex-wrap items-start gap-3">
            {options?.withAvatar ? (
              <PersonAvatar name={value} className="h-10 w-10" textClassName="text-sm" />
            ) : null}
            <input
              value={draftValue}
              onChange={(event) => {
                setDraftValue(event.target.value);
                if (validationMessage) {
                  setValidationMessage('');
                }
              }}
              onKeyDown={handleKeyDown}
              autoFocus
              className={`rounded-lg border border-[#d6d6d6] bg-white px-3 py-2 text-sm text-[#242424] outline-none transition-colors focus:border-[#1d4ed8] ${
                options?.wide ? 'min-w-[320px] flex-1' : 'min-w-[220px] flex-1'
              }`}
            />
            <button
              type="button"
              onClick={saveField}
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
          {validationMessage ? <p className="text-xs text-[#b42318]">{validationMessage}</p> : null}
        </div>
      );
    }

    return (
      <div className="flex flex-wrap items-center gap-3">
        {options?.withAvatar ? (
          <PersonAvatar name={value} className="h-10 w-10" textClassName="text-sm" />
        ) : null}
        {field === 'name' && isSensitiveDataHidden ? (
          <div className="max-w-[220px] truncate font-medium text-[#242424]">
            {(() => {
              const { firstName, remainder } = splitNameParts(value);

              return (
                <>
                  <span>{firstName}</span>
                  {remainder ? (
                    <SensitiveText as="span" hidden className="inline-block">
                      {remainder}
                    </SensitiveText>
                  ) : null}
                </>
              );
            })()}
          </div>
        ) : (
          <SensitiveText
            as="div"
            hidden={field === 'projects' && isSensitiveDataHidden}
            title={value}
            className={
              field === 'projects'
                ? 'max-w-[460px] text-[#242424]'
                : 'max-w-[180px] truncate font-medium text-[#242424]'
            }
          >
            {value}
          </SensitiveText>
        )}
        <button
          type="button"
          onClick={() => startEditing(username, field, value)}
          aria-label={`Rename ${field} for ${username}`}
          title={`Rename ${field}`}
          className="inline-flex items-center rounded-full border border-[#d9d9d9] bg-[#fafafa] p-1.5 text-[#242424] transition-colors hover:border-[#c8c8c8] hover:bg-white"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  return (
    <div>
      <PageHeader
        title="People"
        subtitle="Directory of people, departments, and project assignments."
        badge={peopleRows.length}
      />

      <div className="overflow-hidden rounded-2xl border border-[#eaeaea] bg-white shadow-sm">
        <table className="min-w-full divide-y divide-[#ececec] text-sm">
          <thead className="bg-white">
            <tr className="border-b border-[#e5e7eb] transition-colors">
              <th className="h-10 w-[320px] whitespace-nowrap px-2 pl-4 text-left align-middle text-[13px] font-medium text-[#242424]">
                Person Name
              </th>
              <th className="h-10 w-[320px] whitespace-nowrap px-2 text-left align-middle text-[13px] font-medium text-[#242424]">
                <button
                  type="button"
                  onClick={() => toggleSort('department')}
                  className="inline-flex items-center gap-1 transition-colors hover:text-[#111827]"
                >
                  Department
                  {sortKey === 'department' ? (
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
              <th className="h-10 whitespace-nowrap px-2 text-left align-middle text-[13px] font-medium text-[#242424]">
                <button
                  type="button"
                  onClick={() => toggleSort('projects')}
                  className="inline-flex items-center gap-1 transition-colors hover:text-[#111827]"
                >
                  Projects
                  {sortKey === 'projects' ? (
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
            {peopleRows.map((person) => (
              <tr key={person.username} className="align-top">
                <td className="px-5 py-4">
                  {renderEditableCell(person.username, 'name', person.name, { withAvatar: true })}
                </td>
                <td className="px-5 py-4">
                  {renderEditableCell(person.username, 'department', person.department)}
                </td>
                <td className="px-5 py-4">
                  {renderEditableCell(person.username, 'projects', person.projects, { wide: true })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
