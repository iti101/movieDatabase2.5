import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DidYouMean from '../components/DidYouMean';
import GenreSuggestions from '../components/GenreSuggestions';
import PillButton from '../components/PillButton';
import SearchBar from '../components/SearchBar';
import SearchResults from '../components/SearchResults';
import { searchByBrowseMode } from '../services/tmdb';
import { getAllGenres, getGenresForMediaPreference, pickRandomGenres } from '../utils/genreSuggestions';
import { findSearchSuggestion, getEmptySearchGuidance } from '../utils/searchSuggestion';
import './SearchPage.css';

const ACTOR_BROWSE_OPTION = { id: 'actor', label: 'Actor/Actress' };

function getInitialActorSearch(location) {
  const actor = location.state?.actorSearch;
  if (!actor?.name) {
    return null;
  }
  return {
    id: actor.id ?? null,
    name: String(actor.name).trim(),
  };
}

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

const MEDIA_OPTIONS = [
  { id: 'movie', label: 'Movies' },
  { id: 'tv', label: 'Series' },
];

function getBrowsePlaceholder(label) {
  const term = label.toLowerCase();
  const article = /^[aeiou]/.test(term) ? 'an' : 'a';
  return `Search for ${article} ${term}...`;
}

function getSearchContextLabel(browseOption) {
  if (!browseOption) {
    return null;
  }

  switch (browseOption.id) {
    case 'genre':
      return 'genre';
    case 'actor':
      return 'actor/actress';
    case 'director':
      return 'director';
    case 'release-date':
      return 'release year';
    default:
      return browseOption.label.toLowerCase();
  }
}

export default function SearchPage({ embedded = false, onLetUsHelp }) {
  const navigate = useNavigate();
  const location = useLocation();
  const initialActor = getInitialActorSearch(location);

  const [browseOption, setBrowseOption] = useState(
    initialActor ? ACTOR_BROWSE_OPTION : null,
  );
  const [mediaType, setMediaType] = useState('movie');
  const [genreSuggestions, setGenreSuggestions] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [inputValue, setInputValue] = useState(initialActor?.name ?? '');
  const [activeQuery, setActiveQuery] = useState(initialActor?.name ?? '');
  const [personId, setPersonId] = useState(initialActor?.id ?? null);
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [suggestion, setSuggestion] = useState(null);

  const browseMode = browseOption?.id ?? null;
  const isActive = Boolean(activeQuery) || (browseMode === 'genre' && Boolean(selectedGenre));
  const searchLabel = activeQuery || selectedGenre || '';

  useEffect(() => {
    const shouldSearch =
      Boolean(activeQuery) || (browseMode === 'genre' && Boolean(selectedGenre));

    if (!shouldSearch) {
      return undefined;
    }

    let cancelled = false;

    async function load() {
      setStatus('loading');
      setErrorMessage('');
      setResults([]);
      setSuggestion(null);

      try {
        const data = await searchByBrowseMode(activeQuery || selectedGenre, browseOption, {
          selectedGenre,
          personId: browseMode === 'actor' ? personId : null,
          mediaType,
        });

        if (cancelled) {
          return;
        }

        // Keep people results for actor/director browse; otherwise enforce media type.
        const filtered =
          browseMode === 'actor' || browseMode === 'director'
            ? data
            : data.filter((item) => item.mediaType === mediaType);

        setResults(filtered);
        setStatus('success');

        if (filtered.length === 0 && activeQuery) {
          const closest = await findSearchSuggestion(activeQuery, {
            hasResults: false,
            browseMode,
            mediaType,
          });
          if (!cancelled) {
            setSuggestion(closest);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setResults([]);
          setSuggestion(null);
          setStatus('error');
          setErrorMessage(
            error instanceof Error ? error.message : 'Something went wrong. Please try again.',
          );
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [activeQuery, browseOption, browseMode, selectedGenre, personId, mediaType]);

  useEffect(() => {
    if (browseMode !== 'genre') {
      return;
    }

    const availableGenres = getGenresForMediaPreference(mediaType);

    if (selectedGenre && !availableGenres.includes(selectedGenre)) {
      setSelectedGenre(null);
      setActiveQuery('');
      setInputValue('');
      setResults([]);
      setSuggestion(null);
      setStatus('idle');
      setGenreSuggestions(pickRandomGenres(8, mediaType));
      return;
    }

    if (!selectedGenre && genreSuggestions.length > 0) {
      const showingAll = genreSuggestions.length >= availableGenres.length;
      setGenreSuggestions(
        showingAll ? getAllGenres(mediaType) : pickRandomGenres(8, mediaType),
      );
    }
    // Only refresh genre chips when the Movies/Series toggle changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [mediaType]);

  function handleSearch(query) {
    setGenreSuggestions([]);
    setPersonId(null);

    if (!query) {
      setInputValue('');
      setActiveQuery('');
      setSelectedGenre(null);
      setResults([]);
      setSuggestion(null);
      setStatus('idle');
      setErrorMessage('');
      return;
    }

    setInputValue(query);
    setActiveQuery(query);

    if (browseMode === 'genre') {
      setSelectedGenre(query);
    }
  }

  function handleSuggestionSelect(nextQuery) {
    setPersonId(null);
    setInputValue(nextQuery);
    setActiveQuery(nextQuery);
    setSuggestion(null);

    if (browseMode === 'genre') {
      setSelectedGenre(nextQuery);
    }
  }

  function handleBrowse(option) {
    setPersonId(null);

    if (!option) {
      setBrowseOption(null);
      setSelectedGenre(null);
      setGenreSuggestions([]);
      setActiveQuery('');
      setInputValue('');
      setResults([]);
      setSuggestion(null);
      setStatus('idle');
      setErrorMessage('');
      return;
    }

    setBrowseOption(option);
    setSelectedGenre(null);
    setActiveQuery('');
    setInputValue('');
    setResults([]);
    setSuggestion(null);
    setStatus('idle');
    setErrorMessage('');

    if (option.id === 'genre') {
      setGenreSuggestions(pickRandomGenres(8, mediaType));
    } else {
      setGenreSuggestions([]);
    }
  }

  function handleGenreSelect(genre) {
    setSelectedGenre(genre);
    setInputValue(genre);
    setActiveQuery(genre);
    setGenreSuggestions([]);
    setSuggestion(null);
  }

  function handleAllGenres() {
    setSelectedGenre(null);
    setGenreSuggestions(getAllGenres(mediaType));
  }

  function handleSearchTitlesInstead() {
    const query = activeQuery || selectedGenre || inputValue;
    setBrowseOption(null);
    setSelectedGenre(null);
    setGenreSuggestions([]);
    setPersonId(null);
    setSuggestion(null);
    setErrorMessage('');

    if (!query) {
      setInputValue('');
      setActiveQuery('');
      setResults([]);
      setStatus('idle');
      return;
    }

    setInputValue(query);
    setActiveQuery(query);
  }

  function handleSearchTitlesInstead() {
    const query = activeQuery || selectedGenre || inputValue;
    setBrowseOption(null);
    setSelectedGenre(null);
    setGenreSuggestions([]);
    setPersonId(null);
    setSuggestion(null);
    setErrorMessage('');

    if (!query) {
      setInputValue('');
      setActiveQuery('');
      setResults([]);
      setStatus('idle');
      return;
    }

    setInputValue(query);
    setActiveQuery(query);
  }

  function handleHelp() {
    if (onLetUsHelp) {
      onLetUsHelp();
      return;
    }

    navigate('/suggest');
  }

  const placeholder = selectedGenre
    ? getBrowsePlaceholder(selectedGenre)
    : browseOption
      ? getBrowsePlaceholder(browseOption.label)
      : mediaType === 'movie'
        ? 'Search for a movie...'
        : 'Search for a series...';

  const contextLabel = getSearchContextLabel(browseOption);
  const emptyGuidance = getEmptySearchGuidance(browseMode);

  const pageClassName = [
    'search-page',
    embedded ? 'search-page--embedded' : '',
    isActive ? 'search-page--active' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={pageClassName}>
      <div className="search-page__content">
        <div className="search-page__top">
          <h2 className="search-page__title">
            <span>Search</span>
            <span className="search-page__media-toggle" role="group" aria-label="Media type">
              {MEDIA_OPTIONS.map((option) => {
                let className = 'search-page__media-btn';
                if (mediaType === option.id) {
                  className += ' search-page__media-btn--active';
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
            </span>
          </h2>
          <div className="search-page__search-field">
            <SearchBar
              value={inputValue}
              onChange={setInputValue}
              onSearch={handleSearch}
              onBrowseSelect={handleBrowse}
              browseSelectedId={browseOption?.id ?? null}
              placeholder={placeholder}
            />
            <div className="search-page__below-bar">
              {suggestion ? (
                <DidYouMean
                  query={activeQuery}
                  suggestion={suggestion}
                  onSelect={handleSuggestionSelect}
                />
              ) : null}

              {!suggestion && browseOption?.id === 'genre' && genreSuggestions.length > 0 ? (
                <GenreSuggestions
                  suggestions={genreSuggestions}
                  onSelect={handleGenreSelect}
                  onAllGenres={handleAllGenres}
                  showAllButton={
                    genreSuggestions.length < getGenresForMediaPreference(mediaType).length
                  }
                />
              ) : null}
            </div>
          </div>
        </div>

        <div className="search-page__results">
          {isActive ? (
            <SearchResults
              results={results}
              status={status}
              query={searchLabel}
              contextLabel={contextLabel}
              errorMessage={errorMessage}
              hideEmptyMessage={Boolean(suggestion)}
              emptyHint={emptyGuidance.hint}
              emptyAlternativeLabel={
                emptyGuidance.offerTitleSearch ? emptyGuidance.alternativeLabel : null
              }
              onEmptyAlternative={
                emptyGuidance.offerTitleSearch ? handleSearchTitlesInstead : null
              }
            />
          ) : null}
        </div>

        <div className="search-page__help">
          <p className="search-page__help-text">
            Can&apos;t seem to find anything interesting?
          </p>
          <div className="search-page__help-action">
            <PillButton type="button" onClick={handleHelp}>
              Let us help
            </PillButton>
            <button
              type="button"
              className="search-page__help-arrow"
              onClick={handleHelp}
              aria-label="Let us help"
            >
              <ChevronDownIcon />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
