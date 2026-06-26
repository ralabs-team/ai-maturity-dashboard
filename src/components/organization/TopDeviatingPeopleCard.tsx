import { Link } from 'react-router-dom';
import { useState } from 'react';
import { CircleHelp } from 'lucide-react';
import PersonAvatar from '../ui/PersonAvatar';
import SensitiveText from '../ui/SensitiveText';
import { useSensitiveData } from '../privacy/SensitiveDataContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import type { DeviatingPersonFlag, DeviatingPersonRow } from '../../data/survey/deviationInsights';

function scoreTone(value: number | null): string {
  if (value === null) {
    return 'bg-[#f5f5f5] text-[#8b8b8b]';
  }

  if (value >= 1) {
    return 'bg-[#fee2e2] text-[#b91c1c]';
  }

  if (value >= 0.75) {
    return 'bg-[#ffedd5] text-[#c2410c]';
  }

  if (value >= 0.45) {
    return 'bg-[#eff6ff] text-[#1d4ed8]';
  }

  return 'bg-[#ecfdf5] text-[#047857]';
}

function flagTone(flag: DeviatingPersonFlag): string {
  switch (flag) {
    case 'Different but isolated':
      return 'bg-[#fee2e2] text-[#b91c1c]';
    case 'Different and spreading':
      return 'bg-[#eff6ff] text-[#1d4ed8]';
    case 'Aligned with peers':
      return 'bg-[#ecfdf5] text-[#047857]';
  }
}

function formatScore(value: number | null): string {
  return value === null ? 'N/A' : value.toFixed(1);
}

function HeaderWithTooltip({
  label,
  helpText,
}: {
  label: string;
  helpText?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span>{label}</span>
      {helpText ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              role="button"
              tabIndex={0}
              className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[#9ca3af]"
              aria-label={`About ${label}`}
            >
              <CircleHelp className="h-3.5 w-3.5" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={8} className="max-w-[260px] px-3 py-2 text-[12px] leading-relaxed">
            <div className="text-white">{helpText}</div>
          </TooltipContent>
        </Tooltip>
      ) : null}
    </span>
  );
}

export default function TopDeviatingPeopleCard({
  rows,
  title = 'Top deviating people',
  description = 'People whose maturity profile looks most different from their current project peers and department peers. Low sharing evidence can mean strong know-how is staying personal instead of spreading through advice or reusable practices.',
  emptyMessage = 'No respondents currently stand out enough from their peer groups to show up here.',
}: {
  rows: DeviatingPersonRow[];
  title?: string;
  description?: string;
  emptyMessage?: string;
}) {
  const { isSensitiveDataHidden } = useSensitiveData();
  const [showAllRows, setShowAllRows] = useState(false);
  const deviatingRows = rows.filter((row) => row.flag !== 'Aligned with peers');
  const visibleRows = showAllRows ? deviatingRows : deviatingRows.slice(0, 8);

  return (
    <section className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
        {title}
      </h3>
      <p className="mt-1 text-sm text-[#7a7a7a]">
        {description}
      </p>

      {visibleRows.length > 0 ? (
        <>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-[#ececec] bg-white">
            <table className="min-w-full divide-y divide-[#ececec] text-sm">
              <thead className="bg-[#fafafa]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-[#737373]">Person</th>
                  <th className="px-4 py-3 text-left font-medium text-[#737373]">Department</th>
                  <th className="px-4 py-3 text-left font-medium text-[#737373]">Projects</th>
                  <th className="px-4 py-3 text-left font-medium text-[#737373]">
                    <HeaderWithTooltip
                      label="Vs project group"
                      helpText="Average difference across the five maturity dimensions between this person and the peers on their current projects. Higher means they look more unlike their project group."
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[#737373]">
                    <HeaderWithTooltip
                      label="Vs department"
                      helpText="Average difference across the five maturity dimensions between this person and the peers in their department. Higher means they stand out more from their department."
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[#737373]">
                    <HeaderWithTooltip
                      label="Sharing evidence"
                      helpText="Proxy from existing survey answers about whether this person shares advice, changes how others work, creates reusable artifacts, and helps practices spread. Lower values suggest their know-how may stay personal."
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[#737373]">
                    <HeaderWithTooltip
                      label="Flag"
                      helpText="Different but isolated means this person stands out from peers and has weak evidence that their know-how is spreading. Different and spreading means they stand out, but there is some evidence that their practices are influencing others."
                    />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0] bg-white">
                {visibleRows.map((row) => (
                  <tr key={row.person.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-3">
                        <PersonAvatar
                          name={row.person.name}
                          className="h-10 w-10 shrink-0"
                          textClassName="text-sm"
                          hidden={isSensitiveDataHidden}
                        />
                        <div className="min-w-0">
                          <Link
                            to={`/people?name=${encodeURIComponent(row.person.name)}`}
                            className="block truncate font-medium text-[#242424] transition-colors hover:text-[#0f766e]"
                          >
                            <SensitiveText as="span" hidden={isSensitiveDataHidden}>
                              {row.person.name}
                            </SensitiveText>
                          </Link>
                          <div className="mt-1 text-sm text-[#737373]">
                            {row.person.role} · Level {row.person.overallLevel}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#242424]">
                      <SensitiveText as="span" hidden={isSensitiveDataHidden}>
                        {row.person.allDepartments.join(', ')}
                      </SensitiveText>
                    </td>
                    <td className="px-4 py-3 text-[#242424]">
                      <SensitiveText as="span" hidden={isSensitiveDataHidden}>
                        {row.person.allProjects.join(', ')}
                      </SensitiveText>
                    </td>
                    <td className="px-4 py-3 text-[#242424]">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex w-fit rounded-md px-2.5 py-1 text-xs font-semibold ${scoreTone(row.projectDeviation)}`}
                        >
                          {formatScore(row.projectDeviation)}
                        </span>
                        <span className="text-xs text-[#8b8b8b]">
                          {row.projectPeerCount} peer{row.projectPeerCount === 1 ? '' : 's'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#242424]">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex w-fit rounded-md px-2.5 py-1 text-xs font-semibold ${scoreTone(row.departmentDeviation)}`}
                        >
                          {formatScore(row.departmentDeviation)}
                        </span>
                        <span className="text-xs text-[#8b8b8b]">
                          {row.departmentPeerCount} peer{row.departmentPeerCount === 1 ? '' : 's'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#242424]">
                      <span
                        className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${scoreTone(
                          row.sharingEvidence === null ? null : 5 - row.sharingEvidence,
                        )}`}
                      >
                        {formatScore(row.sharingEvidence)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${flagTone(
                          row.flag,
                        )}`}
                      >
                        {row.flag}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {deviatingRows.length > 8 ? (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAllRows((current) => !current)}
                className="rounded-full border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#525252] transition hover:bg-[#f8f8f8]"
              >
                {showAllRows ? 'Show less' : `Show all (${deviatingRows.length})`}
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-[#d4d4d8] bg-[#fafafa] px-6 py-8 text-center text-sm text-[#7a7a7a]">
          {emptyMessage}
        </div>
      )}
    </section>
  );
}
