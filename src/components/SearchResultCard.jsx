import './SearchResultCard.css';

export default function SearchResultCard({ title, posterUrl }) {
  return (
    <article className="search-result-card">
      <div className="search-result-card__poster-wrap">
        <img
          className="search-result-card__poster"
          src={posterUrl}
          alt={title}
          loading="lazy"
          decoding="async"
        />
      </div>
      <h3 className="search-result-card__title">{title}</h3>
    </article>
  );
}
