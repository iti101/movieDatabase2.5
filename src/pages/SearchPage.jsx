import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DidYouMean from '../components/DidYouMean';
import GenreSuggestions from '../components/GenreSuggestions';
import PillButton from '../components/PillButton';
import SearchBar from '../components/SearchBar';
import SearchResults from '../components/SearchResults';
import { searchByBrowseMode } from '../services/tmdb';
import { getAllGenres, MOVIE_GENRES, pickRandomGenres } from '../utils/genreSuggestions';
import { findSearchSuggestion } from '../utils/searchSuggestion';
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
      return 'actor';
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
        });

        if (cancelled) {
          return;
        }

        setResults(data);
        setStatus('success');

        if (data.length === 0 && activeQuery) {
          const closest = await findSearchSuggestion(activeQuery, {
            hasResults: false,
            browseMode,
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
  }, [activeQuery, browseOption, browseMode, selectedGenre, personId]);

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
      setGenreSuggestions(pickRandomGenres(8));
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
    setGenreSuggestions(getAllGenres());
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
      : 'Search for a movie...';

  const contextLabel = getSearchContextLabel(browseOption);

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
          <div className="search-page__search-field">
            <SearchBar
              value={inputValue}
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
                  showAllButton={genreSuggestions.length < MOVIE_GENRES.length}
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
