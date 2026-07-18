const API_BASE = 'https://api.themoviedb.org/3';
const POSTER_SIZE = 'w342';
const DETAIL_POSTER_SIZE = 'w500';
const PROFILE_SIZE = 'w185';

const POSTER_PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="342" height="513" viewBox="0 0 342 513">' +
      '<rect width="342" height="513" fill="#e2e8f0"/>' +
      '<text x="171" y="256" text-anchor="middle" fill="#94a3b8" font-family="system-ui,sans-serif" font-size="14">No poster</text>' +
    '</svg>',
  );

/** Maps local genre labels to TMDB genre IDs. */
export const GENRE_NAME_TO_ID = {
  Action: 28,
  Adventure: 12,
  Animation: 16,
  Comedy: 35,
  Crime: 80,
  Documentary: 99,
  Drama: 18,
  Family: 10751,
  Fantasy: 14,
  History: 36,
  Horror: 27,
  Music: 10402,
  Mystery: 9648,
  Romance: 10749,
  'Sci-Fi': 878,
  Thriller: 53,
  War: 10752,
  Western: 37,
};

function getApiKey() {
  const key = import.meta.env.VITE_TMDB_API_KEY;
  if (!key) {
    throw new Error(
      'TMDB API key is missing. Add VITE_TMDB_API_KEY to your .env file and restart the dev server.',
    );
  }
  return key;
}

export function getPosterUrl(path, size = POSTER_SIZE) {
  if (!path) {
    return POSTER_PLACEHOLDER;
  }
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

function getProfileUrl(path) {
  if (!path) {
    return POSTER_PLACEHOLDER;
  }
  return `https://image.tmdb.org/t/p/${PROFILE_SIZE}${path}`;
}

function getReleaseYear(dateString) {
  if (!dateString || typeof dateString !== 'string') {
    return null;
  }
  const year = dateString.slice(0, 4);
  return /^\d{4}$/.test(year) ? year : null;
}

function normalizeMovie(item) {
  return {
    id: item.id,
    title: item.title,
    year: getReleaseYear(item.release_date),
    posterUrl: getPosterUrl(item.poster_path),
    mediaType: 'movie',
  };
}

function normalizeTv(item) {
  return {
    id: item.id,
    title: item.name,
    year: getReleaseYear(item.first_air_date),
    posterUrl: getPosterUrl(item.poster_path),
    mediaType: 'tv',
  };
}

function normalizePerson(item) {
  return {
    id: item.id,
    title: item.name,
    posterUrl: getProfileUrl(item.profile_path),
    mediaType: 'person',
    knownForDepartment: item.known_for_department ?? '',
  };
}

async function tmdbFetch(endpoint, params = {}) {
  const url = new URL(`${API_BASE}${endpoint}`);
  url.searchParams.set('api_key', getApiKey());

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`TMDB request failed (${response.status}). Please try again.`);
  }

  return response.json();
}

export async function searchMovies(query) {
  const data = await tmdbFetch('/search/movie', {
    query,
    include_adult: false,
    page: 1,
  });
  return (data.results ?? []).map(normalizeMovie);
}

export async function searchTv(query) {
  const data = await tmdbFetch('/search/tv', {
    query,
    include_adult: false,
    page: 1,
  });
  return (data.results ?? []).map(normalizeTv);
}

export async function searchPeople(query) {
  const data = await tmdbFetch('/search/person', {
    query,
    include_adult: false,
    page: 1,
  });
  return (data.results ?? []).map(normalizePerson);
}

export async function discoverMovies(filters = {}) {
  const data = await tmdbFetch('/discover/movie', {
    include_adult: false,
    sort_by: 'popularity.desc',
    page: 1,
    ...filters,
  });
  return (data.results ?? []).map(normalizeMovie);
}

function getTrailerUrl(videos) {
  const results = videos?.results ?? [];
  if (results.length === 0) {
    return null;
  }

  const youtubeVideos = results.filter(
    (video) => video.site === 'YouTube' && video.key,
  );

  const trailer =
    youtubeVideos.find(
      (video) => video.type === 'Trailer' && video.official,
    ) ??
    youtubeVideos.find((video) => video.type === 'Trailer') ??
    youtubeVideos.find((video) => video.type === 'Teaser') ??
    youtubeVideos[0];

  return trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : null;
}

function normalizeMovieDetails(data) {
  const crew = data.credits?.crew ?? [];
  const directors = crew
    .filter((member) => member.job === 'Director')
    .map((member) => member.name);

  const cast = (data.credits?.cast ?? []).slice(0, 12).map((member) => ({
    id: member.id,
    name: member.name,
    character: member.character || '',
    profileUrl: getProfileUrl(member.profile_path),
  }));

  return {
    id: data.id,
    title: data.title,
    year: getReleaseYear(data.release_date),
    posterUrl: getPosterUrl(data.poster_path, DETAIL_POSTER_SIZE),
    overview: data.overview?.trim() || '',
    genres: (data.genres ?? []).map((genre) => genre.name),
    rating: typeof data.vote_average === 'number' ? data.vote_average : null,
    voteCount: data.vote_count ?? 0,
    director: directors.length > 0 ? directors.join(', ') : '',
    cast,
    trailerUrl: getTrailerUrl(data.videos),
  };
}

/**
 * Fetches full movie details including credits (cast + crew) and videos.
 */
export async function getMovieDetails(movieId) {
  if (!movieId) {
    throw new Error('Movie id is required.');
  }

  const data = await tmdbFetch(`/movie/${movieId}`, {
    append_to_response: 'credits,videos',
  });

  return normalizeMovieDetails(data);
}

export function resolveGenreId(genreName) {
  if (!genreName) {
    return null;
  }

  const exact = GENRE_NAME_TO_ID[genreName];
  if (exact) {
    return exact;
  }

  const normalized = genreName.trim().toLowerCase();
  const entry = Object.entries(GENRE_NAME_TO_ID).find(
    ([name]) => name.toLowerCase() === normalized,
  );

  return entry ? entry[1] : null;
}

function filterPeopleByDepartment(people, department) {
  const target = department.toLowerCase();
  return people.filter(
    (person) => person.knownForDepartment?.toLowerCase() === target,
  );
}

/**
 * Runs a category-aware search.
 * Query meaning changes with browse mode:
 * - default / null: movie title
 * - genre: genre name → movies in that genre
 * - actor: person name → actors/actresses only (or filmography when personId is set)
 * - director: person name → directors only
 * - release-date: year / year range → movies from that period
 */
export async function searchByBrowseMode(
  query,
  browseOption,
  { selectedGenre, personId } = {},
) {
  const mode = browseOption?.id ?? null;
  const trimmed = query.trim();

  if (mode === 'genre') {
    const genreLabel = selectedGenre || trimmed;
    const genreId = resolveGenreId(genreLabel);

    if (!genreId) {
      return [];
    }

    return discoverMovies({ with_genres: genreId });
  }

  // Filmography path (e.g. "All movies" from a person detail page).
  if (mode === 'actor' && personId) {
    return discoverMovies({ with_cast: personId });
  }

  if (!trimmed) {
    return [];
  }

  if (mode === 'actor') {
    const people = await searchPeople(trimmed);
    return filterPeopleByDepartment(people, 'Acting');
  }

  if (mode === 'director') {
    const people = await searchPeople(trimmed);
    return filterPeopleByDepartment(people, 'Directing');
  }

  if (mode === 'release-date') {
    const yearMatch = trimmed.match(/\b(19|20)\d{2}\b/g);
    if (!yearMatch) {
      return [];
    }

    if (yearMatch.length >= 2) {
      const [start, end] = yearMatch
        .map(Number)
        .sort((a, b) => a - b);

      return discoverMovies({
        'primary_release_date.gte': `${start}-01-01`,
        'primary_release_date.lte': `${end}-12-31`,
      });
    }

    return discoverMovies({ primary_release_year: yearMatch[0] });
  }

  return searchMovies(trimmed);
}
