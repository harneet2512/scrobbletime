import type { Connector, ConnectorConfig, ConnectorResult } from '@scrobbletime/schema';
import type { RecentEvent, StatItem } from '@scrobbletime/schema';
import { parseRssFeed } from './utils/rss-parser.js';

export const letterboxdConnector: Connector = {
  serviceId: 'letterboxd',
  displayName: 'Letterboxd',
  authType: 'rss',
  requiredCredentials: ['username'],
  availableFields: ['recentFilms', 'filmCount', 'ratings'],

  async fetch(config: ConnectorConfig): Promise<ConnectorResult> {
    const username = config.credentials.username;

    try {
      const feed = await parseRssFeed(
        `https://letterboxd.com/${username}/rss/`,
      );

      const recent: RecentEvent[] = feed.items.slice(0, 10).map((item) => {
        const rating = extractRating(item);
        const year = extractYear(item.title);

        return {
          id: `letterboxd-${item.guid ?? item.link}`,
          service: 'letterboxd' as const,
          type: 'film' as const,
          title: cleanTitle(item.title),
          subtitle: rating ? `${rating} stars` : undefined,
          description: year ?? undefined,
          url: item.link,
          imageUrl: extractPoster(item.description),
          timestamp: item.pubDate
            ? new Date(item.pubDate).toISOString()
            : new Date().toISOString(),
          metadata: {
            ...(rating !== null ? { rating } : {}),
            ...(year ? { year } : {}),
          },
        };
      });

      const currentYear = new Date().getFullYear();
      const filmsThisYear = feed.items.filter((item) => {
        if (!item.pubDate) return false;
        return new Date(item.pubDate).getFullYear() === currentYear;
      });

      const statItems: StatItem[] = [
        {
          key: 'filmCount',
          label: `Films ${currentYear}`,
          value: filmsThisYear.length,
          unit: 'films',
        },
      ];

      const ratings = feed.items
        .map((item) => extractRating(item))
        .filter((r): r is number => r !== null);

      if (ratings.length > 0) {
        const avg = ratings.reduce((s, r) => s + r, 0) / ratings.length;
        statItems.push({
          key: 'avgRating',
          label: 'Avg Rating',
          value: Math.round(avg * 10) / 10,
          unit: 'stars',
        });
      }

      return {
        service: 'letterboxd',
        success: true,
        data: {
          now: null,
          recent,
          stats: { service: 'letterboxd', label: 'Letterboxd', items: statItems },
        },
      };
    } catch (error) {
      return {
        service: 'letterboxd',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        data: { now: null, recent: [], stats: { service: 'letterboxd', label: 'Letterboxd', items: [] } },
      };
    }
  },

  async validate(config: ConnectorConfig) {
    const username = config.credentials.username;
    try {
      await parseRssFeed(`https://letterboxd.com/${username}/rss/`);
      return { valid: true };
    } catch {
      return { valid: false, error: `Letterboxd feed not found for "${username}"` };
    }
  },
};

function extractRating(item: Record<string, unknown>): number | null {
  const memberRating = item['letterboxd:memberRating'];
  if (memberRating !== undefined) {
    const parsed = parseFloat(String(memberRating));
    if (!isNaN(parsed)) return parsed;
  }

  const description = String(item.description ?? '');
  const match = description.match(/★+½?/);
  if (match) {
    const stars = (match[0].match(/★/g)?.length ?? 0);
    const half = match[0].includes('½') ? 0.5 : 0;
    return stars + half;
  }

  return null;
}

function extractYear(title: string): string | null {
  const match = title.match(/,\s*(\d{4})\s*$/);
  return match ? match[1] : null;
}

function cleanTitle(title: string): string {
  return title.replace(/,\s*\d{4}\s*$/, '').replace(/\s*-\s*★.*$/, '').trim();
}

function extractPoster(description?: string): string | undefined {
  if (!description) return undefined;
  const match = String(description).match(/<img\s+src="([^"]+)"/);
  return match ? match[1] : undefined;
}
