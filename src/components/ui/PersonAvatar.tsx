interface PersonAvatarProps {
  name: string;
  className?: string;
  textClassName?: string;
}

export default function PersonAvatar({
  name,
  className = 'h-8 w-8',
  textClassName = 'text-xs',
}: PersonAvatarProps) {
  const initials = name
    .split(' ')
    .map((word) => word[0])
    .join('');

  return (
    <div
      className={`${className} rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shrink-0 select-none`}
    >
      <span className={`text-white font-medium leading-none ${textClassName}`}>{initials}</span>
    </div>
  );
}
