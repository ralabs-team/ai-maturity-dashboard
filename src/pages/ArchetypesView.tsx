import PageHeader from '../components/layout/PageHeader';
import FloatingSectionNav from '../components/layout/FloatingSectionNav';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from '../components/charts/recharts';
import { TEAM_ARCHETYPE_CATALOG } from '../data/survey/teamArchetypes';
import { INDIVIDUAL_ARCHETYPE_CATALOG } from '../data/survey/individualArchetypes';
import { TECH_DIMENSIONS, type TechDimension } from '../shared/survey-domain';

type ArchetypeFamily = {
  title: string;
  summary: string;
  archetypeIds: string[];
};

type CatalogArchetype = {
  id: string;
  label: string;
  signal: string;
  summary: string;
  target: Record<TechDimension, number>;
};

const TEAM_ARCHETYPE_FAMILIES: ArchetypeFamily[] = [
  {
    title: 'Early direction',
    summary: 'The team is either early overall or can already see the opportunity before usage has become real.',
    archetypeIds: ['earlyCamp', 'visioneers'],
  },
  {
    title: 'Concentrated momentum',
    summary: 'Progress is real, but it still depends more on individuals, tactical tool use, or isolated wins than on shared practice.',
    archetypeIds: ['individualExperts', 'toolOperators', 'skepticalPerformers', 'outcomeHunters'],
  },
  {
    title: 'Shared practice',
    summary: 'AI has become a stronger team habit, first through growing repeatability and eventually as a mature native capability.',
    archetypeIds: ['habitBuilders', 'nativeTeams'],
  },
];

const INDIVIDUAL_ARCHETYPE_FAMILIES: ArchetypeFamily[] = [
  {
    title: 'Early direction',
    summary: 'The individual is either early overall or can already see the opportunity before practical use has become real.',
    archetypeIds: ['earlyExplorer', 'visioneer'],
  },
  {
    title: 'Concentrated momentum',
    summary: 'Progress is real, but it still shows up more as personal capability, tactical tool use, fragmented success, or isolated wins than as embedded practice.',
    archetypeIds: ['individualExpert', 'toolOperator', 'skepticalPerformer', 'outcomeHunter'],
  },
  {
    title: 'Embedded practice',
    summary: 'AI has become a stronger personal habit, first through repeatability and eventually as a mature native capability.',
    archetypeIds: ['habitBuilder', 'aiNative'],
  },
];

function ArchetypeMaturityMap({
  target,
}: {
  target: Record<TechDimension, number>;
}) {
  const radarData = TECH_DIMENSIONS.map((dimension) => ({
    dimension,
    value: target[dimension],
  }));

  return (
    <div className="rounded-2xl border border-[#eaeaea] bg-[#fcfcfc] p-3">
      <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8b8b8b]">
        Maturity map
      </div>
      <div className="mt-3 h-[240px] min-w-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} outerRadius="68%">
            <PolarGrid stroke="rgb(229,229,229)" />
            <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 11, fill: '#737373' }} />
            <PolarRadiusAxis
              domain={[1, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 9, fill: '#b0b0b0' }}
              axisLine={false}
            />
            <RechartsTooltip
              isAnimationActive={false}
              cursor={{ stroke: '#14b8a6', strokeWidth: 1, strokeDasharray: '3 3' }}
              contentStyle={{
                backgroundColor: '#242424',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                color: '#ffffff',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#ffffff', fontWeight: 600 }}
              itemStyle={{ color: '#ffffff' }}
              formatter={(value) => [`${Number(value).toFixed(1)} / 5`, 'Target']}
            />
            <Radar
              name="target"
              dataKey="value"
              stroke="#2563eb"
              fill="#2563eb"
              fillOpacity={0.12}
              strokeWidth={2}
              isAnimationActive={false}
              dot={
                ((props: { cx?: number; cy?: number }) => {
                  const { cx = 0, cy = 0 } = props;
                  const size = 8;
                  return (
                    <rect
                      x={cx - size / 2}
                      y={cy - size / 2}
                      width={size}
                      height={size}
                      fill="#2563eb"
                    />
                  );
                }) as unknown as never
              }
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ArchetypeCatalogSection({
  sectionId,
  eyebrow,
  title,
  description,
  families,
  catalog,
}: {
  sectionId: string;
  eyebrow: string;
  title: string;
  description: string;
  families: ArchetypeFamily[];
  catalog: CatalogArchetype[];
}) {
  const archetypeById = Object.fromEntries(catalog.map((archetype) => [archetype.id, archetype]));

  return (
    <>
      <section id={sectionId} className="mt-6 scroll-mt-24">
        <div className="mb-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8b8b8b]">
            {eyebrow}
          </div>
          <h3 className="mt-2 text-lg font-semibold tracking-tight text-[#1f2937]">{title}</h3>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[#667085]">{description}</p>
        </div>

        <div className="grid gap-4 xl:grid-cols-3">
          {families.map((family) => (
            <section key={family.title} className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
              <h4 className="text-base font-semibold text-[#111827]">{family.title}</h4>
              <p className="mt-2 text-sm leading-6 text-[#667085]">{family.summary}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {family.archetypeIds.map((archetypeId) => {
                  const archetype = archetypeById[archetypeId];

                  return (
                    <span
                      key={archetypeId}
                      className="inline-flex rounded-full border border-[#dbe4f0] bg-[#f8fbff] px-3 py-1.5 text-sm font-medium text-[#31517a]"
                    >
                      {archetype.label}
                    </span>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8b8b8b]">
            Full catalog
          </div>
          <h3 className="mt-2 text-lg font-semibold tracking-tight text-[#1f2937]">
            All current {eyebrow.toLowerCase()} definitions
          </h3>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-[#667085]">
            Each card below shows the current signal, summary, and target dimension profile used
            to describe that archetype.
          </p>
        </div>

        <div className="space-y-4">
          {catalog.map((archetype, index) => (
            <section key={archetype.id} className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f766e_0%,#1d4ed8_100%)] px-2 text-xs font-semibold text-white">
                      {index + 1}
                    </div>
                  </div>
                  <h4 className="mt-3 text-xl font-semibold tracking-tight text-[#111827]">
                    {archetype.label}
                  </h4>
                  <p className="mt-2 text-sm font-medium leading-6 text-[#1f2937]">
                    {archetype.signal}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#667085]">{archetype.summary}</p>
                </div>
                <ArchetypeMaturityMap target={archetype.target} />
              </div>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}

export default function ArchetypesView() {
  const archetypeNavItems = [
    { id: 'team-archetypes', label: 'Teams' },
    { id: 'individual-archetypes', label: 'Individuals' },
  ] as const;

  return (
    <div>
      <FloatingSectionNav
        items={archetypeNavItems}
        showItemLabelsOnHover
        labelAlignment="right"
      />

      <PageHeader
        title="Archetypes"
        subtitle="Reference page for the current team and individual archetype definitions used by the maturity views."
        badge={TEAM_ARCHETYPE_CATALOG.length + INDIVIDUAL_ARCHETYPE_CATALOG.length}
      />

      <section className="rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#8b8b8b]">
          How to read them
        </div>
        <h3 className="mt-2 text-lg font-semibold tracking-tight text-[#1f2937]">
          Archetypes are patterns across five dimensions
        </h3>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-[#667085]">
          These labels are not a strict maturity ladder. They describe common combinations of
          usage, skill, impact, culture, and vision. The most important hidden axis is usually
          culture: whether AI know-how is spreading into team habit or staying concentrated in a
          few people.
        </p>
      </section>

      <ArchetypeCatalogSection
        sectionId="team-archetypes"
        eyebrow="Team archetypes"
        title="The main shapes in the current team catalog"
        description="Patterns that describe how AI is showing up at the team level across shared usage, skill, impact, culture, and vision."
        families={TEAM_ARCHETYPE_FAMILIES}
        catalog={[...TEAM_ARCHETYPE_CATALOG]}
      />

      <ArchetypeCatalogSection
        sectionId="individual-archetypes"
        eyebrow="Individual archetypes"
        title="The main shapes in the current individual catalog"
        description="Patterns that describe how AI is showing up for a single person, including whether the practice is still personal, becoming repeatable, or already producing visible outcomes."
        families={INDIVIDUAL_ARCHETYPE_FAMILIES}
        catalog={[...INDIVIDUAL_ARCHETYPE_CATALOG]}
      />
    </div>
  );
}
