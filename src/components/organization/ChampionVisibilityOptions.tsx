import { Link } from 'react-router-dom';
import { useSensitiveData } from '../privacy/SensitiveDataContext';
import PersonAvatar from '../ui/PersonAvatar';
import SensitiveText from '../ui/SensitiveText';
import { LEVEL_LABELS, type Individual, type TechDimension } from '../../data/types';

export type ChampionRow = {
  person: Individual;
  championScore: number;
  tags: string[];
  teamCount: number;
  teams: string[];
};

export const AI_CHAMPION_SCORE_THRESHOLD = 3.6;

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

function championTeams(person: Individual): string[] {
  return Array.from(
    new Set(
      person.allProjects
        .map((project) => project.trim())
        .filter((project) => project && project.toLowerCase() !== 'n/a'),
    ),
  );
}

function championScore(person: Individual): number {
  const score =
    person.overallScore * 0.45 +
    person.scores.Culture * 0.3 +
    person.scores.Impact * 0.2 +
    person.scores.Vision * 0.05 +
    Math.min(0.15, Math.max(0, championTeams(person).length - 1) * 0.05);

  return Math.min(5, score);
}

function championTags(person: Individual): string[] {
  const candidates = [
    { label: 'Knowledge spread', weight: person.scores.Culture },
    { label: 'High impact', weight: person.scores.Impact },
    { label: 'Deep adoption', weight: person.scores.Usage },
    { label: 'Strong skills', weight: person.scores.Skills },
    { label: 'Forward-looking', weight: person.scores.Vision },
  ];

  if (championTeams(person).length > 1) {
    candidates.push({
      label: 'Cross-team',
      weight: 3.8 + Math.min(0.4, (championTeams(person).length - 1) * 0.1),
    });
  }

  const selected = candidates
    .filter((candidate) => candidate.weight >= 3.6)
    .sort((left, right) => right.weight - left.weight || left.label.localeCompare(right.label))
    .map((candidate) => candidate.label);

  if (selected.length >= 3) {
    return selected.slice(0, 3);
  }

  const fallbackDimensions = (Object.entries(person.scores) as Array<[TechDimension, number]>)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([dimension]) => {
      switch (dimension) {
        case 'Culture':
          return 'Knowledge spread';
        case 'Impact':
          return 'High impact';
        case 'Usage':
          return 'Deep adoption';
        case 'Skills':
          return 'Strong skills';
        case 'Vision':
          return 'Forward-looking';
      }
    });

  return Array.from(new Set([...selected, ...fallbackDimensions])).slice(0, 3);
}

export function buildChampionRows(individuals: Individual[]): ChampionRow[] {
  return [...individuals]
    .map((person) => {
      const teams = championTeams(person);

      return {
        person,
        championScore: championScore(person),
        tags: championTags(person),
        teamCount: teams.length,
        teams,
      };
    })
    .sort((left, right) => {
      if (right.championScore !== left.championScore) {
        return right.championScore - left.championScore;
      }
      if (right.person.scores.Culture !== left.person.scores.Culture) {
        return right.person.scores.Culture - left.person.scores.Culture;
      }
      if (right.person.scores.Impact !== left.person.scores.Impact) {
        return right.person.scores.Impact - left.person.scores.Impact;
      }
      return left.person.name.localeCompare(right.person.name);
    });
}

export function buildTopChampionRows(individuals: Individual[]): ChampionRow[] {
  return buildChampionRows(individuals).slice(0, 10);
}

export default function ChampionVisibilityOptions({
  topChampionRows,
  showHeader = true,
  wrapInCard = true,
  emptyStateMessage = 'Champion views will appear here once people survey results are available.',
}: {
  topChampionRows: ChampionRow[];
  showHeader?: boolean;
  wrapInCard?: boolean;
  emptyStateMessage?: string;
}) {
  const { isSensitiveDataHidden } = useSensitiveData();
  const containerClassName = wrapInCard
    ? 'mt-5 rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm'
    : 'mt-5';
  const tableWrapperClassName = wrapInCard
    ? `${showHeader ? 'mt-4 ' : ''}overflow-x-auto rounded-2xl border border-[#ececec] bg-white`
    : 'overflow-x-auto rounded-2xl border border-[#eaeaea] bg-white shadow-sm';
  const emptyStateClassName = wrapInCard
    ? 'mt-5 rounded-2xl border border-dashed border-[#d4d4d8] bg-[#fafafa] px-6 py-8 text-center text-sm text-[#7a7a7a]'
    : 'rounded-2xl border border-dashed border-[#d4d4d8] bg-[#fafafa] px-6 py-8 text-center text-sm text-[#7a7a7a]';

  return (
    <section className={containerClassName}>
      {showHeader ? (
        <>
          <h3 className="text-lg font-semibold tracking-tight text-[#242424]">
            Top AI champions
          </h3>
          <p className="mt-1 max-w-3xl text-sm text-[#7a7a7a]">
            People to learn from, involve, and support based on overall maturity, culture spread, and real impact.
          </p>
        </>
      ) : null}

      {topChampionRows.length > 0 ? (
        <div className={tableWrapperClassName}>
          <table className="min-w-full divide-y divide-[#ececec] text-sm">
            <thead className="bg-[#fafafa]">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-[#737373]">Person</th>
                <th className="px-4 py-3 text-left font-medium text-[#737373]">Champion score</th>
                <th className="px-4 py-3 text-left font-medium text-[#737373]">Level</th>
                <th className="px-4 py-3 text-left font-medium text-[#737373]">Culture / Impact</th>
                <th className="px-4 py-3 text-left font-medium text-[#737373]">Why they stand out</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f0f0] bg-white">
              {topChampionRows.map((row) => (
                <tr key={`full-champion-${row.person.id}`} className="align-top">
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
                          <PersonNameText
                            name={row.person.name}
                            hideSurname={isSensitiveDataHidden}
                          />
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
                          {row.teamCount > 0
                            ? row.teams.slice(0, 2).join(', ')
                            : row.person.project}
                          {row.teamCount > 2 ? ` +${row.teamCount - 2}` : ''}
                        </SensitiveText>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-[#242424]">
                    {row.championScore.toFixed(1)} / 5
                  </td>
                  <td className="px-4 py-3 text-[#242424]">
                    {`Level ${row.person.overallLevel} ${LEVEL_LABELS[row.person.overallLevel]}`}
                  </td>
                  <td className="px-4 py-3 text-[#242424]">
                    <div className="font-medium">{row.person.scores.Culture.toFixed(1)} / 5</div>
                    <div className="mt-1 text-xs text-[#8b8b8b]">
                      Impact {row.person.scores.Impact.toFixed(1)} / 5
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex max-w-[18rem] flex-wrap gap-2">
                      {row.tags.map((tag) => (
                        <span
                          key={`${row.person.id}-detail-${tag}`}
                          className="rounded-full border border-[#e5e7eb] bg-[#f9fafb] px-2.5 py-1 text-xs font-medium text-[#374151]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className={emptyStateClassName}>
          {emptyStateMessage}
        </div>
      )}
    </section>
  );
}
