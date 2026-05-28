export default function OrganizationSectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-4">
      <h2 className="text-[1.4rem] font-semibold tracking-tight text-[#242424] md:text-[1.5rem]">
        {title}
      </h2>
      <p className="mt-1 max-w-3xl text-sm text-[#7a7a7a] md:text-[0.95rem]">{subtitle}</p>
    </div>
  );
}
