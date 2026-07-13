import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import './NavBar.css';

const MENU_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Movies', to: '/search' },
  { label: 'Series', to: '/search' },
  { label: "Genre's", to: '/search' },
  { label: 'Log in', to: '/search' },
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

function AccountMenu({ onClose, onSignIn }) {
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
        <p className="navbar__account-text">
          Sign in to access your watchlist and preferences.
        </p>
        <button type="button" className="navbar__account-signin" onClick={onSignIn}>
          Sign in
        </button>
      </div>
    </>
  );
}

function FullscreenMenu({ isOpen, onLinkClick }) {
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

          return (
            <NavLink
              key={link.label}
              to={link.to}
              className="navbar__fullscreen-link"
              style={{ transitionDelay: delay }}
              onClick={onLinkClick}
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

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
    alert('Sign in to your personal account — coming soon.');
    setAccountOpen(false);
  }

  let menuButtonClass = 'navbar__menu-btn';
  if (menuOpen) {
    menuButtonClass += ' navbar__menu-btn--open';
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
            onClick={toggleMenu}
          >
            <MenuIcon />
          </button>

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
              <AccountMenu onClose={closeAccount} onSignIn={handleSignIn} />
            )}
          </div>
        </div>
      </header>

      <FullscreenMenu isOpen={menuOpen} onLinkClick={closeMenu} />
    </>
  );
}
