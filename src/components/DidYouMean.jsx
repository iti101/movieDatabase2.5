import './DidYouMean.css';

export default function DidYouMean({ query, suggestion, onSelect }) {
  if (!query || !suggestion) {
    return null;
  }

  return (
    <div className="did-you-mean" role="status">
      <p className="did-you-mean__miss">
        Unable to find &ldquo;{query}&rdquo;
      </p>
      <p className="did-you-mean__hint">
        Did you mean{' '}
        <button
          type="button"
          className="did-you-mean__suggestion"
          onClick={() => onSelect?.(suggestion)}
        >
          {suggestion}
        </button>
        ?
      </p>
    </div>
  );
}
