import type { Connector, ConnectorConfig, ConnectorResult } from '@scrobbletime/schema';
import type { NowActivity, RecentEvent, StatItem } from '@scrobbletime/schema';
import { parseRssFeed } from './utils/rss-parser.js';

export const goodreadsConnector: Connector = {
  serviceId: 'goodreads',
  displayName: 'Goodreads',
  authType: 'rss',
  requiredCredentials: ['userId'],
  availableFields: ['currentlyReading', 'recentBooks', 'bookCount', 'ratings'],

  async fetch(config: ConnectorConfig): Promise<ConnectorResult> {
    const userId = config.credentials.userId;

    try {
      const [currentlyReading, readBooks] = await Promise.all([
        parseRssFeed(
          `https://www.goodreads.com/review/list_rss/${userId}?shelf=currently-reading`,
        ).catch(() => ({ title: '', link: '', items: [] })),
        parseRssFeed(
          `https://www.goodreads.com/review/list_rss/${userId}?shelf=read`,
        ).catch(() => ({ title: '', link: '', items: [] })),
      ]);

      const currentBook = currentlyReading.items[0];
      const now: NowActivity | null = currentBook
        ? {
            service: 'goodreads',
            type: 'reading',
            title: extractBookTitle(currentBook.title),
            subtitle: extractAuthor(currentBook),
            url: currentBook.link,
            imageUrl: extractCover(currentBook),
          }
        : null;

      const recent: RecentEvent[] = readBooks.items.slice(0, 10).map((item) => {
        const rating = extractRating(item);
        return {
          id: `goodreads-${item.guid ?? item.link}`,
          service: 'goodreads' as const,
          type: 'book' as const,
          title: extractBookTitle(item.title),
          subtitle: extractAuthor(item),
          url: item.link,
          imageUrl: extractCover(item),
          timestamp: item.pubDate
            ? new Date(item.pubDate).toISOString()
            : new Date().toISOString(),
          metadata: {
            ...(rating !== null ? { rating } : {}),
          },
        };
      });

      const currentYear = new Date().getFullYear();
      const booksThisYear = readBooks.items.filter((item) => {
        if (!item.pubDate) return false;
        return new Date(item.pubDate).getFullYear() === currentYear;
      });

      const statItems: StatItem[] = [
        {
          key: 'bookCount',
          label: `Books ${currentYear}`,
          value: booksThisYear.length,
          unit: 'books',
        },
      ];

      if (currentBook) {
        statItems.unshift({
          key: 'currentlyReading',
          label: 'Currently Reading',
          value: extractBookTitle(currentBook.title),
        });
      }

      return {
        service: 'goodreads',
        success: true,
        data: {
          now,
          recent,
          stats: { service: 'goodreads', label: 'Goodreads', items: statItems },
        },
      };
    } catch (error) {
      return {
        service: 'goodreads',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        data: { now: null, recent: [], stats: { service: 'goodreads', label: 'Goodreads', items: [] } },
      };
    }
  },
};

function extractBookTitle(title: string): string {
  return title.replace(/\s*\(.*?\)\s*$/, '').trim();
}

function extractAuthor(item: Record<string, unknown>): string | undefined {
  if (item.author_name) return String(item.author_name);

  const description = String(item.description ?? '');
  const match = description.match(/by\s+<[^>]*>([^<]+)</);
  if (match) return match[1].trim();

  const simpleMatch = description.match(/by\s+([^<\n]+)/);
  if (simpleMatch) return simpleMatch[1].trim();

  return undefined;
}

function extractCover(item: Record<string, unknown>): string | undefined {
  const imageUrl = item.book_image_url ?? item.book_medium_image_url;
  if (imageUrl) return String(imageUrl);

  const description = String(item.description ?? '');
  const match = description.match(/<img[^>]+src="([^"]+)"/);
  return match ? match[1] : undefined;
}

function extractRating(item: Record<string, unknown>): number | null {
  const rating = item.user_rating;
  if (rating !== undefined) {
    const parsed = parseInt(String(rating), 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return null;
}
