import { useState } from 'react';
import GenreSuggestions from '../components/GenreSuggestions';
import SearchBar from '../components/SearchBar';
import { pickRandomGenres } from '../utils/genreSuggestions';
import './SearchPage.css';

function getBrowsePlaceholder(label) {
  const term = label.toLowerCase();
  const article = /^[aeiou]/.test(term) ? 'an' : 'a';
  return `Search for ${article} ${term}...`;
}

export default function SearchPage() {
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

  const placeholder = selectedGenre
    ? getBrowsePlaceholder(selectedGenre)
    : browseOption
      ? getBrowsePlaceholder(browseOption.label)
      : 'Search for a movie...';

  return (
    <div className="search-page">
      <div className="search-page__content">
        <div className="search-page__search">
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
      </div>
    </div>
  );
}
