import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import PillButton from '../components/PillButton';
import { useAuth } from '../context/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/watchlist';

  function handleSubmit(event) {
    event.preventDefault();
    login();
    navigate(redirect, { replace: true });
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
          Sign in to access your watchlist and preferences.
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
              autoComplete="current-password"
              placeholder="Enter your password"
              required
            />
          </label>

          <PillButton type="submit" className="login-page__submit">
            Sign in
          </PillButton>
        </form>

        <p className="login-page__signup">
          Not a member yet?{' '}
          <Link to="/signup" className="login-page__signup-link">
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
