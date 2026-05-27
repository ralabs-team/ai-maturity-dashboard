import { BriefcaseBusiness, Handshake, Wrench } from 'lucide-react';

interface SurveyAvatarProps {
  surveyId?: string;
  label: string;
  className?: string;
  textClassName?: string;
}

const surveyIcons = {
  'delivery-engineering': Wrench,
  business: BriefcaseBusiness,
  'client-survey': Handshake,
} as const;

function getSurveyInitials(label: string): string {
  const words = label
    .replace(/[^a-z0-9\s]/gi, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .filter((word) => !['ai', 'score', 'survey', 'and'].includes(word.toLowerCase()));

  if (words.length === 0) {
    return 'AI';
  }

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
}

export default function SurveyAvatar({
  surveyId,
  label,
  className = 'h-9 w-9',
  textClassName = 'text-[11px]',
}: SurveyAvatarProps) {
  const Icon = surveyId ? surveyIcons[surveyId as keyof typeof surveyIcons] : undefined;

  return (
    <div
      className={`${className} flex shrink-0 select-none items-center justify-center rounded-full bg-[linear-gradient(135deg,#0f766e_0%,#1d4ed8_100%)]`}
    >
      {Icon ? (
        <Icon className="h-[52%] w-[52%] text-white" strokeWidth={2.2} />
      ) : (
        <span className={`font-semibold leading-none text-white ${textClassName}`}>
          {getSurveyInitials(label)}
        </span>
      )}
    </div>
  );
}
