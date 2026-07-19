import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PillButton from '../components/PillButton';
import SearchResultCard from '../components/SearchResultCard';
import { useAuth } from '../context/AuthContext';
import {
  createWatchlist,
  deleteWatchlist,
  getAllWatchlistItemsForUser,
  getReviews,
  removeWatchlistItem,
} from '../services/noviApi';
import './WatchlistPage.css';

function ChevronDownIcon({ open }) {
  return (
    <svg
      className={
        open
          ? 'watchlist-page__tab-chevron watchlist-page__tab-chevron--open'
          : 'watchlist-page__tab-chevron'
      }
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function WatchlistPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lists, setLists] = useState([]);
  const [items, setItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [activeListId, setActiveListId] = useState('all');
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [newListName, setNewListName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [menuOpenForId, setMenuOpenForId] = useState(null);
  const [reloadToken, setReloadToken] = useState(0);
  const createInputRef = useRef(null);
  const tabsRef = useRef(null);

  useEffect(() => {
    if (showCreateForm) {
      createInputRef.current?.focus();
    }
  }, [showCreateForm]);

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessMessage('');
    }, 3000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [successMessage]);

  useEffect(() => {
    if (menuOpenForId == null) {
      return undefined;
    }

    function handleClickOutside(event) {
      const openGroup = tabsRef.current?.querySelector(
        `[data-list-menu="${menuOpenForId}"]`,
      );
      if (openGroup && !openGroup.contains(event.target)) {
        setMenuOpenForId(null);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setMenuOpenForId(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpenForId]);

  function requestReload() {
    setReloadToken((value) => value + 1);
  }

  useEffect(() => {
    if (!user?.id) {
      return undefined;
    }

    let cancelled = false;

    async function loadData() {
      try {
        const [{ lists: nextLists, items: nextItems }, nextReviews] =
          await Promise.all([
            getAllWatchlistItemsForUser(user.id),
            getReviews(user.id),
          ]);

        if (cancelled) {
          return;
        }

        setLists(nextLists);
        setItems(nextItems);
        setReviews(nextReviews);
        setStatus('success');
        setError('');
      } catch (err) {
        if (cancelled) {
          return;
        }
        setStatus('error');
        setError(
          err instanceof Error ? err.message : 'Could not load your watchlists.',
        );
      }
    }

    void loadData();

    return () => {
      cancelled = true;
    };
  }, [user?.id, reloadToken]);

  const visibleItems = useMemo(() => {
    if (activeListId === 'all') {
      return items;
    }
    return items.filter((item) => Number(item.watchlistId) === Number(activeListId));
  }, [items, activeListId]);

  const reviewByKey = useMemo(() => {
    const map = new Map();
    for (const review of reviews) {
      map.set(`${review.mediaType}:${review.tmdbId}`, review);
    }
    return map;
  }, [reviews]);

  async function handleCreateList(event) {
    event.preventDefault();
    const name = newListName.trim();
    if (!name || !user?.id) {
      return;
    }

    setCreating(true);
    setError('');
    try {
      await createWatchlist({ userId: user.id, name });
      setNewListName('');
      setShowCreateForm(false);
      requestReload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not create watchlist.',
      );
    } finally {
      setCreating(false);
    }
  }

  function handleCancelCreate() {
    setShowCreateForm(false);
    setNewListName('');
  }

  async function handleDeleteList(listId, listName) {
    setError('');
    setSuccessMessage('');
    setMenuOpenForId(null);
    try {
      const listItems = items.filter(
        (item) => Number(item.watchlistId) === Number(listId),
      );
      await Promise.all(listItems.map((item) => removeWatchlistItem(item.id)));
      await deleteWatchlist(listId);
      if (Number(activeListId) === Number(listId)) {
        setActiveListId('all');
      }
      setSuccessMessage(`The ${listName}-list has been deleted`);
      requestReload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not delete watchlist.',
      );
    }
  }

  async function handleRemoveItem(itemId) {
    setError('');
    try {
      await removeWatchlistItem(itemId);
      requestReload();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not remove title.',
      );
    }
  }

  if (status === 'loading') {
    return (
      <div className="watchlist-page">
        <p className="watchlist-page__message">Loading your watchlists…</p>
      </div>
    );
  }

  return (
    <div className="watchlist-page watchlist-page--filled">
      <div className="watchlist-page__inner">
        <form className="watchlist-page__create" onSubmit={handleCreateList}>
          <div className="watchlist-page__header">
            <h1 className="watchlist-page__title">My watchlists</h1>
            {showCreateForm ? (
              <PillButton
                type="submit"
                className="watchlist-page__create-btn"
                disabled={creating}
              >
                {creating ? 'Creating…' : 'Create new list'}
              </PillButton>
            ) : (
              <PillButton
                type="button"
                className="watchlist-page__create-btn"
                onClick={() => setShowCreateForm(true)}
              >
                Create new list
              </PillButton>
            )}
          </div>

          <div
            className={
              showCreateForm
                ? 'watchlist-page__create-panel watchlist-page__create-panel--open'
                : 'watchlist-page__create-panel'
            }
            aria-hidden={!showCreateForm}
          >
            <div className="watchlist-page__create-panel-inner">
              <div className="watchlist-page__create-row">
                <label className="watchlist-page__create-field">
                  <span className="watchlist-page__create-label">New list</span>
                  <input
                    ref={createInputRef}
                    className="watchlist-page__create-input"
                    type="text"
                    value={newListName}
                    onChange={(event) => setNewListName(event.target.value)}
                    placeholder="e.g. Weekend picks"
                    maxLength={80}
                    required={showCreateForm}
                    disabled={!showCreateForm}
                    tabIndex={showCreateForm ? 0 : -1}
                  />
                </label>
                <button
                  type="button"
                  className="watchlist-page__create-cancel"
                  onClick={handleCancelCreate}
                  disabled={creating || !showCreateForm}
                  tabIndex={showCreateForm ? 0 : -1}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </form>

        {error ? (
          <p className="watchlist-page__error" role="alert">
            {error}
          </p>
        ) : null}

        {successMessage ? (
          <p className="watchlist-page__success" role="status">
            {successMessage}
          </p>
        ) : null}

        <div className="watchlist-page__toolbar">
          <button
            type="button"
            role="tab"
            aria-selected={activeListId === 'all'}
            className={
              activeListId === 'all'
                ? 'watchlist-page__tab watchlist-page__tab--active'
                : 'watchlist-page__tab'
            }
            onClick={() => setActiveListId('all')}
          >
            All titles
          </button>
        </div>

        {lists.length > 0 ? (
          <div
            className="watchlist-page__tabs"
            role="tablist"
            aria-label="Watchlists"
            ref={tabsRef}
          >
            {lists.map((list) => {
              const menuOpen = Number(menuOpenForId) === Number(list.id);
              return (
                <div
                  key={list.id}
                  className="watchlist-page__tab-group"
                  data-list-menu={list.id}
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={Number(activeListId) === Number(list.id)}
                    className={
                      Number(activeListId) === Number(list.id)
                        ? 'watchlist-page__tab watchlist-page__tab--active'
                        : 'watchlist-page__tab'
                    }
                    onClick={() => setActiveListId(list.id)}
                  >
                    {list.name}
                  </button>
                  <button
                    type="button"
                    className="watchlist-page__tab-menu-btn"
                    aria-label={`Options for ${list.name}`}
                    aria-expanded={menuOpen}
                    aria-haspopup="menu"
                    onClick={() =>
                      setMenuOpenForId(menuOpen ? null : list.id)
                    }
                  >
                    <ChevronDownIcon open={menuOpen} />
                  </button>
                  {menuOpen ? (
                    <div className="watchlist-page__tab-menu" role="menu">
                      <button
                        type="button"
                        className="watchlist-page__tab-menu-item"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpenForId(null);
                          navigate(
                            { pathname: '/', hash: '#search' },
                            { state: { scrollTo: 'search' } },
                          );
                        }}
                      >
                        Add title
                      </button>
                      <button
                        type="button"
                        className="watchlist-page__tab-menu-item"
                        role="menuitem"
                        onClick={() => handleDeleteList(list.id, list.name)}
                      >
                        Delete list
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {visibleItems.length === 0 ? (
          <p className="watchlist-page__message watchlist-page__message--inline">
            {lists.length === 0
              ? 'Create a list, then save titles from a movie or TV page.'
              : 'This list is empty. Save titles from a movie or TV page.'}
          </p>
        ) : (
          <ul className="watchlist-page__grid">
            {visibleItems.map((item) => {
              const review = reviewByKey.get(`${item.mediaType}:${item.tmdbId}`);
              return (
                <li key={`${item.mediaType}-${item.tmdbId}-${item.id}`}>
                  <SearchResultCard
                    id={item.tmdbId}
                    title={item.title}
                    year={item.year}
                    posterUrl={item.posterUrl}
                    mediaType={item.mediaType}
                  />
                  <div className="watchlist-page__item-meta">
                    {item.watchlistName ? (
                      <p className="watchlist-page__item-list">{item.watchlistName}</p>
                    ) : null}
                    {review ? (
                      <p className="watchlist-page__item-review">
                        Your rating: {review.rating}/10
                      </p>
                    ) : (
                      <p className="watchlist-page__item-review watchlist-page__item-review--muted">
                        No review yet
                      </p>
                    )}
                    <button
                      type="button"
                      className="watchlist-page__remove"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
