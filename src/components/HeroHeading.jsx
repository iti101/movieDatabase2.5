import { useEffect, useState } from 'react';
import PillButton from './PillButton';
import './HeroHeading.css';

const ROTATING_WORDS = ['movie', 'show', 'episode'];
const INITIAL_DELAY_MS = 800;
const WORD_INTERVAL_MS = 1000;
const FLIP_DURATION_MS = 550;
const LAST_WORD_INDEX = ROTATING_WORDS.length - 1;

function HeroHeading({
  subtitle = "with a clean, fast search across the world's film database.",
  onGetStarted,
}) {
  const [wordIndex, setWordIndex] = useState(0);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    if (wordIndex >= LAST_WORD_INDEX) return undefined;

    const delay = wordIndex === 0 ? INITIAL_DELAY_MS : WORD_INTERVAL_MS;
    const timer = window.setTimeout(() => {
      setWordIndex((current) => current + 1);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [wordIndex]);

  useEffect(() => {
    if (wordIndex < LAST_WORD_INDEX) return undefined;

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const delay = prefersReducedMotion ? 0 : FLIP_DURATION_MS;
    const timer = window.setTimeout(() => {
      setShowButton(true);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [wordIndex]);

  return (
    <div className="hero-heading">
      <h1 className="hero-heading__title">
        Find any{' '}
        <span className="hero-heading__word-slot" aria-live="polite">
          <span className="hero-heading__word-slot-sizer" aria-hidden="true">
            episode
          </span>
          <span
            key={wordIndex}
            className={
              wordIndex > 0
                ? 'hero-heading__rotating-word hero-heading__rotating-word--enter'
                : 'hero-heading__rotating-word'
            }
          >
            {ROTATING_WORDS[wordIndex]}
          </span>
        </span>
        .
      </h1>
      {subtitle ? <p className="hero-heading__subtitle">{subtitle}</p> : null}
      {showButton ? (
        <div className="hero-heading__cta hero-heading__cta--visible">
          <PillButton onClick={onGetStarted}>Let&apos;s get started</PillButton>
        </div>
      ) : null}
    </div>
  );
}

export default HeroHeading;
