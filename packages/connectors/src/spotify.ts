import type { Connector, ConnectorConfig, ConnectorResult } from '@scrobbletime/schema';
import type { NowActivity, RecentEvent, StatItem } from '@scrobbletime/schema';
import { fetchJson } from './utils/http.js';
import { refreshOAuthToken } from './utils/oauth-refresh.js';

const SPOTIFY_TOKEN_URL = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API = 'https://api.spotify.com/v1';

interface SpotifyTrack {
  name: string;
  artists: Array<{ name: string }>;
  album: { name: string; images: Array<{ url: string; width: number }> };
  external_urls: { spotify: string };
  duration_ms: number;
}

interface SpotifyCurrentlyPlaying {
  is_playing: boolean;
  item: SpotifyTrack | null;
  progress_ms: number;
}

interface SpotifyRecentItem {
  track: SpotifyTrack;
  played_at: string;
}

interface SpotifyArtist {
  name: string;
  genres: string[];
}

export const spotifyConnector: Connector = {
  serviceId: 'spotify',
  displayName: 'Spotify',
  authType: 'oauth2',
  requiredCredentials: ['clientId', 'clientSecret', 'refreshToken'],
  availableFields: ['nowPlaying', 'recentTracks', 'topGenres'],

  async fetch(config: ConnectorConfig): Promise<ConnectorResult> {
    const { clientId, clientSecret, refreshToken } = config.credentials;

    try {
      const tokens = await refreshOAuthToken(
        SPOTIFY_TOKEN_URL, clientId, clientSecret, refreshToken,
      );
      const headers = { 'Authorization': `Bearer ${tokens.access_token}` };

      const [currentlyPlaying, recentTracks, topArtists] = await Promise.all([
        fetchCurrentlyPlaying(headers),
        fetchJson<{ items: SpotifyRecentItem[] }>(
          `${SPOTIFY_API}/me/player/recently-played?limit=10`,
          { headers },
        ).catch(() => ({ items: [] })),
        fetchJson<{ items: SpotifyArtist[] }>(
          `${SPOTIFY_API}/me/top/artists?time_range=short_term&limit=10`,
          { headers },
        ).catch(() => ({ items: [] })),
      ]);

      const now: NowActivity | null = currentlyPlaying?.is_playing && currentlyPlaying.item
        ? {
            service: 'spotify',
            type: 'listening',
            title: currentlyPlaying.item.name,
            subtitle: currentlyPlaying.item.artists.map((a) => a.name).join(', '),
            url: currentlyPlaying.item.external_urls.spotify,
            imageUrl: currentlyPlaying.item.album.images[0]?.url,
          }
        : null;

      const recent: RecentEvent[] = recentTracks.items.map((item) => ({
        id: `spotify-${item.played_at}`,
        service: 'spotify' as const,
        type: 'track' as const,
        title: item.track.name,
        subtitle: item.track.artists.map((a) => a.name).join(', '),
        url: item.track.external_urls.spotify,
        imageUrl: item.track.album.images[0]?.url,
        timestamp: item.played_at,
      }));

      const genres = extractTopGenres(topArtists.items);
      const statItems: StatItem[] = [];

      if (genres.length > 0) {
        statItems.push({
          key: 'topGenres',
          label: 'Top Genres',
          value: genres.slice(0, 4).join(', '),
        });
      }

      statItems.push({
        key: 'recentCount',
        label: 'Recently Played',
        value: recentTracks.items.length,
        unit: 'tracks',
      });

      return {
        service: 'spotify',
        success: true,
        data: {
          now,
          recent,
          stats: { service: 'spotify', label: 'Spotify', items: statItems },
        },
      };
    } catch (error) {
      return {
        service: 'spotify',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        data: { now: null, recent: [], stats: { service: 'spotify', label: 'Spotify', items: [] } },
      };
    }
  },
};

async function fetchCurrentlyPlaying(
  headers: Record<string, string>,
): Promise<SpotifyCurrentlyPlaying | null> {
  try {
    const response = await fetch(`${SPOTIFY_API}/me/player/currently-playing`, {
      headers: { ...headers, 'User-Agent': 'ScrobbleTime/0.1' },
    });
    if (response.status === 204) return null;
    if (!response.ok) return null;
    return await response.json() as SpotifyCurrentlyPlaying;
  } catch {
    return null;
  }
}

function extractTopGenres(artists: SpotifyArtist[]): string[] {
  const genreCounts: Record<string, number> = {};
  for (const artist of artists) {
    for (const genre of artist.genres) {
      genreCounts[genre] = (genreCounts[genre] ?? 0) + 1;
    }
  }
  return Object.entries(genreCounts)
    .sort(([, a], [, b]) => b - a)
    .map(([genre]) => genre);
}
