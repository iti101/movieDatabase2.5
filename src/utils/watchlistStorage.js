const STORAGE_KEY = 'movieDatabase.watchlist';

function readWatchlist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeWatchlist(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function itemKey(item) {
  return `${item.mediaType || 'movie'}:${item.id}`;
}

export function getWatchlist() {
  return readWatchlist();
}

export function isInWatchlist(id, mediaType = 'movie') {
  const key = itemKey({ id, mediaType });
  return readWatchlist().some((item) => itemKey(item) === key);
}

export function addToWatchlist(item) {
  const items = readWatchlist();
  const key = itemKey(item);

  if (items.some((existing) => itemKey(existing) === key)) {
    return items;
  }

  const next = [
    {
      id: item.id,
      title: item.title,
      year: item.year ?? '',
      posterUrl: item.posterUrl ?? '',
      mediaType: item.mediaType || 'movie',
      addedAt: Date.now(),
    },
    ...items,
  ];

  writeWatchlist(next);
  return next;
}

export function removeFromWatchlist(id, mediaType = 'movie') {
  const key = itemKey({ id, mediaType });
  const next = readWatchlist().filter((item) => itemKey(item) !== key);
  writeWatchlist(next);
  return next;
}

export function toggleWatchlist(item) {
  if (isInWatchlist(item.id, item.mediaType || 'movie')) {
    return {
      items: removeFromWatchlist(item.id, item.mediaType || 'movie'),
      added: false,
    };
  }

  return {
    items: addToWatchlist(item),
    added: true,
  };
}
