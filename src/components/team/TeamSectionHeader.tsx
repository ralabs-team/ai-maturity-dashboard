type TeamSectionHeaderProps = {
  title: string;
  subtitle: string;
};

export default function TeamSectionHeader({ title, subtitle }: TeamSectionHeaderProps) {
  return (
    <div className="mb-4">
      <h2 className="text-[1.4rem] font-semibold tracking-tight text-[#242424] md:text-[1.5rem]">
        {title}
      </h2>
      <p className="mt-1 text-sm text-[#7a7a7a]">{subtitle}</p>
    </div>
  );
}
