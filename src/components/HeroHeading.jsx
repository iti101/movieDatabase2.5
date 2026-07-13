import './HeroHeading.css';

function HeroHeading({
  title = 'Find any movie.',
  subtitle = "with a clean, fast search across the world's film database.",
}) {
  return (
    <div className="hero-heading">
      <h1 className="hero-heading__title">{title}</h1>
      <p className="hero-heading__subtitle">{subtitle}</p>
    </div>
  );
}

export default HeroHeading;
