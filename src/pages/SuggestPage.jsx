import { useState } from 'react';
import GenreSuggestions from '../components/GenreSuggestions';
import { pickRandomGenres } from '../utils/genreSuggestions';
import './SuggestPage.css';

export default function SuggestPage({ embedded = false }) {
  const [genreSuggestions] = useState(() => pickRandomGenres(8));
  const [selectedGenre, setSelectedGenre] = useState(null);

  function handleGenreSelect(genre) {
    setSelectedGenre(genre);
    console.log('Genre selected:', genre);
  }

  function handleAllGenres() {
    setSelectedGenre(null);
    console.log('All genres');
  }

  return (
    <div className={`suggest-page${embedded ? ' suggest-page--embedded' : ''}`}>
      <div className="suggest-page__content">
        <div className="suggest-page__header">
          <h2 className="suggest-page__title">Let us help</h2>
          <p className="suggest-page__subtitle">
            {selectedGenre
              ? `Great choice — explore ${selectedGenre} titles next.`
              : 'Pick a genre below and we\u2019ll point you in the right direction.'}
          </p>
        </div>
        <GenreSuggestions
          suggestions={genreSuggestions}
          onSelect={handleGenreSelect}
          onAllGenres={handleAllGenres}
        />
      </div>
    </div>
  );
}
