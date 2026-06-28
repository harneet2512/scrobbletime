import { writeFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';
import type { ActivityData } from '@scrobbletime/schema';

const mockData: ActivityData = {
  version: 1,
  lastSync: new Date().toISOString(),
  user: {
    displayName: 'Harneet',
    bio: 'Building things with code, music, and curiosity',
    avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
    website: 'https://harneet.dev',
  },
  services: {
    github: { service: 'github', status: 'active', lastSync: new Date().toISOString() },
    spotify: { service: 'spotify', status: 'active', lastSync: new Date().toISOString() },
    'chess-com': { service: 'chess-com', status: 'active', lastSync: new Date().toISOString() },
    letterboxd: { service: 'letterboxd', status: 'stale', lastSync: new Date(Date.now() - 3600000).toISOString(), error: 'RSS timeout' },
    goodreads: { service: 'goodreads', status: 'active', lastSync: new Date().toISOString() },
  },
  now: {
    service: 'spotify',
    type: 'listening',
    title: 'Everything In Its Right Place',
    subtitle: 'Radiohead',
    url: 'https://open.spotify.com/track/xyz',
  },
  recent: [
    {
      id: 'github-1',
      service: 'github',
      type: 'commit',
      title: 'Pushed 3 commits to scrobbletime',
      subtitle: 'feat: add card layout renderer',
      url: 'https://github.com/harneet/scrobbletime',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'chess-1',
      service: 'chess-com',
      type: 'game',
      title: 'vs magnus_fan_42',
      subtitle: 'Win (1847)',
      url: 'https://chess.com/game/123',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      metadata: { result: 'Win', rating: 1847, opponentRating: 1832 },
    },
    {
      id: 'spotify-1',
      service: 'spotify',
      type: 'track',
      title: 'Idioteque',
      subtitle: 'Radiohead',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 'letterboxd-1',
      service: 'letterboxd',
      type: 'film',
      title: 'The Brutalist',
      subtitle: '4.5 stars',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      metadata: { rating: 4.5, year: '2024' },
    },
    {
      id: 'goodreads-1',
      service: 'goodreads',
      type: 'book',
      title: 'Designing Data-Intensive Applications',
      subtitle: 'Martin Kleppmann',
      timestamp: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: 'github-2',
      service: 'github',
      type: 'pr',
      title: 'Add embed Web Component',
      url: 'https://github.com/harneet/scrobbletime/pull/1',
      timestamp: new Date(Date.now() - 259200000).toISOString(),
    },
  ],
  stats: {
    github: {
      service: 'github',
      label: 'GitHub',
      items: [
        { key: 'commitsWeek', label: 'Commits This Week', value: 23 },
        { key: 'publicRepos', label: 'Public Repos', value: 42 },
        { key: 'languages', label: 'Top Languages', value: 'TypeScript, Python, Go' },
      ],
    },
    'chess-com': {
      service: 'chess-com',
      label: 'Chess.com',
      items: [
        { key: 'blitz', label: 'Blitz', value: 1847, trend: 'up' },
        { key: 'rapid', label: 'Rapid', value: 2012, trend: 'flat' },
        { key: 'winRate', label: 'Win Rate', value: 54, unit: '%' },
      ],
    },
    goodreads: {
      service: 'goodreads',
      label: 'Goodreads',
      items: [
        { key: 'currentlyReading', label: 'Currently Reading', value: 'Designing Data-Intensive Applications' },
        { key: 'bookCount', label: 'Books 2026', value: 12, unit: 'books' },
      ],
    },
    letterboxd: {
      service: 'letterboxd',
      label: 'Letterboxd',
      items: [
        { key: 'filmCount', label: 'Films 2026', value: 47, unit: 'films' },
        { key: 'avgRating', label: 'Avg Rating', value: 3.8, unit: 'stars' },
      ],
    },
  },
};

const outputDir = resolve(process.cwd(), 'output');
mkdirSync(outputDir, { recursive: true });
writeFileSync(resolve(outputDir, 'activity.json'), JSON.stringify(mockData, null, 2));
console.log('Mock activity.json generated at output/activity.json');
