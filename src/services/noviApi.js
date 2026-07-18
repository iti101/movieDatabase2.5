const API_BASE =
  import.meta.env.VITE_NOVI_API_BASE ||
  'https://novi-backend-api-wgsgz.ondigitalocean.app';

const TOKEN_KEY = 'novi.auth.token';
const USER_KEY = 'novi.auth.user';

function getProjectId() {
  const projectId = import.meta.env.VITE_NOVI_PROJECT_ID;
  if (!projectId) {
    throw new Error(
      'Missing VITE_NOVI_PROJECT_ID. Add your NOVI Project ID to the .env file.',
    );
  }
  return projectId;
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function persistAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function decodeJwtPayload(token) {
  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(normalized);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    return false;
  }
  return payload.exp * 1000 <= Date.now();
}

function buildUser(loginPayload, token) {
  const loginUser = loginPayload?.user || loginPayload;
  const payload = decodeJwtPayload(token) || {};
  const id =
    loginUser?.id ??
    loginPayload?.id ??
    payload.id ??
    payload.userId ??
    payload.sub ??
    null;

  return {
    id: id != null ? Number(id) || id : null,
    email: loginUser?.email ?? payload.email ?? '',
    roles: loginUser?.roles ?? payload.roles ?? ['user'],
  };
}

async function readErrorMessage(response) {
  try {
    const data = await response.json();
    if (typeof data === 'string') {
      return data;
    }
    return (
      data.message ||
      data.error ||
      data.title ||
      `Request failed (${response.status})`
    );
  } catch {
    return `Request failed (${response.status})`;
  }
}

export async function noviFetch(path, options = {}) {
  const { auth = true, headers: extraHeaders, ...rest } = options;
  const headers = {
    'Content-Type': 'application/json',
    'novi-education-project-id': getProjectId(),
    ...extraHeaders,
  };

  if (auth) {
    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      clearAuthStorage();
      throw new Error('Your session has expired. Please sign in again.');
    }
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text) {
    return null;
  }

  return JSON.parse(text);
}

export async function login(email, password) {
  const data = await noviFetch('/api/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ email, password }),
  });

  const token = data.token || data.accessToken;
  if (!token) {
    throw new Error('Login succeeded but no token was returned.');
  }

  const user = buildUser(data, token);
  persistAuth(token, user);
  return { token, user };
}

export async function register(email, password) {
  return noviFetch('/api/users', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({
      email,
      password,
      roles: ['user'],
    }),
  });
}

function asArray(data) {
  if (Array.isArray(data)) {
    return data;
  }
  if (Array.isArray(data?.data)) {
    return data.data;
  }
  if (Array.isArray(data?.items)) {
    return data.items;
  }
  return [];
}

export async function getWatchlists(userId) {
  return asArray(await noviFetch(`/api/watchlists?userId=${userId}`));
}

export async function createWatchlist({ userId, name, description = '' }) {
  return noviFetch('/api/watchlists', {
    method: 'POST',
    body: JSON.stringify({
      userId,
      name,
      description,
    }),
  });
}

export async function deleteWatchlist(id) {
  return noviFetch(`/api/watchlists/${id}`, { method: 'DELETE' });
}

export async function getWatchlistItems(watchlistId) {
  return asArray(
    await noviFetch(`/api/watchlistItems?watchlistId=${watchlistId}`),
  );
}

export async function getAllWatchlistItemsForUser(userId) {
  const lists = await getWatchlists(userId);
  const itemGroups = await Promise.all(
    lists.map(async (list) => {
      const items = await getWatchlistItems(list.id);
      return items.map((item) => ({
        ...item,
        watchlistName: list.name,
      }));
    }),
  );
  return {
    lists,
    items: itemGroups.flat(),
  };
}

export async function getOrCreateDefaultWatchlist(userId) {
  const lists = await getWatchlists(userId);
  if (lists.length > 0) {
    return lists[0];
  }
  return createWatchlist({
    userId,
    name: 'My watchlist',
    description: 'Titles I want to watch',
  });
}

export async function findWatchlistItem(userId, tmdbId, mediaType = 'movie') {
  const { items } = await getAllWatchlistItemsForUser(userId);
  return (
    items.find(
      (item) =>
        Number(item.tmdbId) === Number(tmdbId) &&
        item.mediaType === mediaType,
    ) || null
  );
}

export async function addWatchlistItem(item) {
  return noviFetch('/api/watchlistItems', {
    method: 'POST',
    body: JSON.stringify({
      watchlistId: item.watchlistId,
      tmdbId: item.tmdbId,
      mediaType: item.mediaType || 'movie',
      title: item.title,
      posterUrl: item.posterUrl || '',
      year: item.year != null ? String(item.year) : '',
    }),
  });
}

export async function removeWatchlistItem(id) {
  return noviFetch(`/api/watchlistItems/${id}`, { method: 'DELETE' });
}

export async function toggleTitleOnWatchlist(userId, title, watchlistId = null) {
  const mediaType = title.mediaType || 'movie';
  const existing = await findWatchlistItem(userId, title.id, mediaType);

  if (existing) {
    await removeWatchlistItem(existing.id);
    return { added: false, item: null };
  }

  const list = watchlistId
    ? { id: watchlistId }
    : await getOrCreateDefaultWatchlist(userId);
  const item = await addWatchlistItem({
    watchlistId: list.id,
    tmdbId: title.id,
    mediaType,
    title: title.title,
    posterUrl: title.posterUrl,
    year: title.year,
  });

  return { added: true, item };
}

export async function isTitleOnWatchlist(userId, tmdbId, mediaType = 'movie') {
  const item = await findWatchlistItem(userId, tmdbId, mediaType);
  return Boolean(item);
}

export async function getReviews(userId) {
  return asArray(await noviFetch(`/api/reviews?userId=${userId}`));
}

export async function getReviewForTitle(userId, tmdbId, mediaType = 'movie') {
  const reviews = await getReviews(userId);
  return (
    reviews.find(
      (review) =>
        Number(review.tmdbId) === Number(tmdbId) &&
        review.mediaType === mediaType,
    ) || null
  );
}

export async function createReview(review) {
  return noviFetch('/api/reviews', {
    method: 'POST',
    body: JSON.stringify({
      userId: review.userId,
      tmdbId: review.tmdbId,
      mediaType: review.mediaType || 'movie',
      title: review.title,
      rating: Number(review.rating),
      content: review.content,
    }),
  });
}

export async function updateReview(id, patch) {
  return noviFetch(`/api/reviews/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deleteReview(id) {
  return noviFetch(`/api/reviews/${id}`, { method: 'DELETE' });
}

export async function createProfile({ userId, displayName }) {
  return noviFetch('/api/profiles', {
    method: 'POST',
    body: JSON.stringify({ userId, displayName }),
  });
}
