import './FilterChipGroup.css';

/**
 * Multi-select chip group for filter labels.
 * @param {object} props
 * @param {string[]} props.options
 * @param {string[]} props.selected
 * @param {(next: string[]) => void} props.onChange
 * @param {Set<string>|string[]} [props.disabledOptions] - options that cannot be toggled on
 * @param {string} [props.ariaLabel]
 */
export default function FilterChipGroup({
  options,
  selected,
  onChange,
  disabledOptions,
  ariaLabel = 'Filter options',
}) {
  const selectedSet = new Set(selected);
  const disabledSet =
    disabledOptions instanceof Set
      ? disabledOptions
      : new Set(disabledOptions ?? []);

  function toggle(option) {
    if (disabledSet.has(option) && !selectedSet.has(option)) {
      return;
    }

    if (selectedSet.has(option)) {
      onChange(selected.filter((item) => item !== option));
    } else {
      onChange([...selected, option]);
    }
  }

  return (
    <div className="filter-chip-group" role="group" aria-label={ariaLabel}>
      {options.map((option) => {
        const isSelected = selectedSet.has(option);
        const isDisabled = disabledSet.has(option) && !isSelected;
        let className = 'filter-chip-group__chip';
        if (isSelected) {
          className += ' filter-chip-group__chip--selected';
        }
        if (isDisabled) {
          className += ' filter-chip-group__chip--disabled';
        }

        return (
          <button
            key={option}
            type="button"
            className={className}
            aria-pressed={isSelected}
            disabled={isDisabled}
            onClick={() => toggle(option)}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
