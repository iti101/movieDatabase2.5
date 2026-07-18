import { useEffect, useId, useRef } from 'react';
import './WatchlistPicker.css';

export default function WatchlistPicker({
  lists,
  titleName,
  busy = false,
  onSelect,
  onClose,
}) {
  const titleId = useId();
  const closeRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const busyRef = useRef(busy);

  onCloseRef.current = onClose;
  busyRef.current = busy;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === 'Escape' && !busyRef.current) {
        onCloseRef.current();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="watchlist-picker">
      <button
        type="button"
        className="watchlist-picker__backdrop"
        aria-label="Close watchlist picker"
        onClick={() => {
          if (!busy) {
            onClose();
          }
        }}
      />
      <div
        className="watchlist-picker__dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="watchlist-picker__header">
          <h2 id={titleId} className="watchlist-picker__title">
            Save to a list
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="watchlist-picker__close"
            aria-label="Close"
            disabled={busy}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        {titleName ? (
          <p className="watchlist-picker__subtitle">
            Choose which watchlist to add{' '}
            <span className="watchlist-picker__title-name">{titleName}</span> to.
          </p>
        ) : (
          <p className="watchlist-picker__subtitle">
            Choose which watchlist to add this title to.
          </p>
        )}

        <ul className="watchlist-picker__lists">
          {lists.map((list) => (
            <li key={list.id}>
              <button
                type="button"
                className="watchlist-picker__option"
                disabled={busy}
                onClick={() => onSelect(list.id)}
              >
                <span className="watchlist-picker__option-name">{list.name}</span>
                {list.description ? (
                  <span className="watchlist-picker__option-desc">
                    {list.description}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>

        {busy ? (
          <p className="watchlist-picker__status" aria-live="polite">
            Saving…
          </p>
        ) : null}
      </div>
    </div>
  );
}
