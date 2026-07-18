import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PillButton from './PillButton';
import WatchlistPicker from './WatchlistPicker';
import { useAuth } from '../context/AuthContext';
import { getWatchlists, toggleTitleOnWatchlist } from '../services/noviApi';

export default function WatchlistSaveButton({
  title,
  onWatchlist,
  onWatchlistChange,
  onError,
  loginRedirect,
  className = 'movie-detail__watchlist',
  savedClassName = 'movie-detail__watchlist movie-detail__watchlist--saved',
}) {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [pickerLists, setPickerLists] = useState(null);

  async function saveToList(watchlistId = null) {
    setBusy(true);
    try {
      const { added } = await toggleTitleOnWatchlist(user.id, title, watchlistId);
      onWatchlistChange(added);
      setPickerLists(null);
    } catch (error) {
      onError?.(
        error instanceof Error
          ? error.message
          : 'Could not update your watchlist.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleClick() {
    if (!title?.id) {
      return;
    }

    if (!isLoggedIn || !user?.id) {
      navigate(`/login?redirect=${encodeURIComponent(loginRedirect)}`);
      return;
    }

    if (onWatchlist) {
      await saveToList();
      return;
    }

    setBusy(true);
    try {
      const lists = await getWatchlists(user.id);
      if (lists.length > 1) {
        setPickerLists(lists);
        return;
      }
      const { added } = await toggleTitleOnWatchlist(
        user.id,
        title,
        lists[0]?.id ?? null,
      );
      onWatchlistChange(added);
    } catch (error) {
      onError?.(
        error instanceof Error
          ? error.message
          : 'Could not update your watchlist.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PillButton
        className={onWatchlist ? savedClassName : className}
        onClick={handleClick}
        disabled={busy}
      >
        {busy && !pickerLists
          ? 'Updating…'
          : onWatchlist
            ? 'Remove from watchlist'
            : 'Add to watchlist'}
      </PillButton>

      {pickerLists ? (
        <WatchlistPicker
          lists={pickerLists}
          titleName={title.title}
          busy={busy}
          onSelect={(listId) => saveToList(listId)}
          onClose={() => {
            if (!busy) {
              setPickerLists(null);
            }
          }}
        />
      ) : null}
    </>
  );
}
