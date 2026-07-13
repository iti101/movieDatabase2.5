import LandingPage from './LandingPage';
import SearchPage from './SearchPage';
import './HomePage.css';

export default function HomePage() {
  return (
    <div className="home-scroll">
      <section className="home-scroll__section home-scroll__section--landing">
        <LandingPage />
      </section>
      <section className="home-scroll__section home-scroll__section--search">
        <SearchPage />
      </section>
    </div>
  );
}
