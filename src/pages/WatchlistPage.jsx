import { useMemo, useState } from 'react';
import SearchResultCard from '../components/SearchResultCard';
import { getWatchlist } from '../utils/watchlistStorage';
import './WatchlistPage.css';

export default function WatchlistPage() {
  const [items] = useState(getWatchlist);

  const titles = useMemo(
    () => items.filter((item) => item.mediaType === 'movie' || item.mediaType === 'tv'),
    [items],
  );

  if (titles.length === 0) {
    return (
      <div className="watchlist-page">
        <p className="watchlist-page__message">
          Your watchlist is empty. Save titles from a movie page to see them here.
        </p>
      </div>
    );
  }

  return (
    <div className="watchlist-page watchlist-page--filled">
      <div className="watchlist-page__inner">
        <h1 className="watchlist-page__title">My watchlist</h1>
        <ul className="watchlist-page__grid">
          {titles.map((item) => (
            <li key={`${item.mediaType}-${item.id}`}>
              <SearchResultCard
                id={item.id}
                title={item.title}
                year={item.year}
                posterUrl={item.posterUrl}
                mediaType={item.mediaType}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
