import './SearchResultCard.css';

export default function SearchResultCard({ title, year, posterUrl }) {
  const displayTitle = year ? `${title} (${year})` : title;

  return (
    <article className="search-result-card">
      <div className="search-result-card__poster-wrap">
        <img
          className="search-result-card__poster"
          src={posterUrl}
          alt={displayTitle}
          loading="lazy"
          decoding="async"
        />
      </div>
      <h3 className="search-result-card__title">{displayTitle}</h3>
    </article>
  );
}
