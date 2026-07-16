import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FilterChipGroup from '../components/FilterChipGroup';
import PillButton from '../components/PillButton';
import SearchResultCard from '../components/SearchResultCard';
import { searchPeople } from '../services/tmdb';
import { getGenresForMediaPreference } from '../utils/genreSuggestions';
import { randomizeSuggestion } from '../utils/randomizeSuggestion';
import './SuggestPage.css';

function SmileIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" fill="#ffffff" stroke="currentColor" strokeWidth="1.75" />
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
      <circle cx="12" cy="12" r="9" fill="#ffffff" stroke="currentColor" strokeWidth="1.75" />
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

const ACCORDION_SECTIONS = [
  { id: 'mood', label: "I'm in the mood for…" },
  { id: 'want', label: 'I DO want to see…' },
  { id: 'dont', label: "I definitely DON'T want to see…" },
  { id: 'star', label: 'Must star…' },
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
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState('mood');
  const [mediaType, setMediaType] = useState('any');
  const [includeGenres, setIncludeGenres] = useState([]);
  const [excludeGenres, setExcludeGenres] = useState([]);
  const [actorQuery, setActorQuery] = useState('');
  const [actorResults, setActorResults] = useState([]);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [result, setResult] = useState(null);

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

  function toggleSection(sectionId) {
    setOpenSection((current) => (current === sectionId ? null : sectionId));
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
      setResult(pick);
      setStatus('idle');
    } catch (error) {
      setResult(null);
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

  return (
    <div className={`suggest-page${embedded ? ' suggest-page--embedded' : ''}`}>
      <div className="suggest-page__content">
        <div className="suggest-page__header">
          <h1 className="suggest-page__title">Let us help</h1>
          <p className="suggest-page__subtitle">{subtitle}</p>
        </div>

        <div className="suggest-page__accordion" aria-label="Suggestion filters">
          {ACCORDION_SECTIONS.map((section) => {
            const isOpen = openSection === section.id;
            const panelId = `suggest-panel-${section.id}`;
            const headerId = `suggest-header-${section.id}`;

            return (
              <div
                key={section.id}
                className={`suggest-page__accordion-item${isOpen ? ' suggest-page__accordion-item--open' : ''}`}
              >
                <h2 className="suggest-page__accordion-heading">
                  <button
                    type="button"
                    id={headerId}
                    className="suggest-page__accordion-trigger"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggleSection(section.id)}
                  >
                    <span>{section.label}</span>
                    <span className="suggest-page__accordion-icon" aria-hidden="true" />
                  </button>
                </h2>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={headerId}
                  className="suggest-page__accordion-panel"
                  hidden={!isOpen}
                >
                  {section.id === 'mood' ? (
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

                  {section.id === 'want' ? (
                    <FilterChipGroup
                      options={genreOptions}
                      selected={includeGenres}
                      onChange={handleIncludeChange}
                      disabledOptions={excludeGenres}
                      ariaLabel="Genres you want"
                    />
                  ) : null}

                  {section.id === 'dont' ? (
                    <FilterChipGroup
                      options={genreOptions}
                      selected={excludeGenres}
                      onChange={handleExcludeChange}
                      disabledOptions={includeGenres}
                      ariaLabel="Genres to avoid"
                    />
                  ) : null}

                  {section.id === 'star' ? (
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
              </div>
            );
          })}
        </div>

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
                asLink={false}
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
  );
}
