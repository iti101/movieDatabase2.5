import { useEffect, useRef, useState } from 'react';
import './BrowseBy.css';

const BROWSE_OPTIONS = [
  { id: 'genre', label: 'Genre' },
  { id: 'actor', label: 'Actor/Actress' },
  { id: 'director', label: 'Director' },
  { id: 'release-date', label: 'Release date' },
];

function ChevronIcon({ open }) {
  return (
    <svg
      className={'browse-by__chevron' + (open ? ' browse-by__chevron--open' : '')}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BrowseBy({ onSelect, selectedId = null }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  function toggleMenu() {
    setOpen((prev) => !prev);
  }

  function handleOptionClick(option) {
    setOpen(false);
    if (!onSelect) {
      return;
    }

    // Clicking the active option clears the browse filter.
    if (selectedId === option.id) {
      onSelect(null);
      return;
    }

    onSelect(option);
  }

  return (
    <div className="browse-by" ref={containerRef}>
      <button
        type="button"
        className={
          'browse-by__trigger' + (selectedId ? ' browse-by__trigger--active' : '')
        }
        onClick={toggleMenu}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={selectedId ? `Browse by (${selectedId})` : 'Browse by'}
      >
        <ChevronIcon open={open} />
      </button>

      {open && (
        <div className="browse-by__menu">
          <p className="browse-by__label">Browse by...:</p>
          <ul className="browse-by__options" role="menu">
            {BROWSE_OPTIONS.map((option) => (
              <li key={option.id} role="none">
                <button
                  type="button"
                  className={
                    'browse-by__option' +
                    (selectedId === option.id ? ' browse-by__option--selected' : '')
                  }
                  role="menuitem"
                  aria-current={selectedId === option.id ? 'true' : undefined}
                  onClick={() => handleOptionClick(option)}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default BrowseBy;
