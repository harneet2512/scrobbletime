export type Step = 0 | 1 | 2 | 3;

export interface ServiceState {
  enabled: boolean;
  username: string;
  visibility: Record<string, boolean>;
}

export interface WizardState {
  currentStep: Step;
  username: string;
  services: Record<string, ServiceState>;
  layout: 'signature' | 'card' | 'profile';
  theme: 'professional' | 'minimal' | 'playful' | 'auto';
  density: 'compact' | 'comfortable';
}

type Listener = () => void;

const listeners = new Set<Listener>();

const defaultServices: Record<string, ServiceState> = {
  github: { enabled: false, username: '', visibility: { currentProject: true, languages: true, commitStreak: true, recentCommits: true, publicRepos: true, followers: true } },
  spotify: { enabled: false, username: '', visibility: { nowPlaying: true, recentTracks: true, topGenres: true } },
  'youtube-music': { enabled: false, username: '', visibility: { recentLiked: true, likedCount: true } },
  'chess-com': { enabled: false, username: '', visibility: { ratings: true, recentGames: true, winRate: true, totalGames: true } },
  lichess: { enabled: false, username: '', visibility: { ratings: true, recentGames: true, winRate: true, totalGames: true } },
  letterboxd: { enabled: false, username: '', visibility: { recentFilms: true, filmCount: true, ratings: true } },
  goodreads: { enabled: false, username: '', visibility: { currentlyReading: true, recentBooks: true, bookCount: true, ratings: true } },
  strava: { enabled: false, username: '', visibility: { recentActivities: true, totalDistance: true, totalActivities: true, ytdStats: true } },
};

export const state: WizardState = {
  currentStep: 0,
  username: '',
  services: JSON.parse(JSON.stringify(defaultServices)),
  layout: 'card',
  theme: 'auto',
  density: 'comfortable',
};

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notify(): void {
  for (const fn of listeners) fn();
}

export function setStep(step: Step): void {
  state.currentStep = step;
  notify();
}

export function toggleService(id: string, enabled: boolean): void {
  if (state.services[id]) {
    state.services[id].enabled = enabled;
    notify();
  }
}

export function setServiceUsername(id: string, username: string): void {
  if (state.services[id]) {
    state.services[id].username = username;
    notify();
  }
}

export function toggleVisibility(serviceId: string, field: string, visible: boolean): void {
  if (state.services[serviceId]) {
    state.services[serviceId].visibility[field] = visible;
    notify();
  }
}

export function generateConfig(): object {
  const services: Record<string, object> = {};

  for (const [id, svc] of Object.entries(state.services)) {
    if (!svc.enabled) continue;
    services[id] = {
      enabled: true,
      ...(svc.username ? { username: svc.username } : {}),
      visibility: { ...svc.visibility },
    };
  }

  return {
    version: 1,
    username: state.username,
    syncInterval: '30m',
    services,
    embed: {
      layout: state.layout,
      theme: state.theme,
      density: state.density,
    },
  };
}

export function generateSnippet(): string {
  return `<script
  src="https://${state.username}.github.io/scrobbletime/scrobbletime.js"
  data-user="${state.username}"
  data-layout="${state.layout}"
  data-theme="${state.theme}"
  data-density="${state.density}">
</script>`;
}
