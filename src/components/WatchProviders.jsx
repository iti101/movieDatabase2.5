import { useEffect, useMemo, useState } from 'react';
import { getWatchProviderRegions } from '../services/tmdb';
import './WatchProviders.css';

const PROVIDER_GROUPS = [
  { key: 'stream', label: 'Stream' },
  { key: 'rent', label: 'Rent' },
  { key: 'buy', label: 'Buy' },
];

const REGION_STORAGE_KEY = 'watchProviderRegion';

const EMPTY_PROVIDERS = {
  link: null,
  stream: [],
  rent: [],
  buy: [],
};

function getCountryName(code) {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' }).of(code) ?? code;
  } catch {
    return code;
  }
}

function readStoredRegion() {
  try {
    const stored = localStorage.getItem(REGION_STORAGE_KEY);
    if (typeof stored === 'string' && /^[A-Za-z]{2}$/.test(stored)) {
      return stored.toUpperCase();
    }
  } catch {
    // Ignore storage access errors (private mode, etc.)
  }
  return null;
}

function writeStoredRegion(code) {
  try {
    localStorage.setItem(REGION_STORAGE_KEY, code);
  } catch {
    // Ignore storage access errors
  }
}

function pickInitialRegion(regionCodes, preferredRegion) {
  const stored = readStoredRegion();
  if (stored && regionCodes.includes(stored)) {
    return stored;
  }
  if (preferredRegion && regionCodes.includes(preferredRegion)) {
    return preferredRegion;
  }
  return regionCodes[0] ?? preferredRegion ?? 'US';
}

function hasAnyProviders(providers) {
  if (!providers) {
    return false;
  }

  return PROVIDER_GROUPS.some(
    (group) => (providers[group.key] ?? []).length > 0,
  );
}

export default function WatchProviders({ watchProviders }) {
  const preferredRegion = watchProviders?.preferredRegion ?? 'US';
  const byRegion = watchProviders?.byRegion ?? {};
  const titleRegions = useMemo(
    () => watchProviders?.availableRegions ?? [],
    [watchProviders?.availableRegions],
  );

  const [countryOptions, setCountryOptions] = useState([]);
  const [region, setRegion] = useState(() =>
    pickInitialRegion(titleRegions, preferredRegion),
  );

  useEffect(() => {
    let cancelled = false;

    async function loadRegions() {
      try {
        const regions = await getWatchProviderRegions();
        if (!cancelled && regions.length > 0) {
          setCountryOptions(regions);
          return;
        }
      } catch {
        // Fall back to countries present on this title
      }

      if (!cancelled) {
        setCountryOptions(
          titleRegions
            .map((code) => ({
              code,
              label: getCountryName(code),
            }))
            .sort((a, b) => a.label.localeCompare(b.label)),
        );
      }
    }

    loadRegions();

    return () => {
      cancelled = true;
    };
  }, [titleRegions]);

  const regionCodes = useMemo(
    () => countryOptions.map((option) => option.code),
    [countryOptions],
  );

  useEffect(() => {
    if (regionCodes.length === 0) {
      return;
    }
    setRegion((current) =>
      regionCodes.includes(current)
        ? current
        : pickInitialRegion(regionCodes, preferredRegion),
    );
  }, [regionCodes, preferredRegion]);

  function handleRegionChange(event) {
    const next = event.target.value;
    setRegion(next);
    writeStoredRegion(next);
  }

  const selectedProviders = byRegion[region] ?? EMPTY_PROVIDERS;
  const available = hasAnyProviders(selectedProviders);
  const countryLabel =
    countryOptions.find((option) => option.code === region)?.label ??
    getCountryName(region);

  return (
    <section
      className="watch-providers"
      aria-labelledby="watch-providers-heading"
    >
      <div className="watch-providers__header">
        <h2 id="watch-providers-heading" className="watch-providers__title">
          Where to watch
        </h2>

        {countryOptions.length > 0 ? (
          <label className="watch-providers__country">
            <span className="watch-providers__country-label">Country</span>
            <select
              className="watch-providers__country-select"
              value={regionCodes.includes(region) ? region : regionCodes[0]}
              onChange={handleRegionChange}
              aria-label="Country for streaming availability"
            >
              {countryOptions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {available ? (
        <>
          {PROVIDER_GROUPS.map((group) => {
            const providers = selectedProviders[group.key] ?? [];
            if (providers.length === 0) {
              return null;
            }

            return (
              <div key={group.key} className="watch-providers__group">
                <h3 className="watch-providers__group-label">{group.label}</h3>
                <ul className="watch-providers__list">
                  {providers.map((provider) => (
                    <li key={provider.id} className="watch-providers__item">
                      <img
                        className="watch-providers__logo"
                        src={provider.logoUrl}
                        alt=""
                        loading="lazy"
                        decoding="async"
                      />
                      <span className="watch-providers__name">
                        {provider.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          <p className="watch-providers__attribution">
            {selectedProviders.link ? (
              <>
                Availability via{' '}
                <a
                  href={selectedProviders.link}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  JustWatch
                </a>
                {` (${countryLabel})`}.
              </>
            ) : (
              <>Streaming data from JustWatch ({countryLabel}).</>
            )}
          </p>
        </>
      ) : (
        <p className="watch-providers__empty">
          No streaming information available for this title
          {region ? ` in ${countryLabel}` : ''}.
        </p>
      )}
    </section>
  );
}
