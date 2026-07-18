import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import SearchResultCard from '../components/SearchResultCard';
import { getPersonDetails } from '../services/tmdb';
import './MovieDetailPage.css';
import './PersonDetailPage.css';

function formatBirthday(dateString) {
  if (!dateString) {
    return '';
  }

  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function PersonDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const resetSearchRef = useRef(0);
  const [person, setPerson] = useState(null);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');

  function handleAllMoviesClick() {
    if (!person) {
      return;
    }

    resetSearchRef.current += 1;
    navigate(
      { pathname: '/', hash: '#search' },
      {
        state: {
          scrollTo: 'search',
          resetSearch: resetSearchRef.current,
          actorSearch: {
            id: person.id,
            name: person.name,
          },
        },
      },
    );
  }

  useEffect(() => {
    let cancelled = false;

    async function loadPerson() {
      setStatus('loading');
      setErrorMessage('');
      setPerson(null);

      try {
        const details = await getPersonDetails(id);
        if (cancelled) {
          return;
        }

        setPerson(details);
        setStatus('success');
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

    loadPerson();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const birthdayLabel = person ? formatBirthday(person.birthday) : '';

  return (
    <main className="movie-detail person-detail">
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
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M15 18l-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </Link>

        {status === 'loading' ? (
          <p className="movie-detail__message" role="status">
            Loading…
          </p>
        ) : null}

        {status === 'error' ? (
          <p className="movie-detail__message movie-detail__message--error" role="alert">
            {errorMessage}
          </p>
        ) : null}

        {status === 'success' && person ? (
          <article>
            <div className="movie-detail__hero">
              <div className="movie-detail__poster-wrap">
                <img
                  className="movie-detail__poster"
                  src={person.profileUrl}
                  alt=""
                />
              </div>

              <div>
                <h1 className="movie-detail__title">{person.name}</h1>

                <dl className="movie-detail__meta">
                  {person.knownForDepartment ? (
                    <div className="movie-detail__meta-item">
                      <dt>Department</dt>
                      <dd>{person.knownForDepartment}</dd>
                    </div>
                  ) : null}

                  {birthdayLabel ? (
                    <div className="movie-detail__meta-item">
                      <dt>Born</dt>
                      <dd>{birthdayLabel}</dd>
                    </div>
                  ) : null}

                  {person.placeOfBirth ? (
                    <div className="movie-detail__meta-item">
                      <dt>Place of birth</dt>
                      <dd>{person.placeOfBirth}</dd>
                    </div>
                  ) : null}
                </dl>
              </div>
            </div>

            <section className="movie-detail__section" aria-labelledby="biography-heading">
              <h2 id="biography-heading" className="movie-detail__section-title">
                Biography
              </h2>
              <p className="movie-detail__synopsis">
                {person.biography || 'No biography available for this person.'}
              </p>
            </section>

            <section
              className="movie-detail__section"
              aria-labelledby="known-for-heading"
            >
              <div className="person-detail__section-header">
                <h2 id="known-for-heading" className="movie-detail__section-title">
                  Known for
                </h2>
                <button
                  type="button"
                  className="person-detail__all-movies"
                  onClick={handleAllMoviesClick}
                >
                  All movies
                </button>
              </div>

              {person.knownForMovies.length > 0 ? (
                <ul className="person-detail__known-for">
                  {person.knownForMovies.map((movie) => (
                    <li key={movie.id}>
                      <SearchResultCard
                        id={movie.id}
                        title={movie.title}
                        year={movie.year}
                        posterUrl={movie.posterUrl}
                        mediaType="movie"
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="movie-detail__empty">
                  Film credits are unavailable for this person.
                </p>
              )}
            </section>
          </article>
        ) : null}
      </div>
    </main>
  );
}
