import type { ActivityData } from '@scrobbletime/schema';

const cache = new Map<string, { data: ActivityData; fetchedAt: number }>();
const CACHE_TTL = 5 * 60 * 1000;

export async function fetchActivityData(
  url: string,
  signal?: AbortSignal,
): Promise<ActivityData> {
  const cached = cache.get(url);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return cached.data;
  }

  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Failed to load activity data (HTTP ${response.status})`);
  }

  const data = await response.json() as ActivityData;
  cache.set(url, { data, fetchedAt: Date.now() });
  return data;
}
