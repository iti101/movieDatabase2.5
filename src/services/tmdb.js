const API_BASE = 'https://api.themoviedb.org/3';
const POSTER_SIZE = 'w342';

const POSTER_PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="342" height="513" viewBox="0 0 342 513">' +
      '<rect width="342" height="513" fill="#e2e8f0"/>' +
      '<text x="171" y="256" text-anchor="middle" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="14">No poster</text>' +
      '</svg>',
  );

function getApiKey() {
  const key = import.meta.env.VITE_TMDB_API_KEY;
  if (!key) {
    throw new Error(
      'TMDB API key is missing. Add VITE_TMDB_API_KEY to your .env file and restart the dev server.',
    );
  }
  return key;
}

export function getPosterUrl(path) {
  if (!path) {
    return POSTER_PLACEHOLDER;
  }
  return `https://image.tmdb.org/t/p/${POSTER_SIZE}${path}`;
}

function normalizeMovie(item) {
  return {
    id: item.id,
    title: item.title,
    posterUrl: getPosterUrl(item.poster_path),
    mediaType: 'movie',
  };
}

function normalizeTv(item) {
  return {
    id: item.id,
    title: item.name,
    posterUrl: getPosterUrl(item.poster_path),
    mediaType: 'tv',
  };
}

async function tmdbFetch(endpoint, query) {
  const url = new URL(`${API_BASE}${endpoint}`);
  url.searchParams.set('api_key', getApiKey());
  url.searchParams.set('query', query);
  url.searchParams.set('include_adult', 'false');
  url.searchParams.set('page', '1');

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`TMDB request failed (${response.status}). Please try again.`);
  }

  const data = await response.json();
  return data.results ?? [];
}

export async function searchMovies(query) {
  const results = await tmdbFetch('/search/movie', query);
  return results.map(normalizeMovie);
}

export async function searchTv(query) {
  const results = await tmdbFetch('/search/tv', query);
  return results.map(normalizeTv);
}
