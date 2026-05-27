import type { Project } from '../../data/types';
import { TECH_DIMENSIONS, LEVEL_LABELS, scoreToLevel } from '../../data/types';

interface Props {
  project: Project;
}

export default function ProjectCard({ project }: Props) {
  return (
    <div
      className="bg-white rounded-xl border border-slate-100 shadow-sm p-5"
      style={{ borderTopWidth: 4, borderTopColor: project.color }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-slate-900">{project.name}</h3>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
          style={{ backgroundColor: project.color }}
        >
          L{project.overallLevel} &middot; {LEVEL_LABELS[project.overallLevel]}
        </span>
      </div>
      <p className="text-xs text-slate-400 mb-3">{project.members.length} members</p>
      <div className="grid grid-cols-2 gap-2">
        {TECH_DIMENSIONS.map((dim) => {
          const score = project.avgScores[dim];
          const level = scoreToLevel(score);
          return (
            <div key={dim} className="text-center bg-slate-50 rounded-lg p-2">
              <p className="text-xs text-slate-500">{dim}</p>
              <p className="text-sm font-bold text-slate-800">{score.toFixed(1)}</p>
              <p className="text-xs text-slate-400">{LEVEL_LABELS[level]}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
