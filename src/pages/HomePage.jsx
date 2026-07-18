import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import Footer from '../components/Footer';
import LandingPage from './LandingPage';
import SearchPage from './SearchPage';
import SuggestPage from './SuggestPage';
import './HomePage.css';

const SECTION_IDS = {
  search: 'search',
  suggest: 'suggest',
};

export default function HomePage() {
  const location = useLocation();
  const searchSectionRef = useRef(null);
  const suggestSectionRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.add('home-page-active');

    return () => {
      document.documentElement.classList.remove('home-page-active');
    };
  }, []);

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    const scrollState = location.state?.scrollTo;

    // No hash/state → stay at the landing section (e.g. after a reload reset).
    if (!hash && !scrollState) {
      window.scrollTo(0, 0);
      return undefined;
    }

    let target = null;
    if (hash === SECTION_IDS.search || scrollState === SECTION_IDS.search) {
      target = searchSectionRef.current;
    } else if (hash === SECTION_IDS.suggest || scrollState === SECTION_IDS.suggest) {
      target = suggestSectionRef.current;
    }

    if (!target) {
      return undefined;
    }

    const frame = window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: 'smooth' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.hash, location.state]);

  function handleGetStarted() {
    searchSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleLetUsHelp() {
    suggestSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  const searchResetKey = location.state?.resetSearch ?? 'search';

  return (
    <div className="home-scroll">
      <section
        id="home"
        className="home-scroll__section home-scroll__section--landing"
      >
        <LandingPage onGetStarted={handleGetStarted} embedded />
      </section>
      <section
        id={SECTION_IDS.search}
        ref={searchSectionRef}
        className="home-scroll__section home-scroll__section--search"
      >
        <SearchPage key={searchResetKey} embedded onLetUsHelp={handleLetUsHelp} />
      </section>
      <section
        id={SECTION_IDS.suggest}
        ref={suggestSectionRef}
        className="home-scroll__section home-scroll__section--suggest"
      >
        <div className="home-scroll__suggest-viewport">
          <SuggestPage embedded />
        </div>
        <Footer />
      </section>
    </div>
  );
}
