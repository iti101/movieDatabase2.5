# movieDatabase2.5

React + Vite movie/TV browser with TMDB search and NOVI-backed auth, watchlists, and reviews.

## Quick start

```bash
git clone https://github.com/iti101/movieDatabase2.5.git
cd movieDatabase2.5
npm install
cp .env.example .env   # then fill in VITE_TMDB_API_KEY and VITE_NOVI_PROJECT_ID
npm run dev
```

---

# Installation Manual

This guide explains how to set up and run **movieDatabase2.5** locally so it behaves the same as the shared development environment.

The app is a **React + Vite** frontend. Movie/TV data comes from **TMDB**. Auth, profiles, watchlists, and reviews are stored on the **NOVI** education backend.

## Prerequisites

Install these before cloning the repo:

| Dependency | Version | Notes |
|---|---|---|
| **Node.js** | **20.19+** or **22.12+** | Required by Vite 8. Node 24 also works. |
| **npm** | Comes with Node | `npm` is the package manager used by this project. |
| **Git** | Any recent version | Needed to clone the repository. |
| Modern browser | Chrome, Firefox, Edge, Safari | Used to open the local dev server. |

Check your versions:

```bash
node -v
npm -v
```

## 1. Clone the repository

```bash
git clone https://github.com/iti101/movieDatabase2.5.git
cd movieDatabase2.5
```

If you already have a fork or SSH remote, use that URL instead.

## 2. Install npm dependencies

From the project root:

```bash
npm install
```

This installs the runtime and tooling packages declared in `package.json`, including:

**Runtime**

- `react` / `react-dom`
- `react-router-dom`

**Development / build**

- `vite`
- `@vitejs/plugin-react`
- `babel-plugin-react-compiler` (+ related Babel/Rolldown plugins)
- `eslint` and React ESLint plugins

You do **not** need a separate backend server process for local UI work; TMDB and NOVI are remote APIs.

## 3. Create environment variables

The app reads secrets from a root `.env` file (Vite exposes only variables prefixed with `VITE_`).

1. Copy the example file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

2. Edit `.env` and fill in the required values (see the next sections).

| Variable | Required | Purpose |
|---|---|---|
| `VITE_TMDB_API_KEY` | Yes | Authenticates TMDB search, detail, and provider requests. |
| `VITE_NOVI_PROJECT_ID` | Yes | Selects your NOVI project (sent as `novi-education-project-id`). |
| `VITE_NOVI_API_BASE` | No | Overrides the default NOVI host. |
| `VITE_WATCH_REGION` | No | Two-letter country code for watch providers (e.g. `US`, `NL`). |

`.env` is gitignored. Never commit real API keys or project IDs.

After changing `.env`, restart the Vite dev server so the new values are picked up.

## 4. Obtain a TMDB API key

1. Create a free account at [The Movie Database](https://www.themoviedb.org/signup).
2. Open [API settings](https://www.themoviedb.org/settings/api) and request an API key (developer / v3 auth key).
3. Put the key in `.env`:

```env
VITE_TMDB_API_KEY=paste_your_key_here
```

Without this key, browsing and search will fail with a missing-key error.

## 5. Set up NOVI (auth, watchlists, reviews)

NOVI stores users, profiles, watchlists, watchlist items, and reviews.

### 5.1 Create or open a NOVI project

1. Use the NOVI education backend (default host used by the app):

   `https://novi-backend-api-wgsgz.ondigitalocean.app`

2. Create a project (or reuse an existing one) through your course / NOVI dashboard.
3. Copy the **Project ID** into `.env`:

```env
VITE_NOVI_PROJECT_ID=paste_your_project_id_here
```

Optional custom host:

```env
VITE_NOVI_API_BASE=https://novi-backend-api-wgsgz.ondigitalocean.app
```

### 5.2 Configure collections from `novi-api-config.json`

The repo includes `novi-api-config.json`. Import or recreate that schema in your NOVI project so the frontend endpoints match.

Required collections:

| Collection | Used for |
|---|---|
| `profiles` | Display names linked to users |
| `watchlists` | Named lists per user |
| `watchlistItems` | Titles saved to a list |
| `reviews` | User ratings and review text |

The config file also defines sample users and seed data you can load if your NOVI tooling supports importing the full JSON:

| Email | Password | Role |
|---|---|---|
| `admin@moviedb.test` | `admin123` | admin |
| `demo@moviedb.test` | `demo123` | user |

You can also register a new account from the app’s **Sign up** page once the project ID and collections are in place.

Password rules enforced by the UI: at least **8 characters**, including **1 number** and **1 special character**. The sample passwords above are for seeded NOVI users only; new signups must meet the stricter rules.

## 6. Run the application

### Development server

```bash
npm run dev
```

Vite prints a local URL (usually `http://localhost:5173`). Open it in your browser.

### Production build (optional)

```bash
npm run build
npm run preview
```

- `build` outputs static files to `dist/`
- `preview` serves that build locally for a quick smoke test

### Lint (optional)

```bash
npm run lint
```

## 7. Verify the install

After `npm run dev` starts:

1. **Home / search** — search for a movie title; results should appear (TMDB).
2. **Detail pages** — open a movie or TV title; poster and metadata should load.
3. **Auth** — sign up or sign in with a NOVI user; you should land in an authenticated session.
4. **Watchlist / reviews** — save a title or write a review; data should persist after refresh (NOVI).

If something fails, check the browser console and the terminal running Vite.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `TMDB API key is missing` | Empty or unset `VITE_TMDB_API_KEY` | Add the key to `.env` and restart `npm run dev`. |
| `Missing VITE_NOVI_PROJECT_ID` | Empty project ID | Set `VITE_NOVI_PROJECT_ID` and restart. |
| Login / register / watchlist errors | Wrong project ID, missing collections, or wrong API base | Confirm NOVI project setup against `novi-api-config.json`. |
| Env changes ignored | Dev server started before `.env` edit | Stop Vite (Ctrl+C) and run `npm run dev` again. |
| `npm install` / Vite fails on old Node | Node below 20.19 / 22.12 | Upgrade Node, then reinstall (`rm -rf node_modules` then `npm install`). |
| Blank page / module errors | Incomplete install | Delete `node_modules` and `package-lock.json`, run `npm install` again. |

## Project scripts reference

| Script | Command | Description |
|---|---|---|
| Dev server | `npm run dev` | Hot-reload development build |
| Production build | `npm run build` | Build optimized assets into `dist/` |
| Preview build | `npm run preview` | Serve the production build locally |
| Lint | `npm run lint` | Run ESLint on the project |

## Architecture (quick context)

```text
Browser (React + Vite)
   ├── TMDB API          → search, details, people, watch providers
   └── NOVI backend      → login/register, profiles, watchlists, reviews
```

No local database is required. All persistent app data for accounts and lists lives in your NOVI project.
