import { ArrowDown } from 'lucide-react';
import { LEVEL_LABELS, type MaturityLevel } from '../../data/types';
import { Tooltip as InfoTooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import TeamSectionHeader from './TeamSectionHeader';
import { formatLevelLabel, formatPercent, formatScore } from './teamViewShared';

type TeamSummarySectionProps = {
  scopeLabelLower: string;
  selectedTeamLevel45Count: number;
  selectedTeamLevelNumber: number;
  selectedTeamOverallScore: number;
  selectedTeamResponseCount: number;
  aiChampionCount: number;
  aiChampionShare: number;
  isPreparingAiResearchPack: boolean;
  onDownloadAiResearchPack: () => void;
  onJumpToAiChampions: () => void;
  onOpenExternalAi: (url: string) => void;
};

export default function TeamSummarySection({
  scopeLabelLower,
  selectedTeamLevel45Count,
  selectedTeamLevelNumber,
  selectedTeamOverallScore,
  selectedTeamResponseCount,
  aiChampionCount,
  aiChampionShare,
  isPreparingAiResearchPack,
  onDownloadAiResearchPack,
  onJumpToAiChampions,
  onOpenExternalAi,
}: TeamSummarySectionProps) {
  return (
    <section id="team-top-summary" className="mt-8 scroll-mt-24">
      <TeamSectionHeader
        title="Top summary"
        subtitle={`Fast-read ${scopeLabelLower} signals for maturity, movement, participation, and concentration of stronger adopters.`}
      />

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {[
          {
            title: 'Overall maturity',
            value: formatScore(selectedTeamOverallScore),
            detail: formatLevelLabel(LEVEL_LABELS[selectedTeamLevelNumber as MaturityLevel]),
            hoverValue: `${selectedTeamOverallScore.toFixed(2)} / 5`,
          },
          {
            title: 'Responses',
            value: String(selectedTeamResponseCount),
            detail: 'Survey responses',
          },
          {
            title: 'Level 4–5 people',
            value: String(selectedTeamLevel45Count),
            detail: `${formatPercent((selectedTeamLevel45Count / Math.max(selectedTeamResponseCount, 1)) * 100)} of team at advanced maturity`,
          },
          {
            title: 'AI champions',
            value: formatPercent(aiChampionShare),
            detail: `${aiChampionCount} of ${selectedTeamResponseCount} ${
              selectedTeamResponseCount === 1 ? 'respondent clears' : 'respondents clear'
            } the champion threshold`,
            onClick: onJumpToAiChampions,
          },
        ].map((card, index) => (
          <button
            type="button"
            key={card.title}
            onClick={card.onClick}
            className={`flex min-h-[126px] flex-col rounded-2xl shadow-sm ${
              index === 0
                ? 'border border-[#1d4ed8]/20 bg-[linear-gradient(135deg,#0f766e_0%,#1d4ed8_100%)] px-5 py-4 text-white'
                : 'border border-[#eaeaea] bg-white px-4 py-3'
            } ${card.onClick ? 'text-left transition hover:border-[#d4d4d8] hover:bg-[#fafafa] focus:outline-none focus:ring-[3px] focus:ring-[#c7c7cc]/25' : 'text-left'}`}
          >
            <div
              className={`text-[11px] font-medium uppercase tracking-[0.14em] ${
                index === 0 ? 'text-white/75' : 'text-[#8b8b8b]'
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                {card.title}
                {card.onClick ? (
                  <ArrowDown className={`h-3 w-3 ${index === 0 ? 'text-white/70' : 'text-[#9ca3af]'}`} />
                ) : null}
              </span>
            </div>
            <div className="mt-8 flex items-center gap-3">
              {card.hoverValue ? (
                <InfoTooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={`cursor-default text-2xl font-semibold leading-none tracking-tight ${index === 0 ? 'text-white' : 'text-[#242424]'}`}
                    >
                      {card.value}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={8} className="px-3 py-2 text-[12px] leading-relaxed">
                    <div className="font-medium text-white">{card.hoverValue}</div>
                  </TooltipContent>
                </InfoTooltip>
              ) : (
                <div className={`text-2xl font-semibold leading-none tracking-tight ${index === 0 ? 'text-white' : 'text-[#242424]'}`}>
                  {card.value}
                </div>
              )}
            </div>
            <div className={`mt-4 text-sm ${index === 0 ? 'text-white/80' : 'text-[#8b8b8b]'}`}>
              {card.detail}
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-3xl border border-[#e5e7eb] bg-[linear-gradient(180deg,#fbfbfc_0%,#ffffff_100%)] p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8b8b8b]">
              Ask External AI
            </div>
            <h3 className="mt-2 text-lg font-semibold tracking-tight text-[#1f2937]">
              Download an{' '}
              <InfoTooltip>
                <TooltipTrigger asChild>
                  <span className="cursor-help underline decoration-dotted underline-offset-4">
                    anonymized
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" sideOffset={8} className="max-w-[280px] px-3 py-2 text-[12px] leading-relaxed">
                  People are shortened like John R, and project names are replaced with stable aliases like GGLE.
                </TooltipContent>
              </InfoTooltip>{' '}
              research pack for ChatGPT or Claude
            </h3>
            <p className="mt-2 text-sm leading-6 text-[#667085]">
              Export a markdown brief with survey context, organization snapshot, raw dimension
              scores for individuals, departments, and projects, plus question-level responses.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <button
              type="button"
              onClick={() =>
                onOpenExternalAi(
                  'https://chatgpt.com/g/g-6a1748e9d82c81918cc004536a458297-ai-maturity-index-analyst',
                )
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#e5e7eb] bg-white px-4 text-sm font-semibold text-[#242424] transition hover:border-[#d4d4d8] hover:bg-[#f8f8f9] focus:outline-none focus:ring-[3px] focus:ring-[#c7c7cc]/25"
            >
              <img src="/chatgpt-logo.svg" alt="" aria-hidden="true" className="h-4 w-4" />
              Open ChatGPT
            </button>

            <button
              type="button"
              onClick={() => onOpenExternalAi('https://claude.ai/')}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-[#e5e7eb] bg-white px-4 text-sm font-semibold text-[#242424] transition hover:border-[#d4d4d8] hover:bg-[#f8f8f9] focus:outline-none focus:ring-[3px] focus:ring-[#c7c7cc]/25"
            >
              <img src="/claude-logo.png" alt="" aria-hidden="true" className="h-4 w-4" />
              Open Claude
            </button>

            <button
              type="button"
              onClick={onDownloadAiResearchPack}
              disabled={isPreparingAiResearchPack}
              className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#d4d4d8] bg-[#f5f5f5] px-5 text-sm font-semibold text-[#3f3f46] transition hover:border-[#c4c4c7] hover:bg-[#ededee] focus:outline-none focus:ring-[3px] focus:ring-[#c7c7cc]/25 disabled:cursor-wait disabled:opacity-70"
            >
              {isPreparingAiResearchPack ? 'Preparing AI research pack...' : 'Download AI research pack'}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
