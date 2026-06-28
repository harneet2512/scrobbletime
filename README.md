# ScrobbleTime

A live identity embed for personal websites. Aggregates your activity from GitHub, Spotify, YouTube Music, Chess.com, Lichess, Letterboxd, Goodreads, and Strava into one clean, embeddable card.

## Quick Start

1. Fork this repository
2. Copy `templates/scrobbletime.config.json` to the repo root and configure your services
3. Add required secrets (Settings → Secrets → Actions)
4. Enable GitHub Actions and GitHub Pages
5. Add the embed to your site:

```html
<script
  src="https://YOUR-USERNAME.github.io/scrobbletime/scrobbletime.js"
  data-user="YOUR-USERNAME"
  data-layout="card"
  data-theme="auto">
</script>
```

## Layouts

- **Signature** — One-line identity summary for bios and footers
- **Card** — Default layout for sidebars and about sections
- **Profile** — Full section for /now and /about pages

## Themes

- **Auto** — Follows system light/dark preference
- **Professional** — Clean, restrained, portfolio-safe
- **Minimal** — Typography-focused, nearly invisible styling
- **Playful** — Warm accents, rounded corners

## Supported Services

| Service | Auth Type | Data |
|---------|-----------|------|
| GitHub | Public API | Repos, commits, languages, streak |
| Spotify | OAuth 2.0 | Now playing, recent tracks, genres |
| YouTube Music | API Key | Liked songs, recently played |
| Chess.com | None | Ratings, games, win rate |
| Lichess | None | Ratings, games, stats |
| Letterboxd | RSS | Films, ratings |
| Goodreads | RSS | Currently reading, book count |
| Strava | OAuth 2.0 | Activities, distance, stats |

## Development

```bash
npm install
npm run build:schema
npm run build:connectors
npm run build:embed
npm run dev:wizard     # Start wizard dev server
npm run dev:embed      # Start embed dev server
npm run sync           # Run data sync locally
```

## Architecture

```
Services → Connectors → Universal Schema → activity.json → Embed Script → Your Website
```

The embed is a single `<script>` tag that renders a Web Component with Shadow DOM isolation. Data syncs every 30 minutes via GitHub Actions and is served as a static JSON file from GitHub Pages.

## License

MIT
