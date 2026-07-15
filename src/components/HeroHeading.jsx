import { useEffect, useState } from 'react';
import PillButton from './PillButton';
import './HeroHeading.css';

const TYPING_WORDS = ['movie', 'show', 'episode'];
const INITIAL_DELAY_MS = 500;
const WORD_HOLD_MS = 900;
const TYPE_CHAR_MS = 75;
const DELETE_CHAR_MS = 45;
const PAUSE_BETWEEN_WORDS_MS = 120;
const ATTRIBUTION_ANIM_MS = 650;
const CTA_ANIM_MS = 900;

function HeroHeading({
  subtitle = "with a clean, fast search across the world's film database.",
  onGetStarted,
}) {
  const [displayedText, setDisplayedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [showAttribution, setShowAttribution] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const [showArrow, setShowArrow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timers = [];

    function wait(ms) {
      return new Promise((resolve) => {
        timers.push(window.setTimeout(resolve, ms));
      });
    }

    async function typeWord(word) {
      for (let length = 1; length <= word.length; length += 1) {
        if (cancelled) return;
        setDisplayedText(word.slice(0, length));
        await wait(TYPE_CHAR_MS);
      }
    }

    async function deleteWord(word) {
      for (let length = word.length; length >= 0; length -= 1) {
        if (cancelled) return;
        setDisplayedText(word.slice(0, length));
        await wait(DELETE_CHAR_MS);
      }
    }

    async function runSequence() {
      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      ).matches;

      if (prefersReducedMotion) {
        setDisplayedText(TYPING_WORDS[TYPING_WORDS.length - 1]);
        setShowCursor(false);
        setShowAttribution(true);
        setShowButton(true);
        setShowArrow(true);
        return;
      }

      await wait(INITIAL_DELAY_MS);
      if (cancelled) return;

      for (let index = 0; index < TYPING_WORDS.length; index += 1) {
        const word = TYPING_WORDS[index];

        if (index > 0) {
          await deleteWord(TYPING_WORDS[index - 1]);
          if (cancelled) return;
          await wait(PAUSE_BETWEEN_WORDS_MS);
          if (cancelled) return;
        }

        await typeWord(word);
        if (cancelled) return;

        if (index < TYPING_WORDS.length - 1) {
          await wait(WORD_HOLD_MS);
          if (cancelled) return;
        }
      }

      await wait(WORD_HOLD_MS);
      if (cancelled) return;

      setShowCursor(false);
      setShowAttribution(true);
      await wait(ATTRIBUTION_ANIM_MS);
      if (cancelled) return;

      setShowButton(true);
      await wait(CTA_ANIM_MS);
      if (!cancelled) setShowArrow(true);
    }

    runSequence();

    return () => {
      cancelled = true;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  return (
    <div className="hero-heading">
      <h1 className="hero-heading__title">
        Find any{' '}
        <span className="hero-heading__word-slot" aria-live="polite">
          <span className="hero-heading__typed-word">{displayedText}</span>
          <span
            className={
              showCursor
                ? 'hero-heading__cursor'
                : 'hero-heading__cursor hero-heading__cursor--hidden'
            }
            aria-hidden="true"
          />
        </span>
        .
      </h1>
      {subtitle ? <p className="hero-heading__subtitle">{subtitle}</p> : null}
      <div className="hero-heading__attribution-slot">
        <div className="hero-heading__attribution-track">
          {showAttribution ? (
            <p className="hero-heading__attribution hero-heading__attribution--visible">
              Powered by <span className="hero-heading__attribution-brand">TMDB</span>
            </p>
          ) : null}
        </div>
      </div>
      {showButton ? (
        <div className="hero-heading__cta hero-heading__cta--visible">
          <PillButton onClick={onGetStarted}>Let&apos;s get started</PillButton>
          {showArrow ? (
            <div className="hero-heading__arrow hero-heading__arrow--visible" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export default HeroHeading;
