import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

type SearchableMultiSelectProps = {
  placeholder: string;
  singularLabel: string;
  pluralLabel: string;
  searchPlaceholder: string;
  ariaLabel: string;
  options: string[];
  selectedValues: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
  containerClassName?: string;
  triggerClassName?: string;
  dropdownClassName?: string;
  searchInputClassName?: string;
  clearButtonClassName?: string;
  emptyStateClassName?: string;
  renderOptionLeading?: (option: string) => ReactNode;
  renderOptionLabel?: (option: string) => ReactNode;
  renderOptionTrailing?: (option: string) => ReactNode;
};

const DEFAULT_TRIGGER_CLASSNAME =
  'flex h-12 w-full items-center justify-between gap-3 rounded-2xl border border-[#e5e7eb] bg-white pl-4 pr-4 text-left text-sm font-medium text-[#8b8b8b] outline-none transition-all focus:border-[#b0b0b0] focus:ring-[3px] focus:ring-[#b0b0b0]/20 sm:w-auto sm:min-w-[180px] sm:max-w-[220px]';
const DEFAULT_ACTIVE_TRIGGER_CLASSNAME =
  'border-[#cfe7dc] bg-[#f4fbf7] text-[#242424] shadow-[0_1px_2px_rgba(15,23,42,0.06)] focus:border-[#9fc8b4]';
const DEFAULT_DROPDOWN_CLASSNAME =
  'absolute right-0 top-full z-20 mt-2 w-[260px] max-w-[calc(100vw-3rem)] rounded-2xl border border-[#e5e7eb] bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)]';
const DEFAULT_SEARCH_INPUT_CLASSNAME =
  'h-10 w-full rounded-xl border border-[#e5e7eb] bg-white px-3 text-sm text-[#242424] outline-none transition-colors placeholder:text-[#a3a3a3] focus:border-[#b0b0b0] focus:ring-[3px] focus:ring-[#b0b0b0]/20';
const DEFAULT_CLEAR_BUTTON_CLASSNAME =
  'text-sm font-medium text-[#2f6f59] transition hover:text-[#1f5a47]';
const DEFAULT_EMPTY_STATE_CLASSNAME = 'px-3 py-4 text-sm text-[#8b8b8b]';

export default function SearchableMultiSelect({
  placeholder,
  singularLabel,
  pluralLabel,
  searchPlaceholder,
  ariaLabel,
  options,
  selectedValues,
  onToggle,
  onClear,
  containerClassName = 'relative',
  triggerClassName = DEFAULT_TRIGGER_CLASSNAME,
  dropdownClassName = DEFAULT_DROPDOWN_CLASSNAME,
  searchInputClassName = DEFAULT_SEARCH_INPUT_CLASSNAME,
  clearButtonClassName = DEFAULT_CLEAR_BUTTON_CLASSNAME,
  emptyStateClassName = DEFAULT_EMPTY_STATE_CLASSNAME,
  renderOptionLeading,
  renderOptionLabel,
  renderOptionTrailing,
}: SearchableMultiSelectProps) {
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
  const closeDropdown = () => {
    setOpen(false);
    setSearchQuery('');
  };
  const isActive = selectedValues.length > 0;
  const triggerLabel =
    selectedValues.length === 0
      ? placeholder
      : `${selectedValues.length} ${
          selectedValues.length === 1 ? singularLabel : pluralLabel
        }`;

  useEffect(() => {
    if (!open) {
      return;
    }

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setOpen(false);
        setSearchQuery('');
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
    <div ref={dropdownRef} className={containerClassName}>
      <button
        type="button"
        onClick={() => {
          if (open) {
            closeDropdown();
            return;
          }

          setOpen(true);
        }}
        className={`${triggerClassName} ${isActive ? DEFAULT_ACTIVE_TRIGGER_CLASSNAME : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[#8b8b8b]" />
      </button>

      {open ? (
        <div className={dropdownClassName}>
          <div className="border-b border-[#f0f0f0] pb-2">
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={searchPlaceholder}
              autoFocus
              className={searchInputClassName}
            />
          </div>

          <div className="max-h-72 overflow-y-auto py-2" role="listbox" aria-multiselectable="true">
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
                  {renderOptionLeading ? renderOptionLeading(option) : null}
                  {renderOptionLabel ? (
                    renderOptionLabel(option)
                  ) : (
                    <span className="min-w-0 flex-1 truncate">{option}</span>
                  )}
                  {renderOptionTrailing ? renderOptionTrailing(option) : null}
                </button>
              );
            })}

            {filteredOptions.length === 0 ? (
              <div className={emptyStateClassName}>No matches for "{searchQuery.trim()}".</div>
            ) : null}
          </div>

          {selectedValues.length > 0 ? (
            <div className="border-t border-[#f0f0f0] pt-2">
              <button type="button" onClick={onClear} className={clearButtonClassName}>
                Clear {placeholder.toLowerCase()}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
