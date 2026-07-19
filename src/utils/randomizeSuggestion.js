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

function mediaNoun(mediaType, { plural = false } = {}) {
  if (mediaType === 'movie') {
    return plural ? 'movies' : 'movie';
  }
  if (mediaType === 'tv') {
    return plural ? 'TV shows' : 'TV show';
  }
  return plural ? 'titles' : 'title';
}

/**
 * Builds a short phrase describing the user's requested filters.
 * e.g. 'Sci-Fi TV show starring "Jeff Bridges"'
 */
export function describeSuggestionRequest({
  mediaType = 'any',
  includeGenres = [],
  excludeGenres = [],
  personName = null,
} = {}) {
  const genrePart =
    includeGenres.length > 0 ? `${includeGenres.join('/')} ` : '';
  const mediaPart = mediaNoun(mediaType);
  const starPart = personName ? ` starring "${personName}"` : '';
  const skipPart =
    excludeGenres.length > 0
      ? ` (skipping ${excludeGenres.join(', ')})`
      : '';

  return `${genrePart}${mediaPart}${starPart}${skipPart}`.trim();
}

function buildFallbackMessage(requestDescription) {
  return `Unfortunately we couldn't find a ${requestDescription}, but maybe you'll like this one as well…`;
}

function attemptKey({ mediaType, includeGenres, excludeGenres, personId }) {
  return [
    mediaType,
    includeGenres.join('|'),
    excludeGenres.join('|'),
    personId ?? '',
  ].join('::');
}

/**
 * Ordered attempts from strictest to loosest so we still return something useful.
 */
function buildFallbackAttempts({
  mediaPreference,
  resolvedType,
  includeGenres,
  excludeGenres,
  personId,
}) {
  /** @type {Array<{ mediaType: string, includeGenres: string[], excludeGenres: string[], personId: number|null, strict: boolean }>} */
  const attempts = [];
  const seen = new Set();

  function push(attempt) {
    const key = attemptKey(attempt);
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    attempts.push(attempt);
  }

  const typesToTry = [resolvedType];
  if (mediaPreference === 'any') {
    typesToTry.push(resolvedType === 'movie' ? 'tv' : 'movie');
  }

  // Full filter set (strict)
  for (const type of typesToTry) {
    push({
      mediaType: type,
      includeGenres,
      excludeGenres,
      personId,
      strict: true,
    });
  }

  // Drop exclude genres first — still honor mood, wants, and star
  for (const type of typesToTry) {
    push({
      mediaType: type,
      includeGenres,
      excludeGenres: [],
      personId,
      strict: false,
    });
  }

  // Drop person, keep genres
  for (const type of typesToTry) {
    push({
      mediaType: type,
      includeGenres,
      excludeGenres: [],
      personId: null,
      strict: false,
    });
  }

  // Keep person only
  if (personId) {
    for (const type of typesToTry) {
      push({
        mediaType: type,
        includeGenres: [],
        excludeGenres: [],
        personId,
        strict: false,
      });
    }
  }

  // Media type only, then completely open
  for (const type of typesToTry) {
    push({
      mediaType: type,
      includeGenres: [],
      excludeGenres: [],
      personId: null,
      strict: false,
    });
  }

  return attempts;
}

/**
 * Picks one random title matching optional filters.
 * When the exact combo has no matches, relaxes filters and returns a fallback note.
 *
 * @param {object} options
 * @param {'movie'|'tv'|'any'} [options.mediaType='any']
 * @param {string[]} [options.includeGenres]
 * @param {string[]} [options.excludeGenres]
 * @param {number|null} [options.personId]
 * @param {string|null} [options.personName]
 * @returns {Promise<{ item: object, fallbackMessage: string|null }>}
 */
export async function randomizeSuggestion({
  mediaType = 'any',
  includeGenres = [],
  excludeGenres = [],
  personId = null,
  personName = null,
} = {}) {
  const resolvedType = resolveMediaType(mediaType, includeGenres);
  const hasSpecificFilters =
    mediaType !== 'any' ||
    includeGenres.length > 0 ||
    excludeGenres.length > 0 ||
    Boolean(personId);

  const requestDescription = describeSuggestionRequest({
    mediaType,
    includeGenres,
    excludeGenres,
    personName,
  });

  const attempts = buildFallbackAttempts({
    mediaPreference: mediaType,
    resolvedType,
    includeGenres,
    excludeGenres,
    personId,
  });

  let pick = null;
  let usedAttempt = null;

  for (let i = 0; i < attempts.length; i += 1) {
    const attempt = attempts[i];
    const filters = buildDiscoverFilters(attempt);
    const discoverPage =
      attempt.mediaType === 'tv' ? discoverTvPage : discoverMoviesPage;

    let candidate = await fetchRandomFromDiscover(discoverPage, filters);

    if (candidate && recentlyShown.has(resultKey(candidate))) {
      const retry = await fetchRandomFromDiscover(discoverPage, filters);
      if (retry) {
        candidate = retry;
      }
    }

    if (candidate) {
      pick = candidate;
      usedAttempt = attempt;
      break;
    }
  }

  if (!pick) {
    throw new Error(
      'No titles matched those filters. Try loosening them and randomize again.',
    );
  }

  rememberResult(pick);

  const exactMatch = Boolean(usedAttempt?.strict);
  const fallbackMessage =
    !exactMatch && hasSpecificFilters
      ? buildFallbackMessage(requestDescription)
      : null;

  return {
    item: pick,
    fallbackMessage,
  };
}

/** Clears the recent-suggestion memory (useful for tests). */
export function clearRecentSuggestions() {
  recentlyShown.clear();
}
