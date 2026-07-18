import { useState } from 'react';
import PillButton from './PillButton';
import { createReview, updateReview } from '../services/noviApi';
import './TitleReviewForm.css';

export default function TitleReviewForm({
  userId,
  tmdbId,
  mediaType,
  title,
  onWatchlist,
  existingReview,
  onSaved,
}) {
  const [rating, setRating] = useState(existingReview?.rating ?? 8);
  const [content, setContent] = useState(existingReview?.content ?? '');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!onWatchlist) {
    return (
      <section className="title-review" aria-labelledby="review-heading">
        <h2 id="review-heading" className="title-review__title">
          Your review
        </h2>
        <p className="title-review__hint">
          Add this title to a watchlist before writing a review.
        </p>
      </section>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setStatus('');
    setIsSubmitting(true);

    try {
      const payload = {
        userId,
        tmdbId,
        mediaType,
        title,
        rating: Number(rating),
        content: content.trim(),
      };

      let saved;
      if (existingReview?.id) {
        saved = await updateReview(existingReview.id, {
          rating: payload.rating,
          content: payload.content,
        });
      } else {
        saved = await createReview(payload);
      }

      onSaved?.(saved || { ...payload, id: existingReview?.id });
      setStatus(existingReview ? 'Review updated.' : 'Review saved.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not save your review.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="title-review" aria-labelledby="review-heading">
      <h2 id="review-heading" className="title-review__title">
        Your review
      </h2>
      <form className="title-review__form" onSubmit={handleSubmit}>
        <label className="title-review__field">
          <span className="title-review__label">Rating (1–10)</span>
          <input
            className="title-review__input"
            type="number"
            min={1}
            max={10}
            step={1}
            value={rating}
            onChange={(event) => setRating(event.target.value)}
            required
          />
        </label>

        <label className="title-review__field">
          <span className="title-review__label">Review</span>
          <textarea
            className="title-review__textarea"
            rows={4}
            maxLength={2000}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="What did you think?"
            required
          />
        </label>

        {error ? (
          <p className="title-review__error" role="alert">
            {error}
          </p>
        ) : null}
        {status ? (
          <p className="title-review__status" aria-live="polite">
            {status}
          </p>
        ) : null}

        <PillButton type="submit" className="title-review__submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Saving…'
            : existingReview
              ? 'Update review'
              : 'Save review'}
        </PillButton>
      </form>
    </section>
  );
}
