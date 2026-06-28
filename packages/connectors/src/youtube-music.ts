import type { Connector, ConnectorConfig, ConnectorResult } from '@scrobbletime/schema';
import type { RecentEvent, StatItem } from '@scrobbletime/schema';
import { fetchJson } from './utils/http.js';

const YT_API = 'https://www.googleapis.com/youtube/v3';

interface YouTubePlaylistResponse {
  items: YouTubePlaylistItem[];
  pageInfo: { totalResults: number };
}

interface YouTubePlaylistItem {
  id: string;
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: Record<string, { url: string; width: number; height: number }>;
    resourceId: { kind: string; videoId: string };
    channelTitle?: string;
    videoOwnerChannelTitle?: string;
  };
}

interface YouTubeChannelResponse {
  items: Array<{
    id: string;
    statistics: { subscriberCount: string; videoCount: string };
    contentDetails: { relatedPlaylists: { likes: string } };
  }>;
}

export const youtubeMusicConnector: Connector = {
  serviceId: 'youtube-music',
  displayName: 'YouTube Music',
  authType: 'api-key',
  requiredCredentials: ['apiKey', 'channelId'],
  availableFields: ['recentLiked', 'likedCount'],

  async fetch(config: ConnectorConfig): Promise<ConnectorResult> {
    const { apiKey, channelId } = config.credentials;

    try {
      const channel = await fetchJson<YouTubeChannelResponse>(
        `${YT_API}/channels?part=contentDetails,statistics&id=${channelId}&key=${apiKey}`,
      );

      const channelData = channel.items[0];
      if (!channelData) {
        throw new Error('Channel not found');
      }

      const likesPlaylistId = channelData.contentDetails.relatedPlaylists.likes;

      const liked = await fetchJson<YouTubePlaylistResponse>(
        `${YT_API}/playlistItems?part=snippet&playlistId=${likesPlaylistId}&maxResults=10&key=${apiKey}`,
      );

      const recent: RecentEvent[] = liked.items.map((item) => ({
        id: `yt-music-${item.id}`,
        service: 'youtube-music' as const,
        type: 'track' as const,
        title: item.snippet.title,
        subtitle: item.snippet.videoOwnerChannelTitle ?? item.snippet.channelTitle,
        url: `https://music.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
        imageUrl: item.snippet.thumbnails.medium?.url ?? item.snippet.thumbnails.default?.url,
        timestamp: item.snippet.publishedAt,
      }));

      const statItems: StatItem[] = [
        {
          key: 'likedCount',
          label: 'Liked Songs',
          value: liked.pageInfo.totalResults,
          unit: 'tracks',
        },
      ];

      return {
        service: 'youtube-music',
        success: true,
        data: {
          now: null,
          recent,
          stats: { service: 'youtube-music', label: 'YouTube Music', items: statItems },
        },
      };
    } catch (error) {
      return {
        service: 'youtube-music',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        data: { now: null, recent: [], stats: { service: 'youtube-music', label: 'YouTube Music', items: [] } },
      };
    }
  },
};
