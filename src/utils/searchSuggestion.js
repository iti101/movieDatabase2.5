import { searchByBrowseMode, searchMovies, searchPeople } from '../services/tmdb';
import { findClosestMatch, normalizeForCompare } from './fuzzyMatch';
import { MOVIE_GENRES } from './genreSuggestions';

function buildPrefixQueries(query) {
  const trimmed = query.trim();
  const prefixes = new Set();

  if (trimmed.length >= 4) {
    prefixes.add(trimmed.slice(0, trimmed.length - 1));
  }

  if (trimmed.length >= 5) {
    prefixes.add(trimmed.slice(0, trimmed.length - 2));
  }

  if (trimmed.length >= 6) {
    prefixes.add(trimmed.slice(0, Math.ceil(trimmed.length * 0.75)));
  }

  return [...prefixes].filter((prefix) => prefix.length >= 3);
}

function findGenreSuggestion(query) {
  const normalizedQuery = normalizeForCompare(query);
  const canonical = MOVIE_GENRES.find(
    (genre) => normalizeForCompare(genre) === normalizedQuery,
  );

  if (canonical) {
    return canonical.toLowerCase() === query.trim().toLowerCase() ? null : canonical;
  }

  return findClosestMatch(query, MOVIE_GENRES);
}

async function findPersonSuggestion(query) {
  const trimmed = query.trim();
  const prefixes = buildPrefixQueries(trimmed);
  const candidates = new Set();

  for (const prefix of prefixes) {
    try {
      const people = await searchPeople(prefix);
      people.forEach((person) => {
        if (person?.title) {
          candidates.add(person.title);
        }
      });
    } catch {
      // Ignore recovery failures.
    }
  }

  return findClosestMatch(trimmed, [...candidates]);
}

async function findTitleSuggestion(query) {
  const titleCandidates = new Set();
  const prefixes = buildPrefixQueries(query.trim());

  for (const prefix of prefixes) {
    try {
      const results = await searchMovies(prefix);
      results.forEach((item) => {
        if (item?.title) {
          titleCandidates.add(item.title);
        }
      });
    } catch {
      // Ignore recovery failures; the original empty search still stands.
    }
  }

  return findClosestMatch(query, [...titleCandidates]);
}

/**
 * Finds a close alternative when a search query looks unrecognized.
 * Suggestion strategy depends on the active browse mode.
 */
export async function findSearchSuggestion(
  query,
  { hasResults = false, browseMode = null } = {},
) {
  const trimmed = query.trim();

  if (!trimmed || hasResults) {
    return null;
  }

  if (browseMode === 'genre') {
    return findGenreSuggestion(trimmed);
  }

  if (browseMode === 'actor' || browseMode === 'director') {
    return findPersonSuggestion(trimmed);
  }

  if (browseMode === 'release-date') {
    return null;
  }

  const genreSuggestion = findGenreSuggestion(trimmed);
  if (genreSuggestion) {
    return genreSuggestion;
  }

  return findTitleSuggestion(trimmed);
}
