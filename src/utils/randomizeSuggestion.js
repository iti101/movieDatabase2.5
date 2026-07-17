import {
  discoverMoviesPage,
  discoverTvPage,
  getGenreLabelsForMediaType,
  resolveGenreIds,
} from '../services/tmdb';

const RECENT_LIMIT = 12;

/** @type {Set<string>} */
const recentlyShown = new Set();

function resultKey(item) {
  return `${item.mediaType}-${item.id}`;
}

function rememberResult(item) {
  recentlyShown.add(resultKey(item));
  while (recentlyShown.size > RECENT_LIMIT) {
    const oldest = recentlyShown.values().next().value;
    recentlyShown.delete(oldest);
  }
}

function randomInt(maxExclusive) {
  return Math.floor(Math.random() * maxExclusive);
}

function pickRandom(array) {
  if (!array || array.length === 0) {
    return null;
  }
  return array[randomInt(array.length)];
}

/**
 * Prefer a media type that can honor include-genres when Surprise me is selected.
 */
function resolveMediaType(mediaPreference, includeGenres) {
  if (mediaPreference === 'movie' || mediaPreference === 'tv') {
    return mediaPreference;
  }

  const include = includeGenres ?? [];
  if (include.length === 0) {
    return Math.random() < 0.5 ? 'movie' : 'tv';
  }

  const movieLabels = new Set(getGenreLabelsForMediaType('movie'));
  const tvLabels = new Set(getGenreLabelsForMediaType('tv'));
  const movieOk = include.every((g) => movieLabels.has(g));
  const tvOk = include.every((g) => tvLabels.has(g));

  if (movieOk && !tvOk) {
    return 'movie';
  }
  if (tvOk && !movieOk) {
    return 'tv';
  }
  if (movieOk && tvOk) {
    return Math.random() < 0.5 ? 'movie' : 'tv';
  }

  // Partial overlap: prefer the type that matches more include genres
  const movieHits = include.filter((g) => movieLabels.has(g)).length;
  const tvHits = include.filter((g) => tvLabels.has(g)).length;
  if (movieHits > tvHits) {
    return 'movie';
  }
  if (tvHits > movieHits) {
    return 'tv';
  }

  return Math.random() < 0.5 ? 'movie' : 'tv';
}

function buildDiscoverFilters({ mediaType, includeGenres, excludeGenres, personId }) {
  const filters = {
    'vote_count.gte': 50,
  };

  const withIds = resolveGenreIds(includeGenres, mediaType);
  if (withIds.length > 0) {
    filters.with_genres = withIds.join('|');
  }

  const withoutIds = resolveGenreIds(excludeGenres, mediaType);
  if (withoutIds.length > 0) {
    filters.without_genres = withoutIds.join(',');
  }

  if (personId) {
    if (mediaType === 'tv') {
      filters.with_people = personId;
    } else {
      filters.with_cast = personId;
    }
  }

  return filters;
}

async function fetchRandomFromDiscover(discoverPage, filters) {
  const first = await discoverPage(filters, 1);

  if (first.totalPages === 0 || first.results.length === 0) {
    return null;
  }

  const page =
    first.totalPages === 1 ? 1 : randomInt(first.totalPages) + 1;

  const pageData =
    page === 1 ? first : await discoverPage(filters, page);

  if (!pageData.results.length) {
    return null;
  }

  const fresh = pageData.results.filter(
    (item) => !recentlyShown.has(resultKey(item)),
  );
  const pool = fresh.length > 0 ? fresh : pageData.results;
  return pickRandom(pool);
}

/**
 * Picks one random title matching optional filters.
 *
 * @param {object} options
 * @param {'movie'|'tv'|'any'} [options.mediaType='any']
 * @param {string[]} [options.includeGenres]
 * @param {string[]} [options.excludeGenres]
 * @param {number|null} [options.personId]
 * @returns {Promise<object>} normalized movie or TV item
 */
export async function randomizeSuggestion({
  mediaType = 'any',
  includeGenres = [],
  excludeGenres = [],
  personId = null,
} = {}) {
  const resolvedType = resolveMediaType(mediaType, includeGenres);
  const filters = buildDiscoverFilters({
    mediaType: resolvedType,
    includeGenres,
    excludeGenres,
    personId,
  });

  const discoverPage =
    resolvedType === 'tv' ? discoverTvPage : discoverMoviesPage;

  let pick = await fetchRandomFromDiscover(discoverPage, filters);

  // One re-roll on a different page if we landed on a recent repeat
  if (pick && recentlyShown.has(resultKey(pick))) {
    const retry = await fetchRandomFromDiscover(discoverPage, filters);
    if (retry) {
      pick = retry;
    }
  }

  if (!pick) {
    throw new Error(
      'No titles matched those filters. Try loosening them and randomize again.',
    );
  }

  rememberResult(pick);
  return pick;
}

/** Clears the recent-suggestion memory (useful for tests). */
export function clearRecentSuggestions() {
  recentlyShown.clear();
}
