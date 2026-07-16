import { Link } from 'react-router-dom';
import './SearchResultCard.css';

export default function SearchResultCard({ id, title, year, posterUrl }) {
  const displayTitle = year ? `${title} (${year})` : title;

  return (
    <Link
      className="search-result-card"
      to={`/movie/${id}`}
      aria-label={`View details for ${displayTitle}`}
    >
      <div className="search-result-card__poster-wrap">
        <img
          className="search-result-card__poster"
          src={posterUrl}
          alt=""
          loading="lazy"
          decoding="async"
        />
      </div>
      <h3 className="search-result-card__title">{displayTitle}</h3>
    </Link>
  );
}
