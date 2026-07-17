import { getGenreLabelsForMediaType } from '../services/tmdb';

export const MOVIE_GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Documentary',
  'Drama',
  'Family',
  'Fantasy',
  'History',
  'Horror',
  'Music',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Thriller',
  'War',
  'Western',
];

export function getAllGenres() {
  return [...MOVIE_GENRES];
}

/**
 * Genre labels available for the given media preference.
 * For "any", returns the movie list (superset of common labels).
 */
export function getGenresForMediaPreference(mediaPreference) {
  if (mediaPreference === 'tv') {
    return getGenreLabelsForMediaType('tv');
  }
  if (mediaPreference === 'movie') {
    return getGenreLabelsForMediaType('movie');
  }
  return [...MOVIE_GENRES];
}

export function pickRandomGenres(count = 5) {
  const shuffled = [...MOVIE_GENRES];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}
