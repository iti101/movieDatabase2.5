import { useEffect, useMemo, useState } from 'react';
import FilterChipGroup from '../components/FilterChipGroup';
import PillButton from '../components/PillButton';
import SearchResultCard from '../components/SearchResultCard';
import { searchPeople } from '../services/tmdb';
import { getGenresForMediaPreference } from '../utils/genreSuggestions';
import { randomizeSuggestion } from '../utils/randomizeSuggestion';
import './SuggestPage.css';

const MEDIA_OPTIONS = [
  { id: 'movie', label: 'Movie' },
  { id: 'tv', label: 'TV show' },
  { id: 'any', label: 'Surprise me' },
];

const ACTOR_DEBOUNCE_MS = 350;

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
    return 'No idea what to watch? Hit Randomize for a surprise — or tweak the filters first.';
  }

  return `Looking for ${parts.join(', ')}. Hit Randomize whenever you’re ready.`;
}

export default function SuggestPage({ embedded = false }) {
  const [mediaType, setMediaType] = useState('any');
  const [includeGenres, setIncludeGenres] = useState([]);
  const [excludeGenres, setExcludeGenres] = useState([]);
  const [actorQuery, setActorQuery] = useState('');
  const [actorResults, setActorResults] = useState([]);
  const [actorStatus, setActorStatus] = useState('idle');
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [status, setStatus] = useState('idle');
  const [recommendation, setRecommendation] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

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
      setActorStatus('idle');
      return undefined;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setActorStatus('loading');
      try {
        const people = await searchPeople(trimmed);
        if (!cancelled) {
          setActorResults(people.slice(0, 6));
          setActorStatus('success');
        }
      } catch {
        if (!cancelled) {
          setActorResults([]);
          setActorStatus('error');
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
    setActorStatus('idle');
  }

  function handleClearPerson() {
    setSelectedPerson(null);
    setActorQuery('');
    setActorResults([]);
    setActorStatus('idle');
  }

  async function handleRandomize() {
    setStatus('loading');
    setErrorMessage('');

    try {
      const pick = await randomizeSuggestion({
        mediaType,
        includeGenres,
        excludeGenres,
        personId: selectedPerson?.id ?? null,
      });
      setRecommendation(pick);
      setStatus('success');
    } catch (error) {
      setRecommendation(null);
      setStatus('error');
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Something went wrong. Please try again.',
      );
    }
  }

  const subtitle = buildSubtitle({
    mediaType,
    includeGenres,
    excludeGenres,
    selectedPerson,
  });

  return (
    <div className={`suggest-page${embedded ? ' suggest-page--embedded' : ''}`}>
      <div className="suggest-page__content">
        <div className="suggest-page__header">
          <h2 className="suggest-page__title">Let us help</h2>
          <p className="suggest-page__subtitle">{subtitle}</p>
        </div>

        <section className="suggest-page__filters" aria-label="Suggestion filters">
          <div className="suggest-page__filter-block">
            <h3 className="suggest-page__filter-label">In the mood for</h3>
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
          </div>

          <div className="suggest-page__filter-block">
            <h3 className="suggest-page__filter-label">Want to see</h3>
            <FilterChipGroup
              options={genreOptions}
              selected={includeGenres}
              onChange={handleIncludeChange}
              disabledOptions={excludeGenres}
              ariaLabel="Genres you want"
            />
          </div>

          <div className="suggest-page__filter-block">
            <h3 className="suggest-page__filter-label">Don’t want</h3>
            <FilterChipGroup
              options={genreOptions}
              selected={excludeGenres}
              onChange={handleExcludeChange}
              disabledOptions={includeGenres}
              ariaLabel="Genres to avoid"
            />
          </div>

          <div className="suggest-page__filter-block">
            <h3 className="suggest-page__filter-label">Must star</h3>
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
                {selectedPerson || actorQuery ? (
                  <button
                    type="button"
                    className="suggest-page__actor-clear"
                    onClick={handleClearPerson}
                    aria-label="Clear actor filter"
                  >
                    Clear
                  </button>
                ) : null}
              </div>

              {!selectedPerson && actorStatus === 'loading' ? (
                <p className="suggest-page__actor-status">Searching…</p>
              ) : null}

              {!selectedPerson && actorStatus === 'error' ? (
                <p className="suggest-page__actor-status suggest-page__actor-status--error">
                  Couldn’t search people. Try again.
                </p>
              ) : null}

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

              {selectedPerson ? (
                <p className="suggest-page__actor-selected">
                  Filtering by {selectedPerson.title}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <PillButton
          className="suggest-page__randomize"
          onClick={handleRandomize}
          disabled={status === 'loading'}
        >
          {status === 'loading' ? 'Finding something…' : 'Randomize'}
        </PillButton>

        <div className="suggest-page__result" aria-live="polite">
          {status === 'error' ? (
            <p className="suggest-page__message suggest-page__message--error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          {status === 'success' && recommendation ? (
            <div className="suggest-page__card-wrap">
              <p className="suggest-page__result-label">
                How about this{' '}
                {recommendation.mediaType === 'tv' ? 'TV show' : 'movie'}?
              </p>
              <SearchResultCard
                id={recommendation.id}
                title={recommendation.title}
                year={recommendation.year}
                posterUrl={recommendation.posterUrl}
                mediaType={recommendation.mediaType}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
