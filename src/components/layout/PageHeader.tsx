interface Props {
  title: string;
  subtitle?: string;
  badge?: string | number;
  titleClassName?: string;
  subtitleClassName?: string;
}

export default function PageHeader({
  title,
  subtitle,
  badge,
  titleClassName,
  subtitleClassName,
}: Props) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2.5">
        <h2 className={titleClassName ?? 'text-xl font-semibold'}>{title}</h2>
        {badge !== undefined && (
          <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-md bg-[#f4f4f5] text-[#525252]">
            {badge}
          </span>
        )}
      </div>
      {subtitle && <p className={subtitleClassName ?? 'mb-6 text-[#8b8b8b]'}>{subtitle}</p>}
    </div>
  );
}
