import HeroHeading from '../components/HeroHeading';
import './LandingPage.css';

export default function LandingPage({ onGetStarted, embedded = false }) {
  const className = embedded ? 'landing-page landing-page--embedded' : 'landing-page';

  return (
    <div className={className}>
      <HeroHeading subtitle="" onGetStarted={onGetStarted} />
    </div>
  );
}
