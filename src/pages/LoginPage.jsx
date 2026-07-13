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

  return (
    <div className="login-page">
      <div className="login-page__card">
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
