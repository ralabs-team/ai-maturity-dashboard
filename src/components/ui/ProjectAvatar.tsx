interface ProjectAvatarProps {
  name: string;
}

export default function ProjectAvatar({ name }: ProjectAvatarProps) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500">
      <span className="text-sm font-medium text-white">{initials || 'PR'}</span>
    </div>
  );
}
