import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import TitleReviewForm from '../components/TitleReviewForm';
import WatchlistSaveButton from '../components/WatchlistSaveButton';
import WatchProviders from '../components/WatchProviders';
import { useAuth } from '../context/AuthContext';
import { getReviewForTitle, isTitleOnWatchlist } from '../services/noviApi';
import { getMovieDetails } from '../services/tmdb';
import './MovieDetailPage.css';

function formatRating(rating) {
  if (rating == null || Number.isNaN(rating)) {
    return 'N/A';
  }
  return rating.toFixed(1);
}

export default function MovieDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, user } = useAuth();
  const [movie, setMovie] = useState(null);
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

    async function loadMovie() {
      setStatus('loading');
      setErrorMessage('');
      setMovie(null);
      setReview(null);

      try {
        const details = await getMovieDetails(id);
        if (cancelled) {
          return;
        }

        setMovie(details);
        setStatus('success');

        if (isLoggedIn && user?.id) {
          const [saved, existingReview] = await Promise.all([
            isTitleOnWatchlist(user.id, details.id, 'movie'),
            getReviewForTitle(user.id, details.id, 'movie'),
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

    loadMovie();

    return () => {
      cancelled = true;
    };
  }, [id, isLoggedIn, user?.id]);

  const displayTitle = movie
    ? movie.year
      ? `${movie.title} (${movie.year})`
      : movie.title
    : '';

  return (
    <main className="movie-detail">
      <div className="movie-detail__inner">
        <Link
          className="movie-detail__back"
          to={{ pathname: '/', hash: '#search' }}
          state={{ scrollTo: 'search' }}
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
            Loading movie details…
          </p>
        ) : null}

        {status === 'error' ? (
          <p
            className="movie-detail__message movie-detail__message--error"
            role="alert"
          >
            {errorMessage || 'Could not load this movie.'}
          </p>
        ) : null}

        {status === 'success' && movie ? (
          <article className="movie-detail__content">
            <div className="movie-detail__hero">
              <div className="movie-detail__poster-wrap">
                <img
                  className="movie-detail__poster"
                  src={movie.posterUrl}
                  alt={displayTitle}
                />
              </div>

              <div className="movie-detail__header">
                <h1 className="movie-detail__title">{movie.title}</h1>

                <dl className="movie-detail__meta">
                  {movie.year ? (
                    <div className="movie-detail__meta-item">
                      <dt>Year</dt>
                      <dd>{movie.year}</dd>
                    </div>
                  ) : null}

                  {movie.genres.length > 0 ? (
                    <div className="movie-detail__meta-item">
                      <dt>Genre</dt>
                      <dd>{movie.genres.join(', ')}</dd>
                    </div>
                  ) : null}

                  <div className="movie-detail__meta-item">
                    <dt>User rating</dt>
                    <dd>
                      <span className="movie-detail__rating">
                        {formatRating(movie.rating)}
                      </span>
                      <span className="movie-detail__rating-scale"> / 10</span>
                      {movie.voteCount > 0 ? (
                        <span className="movie-detail__vote-count">
                          ({movie.voteCount.toLocaleString()} votes)
                        </span>
                      ) : null}
                    </dd>
                  </div>

                  {movie.director ? (
                    <div className="movie-detail__meta-item">
                      <dt>Director</dt>
                      <dd>{movie.director}</dd>
                    </div>
                  ) : null}

                  {movie.trailerUrl ? (
                    <div className="movie-detail__meta-item">
                      <dt>Trailer</dt>
                      <dd>
                        <a
                          className="movie-detail__trailer-link"
                          href={movie.trailerUrl}
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
                    id: movie.id,
                    title: movie.title,
                    year: movie.year,
                    posterUrl: movie.posterUrl,
                    mediaType: 'movie',
                  }}
                  onWatchlist={onWatchlist}
                  onWatchlistChange={handleWatchlistChange}
                  onError={setErrorMessage}
                  loginRedirect={`/movie/${movie.id}`}
                />
              </div>
            </div>

            <section className="movie-detail__section" aria-labelledby="synopsis-heading">
              <h2 id="synopsis-heading" className="movie-detail__section-title">
                Storyline
              </h2>
              <p className="movie-detail__synopsis">
                {movie.overview || 'No synopsis available for this movie.'}
              </p>
            </section>

            <WatchProviders watchProviders={movie.watchProviders} />

            {isLoggedIn ? (
              <div className="movie-detail__section">
                <TitleReviewForm
                  userId={user.id}
                  tmdbId={movie.id}
                  mediaType="movie"
                  title={movie.title}
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
              {movie.cast.length > 0 ? (
                <ul className="movie-detail__cast">
                  {movie.cast.map((member) => (
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
