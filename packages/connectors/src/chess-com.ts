import type { Connector, ConnectorConfig, ConnectorResult } from '@scrobbletime/schema';
import type { RecentEvent, StatItem } from '@scrobbletime/schema';
import { fetchJson } from './utils/http.js';

interface ChessComStats {
  chess_rapid?: TimeControlStats;
  chess_blitz?: TimeControlStats;
  chess_bullet?: TimeControlStats;
}

interface TimeControlStats {
  last: { rating: number; date: number };
  best?: { rating: number; date: number };
  record: { win: number; loss: number; draw: number };
}

interface ChessComGame {
  url: string;
  time_control: string;
  end_time: number;
  rated: boolean;
  white: ChessComPlayer;
  black: ChessComPlayer;
}

interface ChessComPlayer {
  username: string;
  rating: number;
  result: string;
}

export const chessComConnector: Connector = {
  serviceId: 'chess-com',
  displayName: 'Chess.com',
  authType: 'none',
  requiredCredentials: ['username'],
  availableFields: ['ratings', 'recentGames', 'winRate', 'totalGames'],

  async fetch(config: ConnectorConfig): Promise<ConnectorResult> {
    const username = config.credentials.username;

    try {
      const [stats, games] = await Promise.all([
        fetchJson<ChessComStats>(
          `https://api.chess.com/pub/player/${username}/stats`,
        ),
        fetchCurrentMonthGames(username),
      ]);

      const statItems = buildStatItems(stats);
      const recentEvents = buildRecentEvents(games, username);

      return {
        service: 'chess-com',
        success: true,
        data: {
          now: null,
          recent: recentEvents.slice(0, 10),
          stats: {
            service: 'chess-com',
            label: 'Chess.com',
            items: statItems,
          },
        },
      };
    } catch (error) {
      return {
        service: 'chess-com',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        data: { now: null, recent: [], stats: { service: 'chess-com', label: 'Chess.com', items: [] } },
      };
    }
  },

  async validate(config: ConnectorConfig) {
    const username = config.credentials.username;
    try {
      await fetchJson(`https://api.chess.com/pub/player/${username}`);
      return { valid: true };
    } catch {
      return { valid: false, error: `Chess.com user "${username}" not found` };
    }
  },
};

function buildStatItems(stats: ChessComStats): StatItem[] {
  const items: StatItem[] = [];

  if (stats.chess_blitz) {
    items.push({
      key: 'blitz',
      label: 'Blitz',
      value: stats.chess_blitz.last.rating,
      trend: determineTrend(stats.chess_blitz),
    });
  }

  if (stats.chess_rapid) {
    items.push({
      key: 'rapid',
      label: 'Rapid',
      value: stats.chess_rapid.last.rating,
      trend: determineTrend(stats.chess_rapid),
    });
  }

  if (stats.chess_bullet) {
    items.push({
      key: 'bullet',
      label: 'Bullet',
      value: stats.chess_bullet.last.rating,
      trend: determineTrend(stats.chess_bullet),
    });
  }

  const totalRecord = getTotalRecord(stats);
  if (totalRecord.total > 0) {
    items.push({
      key: 'totalGames',
      label: 'Total Games',
      value: totalRecord.total,
      unit: 'games',
    });
    items.push({
      key: 'winRate',
      label: 'Win Rate',
      value: Math.round((totalRecord.wins / totalRecord.total) * 100),
      unit: '%',
    });
  }

  return items;
}

function determineTrend(tc: TimeControlStats): 'up' | 'down' | 'flat' {
  if (!tc.best) return 'flat';
  const diff = tc.last.rating - tc.best.rating;
  if (diff >= -20) return 'up';
  if (diff < -50) return 'down';
  return 'flat';
}

function getTotalRecord(stats: ChessComStats) {
  let wins = 0, losses = 0, draws = 0;
  for (const tc of [stats.chess_blitz, stats.chess_rapid, stats.chess_bullet]) {
    if (tc) {
      wins += tc.record.win;
      losses += tc.record.loss;
      draws += tc.record.draw;
    }
  }
  return { wins, losses, draws, total: wins + losses + draws };
}

async function fetchCurrentMonthGames(username: string): Promise<ChessComGame[]> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  try {
    const data = await fetchJson<{ games: ChessComGame[] }>(
      `https://api.chess.com/pub/player/${username}/games/${year}/${month}`,
    );
    return data.games ?? [];
  } catch {
    return [];
  }
}

function buildRecentEvents(games: ChessComGame[], username: string): RecentEvent[] {
  return games
    .sort((a, b) => b.end_time - a.end_time)
    .map((game) => {
      const isWhite = game.white.username.toLowerCase() === username.toLowerCase();
      const player = isWhite ? game.white : game.black;
      const opponent = isWhite ? game.black : game.white;
      const result = mapResult(player.result);

      return {
        id: `chess-com-${game.end_time}-${game.url.split('/').pop()}`,
        service: 'chess-com' as const,
        type: 'game' as const,
        title: `vs ${opponent.username}`,
        subtitle: `${result} (${player.rating})`,
        url: game.url,
        timestamp: new Date(game.end_time * 1000).toISOString(),
        metadata: {
          result,
          rating: player.rating,
          opponentRating: opponent.rating,
          timeControl: game.time_control,
        },
      };
    });
}

function mapResult(result: string): string {
  switch (result) {
    case 'win': return 'Win';
    case 'checkmated':
    case 'timeout':
    case 'resigned':
    case 'abandoned': return 'Loss';
    case 'stalemate':
    case 'agreed':
    case 'repetition':
    case 'insufficient':
    case '50move':
    case 'timevsinsufficient': return 'Draw';
    default: return result;
  }
}
