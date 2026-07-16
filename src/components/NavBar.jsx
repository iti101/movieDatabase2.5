import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import './NavBar.css';

const MENU_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Search', to: '/search' },
  { label: 'My watchlist', to: '/watchlist' },
  { label: 'Log in/out', action: 'auth' },
];

function MenuIcon() {
  return (
    <span className="navbar__menu-icon" aria-hidden="true">
      <span className="navbar__menu-line" />
      <span className="navbar__menu-line" />
      <span className="navbar__menu-line" />
    </span>
  );
}

function AccountIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5 20c0-3.314 3.134-6 7-6s7 2.686 7 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AccountMenu({ onClose, onSignIn, onSignOut, isLoggedIn }) {
  return (
    <>
      <button
        type="button"
        className="navbar__account-backdrop"
        aria-label="Close account menu"
        onClick={onClose}
      />
      <div className="navbar__account-panel" role="dialog" aria-label="Account">
        <p className="navbar__account-heading">Your account</p>
        {isLoggedIn ? (
          <>
            <p className="navbar__account-text">You are signed in.</p>
            <button type="button" className="navbar__account-signin" onClick={onSignOut}>
              Log out
            </button>
          </>
        ) : (
          <>
            <p className="navbar__account-text">
              Sign in to access your watchlist and preferences.
            </p>
            <button type="button" className="navbar__account-signin" onClick={onSignIn}>
              Sign in
            </button>
          </>
        )}
      </div>
    </>
  );
}

function FullscreenMenu({ isOpen, onLinkClick, onAuthClick, onSearchClick, onHomeClick, authLabel }) {
  let overlayClass = 'navbar__overlay';
  if (isOpen) {
    overlayClass += ' navbar__overlay--open';
  }

  return (
    <div
      id="navbar-fullscreen-menu"
      className={overlayClass}
      aria-hidden={!isOpen}
    >
      <nav className="navbar__fullscreen-nav" aria-label="Main navigation">
        {MENU_LINKS.map((link, index) => {
          let delay = '0ms';
          if (isOpen) {
            delay = `${index * 60 + 80}ms`;
          }

          if (link.action === 'auth') {
            return (
              <button
                key={link.label}
                type="button"
                className="navbar__fullscreen-link"
                style={{ transitionDelay: delay }}
                onClick={() => {
                  onAuthClick();
                  onLinkClick();
                }}
              >
                {authLabel}
              </button>
            );
          }

          if (link.to === '/search') {
            return (
              <NavLink
                key={link.label}
                to="/search"
                className="navbar__fullscreen-link"
                style={{ transitionDelay: delay }}
                onClick={(event) => {
                  event.preventDefault();
                  onSearchClick();
                  onLinkClick();
                }}
              >
                {link.label}
              </NavLink>
            );
          }

          return (
            <NavLink
              key={link.label}
              to={link.to}
              className="navbar__fullscreen-link"
              style={{ transitionDelay: delay }}
              onClick={() => {
                if (link.to === '/') {
                  onHomeClick();
                }
                onLinkClick();
              }}
            >
              {link.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoggedIn, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const authLabel = isLoggedIn ? 'Log out' : 'Log in';
  const isDetailPage =
    location.pathname.startsWith('/movie/') ||
    location.pathname.startsWith('/tv/');
  const menuTucked = isDetailPage && !menuOpen;

  // Stop the page from scrolling while the fullscreen menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  function toggleMenu() {
    if (menuOpen) {
      setMenuOpen(false);
    } else {
      setMenuOpen(true);
      setAccountOpen(false);
    }
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  function toggleAccount() {
    if (accountOpen) {
      setAccountOpen(false);
    } else {
      setAccountOpen(true);
      setMenuOpen(false);
    }
  }

  function closeAccount() {
    setAccountOpen(false);
  }

  function handleSignIn() {
    setAccountOpen(false);
    navigate('/login');
  }

  function handleSignOut() {
    logout();
    setAccountOpen(false);
    navigate('/');
  }

  function handleAuthClick() {
    if (isLoggedIn) {
      handleSignOut();
    } else {
      handleSignIn();
    }
  }

  function handleSearchClick() {
    // Jump to the search section on the scrollable home page.
    navigate(
      { pathname: '/', hash: '#search' },
      { state: { scrollTo: 'search', resetSearch: Date.now() } },
    );
  }

  function handleHomeClick() {
    if (window.location.pathname === '/') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  let menuButtonClass = 'navbar__menu-btn';
  if (menuOpen) {
    menuButtonClass += ' navbar__menu-btn--open';
  }
  if (menuTucked) {
    menuButtonClass += ' navbar__menu-btn--tucked';
  }

  return (
    <>
      <header className="navbar">
        <div className="navbar__inner">
          <button
            type="button"
            className={menuButtonClass}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            aria-controls="navbar-fullscreen-menu"
            aria-hidden={menuTucked}
            tabIndex={menuTucked ? -1 : undefined}
            onClick={toggleMenu}
          >
            <MenuIcon />
          </button>

          {isDetailPage ? (
            <button
              type="button"
              className={
                menuTucked
                  ? 'navbar__menu-peek'
                  : 'navbar__menu-peek navbar__menu-peek--hidden'
              }
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="navbar-fullscreen-menu"
              tabIndex={menuTucked ? undefined : -1}
              onClick={toggleMenu}
            >
              <span className="navbar__menu-peek-icon" aria-hidden="true">
                <span className="navbar__menu-peek-line" />
                <span className="navbar__menu-peek-line" />
                <span className="navbar__menu-peek-line" />
              </span>
            </button>
          ) : null}

          <div className="navbar__actions">
            <ThemeToggle />

            <div className="navbar__account">
              <button
                type="button"
                className="navbar__account-btn"
                aria-label="Account"
                aria-expanded={accountOpen}
                aria-haspopup="true"
                onClick={toggleAccount}
              >
                <AccountIcon />
              </button>

              {accountOpen && (
                <AccountMenu
                  onClose={closeAccount}
                  onSignIn={handleSignIn}
                  onSignOut={handleSignOut}
                  isLoggedIn={isLoggedIn}
                />
              )}
            </div>
          </div>
        </div>
      </header>

      <FullscreenMenu
        isOpen={menuOpen}
        onLinkClick={closeMenu}
        onAuthClick={handleAuthClick}
        onSearchClick={handleSearchClick}
        onHomeClick={handleHomeClick}
        authLabel={authLabel}
      />
    </>
  );
}
