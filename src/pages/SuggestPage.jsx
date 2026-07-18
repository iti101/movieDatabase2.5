import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FilterChipGroup from '../components/FilterChipGroup';
import Footer from '../components/Footer';
import PillButton from '../components/PillButton';
import SearchResultCard from '../components/SearchResultCard';
import { searchPeople } from '../services/tmdb';
import { getGenresForMediaPreference } from '../utils/genreSuggestions';
import { randomizeSuggestion } from '../utils/randomizeSuggestion';
import './SuggestPage.css';

function SmileIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9"
        className="suggest-page__face-fill"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="9" cy="10" r="1.1" fill="currentColor" />
      <circle cx="15" cy="10" r="1.1" fill="currentColor" />
      <path
        d="M8.5 14c1.1 1.4 2.5 2.1 3.5 2.1s2.4-.7 3.5-2.1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SadIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="9"
        className="suggest-page__face-fill"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="9" cy="10" r="1.1" fill="currentColor" />
      <circle cx="15" cy="10" r="1.1" fill="currentColor" />
      <path
        d="M8.5 16.5c1.1-1.4 2.5-2.1 3.5-2.1s2.4.7 3.5 2.1"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

const MEDIA_OPTIONS = [
  { id: 'movie', label: 'Movie' },
  { id: 'tv', label: 'TV show' },
  { id: 'any', label: 'Surprise me' },
];

const FILTER_TABS = [
  { id: 'mood', label: 'Mood', heading: "I'm in the mood for…" },
  { id: 'want', label: 'Want', heading: 'I DO want to see…' },
  { id: 'dont', label: "Don't want", heading: "I definitely DON'T want to see…" },
  { id: 'star', label: 'Must star', heading: 'Must star…' },
];

const ACTOR_DEBOUNCE_MS = 350;

function mediaTypeLabel(mediaType) {
  if (mediaType === 'movie') {
    return 'Movie';
  }
  if (mediaType === 'tv') {
    return 'TV show';
  }
  return 'Surprise me';
}

function summarizeList(items, emptyLabel) {
  if (items.length === 0) {
    return emptyLabel;
  }
  if (items.length <= 2) {
    return items.join(', ');
  }
  return `${items.length} selected`;
}

function buildSubtitle({ mediaType, includeGenres, excludeGenres, selectedPerson }) {
  const parts = [];

  if (mediaType === 'movie') {
    parts.push('movies');
  } else if (mediaType === 'tv') {
    parts.push('TV shows');
  }

  if (includeGenres.length > 0) {
    parts.push(`in ${includeGenres.join(', ')}`);
  }

  if (excludeGenres.length > 0) {
    parts.push(`skipping ${excludeGenres.join(', ')}`);
  }

  if (selectedPerson) {
    parts.push(`starring ${selectedPerson.title}`);
  }

  if (parts.length === 0) {
    return (
      <>
        No idea what to watch?
        <br />
        Hit Randomize for a surprise — or tweak the filters first.
      </>
    );
  }

  return `Looking for ${parts.join(', ')}. Hit Randomize whenever you’re ready.`;
}

function countActiveFilters({ mediaType, includeGenres, excludeGenres, selectedPerson }) {
  let count = 0;
  if (mediaType !== 'any') {
    count += 1;
  }
  count += includeGenres.length;
  count += excludeGenres.length;
  if (selectedPerson) {
    count += 1;
  }
  return count;
}

export default function SuggestPage({ embedded = false }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('mood');
  const [mediaType, setMediaType] = useState('any');
  const [includeGenres, setIncludeGenres] = useState([]);
  const [excludeGenres, setExcludeGenres] = useState([]);
  const [actorQuery, setActorQuery] = useState('');
  const [actorResults, setActorResults] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState(null);
  const [fallbackMessage, setFallbackMessage] = useState('');
  const [filtersAccordionOpen, setFiltersAccordionOpen] = useState(true);

  const genreOptions = useMemo(
    () => getGenresForMediaPreference(mediaType),
    [mediaType],
  );

  // Drop selections that are no longer available for the media type
  useEffect(() => {
    const available = new Set(genreOptions);
    setIncludeGenres((prev) => prev.filter((g) => available.has(g)));
    setExcludeGenres((prev) => prev.filter((g) => available.has(g)));
  }, [genreOptions]);

  useEffect(() => {
    if (selectedPerson) {
      return undefined;
    }

    const trimmed = actorQuery.trim();
    if (trimmed.length < 2) {
      setActorResults([]);
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const people = await searchPeople(trimmed);
        if (!cancelled) {
          setActorResults(people.slice(0, 6));
        }
      } catch {
        if (!cancelled) {
          setActorResults([]);
        }
      }
    }, ACTOR_DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [actorQuery, selectedPerson]);

  function handleIncludeChange(next) {
    setIncludeGenres(next);
    setExcludeGenres((prev) => prev.filter((g) => !next.includes(g)));
  }

  function handleExcludeChange(next) {
    setExcludeGenres(next);
    setIncludeGenres((prev) => prev.filter((g) => !next.includes(g)));
  }

  function handleSelectPerson(person) {
    setSelectedPerson(person);
    setActorQuery(person.title);
    setActorResults([]);
  }

  async function handleRandomize() {
    setStatus('loading');
    setErrorMessage('');
    setFallbackMessage('');

    try {
      const { item, fallbackMessage: note } = await randomizeSuggestion({
        mediaType,
        includeGenres,
        excludeGenres,
        personId: selectedPerson?.id ?? null,
        personName: selectedPerson?.title ?? null,
      });
      setResult(item);
      setFallbackMessage(note ?? '');
      setStatus('idle');
    } catch (error) {
      setResult(null);
      setFallbackMessage('');
      setStatus('error');
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.',
      );
    }
  }

  function handleAcceptResult() {
    if (!result) {
      return;
    }
    const path =
      result.mediaType === 'tv' ? `/tv/${result.id}` : `/movie/${result.id}`;
    navigate(path);
  }

  const subtitle = buildSubtitle({
    mediaType,
    includeGenres,
    excludeGenres,
    selectedPerson,
  });

  const activeFilterTab = FILTER_TABS.find((tab) => tab.id === activeTab) ?? FILTER_TABS[0];

  const tabBadges = {
    mood: mediaTypeLabel(mediaType),
    want: summarizeList(includeGenres, 'Any'),
    dont: summarizeList(excludeGenres, 'None'),
    star: selectedPerson?.title ?? 'Anyone',
  };

  const activeFilterCount = countActiveFilters({
    mediaType,
    includeGenres,
    excludeGenres,
    selectedPerson,
  });

  const filterSummaryRows = [
    {
      id: 'mood',
      label: 'Mood',
      value: mediaTypeLabel(mediaType),
      filled: mediaType !== 'any',
    },
    {
      id: 'want',
      label: 'Want',
      value: includeGenres.length > 0 ? includeGenres.join(', ') : 'Any genre',
      filled: includeGenres.length > 0,
    },
    {
      id: 'dont',
      label: "Don't want",
      value: excludeGenres.length > 0 ? excludeGenres.join(', ') : 'Nothing excluded',
      filled: excludeGenres.length > 0,
    },
    {
      id: 'star',
      label: 'Must star',
      value: selectedPerson?.title ?? 'Anyone',
      filled: Boolean(selectedPerson),
    },
  ];

  function handleTabKeyDown(event) {
    const currentIndex = FILTER_TABS.findIndex((tab) => tab.id === activeTab);
    if (currentIndex < 0) {
      return;
    }

    let nextIndex = currentIndex;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (currentIndex + 1) % FILTER_TABS.length;
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (currentIndex - 1 + FILTER_TABS.length) % FILTER_TABS.length;
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = FILTER_TABS.length - 1;
    } else {
      return;
    }

    event.preventDefault();
    const nextTabId = FILTER_TABS[nextIndex].id;
    setActiveTab(nextTabId);
    document.getElementById(`suggest-tab-${nextTabId}`)?.focus();
  }

  return (
    <div className={`suggest-page${embedded ? ' suggest-page--embedded' : ''}`}>
      <div className="suggest-page__content">
        <div className="suggest-page__header">
          <h1 className="suggest-page__title">Let us help</h1>
          <p className="suggest-page__subtitle">{subtitle}</p>
        </div>

        <div className="suggest-page__filters">
          <div className="suggest-page__tabs-scroll">
            <div
              className="suggest-page__tabs"
              role="tablist"
              aria-label="Suggestion filters"
              onKeyDown={handleTabKeyDown}
            >
              {FILTER_TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                let className = 'suggest-page__tab';
                if (isActive) {
                  className += ' suggest-page__tab--active';
                }
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    id={`suggest-tab-${tab.id}`}
                    className={className}
                    aria-selected={isActive}
                    aria-controls={`suggest-panel-${tab.id}`}
                    tabIndex={isActive ? 0 : -1}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <span className="suggest-page__tab-label">{tab.label}</span>
                    <span className="suggest-page__tab-badge">{tabBadges[tab.id]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <h2 className="suggest-page__panel-heading">{activeFilterTab.heading}</h2>

          <div
            id={`suggest-panel-${activeFilterTab.id}`}
            role="tabpanel"
            aria-labelledby={`suggest-tab-${activeFilterTab.id}`}
            className="suggest-page__panel"
          >
            {activeFilterTab.id === 'mood' ? (
              <div className="suggest-page__media-toggle" role="group" aria-label="Media type">
                {MEDIA_OPTIONS.map((option) => {
                  let className = 'suggest-page__media-btn';
                  if (mediaType === option.id) {
                    className += ' suggest-page__media-btn--active';
                  }
                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={className}
                      aria-pressed={mediaType === option.id}
                      onClick={() => setMediaType(option.id)}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            ) : null}

            {activeFilterTab.id === 'want' ? (
              <FilterChipGroup
                options={genreOptions}
                selected={includeGenres}
                onChange={handleIncludeChange}
                disabledOptions={excludeGenres}
                ariaLabel="Genres you want"
              />
            ) : null}

            {activeFilterTab.id === 'dont' ? (
              <FilterChipGroup
                options={genreOptions}
                selected={excludeGenres}
                onChange={handleExcludeChange}
                disabledOptions={includeGenres}
                ariaLabel="Genres to avoid"
              />
            ) : null}

            {activeFilterTab.id === 'star' ? (
              <div className="suggest-page__actor">
                <div className="suggest-page__actor-field">
                  <input
                    type="search"
                    className="suggest-page__actor-input"
                    placeholder="Actor or actress (optional)"
                    value={actorQuery}
                    onChange={(event) => {
                      setActorQuery(event.target.value);
                      if (selectedPerson) {
                        setSelectedPerson(null);
                      }
                    }}
                    aria-label="Search for an actor or actress"
                    autoComplete="off"
                  />
                </div>

                {!selectedPerson && actorResults.length > 0 ? (
                  <ul className="suggest-page__actor-results" role="listbox">
                    {actorResults.map((person) => (
                      <li key={person.id}>
                        <button
                          type="button"
                          className="suggest-page__actor-result"
                          role="option"
                          onClick={() => handleSelectPerson(person)}
                        >
                          <img
                            className="suggest-page__actor-photo"
                            src={person.posterUrl}
                            alt=""
                            loading="lazy"
                            decoding="async"
                          />
                          <span>{person.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="suggest-page__filter-summary">
            <button
              type="button"
              className="suggest-page__filter-summary-toggle"
              aria-expanded={filtersAccordionOpen}
              aria-controls="suggest-filter-summary-panel"
              id="suggest-filter-summary-toggle"
              onClick={() => setFiltersAccordionOpen((open) => !open)}
            >
              <span className="suggest-page__filter-summary-title">
                Selected filters
                <span className="suggest-page__filter-summary-count">
                  {activeFilterCount === 0
                    ? ' · defaults'
                    : ` · ${activeFilterCount} set`}
                </span>
              </span>
              <span
                className={
                  filtersAccordionOpen
                    ? 'suggest-page__filter-summary-chevron suggest-page__filter-summary-chevron--open'
                    : 'suggest-page__filter-summary-chevron'
                }
                aria-hidden="true"
              />
            </button>

            {filtersAccordionOpen ? (
              <div
                id="suggest-filter-summary-panel"
                role="region"
                aria-labelledby="suggest-filter-summary-toggle"
                className="suggest-page__filter-summary-panel"
              >
                <p className="suggest-page__filter-summary-hint">
                  The randomizer will pick from titles matching these filters.
                </p>
                <dl className="suggest-page__filter-summary-list">
                  {filterSummaryRows.map((row) => (
                    <div
                      key={row.id}
                      className={
                        row.filled
                          ? 'suggest-page__filter-summary-row suggest-page__filter-summary-row--filled'
                          : 'suggest-page__filter-summary-row'
                      }
                    >
                      <dt>{row.label}</dt>
                      <dd>{row.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </div>
        </div>

        <div
          className={
            result
              ? 'suggest-page__action suggest-page__action--revealed'
              : 'suggest-page__action'
          }
        >
          <PillButton
            className="suggest-page__randomize"
            onClick={handleRandomize}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Finding something…' : 'Randomize'}
          </PillButton>

          {status === 'error' && errorMessage ? (
            <p className="suggest-page__message suggest-page__message--error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          {result && fallbackMessage ? (
            <p className="suggest-page__message suggest-page__message--fallback" role="status">
              {fallbackMessage}
            </p>
          ) : null}

          {result ? (
            <div className="suggest-page__result" aria-live="polite">
              <button
                type="button"
                className="suggest-page__reaction suggest-page__reaction--reject"
                onClick={handleRandomize}
                disabled={status === 'loading'}
                aria-label="Not this one — get another suggestion"
              >
                <SadIcon />
              </button>

              <div className="suggest-page__result-card">
                <SearchResultCard
                  id={result.id}
                  title={result.title}
                  year={result.year}
                  posterUrl={result.posterUrl}
                  mediaType={result.mediaType}
                />
              </div>

              <button
                type="button"
                className="suggest-page__reaction suggest-page__reaction--accept"
                onClick={handleAcceptResult}
                aria-label={`Open details for ${result.title}`}
              >
                <SmileIcon />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {!embedded ? <Footer /> : null}
    </div>
  );
}
