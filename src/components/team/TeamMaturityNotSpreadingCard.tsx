import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleHelp } from 'lucide-react';
import PersonAvatar from '../ui/PersonAvatar';
import SensitiveText from '../ui/SensitiveText';
import { useSensitiveData } from '../privacy/SensitiveDataContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import type { TeamValidatedPersonFlag, TeamValidatedPersonRow } from '../../data/survey/teamValidatedView';

function scoreTone(value: number | null): string {
  if (value === null) {
    return 'bg-[#f5f5f5] text-[#8b8b8b]';
  }

  if (value >= 1) {
    return 'bg-[#fee2e2] text-[#b91c1c]';
  }

  if (value >= 0.6) {
    return 'bg-[#ffedd5] text-[#c2410c]';
  }

  if (value > 0.35) {
    return 'bg-[#eff6ff] text-[#1d4ed8]';
  }

  return 'bg-[#ecfdf5] text-[#047857]';
}

function flagTone(flag: TeamValidatedPersonFlag): string {
  switch (flag) {
    case 'Not spreading yet':
      return 'bg-[#fee2e2] text-[#b91c1c]';
    case 'Spreading but fragile':
      return 'bg-[#ffedd5] text-[#c2410c]';
    case 'Proxy stronger than self':
      return 'bg-[#eff6ff] text-[#1d4ed8]';
    case 'Aligned':
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

export default function TeamMaturityNotSpreadingCard({
  rows,
  scopeLabelLower,
}: {
  rows: TeamValidatedPersonRow[];
  scopeLabelLower: string;
}) {
  const { isSensitiveDataHidden } = useSensitiveData();
  const [showAllRows, setShowAllRows] = useState(false);
  const filteredRows = rows.filter(
    (row) => row.alignmentGap !== null && row.alignmentGap > 0.35,
  );
  const visibleRows = showAllRows ? filteredRows : filteredRows.slice(0, 8);

  return (
    <section className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
        Where maturity is not spreading
      </h3>
      <p className="mt-1 text-sm text-[#7a7a7a]">
        People inside the selected {scopeLabelLower} whose self-reported maturity is stronger than
        the team-validated proxy built from influence and surrounding team signals. This helps spot
        know-how that exists but is not yet turning into shared behavior around them.
      </p>

      {visibleRows.length > 0 ? (
        <>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-[#ececec] bg-white">
            <table className="min-w-full divide-y divide-[#ececec] text-sm">
              <thead className="bg-[#fafafa]">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-[#737373]">Person</th>
                  <th className="px-4 py-3 text-left font-medium text-[#737373]">
                    <HeaderWithTooltip
                      label="Self score"
                      helpText="Their normal maturity score from their own survey answers."
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[#737373]">
                    <HeaderWithTooltip
                      label="Proxy"
                      helpText="A team-validated proxy built from signals about whether their maturity shows up around them through influence, artifacts, shared practices, and local team climate."
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[#737373]">
                    <HeaderWithTooltip
                      label="Gap"
                      helpText="Self score minus proxy. Higher positive values mean the person looks stronger on paper than their maturity currently appears around them."
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[#737373]">
                    <HeaderWithTooltip
                      label="Sharing evidence"
                      helpText="Signals about whether they share advice, create reusable artifacts, and help other people adopt AI in practice."
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-[#737373]">
                    <HeaderWithTooltip
                      label="Signal"
                      helpText="Not spreading yet means high self maturity is not showing up strongly around them. Spreading but fragile means there is some spread, but it still looks weaker than their personal maturity."
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
                    <td className="px-4 py-3 text-[#242424]">{row.selfOverallScore.toFixed(1)}</td>
                    <td className="px-4 py-3 text-[#242424]">{formatScore(row.peerViewProxyScore)}</td>
                    <td className="px-4 py-3 text-[#242424]">
                      <span
                        className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold ${scoreTone(
                          row.alignmentGap,
                        )}`}
                      >
                        {formatScore(row.alignmentGap)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#242424]">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex w-fit rounded-md px-2.5 py-1 text-xs font-semibold ${scoreTone(
                            row.influenceEvidenceScore === null ? null : 5 - row.influenceEvidenceScore,
                          )}`}
                        >
                          {formatScore(row.influenceEvidenceScore)}
                        </span>
                        <span className="text-xs text-[#8b8b8b]">
                          {row.peerRespondentCount} peer{row.peerRespondentCount === 1 ? '' : 's'}
                        </span>
                      </div>
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

          {filteredRows.length > 8 ? (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAllRows((current) => !current)}
                className="rounded-full border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#525252] transition hover:bg-[#f8f8f8]"
              >
                {showAllRows ? 'Show less' : `Show all (${filteredRows.length})`}
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-[#d4d4d8] bg-[#fafafa] px-6 py-8 text-center text-sm text-[#7a7a7a]">
          No people in the selected {scopeLabelLower} currently show a strong enough self-vs-proxy gap to surface here.
        </div>
      )}
    </section>
  );
}
