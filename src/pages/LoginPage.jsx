import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import PillButton from '../components/PillButton';
import { useAuth } from '../context/AuthContext';
import { createProfile } from '../services/noviApi';
import './LoginPage.css';

const PENDING_USERNAME_KEY = 'novi.pendingDisplayName';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/watchlist';
  const justRegistered = searchParams.get('registered') === '1';
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');

    try {
      const user = await login(email, password);
      const pendingUsername = sessionStorage.getItem(PENDING_USERNAME_KEY);

      if (pendingUsername && user?.id != null) {
        try {
          await createProfile({
            userId: user.id,
            displayName: pendingUsername,
          });
        } catch {
          // Account is usable even if profile creation fails; reviews fall back to a generic label.
        } finally {
          sessionStorage.removeItem(PENDING_USERNAME_KEY);
        }
      }

      navigate(redirect, { replace: true });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Could not sign in. Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleClose() {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  }

  return (
    <div className="login-page">
      <div className="login-page__card">
        <button
          type="button"
          className="login-page__close"
          aria-label="Close sign in"
          onClick={handleClose}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
        <h1 className="login-page__heading">Sign in</h1>
        <p className="login-page__text">
          Sign in to access your watchlists and reviews.
        </p>

        {justRegistered ? (
          <p className="login-page__success" role="status">
            Your account has been created. Sign in to continue.
          </p>
        ) : null}

        <form className="login-page__form" onSubmit={handleSubmit}>
          <label className="login-page__field">
            <span className="login-page__label">Email</span>
            <input
              className="login-page__input"
              type="email"
              name="email"
              autoComplete="email"
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="login-page__field">
            <span className="login-page__label">Password</span>
            <input
              className="login-page__input"
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              required
            />
          </label>

          {error ? (
            <p className="login-page__error" role="alert">
              {error}
            </p>
          ) : null}

          <PillButton type="submit" className="login-page__submit" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </PillButton>
        </form>

        <p className="login-page__signup">
          Not a member yet?{' '}
          <Link
            to={`/signup?redirect=${encodeURIComponent(redirect)}`}
            className="login-page__signup-link"
          >
            Create new account
          </Link>
        </p>

        <Link to="/" className="login-page__back">
          Back to home
        </Link>
      </div>
    </div>
  );
}
