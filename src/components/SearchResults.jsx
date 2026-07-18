import SearchResultCard from './SearchResultCard';
import './SearchResults.css';

export default function SearchResults({
  results,
  status,
  query,
  contextLabel,
  errorMessage,
  hideEmptyMessage = false,
  emptyHint = null,
  emptyAlternativeLabel = null,
  onEmptyAlternative = null,
}) {
  const loadingMessage = contextLabel
    ? `Searching by ${contextLabel} for “${query}”…`
    : `Searching for “${query}”…`;

  const emptyMessage = contextLabel
    ? `No ${contextLabel} results found for “${query}”.`
    : `No results found for “${query}”.`;

  const showEmpty = status === 'success' && results.length === 0;
  const showAlternative =
    showEmpty && emptyHint && (emptyAlternativeLabel ? Boolean(onEmptyAlternative) : true);

  return (
    <section className="search-results" aria-label="Search results">
      <div className="search-results__body" aria-live="polite" aria-busy={status === 'loading'}>
        {status === 'loading' ? (
          <p className="search-results__message">{loadingMessage}</p>
        ) : null}

        {status === 'error' ? (
          <p className="search-results__message search-results__message--error">
            {errorMessage || 'Something went wrong. Please try again.'}
          </p>
        ) : null}

        {showEmpty ? (
          <div className="search-results__empty">
            {!hideEmptyMessage ? (
              <p className="search-results__message">{emptyMessage}</p>
            ) : null}

            {showAlternative ? (
              <p className="search-results__hint">
                {emptyHint}
                {emptyAlternativeLabel && onEmptyAlternative ? (
                  <>
                    {' '}
                    <button
                      type="button"
                      className="search-results__alternative"
                      onClick={onEmptyAlternative}
                    >
                      {emptyAlternativeLabel}
                    </button>
                  </>
                ) : null}
              </p>
            ) : null}
          </div>
        ) : null}

        {status === 'success' && results.length > 0 ? (
          <ul className="search-results__grid">
            {results.map((item) => (
              <li key={`${item.mediaType}-${item.id}`}>
                <SearchResultCard
                  id={item.id}
                  title={item.title}
                  year={item.year}
                  posterUrl={item.posterUrl}
                />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
