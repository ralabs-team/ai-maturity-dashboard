import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useSensitiveData } from '../privacy/SensitiveDataContext';
import SensitiveText from '../ui/SensitiveText';

export type CompactUsageMultiSelectProps = {
  placeholder: string;
  singularLabel: string;
  pluralLabel: string;
  searchPlaceholder: string;
  ariaLabel: string;
  options: string[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
};

export default function CompactUsageMultiSelect({
  placeholder,
  singularLabel,
  pluralLabel,
  searchPlaceholder,
  ariaLabel,
  options,
  selectedValues,
  onToggle,
  onClear,
}: CompactUsageMultiSelectProps) {
  const { isSensitiveDataHidden } = useSensitiveData();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredOptions = useMemo(
    () =>
      normalizedQuery.length === 0
        ? options
        : options.filter((option) => option.toLowerCase().includes(normalizedQuery)),
    [normalizedQuery, options],
  );
  const isActive = selectedValues.length > 0;
  const triggerLabel =
    selectedValues.length === 0
      ? placeholder
      : `${selectedValues.length} ${
          selectedValues.length === 1 ? singularLabel : pluralLabel
        }`;
  const shouldMaskOptionLabels =
    isSensitiveDataHidden && (placeholder === 'Team' || placeholder === 'Department');

  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [open]);

  return (
    <div
      ref={dropdownRef}
      className="relative w-full min-w-0 sm:w-auto sm:min-w-[180px] sm:max-w-[220px]"
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex h-12 w-full items-center justify-between gap-3 rounded-2xl border pl-4 pr-4 text-left text-sm font-medium outline-none transition-all focus:ring-[3px] focus:ring-[#b0b0b0]/20 sm:w-auto sm:min-w-[180px] sm:max-w-[220px] ${
          isActive
            ? 'border-[#cfe7dc] bg-[#f4fbf7] text-[#242424] shadow-[0_1px_2px_rgba(15,23,42,0.06)] focus:border-[#9fc8b4]'
            : 'border-[#e5e7eb] bg-white text-[#8b8b8b] focus:border-[#b0b0b0]'
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[#8b8b8b]" />
      </button>

      {open ? (
        <div className="absolute left-0 top-full z-20 mt-2 w-[260px] max-w-[calc(100vw-3rem)] rounded-2xl border border-[#e5e7eb] bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
          <div className="border-b border-[#f0f0f0] pb-2">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={searchPlaceholder}
              autoFocus
              className="h-10 w-full rounded-xl border border-[#e5e7eb] bg-white px-3 text-sm text-[#242424] outline-none transition-colors placeholder:text-[#a3a3a3] focus:border-[#b0b0b0] focus:ring-[3px] focus:ring-[#b0b0b0]/20"
            />
          </div>

          <div className="max-h-72 overflow-y-auto py-2">
            {filteredOptions.map((option) => {
              const isSelected = selectedValues.includes(option);

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => onToggle(option)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                    isSelected
                      ? 'bg-[#f4fbf7] text-[#242424]'
                      : 'text-[#3f3f46] hover:bg-[#f4f4f5]'
                  }`}
                  role="option"
                  aria-selected={isSelected}
                >
                  <div
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      isSelected ? 'border-[#1f6f54] bg-[#1f6f54]' : 'border-[#d4d4d4]'
                    }`}
                  >
                    {isSelected ? (
                      <svg
                        className="h-3 w-3 text-white"
                        viewBox="0 0 12 12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path d="M2 6l3 3 5-5" />
                      </svg>
                    ) : null}
                  </div>
                  <SensitiveText as="span" hidden={shouldMaskOptionLabels} className="truncate">
                    {option}
                  </SensitiveText>
                </button>
              );
            })}

            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-sm text-[#8b8b8b]">
                No matches for "{searchQuery.trim()}".
              </div>
            ) : null}
          </div>

          {selectedValues.length > 0 ? (
            <div className="border-t border-[#f0f0f0] pt-2">
              <button
                type="button"
                onClick={onClear}
                className="text-sm font-medium text-[#2f6f59] transition hover:text-[#1f5a47]"
              >
                Clear {placeholder.toLowerCase()}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
