import { useRef } from 'react';
import LandingPage from './LandingPage';
import SearchPage from './SearchPage';
import SuggestPage from './SuggestPage';
import './HomePage.css';

export default function HomePage() {
  const searchSectionRef = useRef(null);
  const suggestSectionRef = useRef(null);

  function handleGetStarted() {
    searchSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function handleLetUsHelp() {
    suggestSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="home-scroll">
      <section className="home-scroll__section home-scroll__section--landing">
        <LandingPage onGetStarted={handleGetStarted} embedded />
      </section>
      <section
        ref={searchSectionRef}
        className="home-scroll__section home-scroll__section--search"
      >
        <SearchPage embedded onLetUsHelp={handleLetUsHelp} />
      </section>
      <section
        ref={suggestSectionRef}
        className="home-scroll__section home-scroll__section--suggest"
      >
        <SuggestPage embedded />
      </section>
    </div>
  );
}
