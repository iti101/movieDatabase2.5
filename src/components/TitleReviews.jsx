import { useEffect, useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PillButton from './PillButton';
import { useAuth } from '../context/AuthContext';
import {
  createReview,
  getProfiles,
  getReviewsForTitle,
  updateReview,
} from '../services/noviApi';
import './TitleReviews.css';

const STAR_VALUES = [1, 2, 3, 4, 5];

function authorLabel(review, profileByUserId) {
  const profile = profileByUserId.get(Number(review.userId));
  if (profile?.displayName) {
    return profile.displayName;
  }
  return 'A viewer';
}

function formatReviewDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/** API rating is 1–10; UI uses 0.5–5 stars (half-star steps). */
function ratingToStars(rating) {
  if (rating == null || Number.isNaN(Number(rating))) {
    return 0;
  }
  return Math.min(5, Math.max(0, Math.round(Number(rating)) / 2));
}

function starsToRating(stars) {
  return Math.min(10, Math.max(1, Math.round(stars * 2)));
}

function StarIcon({ fill }) {
  const clipId = useId().replace(/:/g, '');
  const fillWidth = fill >= 1 ? 24 : fill >= 0.5 ? 12 : 0;

  return (
    <svg
      className="title-reviews__star-svg"
      viewBox="0 0 24 24"
      width="28"
      height="28"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width={fillWidth} height="24" />
        </clipPath>
      </defs>
      <path
        className="title-reviews__star-outline"
        d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.77l-5.8 3.05 1.11-6.47-4.7-4.58 6.49-.94L12 2.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        className="title-reviews__star-fill"
        d="M12 2.5l2.9 5.88 6.49.94-4.7 4.58 1.11 6.47L12 17.77l-5.8 3.05 1.11-6.47-4.7-4.58 6.49-.94L12 2.5z"
        clipPath={`url(#${clipId})`}
      />
    </svg>
  );
}

function StarRow({
  value,
  hoverValue = 0,
  interactive = false,
  disabled = false,
  labelledBy,
  onHoverChange,
  onSelect,
}) {
  const display = hoverValue || value;

  return (
    <div
      className={`title-reviews__stars${interactive ? '' : ' title-reviews__stars--static'}`}
      role={interactive ? 'radiogroup' : 'img'}
      aria-labelledby={labelledBy}
      aria-label={
        interactive || labelledBy
          ? undefined
          : value > 0
            ? `Rated ${value} out of 5 stars`
            : 'No rating'
      }
      onMouseLeave={interactive ? () => onHoverChange?.(0) : undefined}
    >
      {STAR_VALUES.map((starValue) => {
        const fill = Math.min(1, Math.max(0, display - (starValue - 1)));
        return (
          <span
            key={starValue}
            className={`title-reviews__star${fill > 0 ? ' title-reviews__star--active' : ''}`}
          >
            <StarIcon fill={fill} />
            {interactive ? (
              <>
                <button
                  type="button"
                  className="title-reviews__star-half title-reviews__star-half--left"
                  aria-label={`${starValue - 0.5} stars`}
                  aria-checked={value === starValue - 0.5}
                  role="radio"
                  disabled={disabled}
                  onMouseEnter={() => onHoverChange?.(starValue - 0.5)}
                  onFocus={() => onHoverChange?.(starValue - 0.5)}
                  onClick={() => onSelect?.(starValue - 0.5)}
                />
                <button
                  type="button"
                  className="title-reviews__star-half title-reviews__star-half--right"
                  aria-label={`${starValue} stars`}
                  aria-checked={value === starValue}
                  role="radio"
                  disabled={disabled}
                  onMouseEnter={() => onHoverChange?.(starValue)}
                  onFocus={() => onHoverChange?.(starValue)}
                  onClick={() => onSelect?.(starValue)}
                />
              </>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

export default function TitleReviews({
  tmdbId,
  mediaType,
  title,
  loginRedirect,
}) {
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [profileByUserId, setProfileByUserId] = useState(new Map());
  const [loadStatus, setLoadStatus] = useState('idle');
  const [showAll, setShowAll] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [isRating, setIsRating] = useState(false);
  const [stars, setStars] = useState(0);
  const [hoverStars, setHoverStars] = useState(0);
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingRating, setIsSavingRating] = useState(false);

  const ownReview =
    reviews.find((review) => Number(review.userId) === Number(user?.id)) ||
    null;

  useEffect(() => {
    let cancelled = false;

    async function loadReviews() {
      if (!isLoggedIn) {
        setReviews([]);
        setProfileByUserId(new Map());
        setLoadStatus('guest');
        return;
      }

      setLoadStatus('loading');
      setError('');

      try {
        const [titleReviews, profiles] = await Promise.all([
          getReviewsForTitle(tmdbId, mediaType),
          getProfiles().catch(() => []),
        ]);

        if (cancelled) {
          return;
        }

        const map = new Map();
        for (const profile of profiles) {
          map.set(Number(profile.userId), profile);
        }

        setReviews(titleReviews);
        setProfileByUserId(map);
        setLoadStatus('ready');
      } catch (err) {
        if (!cancelled) {
          setLoadStatus('error');
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load reviews for this title.',
          );
        }
      }
    }

    loadReviews();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, tmdbId, mediaType]);

  useEffect(() => {
    if (ownReview?.content && !isWriting) {
      setContent(ownReview.content);
    }
  }, [ownReview?.id, ownReview?.content, isWriting]);

  useEffect(() => {
    if (ownReview?.rating != null) {
      setStars(ratingToStars(ownReview.rating));
    }
  }, [ownReview?.id, ownReview?.rating]);

  function handleWriteClick() {
    if (!isLoggedIn || !user?.id) {
      navigate(`/login?redirect=${encodeURIComponent(loginRedirect)}`);
      return;
    }

    setError('');
    setStatus('');
    setIsRating(false);
    setIsWriting((open) => !open);
  }

  function handleRatingClick() {
    if (!isLoggedIn || !user?.id) {
      navigate(`/login?redirect=${encodeURIComponent(loginRedirect)}`);
      return;
    }

    setError('');
    setStatus('');
    setIsWriting(false);
    setIsRating((open) => !open);
  }

  async function handleStarSelect(nextStars) {
    if (!isLoggedIn || !user?.id) {
      navigate(`/login?redirect=${encodeURIComponent(loginRedirect)}`);
      return;
    }

    setStars(nextStars);
    setHoverStars(0);
    setError('');
    setStatus('');

    const rating = starsToRating(nextStars);

    if (!ownReview?.id) {
      setStatus('Rating selected — publish a review to save it.');
      return;
    }

    setIsSavingRating(true);
    try {
      const saved = await updateReview(ownReview.id, { rating });
      const nextReview = { ...ownReview, ...saved, rating };
      setReviews((current) =>
        current.map((review) =>
          Number(review.userId) === Number(user.id) ? nextReview : review,
        ),
      );
      setStatus(`Rated ${nextStars} / 5.`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save your rating.',
      );
    } finally {
      setIsSavingRating(false);
    }
  }

  async function handlePublish(event) {
    event.preventDefault();

    if (!isLoggedIn || !user?.id) {
      navigate(`/login?redirect=${encodeURIComponent(loginRedirect)}`);
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) {
      setError('Write a review before publishing.');
      return;
    }

    setError('');
    setStatus('');
    setIsSubmitting(true);

    const rating = stars > 0 ? starsToRating(stars) : 8;

    try {
      let saved;
      if (ownReview?.id) {
        saved = await updateReview(ownReview.id, {
          content: trimmed,
          rating,
        });
      } else {
        saved = await createReview({
          userId: user.id,
          tmdbId,
          mediaType,
          title,
          content: trimmed,
          rating,
        });
      }

      const nextReview = saved || {
        ...ownReview,
        userId: user.id,
        tmdbId,
        mediaType,
        title,
        content: trimmed,
        rating,
      };

      setReviews((current) => {
        const withoutOwn = current.filter(
          (review) => Number(review.userId) !== Number(user.id),
        );
        return [nextReview, ...withoutOwn];
      });
      setStatus(ownReview ? 'Review updated.' : 'Review published.');
      setIsWriting(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not publish your review.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const visibleReviews = showAll ? reviews : reviews.slice(0, 1);

  return (
    <section className="title-reviews" aria-labelledby="reviews-heading">
      <div className="title-reviews__header">
        <h2 id="reviews-heading" className="title-reviews__title">
          Reviews
        </h2>
        {reviews.length > 1 ? (
          <button
            type="button"
            className="title-reviews__all-btn"
            onClick={() => setShowAll((value) => !value)}
            aria-expanded={showAll}
          >
            {showAll ? 'Show less' : 'ALL Reviews'}
          </button>
        ) : null}
      </div>

      <div className="title-reviews__actions">
        <div className="title-reviews__action-btns">
          <button
            type="button"
            className="title-reviews__write-btn"
            onClick={handleWriteClick}
            aria-expanded={isWriting}
          >
            Write a review
          </button>
          <button
            type="button"
            className="title-reviews__write-btn"
            onClick={handleRatingClick}
            aria-expanded={isRating}
          >
            Rating
          </button>
        </div>

        <div
          className={`title-reviews__composer${isWriting ? ' title-reviews__composer--open' : ''}`}
        >
          <div className="title-reviews__composer-inner">
            <form className="title-reviews__form" onSubmit={handlePublish}>
              <label className="title-reviews__field">
                <span className="title-reviews__label">Your review</span>
                <textarea
                  className="title-reviews__textarea"
                  rows={4}
                  maxLength={2000}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="What did you think?"
                  required
                />
              </label>

              {stars > 0 ? (
                <div className="title-reviews__form-rating">
                  <span className="title-reviews__label">Your rating</span>
                  <StarRow value={stars} />
                </div>
              ) : null}

              {error && isWriting ? (
                <p className="title-reviews__error" role="alert">
                  {error}
                </p>
              ) : null}
              {status && isWriting ? (
                <p className="title-reviews__status" aria-live="polite">
                  {status}
                </p>
              ) : null}

              <PillButton
                type="submit"
                className="title-reviews__publish"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Publishing…' : 'Publish review'}
              </PillButton>
            </form>
          </div>
        </div>

        <div
          className={`title-reviews__composer${isRating ? ' title-reviews__composer--open' : ''}`}
        >
          <div className="title-reviews__composer-inner">
            <div className="title-reviews__rating-panel">
              <p className="title-reviews__label" id="rating-stars-label">
                Your rating
                {(hoverStars || stars) > 0
                  ? ` · ${hoverStars || stars} / 5`
                  : ''}
              </p>
              <StarRow
                value={stars}
                hoverValue={hoverStars}
                interactive
                disabled={isSavingRating}
                labelledBy="rating-stars-label"
                onHoverChange={setHoverStars}
                onSelect={handleStarSelect}
              />
              {error && isRating ? (
                <p className="title-reviews__error" role="alert">
                  {error}
                </p>
              ) : null}
              {status && isRating ? (
                <p className="title-reviews__status" aria-live="polite">
                  {status}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {!isWriting && !isRating && status ? (
        <p className="title-reviews__status" aria-live="polite">
          {status}
        </p>
      ) : null}
      {!isWriting && !isRating && error && loadStatus === 'error' ? (
        <p className="title-reviews__error" role="alert">
          {error}
        </p>
      ) : null}

      {loadStatus === 'guest' ? (
        <p className="title-reviews__empty">
          Sign in to read and write reviews for this title.
        </p>
      ) : null}

      {loadStatus === 'loading' ? (
        <p className="title-reviews__empty" aria-live="polite">
          Loading reviews…
        </p>
      ) : null}

      {loadStatus === 'ready' && reviews.length === 0 ? (
        <p className="title-reviews__empty">
          No reviews yet. Be the first to write one.
        </p>
      ) : null}

      {loadStatus === 'ready' && visibleReviews.length > 0 ? (
        <ul className="title-reviews__list">
          {visibleReviews.map((review) => {
            const dated = formatReviewDate(review.createdAt);
            const reviewStars = ratingToStars(review.rating);
            const hasBody = Boolean(review.content?.trim());
            return (
              <li
                key={review.id ?? `${review.userId}-${review.content}`}
                className="title-reviews__item"
              >
                <article className="title-reviews__post">
                  <header className="title-reviews__item-meta">
                    <span className="title-reviews__author">
                      {authorLabel(review, profileByUserId)}
                    </span>
                    {dated ? (
                      <time
                        className="title-reviews__date"
                        dateTime={review.createdAt}
                      >
                        {dated}
                      </time>
                    ) : null}
                  </header>

                  {reviewStars > 0 ? (
                    <div className="title-reviews__item-rating">
                      <StarRow value={reviewStars} />
                      <span className="title-reviews__item-rating-label">
                        {reviewStars}/5
                      </span>
                    </div>
                  ) : null}

                  {hasBody ? (
                    <p className="title-reviews__content">{review.content}</p>
                  ) : (
                    <p className="title-reviews__content title-reviews__content--empty">
                      Rated this title without a written review.
                    </p>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
