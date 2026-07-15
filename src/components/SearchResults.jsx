import SearchResultCard from './SearchResultCard';
import './SearchResults.css';

const TABS = [
  { id: 'movie', label: 'Movies' },
  { id: 'tv', label: 'TV Shows' },
];

export default function SearchResults({
  activeTab,
  onTabChange,
  results,
  status,
  query,
  errorMessage,
}) {
  const showTabs = Boolean(query);

  return (
    <div className="search-results">
      {showTabs ? (
        <div className="search-results__tabs" role="tablist" aria-label="Search result type">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              className={
                'search-results__tab' +
                (activeTab === tab.id ? ' search-results__tab--active' : '')
              }
              aria-selected={activeTab === tab.id}
              onClick={() => onTabChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      ) : null}

      <div
        className="search-results__body"
        role="tabpanel"
        aria-live="polite"
        aria-busy={status === 'loading'}
      >
        {status === 'loading' ? (
          <p className="search-results__message">Searching for &ldquo;{query}&rdquo;&hellip;</p>
        ) : null}

        {status === 'error' ? (
          <p className="search-results__message search-results__message--error">
            {errorMessage || 'Something went wrong. Please try again.'}
          </p>
        ) : null}

        {status === 'success' && results.length === 0 ? (
          <p className="search-results__message">
            No results found for &ldquo;{query}&rdquo;.
          </p>
        ) : null}

        {status === 'success' && results.length > 0 ? (
          <ul className="search-results__grid">
            {results.map((item) => (
              <li key={`${item.mediaType}-${item.id}`}>
                <SearchResultCard title={item.title} posterUrl={item.posterUrl} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
