export function normalizeForCompare(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

export function levenshtein(a, b) {
  const left = normalizeForCompare(a);
  const right = normalizeForCompare(b);

  if (left === right) {
    return 0;
  }

  if (!left.length) {
    return right.length;
  }

  if (!right.length) {
    return left.length;
  }

  const rows = left.length + 1;
  const cols = right.length + 1;
  const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) {
    matrix[i][0] = i;
  }

  for (let j = 0; j < cols; j += 1) {
    matrix[0][j] = j;
  }

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = left[i - 1] === right[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[left.length][right.length];
}

function getMaxDistance(queryLength) {
  if (queryLength <= 4) {
    return 1;
  }

  if (queryLength <= 8) {
    return 2;
  }

  return Math.max(2, Math.floor(queryLength * 0.34));
}

/**
 * Returns the closest candidate to `query`, or null if nothing is close enough
 * (or if an exact match already exists).
 */
export function findClosestMatch(query, candidates) {
  const normalizedQuery = normalizeForCompare(query);

  if (normalizedQuery.length < 2 || !candidates?.length) {
    return null;
  }

  let best = null;
  let bestDistance = Infinity;

  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }

    const distance = levenshtein(normalizedQuery, candidate);

    if (distance === 0) {
      return null;
    }

    if (distance < bestDistance) {
      bestDistance = distance;
      best = candidate;
    }
  }

  const threshold = getMaxDistance(normalizedQuery.length);

  if (!best || bestDistance > threshold) {
    return null;
  }

  return best;
}
