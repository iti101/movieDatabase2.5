import './GenreSuggestions.css';

function GenreSuggestions({ suggestions, onSelect, onAllGenres, showAllButton = true }) {
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
      {showAllButton ? (
        <button
          type="button"
          className="genre-suggestions__all"
          onClick={onAllGenres}
        >
          All genre&apos;s
        </button>
      ) : null}
    </div>
  );
}

export default GenreSuggestions;
