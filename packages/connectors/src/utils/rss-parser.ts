import { XMLParser } from 'fast-xml-parser';
import { fetchText } from './http.js';

export interface RssItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  guid?: string;
  [key: string]: unknown;
}

export interface RssFeed {
  title: string;
  link: string;
  items: RssItem[];
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

export async function parseRssFeed(url: string): Promise<RssFeed> {
  const xml = await fetchText(url);
  const parsed = parser.parse(xml);

  const channel = parsed?.rss?.channel;
  if (!channel) {
    throw new Error('Invalid RSS feed: no channel element');
  }

  const rawItems = Array.isArray(channel.item)
    ? channel.item
    : channel.item
      ? [channel.item]
      : [];

  const items: RssItem[] = rawItems.map((item: Record<string, unknown>) => ({
    title: String(item.title ?? ''),
    link: String(item.link ?? ''),
    description: item.description ? String(item.description) : undefined,
    pubDate: item.pubDate ? String(item.pubDate) : undefined,
    guid: item.guid
      ? typeof item.guid === 'object'
        ? String((item.guid as Record<string, unknown>)['#text'] ?? '')
        : String(item.guid)
      : undefined,
    ...item,
  }));

  return {
    title: String(channel.title ?? ''),
    link: String(channel.link ?? ''),
    items,
  };
}
