import { state, toggleVisibility } from '../state.js';

const FIELD_LABELS: Record<string, Record<string, string>> = {
  github: {
    currentProject: 'Current Project',
    languages: 'Top Languages',
    commitStreak: 'Commit Streak',
    recentCommits: 'Recent Commits',
    publicRepos: 'Public Repos',
    followers: 'Followers',
  },
  spotify: {
    nowPlaying: 'Now Playing',
    recentTracks: 'Recent Tracks',
    topGenres: 'Top Genres',
  },
  'youtube-music': {
    recentLiked: 'Recently Liked',
    likedCount: 'Liked Songs Count',
  },
  'chess-com': {
    ratings: 'Ratings',
    recentGames: 'Recent Games',
    winRate: 'Win Rate',
    totalGames: 'Total Games',
  },
  lichess: {
    ratings: 'Ratings',
    recentGames: 'Recent Games',
    winRate: 'Win Rate',
    totalGames: 'Total Games',
  },
  letterboxd: {
    recentFilms: 'Recent Films',
    filmCount: 'Film Count',
    ratings: 'Ratings',
  },
  goodreads: {
    currentlyReading: 'Currently Reading',
    recentBooks: 'Recent Books',
    bookCount: 'Book Count',
    ratings: 'Ratings',
  },
  strava: {
    recentActivities: 'Recent Activities',
    totalDistance: 'Total Distance',
    totalActivities: 'Total Activities',
    ytdStats: 'Year-to-Date Stats',
  },
};

const SERVICE_NAMES: Record<string, string> = {
  github: 'GitHub',
  spotify: 'Spotify',
  'youtube-music': 'YouTube Music',
  'chess-com': 'Chess.com',
  lichess: 'Lichess',
  letterboxd: 'Letterboxd',
  goodreads: 'Goodreads',
  strava: 'Strava',
};

export function renderConfigure(container: HTMLElement): void {
  container.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'wizard-step-header';
  header.innerHTML = `
    <h2>Choose Visible Fields</h2>
    <p>For each connected service, choose what appears on your public identity card. Hidden data is never written to your public activity file.</p>
  `;
  container.appendChild(header);

  const enabledServices = Object.entries(state.services)
    .filter(([, svc]) => svc.enabled);

  if (enabledServices.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'wizard-empty';
    empty.textContent = 'No services connected yet. Go back and connect at least one service.';
    container.appendChild(empty);
    return;
  }

  for (const [id, svc] of enabledServices) {
    const section = document.createElement('div');
    section.className = 'wizard-visibility-section';

    const title = document.createElement('h3');
    title.textContent = SERVICE_NAMES[id] ?? id;
    section.appendChild(title);

    const fields = FIELD_LABELS[id] ?? {};
    for (const [field, label] of Object.entries(fields)) {
      const row = document.createElement('div');
      row.className = 'wizard-field-row';

      row.innerHTML = `
        <span class="wizard-field-label">${label}</span>
        <label class="wizard-toggle">
          <input type="checkbox" ${svc.visibility[field] !== false ? 'checked' : ''} />
          <span class="wizard-toggle-track"></span>
        </label>
      `;

      const checkbox = row.querySelector('input') as HTMLInputElement;
      checkbox.addEventListener('change', () => {
        toggleVisibility(id, field, checkbox.checked);
      });

      section.appendChild(row);
    }

    container.appendChild(section);
  }
}
