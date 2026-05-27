import type { Individual } from '../../data/types';
import { MAX_DIMENSION_SCORE, TECH_DIMENSIONS, LEVEL_LABELS, scoreToLevel } from '../../data/types';

interface Props {
  person: Individual;
  onClose?: () => void;
}

function ScoreBadge({ score }: { score: number }) {
  const level = scoreToLevel(score);
  const colors: Record<number, string> = {
    1: 'bg-orange-100 text-orange-700',
    2: 'bg-amber-100 text-amber-700',
    3: 'bg-indigo-100 text-indigo-700',
    4: 'bg-blue-100 text-blue-700',
    5: 'bg-emerald-100 text-emerald-700',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors[level]}`}>
      {LEVEL_LABELS[level]}
    </span>
  );
}

export default function PersonCard({ person, onClose }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-lg p-6 w-full max-w-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{person.name}</h3>
          <p className="text-sm text-slate-500">
            {person.role} &middot; {person.project}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-lg leading-none"
          >
            &times;
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 mb-5">
        <span className="text-sm text-slate-500">Overall:</span>
        <span className="text-2xl font-bold text-slate-900">L{person.overallLevel}</span>
        <ScoreBadge score={(person.overallLevel - 1)} />
      </div>

      <div className="space-y-3">
        {TECH_DIMENSIONS.map((dim) => {
          const score = person.scores[dim];
          const pct = (score / MAX_DIMENSION_SCORE) * 100;
          const level = scoreToLevel(score);
          return (
            <div key={dim}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-600">{dim}</span>
                <span className="font-semibold text-slate-800">
                  {LEVEL_LABELS[level]}{' '}
                  <span className="text-slate-400 text-xs">({score.toFixed(1)})</span>
                </span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background:
                      level <= 2
                        ? '#f59e0b'
                        : level === 3
                        ? '#6366f1'
                        : '#10b981',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
