import { Link } from 'react-router-dom';
import { useSensitiveData } from '../privacy/SensitiveDataContext';
import PersonAvatar from '../ui/PersonAvatar';
import SensitiveText from '../ui/SensitiveText';
import { LEVEL_LABELS, type Individual } from '../../data/types';

const EXPERIENCE_REVIEW_PERCENTILE = 0.1;
const MIN_ANSWER_SHARE = 0.65;

export type ExperienceReviewRow = {
  person: Individual;
  experienceScore: number;
  validQuestionCount: number;
  skippedQuestionCount: number;
  answeredShare: number;
  tags: string[];
};

export type ExperienceReviewCohorts = {
  topRows: ExperienceReviewRow[];
  bottomRows: ExperienceReviewRow[];
  eligibleCount: number;
  excludedCount: number;
  cohortSize: number;
};

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
    <span>
      <span>{firstName || 'Unknown'}</span>
      {remainder ? <span>{remainder}</span> : null}
    </span>
  );
}

function experienceScore(person: Individual): number {
  return (
    person.scores.Usage * 0.45 +
    person.scores.Skills * 0.35 +
    person.scores.Impact * 0.2
  );
}

function answerCoverage(person: Individual): Pick<
  ExperienceReviewRow,
  'validQuestionCount' | 'skippedQuestionCount' | 'answeredShare'
> {
  const entries = Object.values(person.questionScores);
  const validQuestionCount = entries.filter((score) => typeof score === 'number').length;
  const skippedQuestionCount = entries.length - validQuestionCount;
  const answeredShare = entries.length > 0 ? validQuestionCount / entries.length : 0;

  return {
    validQuestionCount,
    skippedQuestionCount,
    answeredShare,
  };
}

function topTags(person: Individual): string[] {
  const candidates = [
    { label: 'Deep usage', value: person.scores.Usage },
    { label: 'Strong skills', value: person.scores.Skills },
    { label: 'High impact', value: person.scores.Impact },
  ];

  return candidates
    .filter((candidate) => candidate.value >= 3.5)
    .sort((left, right) => right.value - left.value || left.label.localeCompare(right.label))
    .map((candidate) => candidate.label)
    .slice(0, 3);
}

function bottomTags(person: Individual): string[] {
  const candidates = [
    { label: 'Low usage', value: person.scores.Usage },
    { label: 'Low skills', value: person.scores.Skills },
    { label: 'Low impact', value: person.scores.Impact },
  ];

  const tags = candidates
    .filter((candidate) => candidate.value <= 2.6)
    .sort((left, right) => left.value - right.value || left.label.localeCompare(right.label))
    .map((candidate) => candidate.label)
    .slice(0, 3);

  return tags.length > 0 ? tags : ['Needs closer review'];
}

function buildEligibleRows(individuals: Individual[]): ExperienceReviewRow[] {
  return individuals
    .map((person) => {
      const coverage = answerCoverage(person);

      return {
        person,
        experienceScore: experienceScore(person),
        validQuestionCount: coverage.validQuestionCount,
        skippedQuestionCount: coverage.skippedQuestionCount,
        answeredShare: coverage.answeredShare,
        tags: [],
      };
    })
    .filter((row) => !row.person.credibilityWarning && row.answeredShare >= MIN_ANSWER_SHARE);
}

function sortRowsDescending(left: ExperienceReviewRow, right: ExperienceReviewRow): number {
  if (right.experienceScore !== left.experienceScore) {
    return right.experienceScore - left.experienceScore;
  }
  if (right.person.scores.Skills !== left.person.scores.Skills) {
    return right.person.scores.Skills - left.person.scores.Skills;
  }
  if (right.person.scores.Usage !== left.person.scores.Usage) {
    return right.person.scores.Usage - left.person.scores.Usage;
  }
  if (right.person.scores.Impact !== left.person.scores.Impact) {
    return right.person.scores.Impact - left.person.scores.Impact;
  }
  return left.person.name.localeCompare(right.person.name);
}

function sortRowsAscending(left: ExperienceReviewRow, right: ExperienceReviewRow): number {
  if (left.experienceScore !== right.experienceScore) {
    return left.experienceScore - right.experienceScore;
  }
  if (left.person.scores.Skills !== right.person.scores.Skills) {
    return left.person.scores.Skills - right.person.scores.Skills;
  }
  if (left.person.scores.Usage !== right.person.scores.Usage) {
    return left.person.scores.Usage - right.person.scores.Usage;
  }
  if (left.person.scores.Impact !== right.person.scores.Impact) {
    return left.person.scores.Impact - right.person.scores.Impact;
  }
  return left.person.name.localeCompare(right.person.name);
}

export function buildExperienceReviewCohorts(individuals: Individual[]): ExperienceReviewCohorts {
  const eligibleRows = buildEligibleRows(individuals);
  const cohortSize =
    eligibleRows.length > 0
      ? Math.max(1, Math.ceil(eligibleRows.length * EXPERIENCE_REVIEW_PERCENTILE))
      : 0;

  const topRows = [...eligibleRows]
    .sort(sortRowsDescending)
    .slice(0, cohortSize)
    .map((row) => ({
      ...row,
      tags: topTags(row.person),
    }));

  const topIds = new Set(topRows.map((row) => row.person.id));

  const bottomRows = [...eligibleRows]
    .sort(sortRowsAscending)
    .filter((row) => !topIds.has(row.person.id))
    .slice(0, cohortSize)
    .map((row) => ({
      ...row,
      tags: bottomTags(row.person),
    }));

  return {
    topRows,
    bottomRows,
    eligibleCount: eligibleRows.length,
    excludedCount: individuals.length - eligibleRows.length,
    cohortSize,
  };
}

function ReviewList({
  title,
  subtitle,
  rows,
  tone,
  emptyState,
}: {
  title: string;
  subtitle: string;
  rows: ExperienceReviewRow[];
  tone: 'positive' | 'warning';
  emptyState: string;
}) {
  const { isSensitiveDataHidden } = useSensitiveData();

  const toneClassName =
    tone === 'positive'
      ? 'border-[#ccfbf1] bg-[#f0fdfa] text-[#0f766e]'
      : 'border-[#fde68a] bg-[#fffbeb] text-[#b45309]';

  return (
    <div className="rounded-2xl border border-[#eaeaea] bg-[#fcfcfc] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-base font-semibold text-[#242424]">{title}</h4>
          <p className="mt-1 text-sm text-[#7a7a7a]">{subtitle}</p>
        </div>
        <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${toneClassName}`}>
          {rows.length} people
        </span>
      </div>

      {rows.length > 0 ? (
        <div className="mt-4 space-y-3">
          {rows.map((row) => (
            <article
              key={`${tone}-${row.person.id}`}
              className="rounded-2xl border border-[#eaeaea] bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
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
                      <PersonNameText name={row.person.name} hideSurname={isSensitiveDataHidden} />
                    </Link>
                    <div className="mt-1 text-sm text-[#737373]">
                      {row.person.role} ·{' '}
                      <SensitiveText as="span" hidden={isSensitiveDataHidden}>
                        {row.person.department}
                      </SensitiveText>
                    </div>
                    <SensitiveText
                      as="div"
                      hidden={isSensitiveDataHidden}
                      className="mt-1 text-xs text-[#a1a1aa]"
                    >
                      {row.person.project}
                    </SensitiveText>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <div className="text-sm font-semibold text-[#242424]">
                    {row.experienceScore.toFixed(1)} / 5
                  </div>
                  <div className="mt-1 text-xs text-[#8b8b8b]">Experience score</div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-[#e5e7eb] bg-[#f9fafb] px-2.5 py-1 text-xs font-medium text-[#374151]">
                  {`L${row.person.overallLevel} ${LEVEL_LABELS[row.person.overallLevel]}`}
                </span>
                <span className="rounded-full border border-[#e5e7eb] bg-[#f9fafb] px-2.5 py-1 text-xs font-medium text-[#374151]">
                  {`Usage ${row.person.scores.Usage.toFixed(1)}`}
                </span>
                <span className="rounded-full border border-[#e5e7eb] bg-[#f9fafb] px-2.5 py-1 text-xs font-medium text-[#374151]">
                  {`Skills ${row.person.scores.Skills.toFixed(1)}`}
                </span>
                <span className="rounded-full border border-[#e5e7eb] bg-[#f9fafb] px-2.5 py-1 text-xs font-medium text-[#374151]">
                  {`Impact ${row.person.scores.Impact.toFixed(1)}`}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {row.tags.map((tag) => (
                  <span
                    key={`${row.person.id}-${tag}`}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium ${toneClassName}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="mt-4 text-xs text-[#8b8b8b]">
                {`${Math.round(row.answeredShare * 100)}% answer coverage · ${row.validQuestionCount} scored answers · ${row.skippedQuestionCount} skipped`}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-[#d4d4d8] bg-white px-5 py-8 text-center text-sm text-[#7a7a7a]">
          {emptyState}
        </div>
      )}
    </div>
  );
}

export default function ExperienceReviewOptions({
  cohorts,
}: {
  cohorts: ExperienceReviewCohorts;
}) {
  return (
    <section className="mt-5 rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
        Detailed answer review cohorts
      </h3>
      <p className="mt-1 max-w-3xl text-sm text-[#7a7a7a]">
        We automatically shortlist roughly the top and bottom 10% of credible respondents by hands-on AI experience score so you can review their answers in more detail.
      </p>

      <div className="mt-4 flex flex-wrap gap-2 text-xs text-[#6b7280]">
        <span className="rounded-full border border-[#e5e7eb] bg-[#fafafa] px-3 py-1.5 font-medium">
          {`${cohorts.eligibleCount} eligible respondents`}
        </span>
        <span className="rounded-full border border-[#e5e7eb] bg-[#fafafa] px-3 py-1.5 font-medium">
          {`${cohorts.excludedCount} excluded for low coverage or credibility flags`}
        </span>
        <span className="rounded-full border border-[#e5e7eb] bg-[#fafafa] px-3 py-1.5 font-medium">
          {`Cohort size: ${cohorts.cohortSize}`}
        </span>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <ReviewList
          title="Top 10% to learn from"
          subtitle="These are the strongest hands-on respondents to study for reusable patterns, workflows, and examples."
          rows={cohorts.topRows}
          tone="positive"
          emptyState="No high-confidence top-review cohort is available yet."
        />
        <ReviewList
          title="Bottom 10% to review closely"
          subtitle="These respondents are the best candidates for deeper answer review to understand blockers, confusion, or missing support."
          rows={cohorts.bottomRows}
          tone="warning"
          emptyState="Not enough distinct eligible respondents yet to build a lower-experience review cohort."
        />
      </div>
    </section>
  );
}
