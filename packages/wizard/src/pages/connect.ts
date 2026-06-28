import { state, toggleService, setServiceUsername, notify } from '../state.js';

interface ServiceInfo {
  id: string;
  name: string;
  authType: string;
  description: string;
  credentialLabel: string;
  credentialPlaceholder: string;
}

const SERVICES: ServiceInfo[] = [
  { id: 'github', name: 'GitHub', authType: 'Public API', description: 'Repos, commits, languages, streak', credentialLabel: 'Username', credentialPlaceholder: 'your-github-username' },
  { id: 'spotify', name: 'Spotify', authType: 'OAuth 2.0', description: 'Now playing, recent tracks, genres', credentialLabel: 'OAuth setup required', credentialPlaceholder: 'See docs for OAuth setup' },
  { id: 'youtube-music', name: 'YouTube Music', authType: 'API Key', description: 'Liked songs, recently played', credentialLabel: 'Channel ID', credentialPlaceholder: 'UCxxxxxxxx' },
  { id: 'chess-com', name: 'Chess.com', authType: 'Public API', description: 'Ratings, recent games, win rate', credentialLabel: 'Username', credentialPlaceholder: 'your-chess-username' },
  { id: 'lichess', name: 'Lichess', authType: 'Public API', description: 'Ratings, game history, stats', credentialLabel: 'Username', credentialPlaceholder: 'your-lichess-username' },
  { id: 'letterboxd', name: 'Letterboxd', authType: 'RSS Feed', description: 'Films watched, ratings', credentialLabel: 'Username', credentialPlaceholder: 'your-letterboxd-username' },
  { id: 'goodreads', name: 'Goodreads', authType: 'RSS Feed', description: 'Currently reading, book count', credentialLabel: 'User ID', credentialPlaceholder: 'numeric-user-id' },
  { id: 'strava', name: 'Strava', authType: 'OAuth 2.0', description: 'Activities, distance, elevation', credentialLabel: 'OAuth setup required', credentialPlaceholder: 'See docs for OAuth setup' },
];

export function renderConnect(container: HTMLElement): void {
  container.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'wizard-step-header';
  header.innerHTML = `
    <h2>Connect Your Services</h2>
    <p>Select the services you want to show on your live identity card. Each service is optional.</p>
  `;
  container.appendChild(header);

  const usernameSection = document.createElement('div');
  usernameSection.className = 'wizard-field';
  usernameSection.innerHTML = `
    <label for="st-username">Your GitHub Username</label>
    <input type="text" id="st-username" value="${state.username}" placeholder="your-github-username" />
    <span class="wizard-hint">This determines where your ScrobbleTime instance lives</span>
  `;
  container.appendChild(usernameSection);

  const input = usernameSection.querySelector('#st-username') as HTMLInputElement;
  input.addEventListener('input', () => {
    state.username = input.value.trim();
    notify();
  });

  const grid = document.createElement('div');
  grid.className = 'wizard-service-grid';

  for (const svc of SERVICES) {
    const card = createServiceCard(svc);
    grid.appendChild(card);
  }

  container.appendChild(grid);
}

function createServiceCard(info: ServiceInfo): HTMLElement {
  const svcState = state.services[info.id];
  const card = document.createElement('div');
  card.className = `wizard-service-card${svcState.enabled ? ' active' : ''}`;

  card.innerHTML = `
    <div class="wizard-service-header">
      <div class="wizard-service-info">
        <span class="wizard-service-name">${info.name}</span>
        <span class="wizard-service-auth">${info.authType}</span>
      </div>
      <label class="wizard-toggle">
        <input type="checkbox" ${svcState.enabled ? 'checked' : ''} />
        <span class="wizard-toggle-track"></span>
      </label>
    </div>
    <p class="wizard-service-desc">${info.description}</p>
    <div class="wizard-service-credential" style="display: ${svcState.enabled ? 'block' : 'none'}">
      <label>${info.credentialLabel}</label>
      <input type="text" value="${svcState.username}" placeholder="${info.credentialPlaceholder}" />
    </div>
  `;

  const toggle = card.querySelector('input[type="checkbox"]') as HTMLInputElement;
  const credentialDiv = card.querySelector('.wizard-service-credential') as HTMLElement;
  const credentialInput = credentialDiv.querySelector('input') as HTMLInputElement;

  toggle.addEventListener('change', () => {
    toggleService(info.id, toggle.checked);
    card.classList.toggle('active', toggle.checked);
    credentialDiv.style.display = toggle.checked ? 'block' : 'none';
  });

  credentialInput.addEventListener('input', () => {
    setServiceUsername(info.id, credentialInput.value.trim());
  });

  return card;
}
