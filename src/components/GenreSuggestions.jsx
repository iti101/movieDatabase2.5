import './GenreSuggestions.css';

function GenreSuggestions({ suggestions, onSelect, onAllGenres }) {
  return (
    <div className="genre-suggestions">
      <div className="genre-suggestions__list">
        {suggestions.map((genre) => (
          <button
            key={genre}
            type="button"
            className="genre-suggestions__item"
            onClick={() => onSelect(genre)}
          >
            #{genre}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="genre-suggestions__all"
        onClick={onAllGenres}
      >
        All genre&apos;s
      </button>
    </div>
  );
}

export default GenreSuggestions;
