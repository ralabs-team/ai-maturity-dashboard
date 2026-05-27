import { useEffect, useMemo, useState } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';

export type FloatingSectionNavChildItem = {
  id: string;
  label: string;
};

export type FloatingSectionNavItem = FloatingSectionNavChildItem & {
  children?: readonly FloatingSectionNavChildItem[];
};

type FloatingSectionNavProps = {
  items: readonly FloatingSectionNavItem[];
  className?: string;
  topThreshold?: number;
  bottomThreshold?: number;
  activationLineRatio?: number;
  activationLineMin?: number;
  showItemLabels?: boolean;
  showItemLabelsOnHover?: boolean;
  labelAlignment?: 'center' | 'right';
};

const DEFAULT_CLASS_NAME =
  'fixed right-6 top-1/2 z-30 hidden -translate-y-1/2 xl:block 2xl:right-10';

export default function FloatingSectionNav({
  items,
  className = DEFAULT_CLASS_NAME,
  topThreshold = 48,
  bottomThreshold = 8,
  activationLineRatio = 0.3,
  activationLineMin = 140,
  showItemLabels = false,
  showItemLabelsOnHover = false,
  labelAlignment = 'center',
}: FloatingSectionNavProps) {
  const [activeSectionId, setActiveSectionId] = useState(items[0]?.id ?? '');
  const observedItems = useMemo(
    () =>
      items.flatMap((item) => [
        { id: item.id, label: item.label, parentId: item.id, isChild: false },
        ...(item.children ?? []).map((child) => ({
          id: child.id,
          label: child.label,
          parentId: item.id,
          isChild: true,
        })),
      ]),
    [items],
  );

  useEffect(() => {
    if (observedItems.length === 0 || typeof window === 'undefined') {
      return;
    }

    const sections = observedItems
      .map(({ id }) => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section))
      .sort(
        (left, right) =>
          left.getBoundingClientRect().top + window.scrollY - (right.getBoundingClientRect().top + window.scrollY),
      );

    if (sections.length === 0) {
      return;
    }

    let animationFrame: number | null = null;

    const updateActiveSection = () => {
      animationFrame = null;

      const activationLine = Math.max(activationLineMin, window.innerHeight * activationLineRatio);
      const isNearPageTop = window.scrollY <= topThreshold;
      const isNearPageBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - bottomThreshold;

      let nextSectionId = sections[0].id;

      if (isNearPageTop) {
        setActiveSectionId((current) => (current === nextSectionId ? current : nextSectionId));
        return;
      }

      for (const section of sections) {
        if (section.getBoundingClientRect().top <= activationLine) {
          nextSectionId = section.id;
          continue;
        }

        break;
      }

      if (isNearPageBottom) {
        nextSectionId = sections[sections.length - 1].id;
      }

      setActiveSectionId((current) => (current === nextSectionId ? current : nextSectionId));
    };

    const scheduleUpdate = () => {
      if (animationFrame !== null) {
        return;
      }

      animationFrame = window.requestAnimationFrame(updateActiveSection);
    };

    setActiveSectionId(sections[0].id);
    scheduleUpdate();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }

      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
    };
  }, [activationLineMin, activationLineRatio, bottomThreshold, observedItems, topThreshold]);

  if (items.length === 0) {
    return null;
  }

  const usesLabelLayout = showItemLabels || showItemLabelsOnHover;
  const revealLabelsOnHover = showItemLabelsOnHover && !showItemLabels;
  const alignmentClass = showItemLabels
    ? usesLabelLayout && labelAlignment === 'right'
      ? 'items-end'
      : 'items-center'
    : revealLabelsOnHover && labelAlignment === 'right'
      ? 'items-center group-hover/nav:items-end group-focus-within/nav:items-end'
      : 'items-center';
  const textAlignmentClass = labelAlignment === 'right' ? 'text-right' : '';

  return (
    <nav aria-label="Page sections" className={`${className} ${revealLabelsOnHover ? 'group/nav' : ''}`}>
      <div
        className={`border border-[#e5e7eb] bg-white/92 shadow-lg shadow-slate-200/60 backdrop-blur transition-all duration-200 ${
          showItemLabels
            ? 'rounded-[28px] px-2.5 py-3'
            : revealLabelsOnHover
              ? 'rounded-[28px] px-2 py-3 group-hover/nav:px-2.5 group-focus-within/nav:px-2.5'
              : 'rounded-full px-2 py-3'
        }`}
      >
        <div className={`flex flex-col gap-3 ${alignmentClass}`}>
          {items.map((item) => {
            const hasActiveChild = item.children?.some((child) => child.id === activeSectionId) ?? false;
            const isActive = item.id === activeSectionId || hasActiveChild;
            const showChildren = isActive && (item.children?.length ?? 0) > 0;

            return (
              <div key={item.id} className={`flex flex-col ${alignmentClass}`}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={`#${item.id}`}
                      aria-label={item.label}
                      aria-current={isActive ? 'location' : undefined}
                      onClick={(event) => {
                        event.preventDefault();
                        document.getElementById(item.id)?.scrollIntoView({
                          behavior: 'smooth',
                          block: 'start',
                        });
                      }}
                      className={`block rounded-full transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/30 focus:ring-offset-2 ${
                        revealLabelsOnHover ? 'hover:scale-105 group-hover/nav:scale-100 group-focus-within/nav:scale-100' : ''
                      }`}
                    >
                      {showItemLabels ? (
                        <span
                          className={`block rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] ${
                            isActive
                              ? 'bg-[#1d4ed8] text-white shadow-[0_0_0_4px_rgba(29,78,216,0.12)]'
                              : 'bg-[#eff3f8] text-[#64748b] hover:bg-[#dbe7f4]'
                          } ${textAlignmentClass}`}
                        >
                          {item.label}
                        </span>
                      ) : revealLabelsOnHover ? (
                        <>
                          <span
                            className={`block rounded-full border transition-all duration-200 group-hover/nav:hidden group-focus-within/nav:hidden ${
                              isActive
                                ? 'h-5 w-5 border-[#1d4ed8] bg-[#1d4ed8] shadow-[0_0_0_4px_rgba(29,78,216,0.12)]'
                                : 'h-4 w-4 border-[#cbd5e1] bg-[#e2e8f0]'
                            }`}
                          />
                          <span
                            className={`hidden rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em] group-hover/nav:block group-focus-within/nav:block ${
                              isActive
                                ? 'bg-[#1d4ed8] text-white shadow-[0_0_0_4px_rgba(29,78,216,0.12)]'
                                : 'bg-[#eff3f8] text-[#64748b] hover:bg-[#dbe7f4]'
                            } ${textAlignmentClass}`}
                          >
                            {item.label}
                          </span>
                        </>
                      ) : (
                        <span
                          className={`block rounded-full border transition-all duration-200 ${
                            isActive
                              ? 'h-5 w-5 border-[#1d4ed8] bg-[#1d4ed8] shadow-[0_0_0_4px_rgba(29,78,216,0.12)]'
                              : 'h-4 w-4 border-[#cbd5e1] bg-[#e2e8f0]'
                          }`}
                        />
                      )}
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="left" sideOffset={12} className="px-3 py-2 text-xs">
                    {item.label}
                  </TooltipContent>
                </Tooltip>

                {item.children?.length ? (
                  <div
                    aria-hidden={!showChildren}
                    className={`flex flex-col gap-2 transition-all duration-200 ease-out ${
                      alignmentClass
                    } ${
                      showChildren
                        ? 'mt-2 max-h-80 translate-y-0 overflow-visible opacity-100'
                        : 'pointer-events-none max-h-0 -translate-y-1 overflow-hidden opacity-0'
                    }`}
                  >
                    {item.children.map((child) => {
                      const isChildActive = child.id === activeSectionId;

                      return (
                        <Tooltip key={child.id}>
                          <TooltipTrigger asChild>
                            <a
                              href={`#${child.id}`}
                              aria-label={child.label}
                              aria-current={isChildActive ? 'location' : undefined}
                              tabIndex={showChildren ? 0 : -1}
                              onClick={(event) => {
                                event.preventDefault();
                                document.getElementById(child.id)?.scrollIntoView({
                                  behavior: 'smooth',
                                  block: 'start',
                                });
                              }}
                              className={`block rounded-full transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#60a5fa]/30 focus:ring-offset-2 ${
                                showItemLabels
                                  ? 'hover:translate-x-[2px]'
                                  : revealLabelsOnHover
                                    ? 'hover:scale-105 group-hover/nav:scale-100 group-focus-within/nav:scale-100'
                                    : 'hover:scale-105'
                              }`}
                            >
                              {showItemLabels ? (
                                <span
                                  className={`block rounded-full px-3 py-1 text-[10px] font-semibold tracking-[0.12em] transition-all duration-200 ${
                                    isChildActive
                                      ? 'bg-[#60a5fa] text-white shadow-[0_0_0_3px_rgba(96,165,250,0.16)]'
                                      : 'bg-[#eaf2ff] text-[#5b7296] hover:bg-[#dbeafe]'
                                  } ${textAlignmentClass}`}
                                >
                                  {child.label}
                                </span>
                              ) : revealLabelsOnHover ? (
                                <>
                                  <span
                                    className={`block rounded-full border transition-all duration-200 group-hover/nav:hidden group-focus-within/nav:hidden ${
                                      isChildActive
                                        ? 'h-4 w-4 border-[#60a5fa] bg-[#60a5fa] shadow-[0_0_0_3px_rgba(96,165,250,0.16)]'
                                        : 'h-3.5 w-3.5 border-[#bfdbfe] bg-[#dbeafe]'
                                    }`}
                                  />
                                  <span
                                    className={`hidden rounded-full px-3 py-1 text-[10px] font-semibold tracking-[0.12em] transition-all duration-200 group-hover/nav:block group-focus-within/nav:block ${
                                      isChildActive
                                        ? 'bg-[#60a5fa] text-white shadow-[0_0_0_3px_rgba(96,165,250,0.16)]'
                                        : 'bg-[#eaf2ff] text-[#5b7296] hover:bg-[#dbeafe]'
                                    } ${textAlignmentClass}`}
                                  >
                                    {child.label}
                                  </span>
                                </>
                              ) : (
                                <span
                                  className={`block rounded-full border transition-all duration-200 ${
                                    isChildActive
                                      ? 'h-4 w-4 border-[#60a5fa] bg-[#60a5fa] shadow-[0_0_0_3px_rgba(96,165,250,0.16)]'
                                      : 'h-3.5 w-3.5 border-[#bfdbfe] bg-[#dbeafe]'
                                  }`}
                                />
                              )}
                            </a>
                          </TooltipTrigger>
                          <TooltipContent side="left" sideOffset={12} className="px-3 py-2 text-xs">
                            {child.label}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
