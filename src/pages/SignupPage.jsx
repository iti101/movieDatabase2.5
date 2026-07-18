import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import PillButton from '../components/PillButton';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/watchlist';
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') || '').trim();
    const password = String(formData.get('password') || '');
    const confirmPassword = String(formData.get('confirmPassword') || '');

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setIsSubmitting(false);
      return;
    }

    try {
      await register(email, password);
      navigate(
        `/login?redirect=${encodeURIComponent(redirect)}&registered=1`,
        { replace: true },
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not create account. Please try again.',
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
          aria-label="Close sign up"
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
        <h1 className="login-page__heading">Create account</h1>
        <p className="login-page__text">
          Register with your email to save watchlists and write reviews.
        </p>

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
              autoComplete="new-password"
              placeholder="At least 6 characters"
              minLength={6}
              required
            />
          </label>

          <label className="login-page__field">
            <span className="login-page__label">Confirm password</span>
            <input
              className="login-page__input"
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="Repeat your password"
              minLength={6}
              required
            />
          </label>

          {error ? (
            <p className="login-page__error" role="alert">
              {error}
            </p>
          ) : null}

          <PillButton type="submit" className="login-page__submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating account…' : 'Create account'}
          </PillButton>
        </form>

        <p className="login-page__signup">
          Already have an account?{' '}
          <Link
            to={`/login?redirect=${encodeURIComponent(redirect)}`}
            className="login-page__signup-link"
          >
            Sign in
          </Link>
        </p>

        <Link to="/" className="login-page__back">
          Back to home
        </Link>
      </div>
    </div>
  );
}
