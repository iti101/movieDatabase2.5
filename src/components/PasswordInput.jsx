import { useId, useState } from 'react';

function EyeClosedIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3.5 3.5l17 17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M10.6 10.7a2.5 2.5 0 003.5 3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9.9 5.6A10.4 10.4 0 0112 5.3c5.2 0 9.1 4.1 10.5 6.2a1.3 1.3 0 010 1.4c-.5.8-1.6 2.2-3.3 3.5M6.5 6.9C4.5 8.3 3.1 10 2.5 11c-.3.5-.3 1 0 1.4C3.9 14.6 7.8 18.7 13 18.7c1.1 0 2.2-.2 3.2-.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EyeOpenIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default function PasswordInput({
  id,
  className = 'login-page__input',
  ...props
}) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <div className="login-page__input-wrap">
      <input
        {...props}
        id={inputId}
        className={`${className} login-page__input--with-toggle`}
        type={visible ? 'text' : 'password'}
      />
      <button
        type="button"
        className="login-page__visibility-toggle"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        aria-controls={inputId}
        onClick={() => setVisible((current) => !current)}
      >
        {visible ? <EyeOpenIcon /> : <EyeClosedIcon />}
      </button>
    </div>
  );
}
