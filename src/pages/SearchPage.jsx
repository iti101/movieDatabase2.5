import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GenreSuggestions from '../components/GenreSuggestions';
import PillButton from '../components/PillButton';
import SearchBar from '../components/SearchBar';
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

export default function SearchPage({ embedded = false, onLetUsHelp }) {
  const navigate = useNavigate();
  const [browseOption, setBrowseOption] = useState(null);
  const [genreSuggestions, setGenreSuggestions] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);

  function handleSearch(query) {
    if (query) {
      console.log('Search:', query);
    }
  }

  function handleBrowse(option) {
    setBrowseOption(option);
    setSelectedGenre(null);

    if (option.id === 'genre') {
      setGenreSuggestions(pickRandomGenres(8));
    } else {
      setGenreSuggestions([]);
    }

    console.log('Browse by:', option.id);
  }

  function handleGenreSelect(genre) {
    setSelectedGenre(genre);
    console.log('Genre selected:', genre);
  }

  function handleAllGenres() {
    setSelectedGenre(null);
    console.log('All genres');
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

  return (
    <div className={`search-page${embedded ? ' search-page--embedded' : ''}`}>
      <div className="search-page__content">
        <div className="search-page__search">
          <div className="search-page__search-field">
            <SearchBar
              onSearch={handleSearch}
              onBrowseSelect={handleBrowse}
              placeholder={placeholder}
            />
            {browseOption?.id === 'genre' && (
              <GenreSuggestions
                suggestions={genreSuggestions}
                onSelect={handleGenreSelect}
                onAllGenres={handleAllGenres}
              />
            )}
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
    </div>
  );
}
