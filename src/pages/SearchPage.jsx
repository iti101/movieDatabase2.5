import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GenreSuggestions from '../components/GenreSuggestions';
import PillButton from '../components/PillButton';
import SearchBar from '../components/SearchBar';
import SearchResults from '../components/SearchResults';
import { searchMovies, searchTv } from '../services/tmdb';
import { pickRandomGenres } from '../utils/genreSuggestions';
import './SearchPage.css';

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

async function fetchResults(query, tab) {
  if (tab === 'tv') {
    return searchTv(query);
  }
  return searchMovies(query);
}

export default function SearchPage({ embedded = false, onLetUsHelp }) {
  const navigate = useNavigate();
  const [browseOption, setBrowseOption] = useState(null);
  const [genreSuggestions, setGenreSuggestions] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [activeQuery, setActiveQuery] = useState('');
  const [activeTab, setActiveTab] = useState('movie');
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const isActive = Boolean(activeQuery);

  useEffect(() => {
    if (!activeQuery) {
      return undefined;
    }

    let cancelled = false;

    async function load() {
      setStatus('loading');
      setErrorMessage('');
      setResults([]);

      try {
        const data = await fetchResults(activeQuery, activeTab);
        if (!cancelled) {
          setResults(data);
          setStatus('success');
        }
      } catch (error) {
        if (!cancelled) {
          setResults([]);
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
  }, [activeQuery, activeTab]);

  function handleSearch(query) {
    if (!query) {
      setActiveQuery('');
      setResults([]);
      setStatus('idle');
      setErrorMessage('');
      return;
    }

    setActiveQuery(query);
  }

  function handleTabChange(tab) {
    if (tab === activeTab) {
      return;
    }
    setActiveTab(tab);
  }

  function handleBrowse(option) {
    setBrowseOption(option);
    setSelectedGenre(null);

    if (option.id === 'genre') {
      setGenreSuggestions(pickRandomGenres(8));
    } else {
      setGenreSuggestions([]);
    }
  }

  function handleGenreSelect(genre) {
    setSelectedGenre(genre);
  }

  function handleAllGenres() {
    setSelectedGenre(null);
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
              onSearch={handleSearch}
              onBrowseSelect={handleBrowse}
              placeholder={placeholder}
            />
            <div className="search-page__genre-slot">
              {browseOption?.id === 'genre' ? (
                <GenreSuggestions
                  suggestions={genreSuggestions}
                  onSelect={handleGenreSelect}
                  onAllGenres={handleAllGenres}
                />
              ) : null}
            </div>
          </div>
        </div>

        <div className="search-page__results">
          {isActive ? (
            <SearchResults
              activeTab={activeTab}
              onTabChange={handleTabChange}
              results={results}
              status={status}
              query={activeQuery}
              errorMessage={errorMessage}
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
