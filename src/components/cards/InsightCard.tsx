import { Lightbulb } from 'lucide-react';

interface Props {
  title: string;
  text: string;
  color: string;
}

export default function InsightCard({ title, text, color }: Props) {
  return (
    <div
      className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm"
      style={{ borderLeftWidth: 4, borderLeftColor: color }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb size={16} style={{ color }} />
        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
    </div>
  );
}
