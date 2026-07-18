import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import TitleReviewForm from '../components/TitleReviewForm';
import WatchlistSaveButton from '../components/WatchlistSaveButton';
import WatchProviders from '../components/WatchProviders';
import { useAuth } from '../context/AuthContext';
import { getReviewForTitle, isTitleOnWatchlist } from '../services/noviApi';
import { getTvDetails } from '../services/tmdb';
import './MovieDetailPage.css';

function formatRating(rating) {
  if (rating == null || Number.isNaN(rating)) {
    return 'N/A';
  }
  return rating.toFixed(1);
}

export default function TvDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const [show, setShow] = useState(null);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [onWatchlist, setOnWatchlist] = useState(false);
  const [review, setReview] = useState(null);

  function handleCastClick(member) {
    navigate(`/person/${member.id}`);
  }

  function handleWatchlistChange(added) {
    setOnWatchlist(added);
    if (!added) {
      setReview(null);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function loadShow() {
      setStatus('loading');
      setErrorMessage('');
      setShow(null);
      setReview(null);

      try {
        const details = await getTvDetails(id);
        if (cancelled) {
          return;
        }

        setShow(details);
        setStatus('success');

        if (isLoggedIn && user?.id) {
          const [saved, existingReview] = await Promise.all([
            isTitleOnWatchlist(user.id, details.id, 'tv'),
            getReviewForTitle(user.id, details.id, 'tv'),
          ]);
          if (!cancelled) {
            setOnWatchlist(saved);
            setReview(existingReview);
          }
        } else {
          setOnWatchlist(false);
        }
      } catch (error) {
        if (!cancelled) {
          setStatus('error');
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'Something went wrong. Please try again.',
          );
        }
      }
    }

    loadShow();

    return () => {
      cancelled = true;
    };
  }, [id, isLoggedIn, user?.id]);

  const displayTitle = show
    ? show.year
      ? `${show.title} (${show.year})`
      : show.title
    : '';

  return (
    <main className="movie-detail">
      <div className="movie-detail__inner">
        <Link
          className="movie-detail__back"
          to={{ pathname: '/', hash: '#suggest' }}
          state={{ scrollTo: 'suggest' }}
        >
          <svg
            className="movie-detail__back-icon"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M14 5L7 12l7 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </Link>

        {status === 'loading' ? (
          <p className="movie-detail__message" aria-live="polite">
            Loading TV show details…
          </p>
        ) : null}

        {status === 'error' ? (
          <p
            className="movie-detail__message movie-detail__message--error"
            role="alert"
          >
            {errorMessage || 'Could not load this TV show.'}
          </p>
        ) : null}

        {status === 'success' && show ? (
          <article className="movie-detail__content">
            <div className="movie-detail__hero">
              <div className="movie-detail__poster-wrap">
                <img
                  className="movie-detail__poster"
                  src={show.posterUrl}
                  alt={displayTitle}
                />
              </div>

              <div className="movie-detail__header">
                <h1 className="movie-detail__title">{show.title}</h1>

                <dl className="movie-detail__meta">
                  {show.year ? (
                    <div className="movie-detail__meta-item">
                      <dt>First aired</dt>
                      <dd>{show.year}</dd>
                    </div>
                  ) : null}

                  {show.genres.length > 0 ? (
                    <div className="movie-detail__meta-item">
                      <dt>Genre</dt>
                      <dd>{show.genres.join(', ')}</dd>
                    </div>
                  ) : null}

                  <div className="movie-detail__meta-item">
                    <dt>User rating</dt>
                    <dd>
                      <span className="movie-detail__rating">
                        {formatRating(show.rating)}
                      </span>
                      <span className="movie-detail__rating-scale"> / 10</span>
                      {show.voteCount > 0 ? (
                        <span className="movie-detail__vote-count">
                          ({show.voteCount.toLocaleString()} votes)
                        </span>
                      ) : null}
                    </dd>
                  </div>

                  {show.creators ? (
                    <div className="movie-detail__meta-item">
                      <dt>Created by</dt>
                      <dd>{show.creators}</dd>
                    </div>
                  ) : null}

                  {show.trailerUrl ? (
                    <div className="movie-detail__meta-item">
                      <dt>Trailer</dt>
                      <dd>
                        <a
                          className="movie-detail__trailer-link"
                          href={show.trailerUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Watch on YouTube
                        </a>
                      </dd>
                    </div>
                  ) : null}
                </dl>

                <WatchlistSaveButton
                  title={{
                    id: show.id,
                    title: show.title,
                    year: show.year,
                    posterUrl: show.posterUrl,
                    mediaType: 'tv',
                  }}
                  onWatchlist={onWatchlist}
                  onWatchlistChange={handleWatchlistChange}
                  onError={setErrorMessage}
                  loginRedirect={`/tv/${show.id}`}
                />
              </div>
            </div>

            <section className="movie-detail__section" aria-labelledby="synopsis-heading">
              <h2 id="synopsis-heading" className="movie-detail__section-title">
                Storyline
              </h2>
              <p className="movie-detail__synopsis">
                {show.overview || 'No synopsis available for this show.'}
              </p>
            </section>

            <WatchProviders watchProviders={show.watchProviders} />

            {isLoggedIn ? (
              <div className="movie-detail__section">
                <TitleReviewForm
                  userId={user.id}
                  tmdbId={show.id}
                  mediaType="tv"
                  title={show.title}
                  onWatchlist={onWatchlist}
                  existingReview={review}
                  onSaved={setReview}
                />
              </div>
            ) : null}

            <section className="movie-detail__section" aria-labelledby="cast-heading">
              <h2 id="cast-heading" className="movie-detail__section-title">
                Cast
              </h2>
              {show.cast.length > 0 ? (
                <ul className="movie-detail__cast">
                  {show.cast.map((member) => (
                    <li key={member.id}>
                      <button
                        type="button"
                        className="movie-detail__cast-member"
                        onClick={() => handleCastClick(member)}
                        aria-label={`View details for ${member.name}`}
                      >
                        <div className="movie-detail__cast-photo-wrap">
                          <img
                            className="movie-detail__cast-photo"
                            src={member.profileUrl}
                            alt=""
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                        <p className="movie-detail__cast-name">{member.name}</p>
                        {member.character ? (
                          <p className="movie-detail__cast-role">{member.character}</p>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="movie-detail__empty">Cast information is unavailable.</p>
              )}
            </section>
          </article>
        ) : null}
      </div>
    </main>
  );
}
