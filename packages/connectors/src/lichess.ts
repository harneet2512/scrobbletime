import type { Connector, ConnectorConfig, ConnectorResult } from '@scrobbletime/schema';
import type { RecentEvent, StatItem } from '@scrobbletime/schema';
import { fetchJson } from './utils/http.js';

interface LichessUser {
  id: string;
  username: string;
  perfs: Record<string, LichessPerf>;
  count: { all: number; win: number; loss: number; draw: number };
  url: string;
}

interface LichessPerf {
  games: number;
  rating: number;
  rd: number;
  prog: number;
}

interface LichessGame {
  id: string;
  rated: boolean;
  variant: string;
  speed: string;
  perf: string;
  createdAt: number;
  lastMoveAt: number;
  status: string;
  players: {
    white: LichessGamePlayer;
    black: LichessGamePlayer;
  };
  winner?: 'white' | 'black';
}

interface LichessGamePlayer {
  user?: { name: string; id: string };
  rating?: number;
}

export const lichessConnector: Connector = {
  serviceId: 'lichess',
  displayName: 'Lichess',
  authType: 'none',
  requiredCredentials: ['username'],
  availableFields: ['ratings', 'recentGames', 'winRate', 'totalGames'],

  async fetch(config: ConnectorConfig): Promise<ConnectorResult> {
    const username = config.credentials.username;

    try {
      const user = await fetchJson<LichessUser>(
        `https://lichess.org/api/user/${username}`,
        { headers: { 'Accept': 'application/json' } },
      );

      const games = await fetchRecentGames(username);
      const statItems = buildStatItems(user);
      const recentEvents = buildRecentEvents(games, username);

      return {
        service: 'lichess',
        success: true,
        data: {
          now: null,
          recent: recentEvents.slice(0, 10),
          stats: {
            service: 'lichess',
            label: 'Lichess',
            items: statItems,
          },
        },
      };
    } catch (error) {
      return {
        service: 'lichess',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        data: { now: null, recent: [], stats: { service: 'lichess', label: 'Lichess', items: [] } },
      };
    }
  },

  async validate(config: ConnectorConfig) {
    const username = config.credentials.username;
    try {
      await fetchJson(`https://lichess.org/api/user/${username}`, {
        headers: { 'Accept': 'application/json' },
      });
      return { valid: true };
    } catch {
      return { valid: false, error: `Lichess user "${username}" not found` };
    }
  },
};

function buildStatItems(user: LichessUser): StatItem[] {
  const items: StatItem[] = [];
  const perfOrder = ['blitz', 'rapid', 'bullet', 'classical', 'correspondence'];

  for (const perf of perfOrder) {
    const data = user.perfs[perf];
    if (data && data.games > 0) {
      items.push({
        key: perf,
        label: perf.charAt(0).toUpperCase() + perf.slice(1),
        value: data.rating,
        trend: data.prog > 0 ? 'up' : data.prog < 0 ? 'down' : 'flat',
      });
    }
  }

  if (user.count.all > 0) {
    items.push({
      key: 'totalGames',
      label: 'Total Games',
      value: user.count.all,
      unit: 'games',
    });
    items.push({
      key: 'winRate',
      label: 'Win Rate',
      value: Math.round((user.count.win / user.count.all) * 100),
      unit: '%',
    });
  }

  return items;
}

async function fetchRecentGames(username: string): Promise<LichessGame[]> {
  try {
    const response = await fetch(
      `https://lichess.org/api/user/${username}/activity`,
      { headers: { 'Accept': 'application/json', 'User-Agent': 'ScrobbleTime/0.1' } },
    );
    if (!response.ok) return [];

    const text = await response.text();
    const lines = text.trim().split('\n').filter(Boolean);
    return lines.map((line) => JSON.parse(line) as LichessGame);
  } catch {
    return [];
  }
}

function buildRecentEvents(games: LichessGame[], username: string): RecentEvent[] {
  return games.map((game) => {
    const isWhite = game.players.white.user?.name.toLowerCase() === username.toLowerCase();
    const opponent = isWhite ? game.players.black : game.players.white;
    const opponentName = opponent.user?.name ?? 'Anonymous';

    let result = 'Draw';
    if (game.winner) {
      result = (game.winner === 'white') === isWhite ? 'Win' : 'Loss';
    }

    const playerRating = isWhite
      ? game.players.white.rating
      : game.players.black.rating;

    return {
      id: `lichess-${game.id}`,
      service: 'lichess' as const,
      type: 'game' as const,
      title: `vs ${opponentName}`,
      subtitle: `${result}${playerRating ? ` (${playerRating})` : ''}`,
      url: `https://lichess.org/${game.id}`,
      timestamp: new Date(game.lastMoveAt).toISOString(),
      metadata: {
        result,
        speed: game.speed,
        variant: game.variant,
        ...(playerRating !== undefined ? { rating: playerRating } : {}),
      },
    };
  });
}
