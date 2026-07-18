import { Link } from 'react-router-dom';
import './SearchResultCard.css';

export default function SearchResultCard({
  id,
  title,
  year,
  posterUrl,
  mediaType = 'movie',
  asLink = true,
}) {
  const displayTitle = year ? `${title} (${year})` : title;
  const detailPath =
    mediaType === 'person'
      ? `/person/${id}`
      : mediaType === 'tv'
        ? `/tv/${id}`
        : `/movie/${id}`;

  const content = (
    <>
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
    </>
  );

  if (!asLink) {
    return <div className="search-result-card">{content}</div>;
  }

  return (
    <Link
      className="search-result-card"
      to={detailPath}
      aria-label={`View details for ${displayTitle}`}
    >
      {content}
    </Link>
  );
}
