import { useState } from 'react';
import BrowseBy from './BrowseBy';
import PillButton from './PillButton';
import './SearchBar.css';

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M20 20l-3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchBar({
  placeholder = 'Search for a movie...',
  onSearch,
  onChange,
  onBrowseSelect,
  browseSelectedId = null,
  defaultValue = '',
  value,
}) {
  const isControlled = value !== undefined;
  const [uncontrolledQuery, setUncontrolledQuery] = useState(defaultValue);
  const query = isControlled ? value : uncontrolledQuery;

  function handleInputChange(event) {
    const next = event.target.value;

    if (!isControlled) {
      setUncontrolledQuery(next);
    }

    onChange?.(next);
  }

  function handleSubmit(event) {
    event.preventDefault();

    const trimmed = query.trim();
    if (onSearch) {
      onSearch(trimmed);
    }
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-bar__field">
        <span className="search-bar__icon" aria-hidden="true">
          <SearchIcon />
        </span>

        <input
          type="search"
          className="search-bar__input"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          dir="ltr"
          spellCheck={false}
          autoComplete="off"
          aria-label="Search for a movie"
        />

        <PillButton type="submit" className="search-bar__submit">
          Search
        </PillButton>
      </div>

      {onBrowseSelect && (
        <BrowseBy onSelect={onBrowseSelect} selectedId={browseSelectedId} />
      )}
    </form>
  );
}

export default SearchBar;
