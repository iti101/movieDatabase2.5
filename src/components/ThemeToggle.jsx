import { useTheme } from '../context/ThemeContext';
import './ThemeToggle.css';

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <path
        d="M12 1.75v2.5M12 19.75v2.5M1.75 12h2.5M19.75 12h2.5M4.4 4.4l1.77 1.77M17.83 17.83l1.77 1.77M4.4 19.6l1.77-1.77M17.83 6.17l1.77-1.77"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 14.35A8.5 8.5 0 1 1 9.65 3 7 7 0 0 0 21 14.35Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function ThemeToggle() {
  const { theme, setLight, setDark } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="theme-toggle" role="group" aria-label="Color theme">
      <button
        type="button"
        className={
          isDark
            ? 'theme-toggle__btn'
            : 'theme-toggle__btn theme-toggle__btn--active'
        }
        aria-label="Light mode"
        aria-pressed={!isDark}
        onClick={setLight}
      >
        <SunIcon />
      </button>
      <button
        type="button"
        className={
          isDark
            ? 'theme-toggle__btn theme-toggle__btn--active'
            : 'theme-toggle__btn'
        }
        aria-label="Dark mode"
        aria-pressed={isDark}
        onClick={setDark}
      >
        <MoonIcon />
      </button>
    </div>
  );
}
