import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import PasswordInput from '../components/PasswordInput';
import PillButton from '../components/PillButton';
import { useAuth } from '../context/AuthContext';
import { isDisplayNameTaken } from '../services/noviApi';
import './LoginPage.css';

const PENDING_USERNAME_KEY = 'novi.pendingDisplayName';

const SPECIAL_CHAR_PATTERN = /[^A-Za-z0-9]/;

function getPasswordChecks(password) {
  return [
    {
      id: 'length',
      label: 'At least 8 characters',
      met: password.length >= 8,
      missing: 'at least 8 characters',
    },
    {
      id: 'number',
      label: 'At least 1 number',
      met: /\d/.test(password),
      missing: 'at least 1 number',
    },
    {
      id: 'special',
      label: 'At least 1 special character',
      met: SPECIAL_CHAR_PATTERN.test(password),
      missing: 'at least 1 special character',
    },
  ];
}

function formatPasswordFeedback(checks) {
  const missing = checks.filter((check) => !check.met).map((check) => check.missing);
  if (missing.length === 0) {
    return '';
  }
  if (missing.length === 1) {
    return `Your password still needs ${missing[0]}.`;
  }
  if (missing.length === 2) {
    return `Your password still needs ${missing[0]} and ${missing[1]}.`;
  }
  return `Your password still needs ${missing.slice(0, -1).join(', ')}, and ${missing[missing.length - 1]}.`;
}

export default function SignupPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/watchlist';
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordChecks = getPasswordChecks(password);
  const passwordFeedback = formatPasswordFeedback(passwordChecks);
  const passwordIsValid = passwordChecks.every((check) => check.met);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setUsernameError('');
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const username = String(formData.get('username') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const nextPassword = String(formData.get('password') || '');
    const confirmPassword = String(formData.get('confirmPassword') || '');

    if (username.length < 2) {
      setUsernameError('Username must be at least 2 characters.');
      setIsSubmitting(false);
      return;
    }

    if (username.length > 50) {
      setUsernameError('Username must be 50 characters or fewer.');
      setIsSubmitting(false);
      return;
    }

    const submitChecks = getPasswordChecks(nextPassword);
    if (!submitChecks.every((check) => check.met)) {
      setError(formatPasswordFeedback(submitChecks));
      setIsSubmitting(false);
      return;
    }

    if (nextPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setIsSubmitting(false);
      return;
    }

    try {
      if (await isDisplayNameTaken(username)) {
        setUsernameError(
          'This username is already in use. Please try a different one.',
        );
        setIsSubmitting(false);
        return;
      }

      await register(email, nextPassword);
      sessionStorage.setItem(PENDING_USERNAME_KEY, username);
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
            <span className="login-page__label">Username</span>
            <input
              className="login-page__input"
              type="text"
              name="username"
              autoComplete="username"
              placeholder="Choose a username"
              minLength={2}
              maxLength={50}
              aria-invalid={Boolean(usernameError)}
              aria-describedby={usernameError ? 'username-error' : undefined}
              onChange={() => {
                if (usernameError) {
                  setUsernameError('');
                }
              }}
              required
            />
            {usernameError ? (
              <p id="username-error" className="login-page__error" role="alert">
                {usernameError}
              </p>
            ) : null}
          </label>

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
            <PasswordInput
              name="password"
              autoComplete="new-password"
              placeholder="Create a strong password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              aria-describedby="password-requirements password-feedback"
              aria-invalid={password.length > 0 && !passwordIsValid}
              required
            />
            <ul
              id="password-requirements"
              className="login-page__password-rules"
              aria-label="Password requirements"
            >
              {passwordChecks.map((check) => (
                <li
                  key={check.id}
                  className={
                    check.met
                      ? 'login-page__password-rule login-page__password-rule--met'
                      : 'login-page__password-rule'
                  }
                >
                  {check.label}
                </li>
              ))}
            </ul>
            {password.length > 0 && passwordFeedback ? (
              <p id="password-feedback" className="login-page__hint" role="status">
                {passwordFeedback}
              </p>
            ) : (
              <p id="password-feedback" className="login-page__hint">
                Use at least 8 characters, including one number and one special character.
              </p>
            )}
          </label>

          <label className="login-page__field">
            <span className="login-page__label">Confirm password</span>
            <PasswordInput
              name="confirmPassword"
              autoComplete="new-password"
              placeholder="Repeat your password"
              minLength={8}
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
