import type {
  Connector,
  ConnectorConfig,
  ConnectorResult,
  ActivityData,
  ServiceStatus,
  NowActivity,
  RecentEvent,
  StatGroup,
  ServiceId,
} from '@scrobbletime/schema';

import { githubConnector } from './github.js';
import { spotifyConnector } from './spotify.js';
import { youtubeMusicConnector } from './youtube-music.js';
import { chessComConnector } from './chess-com.js';
import { lichessConnector } from './lichess.js';
import { letterboxdConnector } from './letterboxd.js';
import { goodreadsConnector } from './goodreads.js';
import { stravaConnector } from './strava.js';

export const connectors: Record<string, Connector> = {
  'github': githubConnector,
  'spotify': spotifyConnector,
  'youtube-music': youtubeMusicConnector,
  'chess-com': chessComConnector,
  'lichess': lichessConnector,
  'letterboxd': letterboxdConnector,
  'goodreads': goodreadsConnector,
  'strava': stravaConnector,
};

export async function runConnectors(
  activeServices: string[],
  configMap: Record<string, ConnectorConfig>,
  previousData?: ActivityData,
): Promise<ActivityData> {
  const results = await Promise.allSettled(
    activeServices.map(async (serviceId) => {
      const connector = connectors[serviceId];
      if (!connector) {
        throw new Error(`Unknown connector: ${serviceId}`);
      }
      const config = configMap[serviceId];
      if (!config) {
        throw new Error(`No config for connector: ${serviceId}`);
      }
      return connector.fetch(config);
    }),
  );

  const services: Record<string, ServiceStatus> = {};
  let now: NowActivity | null = null;
  const recent: RecentEvent[] = [];
  const stats: Record<string, StatGroup> = {};

  for (let i = 0; i < activeServices.length; i++) {
    const serviceId = activeServices[i] as ServiceId;
    const result = results[i];

    if (result.status === 'rejected') {
      services[serviceId] = {
        service: serviceId,
        status: 'failed',
        lastSync: null,
        error: result.reason?.message ?? 'Unknown error',
      };

      if (previousData?.stats[serviceId]) {
        stats[serviceId] = previousData.stats[serviceId];
      }
      if (previousData?.services[serviceId]) {
        services[serviceId].lastSync = previousData.services[serviceId].lastSync;
      }
      continue;
    }

    const connectorResult: ConnectorResult = result.value;

    if (!connectorResult.success) {
      services[serviceId] = {
        service: serviceId,
        status: 'stale',
        lastSync: previousData?.services[serviceId]?.lastSync ?? null,
        error: connectorResult.error,
      };

      if (previousData?.stats[serviceId]) {
        stats[serviceId] = previousData.stats[serviceId];
      }
      const prevRecent = previousData?.recent.filter((e) => e.service === serviceId) ?? [];
      recent.push(...prevRecent);
      continue;
    }

    services[serviceId] = {
      service: serviceId,
      status: 'active',
      lastSync: new Date().toISOString(),
    };

    if (connectorResult.data.now && !now) {
      now = connectorResult.data.now;
    }

    recent.push(...connectorResult.data.recent);
    stats[serviceId] = connectorResult.data.stats;
  }

  recent.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return {
    version: 1,
    lastSync: new Date().toISOString(),
    user: previousData?.user ?? { displayName: '' },
    services,
    now,
    recent: recent.slice(0, 30),
    stats,
  };
}

export {
  githubConnector,
  spotifyConnector,
  youtubeMusicConnector,
  chessComConnector,
  lichessConnector,
  letterboxdConnector,
  goodreadsConnector,
  stravaConnector,
};
