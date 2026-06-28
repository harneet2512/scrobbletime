import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';
import { runConnectors } from '@scrobbletime/connectors';
import { applyVisibilityFilter, validateConfig } from '@scrobbletime/schema';
import type { ActivityData, ConnectorConfig, ScrobbleTimeConfig } from '@scrobbletime/schema';

async function main() {
  const configPath = resolve(process.cwd(), 'scrobbletime.config.json');
  if (!existsSync(configPath)) {
    console.error('Error: scrobbletime.config.json not found');
    process.exit(1);
  }

  const rawConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
  const configResult = validateConfig(rawConfig);

  if (!configResult.success) {
    console.error('Invalid config:', configResult.error.format());
    process.exit(1);
  }

  const config = configResult.data as ScrobbleTimeConfig;
  console.log(`ScrobbleTime sync starting for user: ${config.username}`);

  let previousData: ActivityData | undefined;
  const outputPath = resolve(process.cwd(), 'output', 'activity.json');
  try {
    if (existsSync(outputPath)) {
      previousData = JSON.parse(readFileSync(outputPath, 'utf-8'));
    }
  } catch {
    // No previous data — fine
  }

  const activeServices = Object.entries(config.services)
    .filter(([, svc]) => svc.enabled)
    .map(([key]) => key);

  if (activeServices.length === 0) {
    console.log('No active services configured. Nothing to sync.');
    process.exit(0);
  }

  console.log(`Active services: ${activeServices.join(', ')}`);

  const configMap = buildConnectorConfigs(config);
  const rawData = await runConnectors(activeServices, configMap, previousData);

  rawData.user = {
    displayName: config.username,
    ...previousData?.user,
  };

  const filtered = applyVisibilityFilter(rawData, config);

  mkdirSync(resolve(process.cwd(), 'output'), { recursive: true });
  writeFileSync(outputPath, JSON.stringify(filtered, null, 2));

  const successCount = Object.values(filtered.services)
    .filter((s) => s.status === 'active').length;
  const failCount = activeServices.length - successCount;

  console.log(`Sync complete. ${successCount} succeeded, ${failCount} failed.`);
  console.log(`Output written to ${outputPath}`);
}

function buildConnectorConfigs(
  config: ScrobbleTimeConfig,
): Record<string, ConnectorConfig> {
  const map: Record<string, ConnectorConfig> = {};
  const env = process.env;

  for (const [serviceId, svc] of Object.entries(config.services)) {
    if (!svc.enabled) continue;

    const visibleFields = Object.entries(svc.visibility)
      .filter(([, v]) => v)
      .map(([k]) => k);

    const credentials: Record<string, string> = {};

    switch (serviceId) {
      case 'github':
        credentials.username = svc.username ?? config.username;
        if (env.GITHUB_TOKEN) credentials.token = env.GITHUB_TOKEN;
        break;

      case 'spotify':
        credentials.clientId = env.SPOTIFY_CLIENT_ID ?? '';
        credentials.clientSecret = env.SPOTIFY_CLIENT_SECRET ?? '';
        credentials.refreshToken = env.SPOTIFY_REFRESH_TOKEN ?? '';
        break;

      case 'youtube-music':
        credentials.apiKey = env.YOUTUBE_API_KEY ?? '';
        credentials.channelId = env.YOUTUBE_CHANNEL_ID ?? '';
        break;

      case 'chess-com':
        credentials.username = svc.username ?? '';
        break;

      case 'lichess':
        credentials.username = svc.username ?? '';
        break;

      case 'letterboxd':
        credentials.username = svc.username ?? '';
        break;

      case 'goodreads':
        credentials.userId = svc.username ?? '';
        break;

      case 'strava':
        credentials.clientId = env.STRAVA_CLIENT_ID ?? '';
        credentials.clientSecret = env.STRAVA_CLIENT_SECRET ?? '';
        credentials.refreshToken = env.STRAVA_REFRESH_TOKEN ?? '';
        break;
    }

    map[serviceId] = {
      credentials,
      settings: {},
      visibleFields,
    };
  }

  return map;
}

main().catch((error) => {
  console.error('Sync failed:', error);
  process.exit(1);
});
