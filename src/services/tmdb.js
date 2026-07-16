const API_BASE = 'https://api.themoviedb.org/3';
const POSTER_SIZE = 'w342';
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

export function getPosterUrl(path) {
  if (!path) {
    return POSTER_PLACEHOLDER;
  }
  return `https://image.tmdb.org/t/p/${POSTER_SIZE}${path}`;
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

async function findBestPerson(query, { department } = {}) {
  const people = await searchPeople(query);

  if (people.length === 0) {
    return null;
  }

  if (!department) {
    return people[0];
  }

  const preferred = people.find(
    (person) => person.knownForDepartment?.toLowerCase() === department.toLowerCase(),
  );

  return preferred ?? people[0];
}

async function getPersonMovieCredits(personId) {
  return tmdbFetch(`/person/${personId}/movie_credits`);
}

/**
 * Runs a category-aware search.
 * Query meaning changes with browse mode:
 * - default / null: movie title
 * - genre: genre name → movies in that genre
 * - actor: person name → movies featuring that actor
 * - director: person name → movies directed by that person
 * - release-date: year / year range → movies from that period
 */
export async function searchByBrowseMode(query, browseOption, { selectedGenre } = {}) {
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

  if (!trimmed) {
    return [];
  }

  if (mode === 'actor') {
    const person = await findBestPerson(trimmed, { department: 'Acting' });
    if (!person) {
      return [];
    }

    return discoverMovies({ with_cast: person.id });
  }

  if (mode === 'director') {
    const person = await findBestPerson(trimmed, { department: 'Directing' });
    if (!person) {
      return [];
    }

    const credits = await getPersonMovieCredits(person.id);
    const directed = (credits.crew ?? [])
      .filter((credit) => credit.job === 'Director')
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));

    const seen = new Set();
    return directed
      .filter((credit) => {
        if (seen.has(credit.id)) {
          return false;
        }
        seen.add(credit.id);
        return true;
      })
      .slice(0, 20)
      .map(normalizeMovie);
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
