import type { Connector, ConnectorConfig, ConnectorResult } from '@scrobbletime/schema';
import type { NowActivity, RecentEvent, StatItem } from '@scrobbletime/schema';
import { fetchJson } from './utils/http.js';
import { refreshOAuthToken } from './utils/oauth-refresh.js';

const STRAVA_TOKEN_URL = 'https://www.strava.com/oauth/token';
const STRAVA_API = 'https://www.strava.com/api/v3';

interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  start_date: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  average_speed: number;
  max_speed: number;
}

interface StravaStats {
  all_run_totals: StravaTotals;
  all_ride_totals: StravaTotals;
  all_swim_totals: StravaTotals;
  recent_run_totals: StravaTotals;
  recent_ride_totals: StravaTotals;
  ytd_run_totals: StravaTotals;
  ytd_ride_totals: StravaTotals;
}

interface StravaTotals {
  count: number;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  elevation_gain: number;
}

export const stravaConnector: Connector = {
  serviceId: 'strava',
  displayName: 'Strava',
  authType: 'oauth2',
  requiredCredentials: ['clientId', 'clientSecret', 'refreshToken'],
  availableFields: ['recentActivities', 'totalDistance', 'totalActivities', 'ytdStats'],

  async fetch(config: ConnectorConfig): Promise<ConnectorResult> {
    const { clientId, clientSecret, refreshToken } = config.credentials;

    try {
      const tokens = await refreshOAuthToken(
        STRAVA_TOKEN_URL, clientId, clientSecret, refreshToken,
      );

      if (tokens.refresh_token && tokens.refresh_token !== refreshToken) {
        config.credentials._newRefreshToken = tokens.refresh_token;
      }

      const headers = { 'Authorization': `Bearer ${tokens.access_token}` };

      const [activities, stats] = await Promise.all([
        fetchJson<StravaActivity[]>(
          `${STRAVA_API}/athlete/activities?per_page=10`,
          { headers },
        ),
        fetchJson<StravaStats>(
          `${STRAVA_API}/athletes/${await getAthleteId(headers)}/stats`,
          { headers },
        ).catch(() => null),
      ]);

      const mostRecent = activities[0];
      const recentEnoughForNow = mostRecent
        && (Date.now() - new Date(mostRecent.start_date).getTime()) < 4 * 60 * 60 * 1000;

      const now: NowActivity | null = recentEnoughForNow
        ? {
            service: 'strava',
            type: 'exercising',
            title: mostRecent.name,
            subtitle: `${mostRecent.type} · ${formatDistance(mostRecent.distance)}`,
          }
        : null;

      const recent: RecentEvent[] = activities.map((act) => ({
        id: `strava-${act.id}`,
        service: 'strava' as const,
        type: 'activity' as const,
        title: act.name,
        subtitle: `${act.type} · ${formatDistance(act.distance)} · ${formatDuration(act.moving_time)}`,
        timestamp: act.start_date,
        metadata: {
          type: act.type,
          distance: Math.round(act.distance),
          movingTime: act.moving_time,
          elevation: Math.round(act.total_elevation_gain),
        },
      }));

      const statItems = buildStatItems(stats, activities);

      return {
        service: 'strava',
        success: true,
        data: {
          now,
          recent,
          stats: { service: 'strava', label: 'Strava', items: statItems },
        },
      };
    } catch (error) {
      return {
        service: 'strava',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        data: { now: null, recent: [], stats: { service: 'strava', label: 'Strava', items: [] } },
      };
    }
  },
};

async function getAthleteId(headers: Record<string, string>): Promise<number> {
  const athlete = await fetchJson<{ id: number }>(
    `${STRAVA_API}/athlete`,
    { headers },
  );
  return athlete.id;
}

function buildStatItems(stats: StravaStats | null, activities: StravaActivity[]): StatItem[] {
  const items: StatItem[] = [];

  if (stats) {
    const totalRuns = stats.all_run_totals;
    const totalRides = stats.all_ride_totals;

    if (totalRuns.count > 0) {
      items.push({
        key: 'totalRunDistance',
        label: 'Total Run Distance',
        value: Math.round(totalRuns.distance / 1000),
        unit: 'km',
      });
    }

    if (totalRides.count > 0) {
      items.push({
        key: 'totalRideDistance',
        label: 'Total Ride Distance',
        value: Math.round(totalRides.distance / 1000),
        unit: 'km',
      });
    }

    const totalCount = totalRuns.count + totalRides.count + stats.all_swim_totals.count;
    items.push({
      key: 'totalActivities',
      label: 'Total Activities',
      value: totalCount,
      unit: 'activities',
    });
  }

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = activities.filter(
    (a) => new Date(a.start_date).getTime() > weekAgo,
  );
  items.push({
    key: 'activitiesWeek',
    label: 'This Week',
    value: thisWeek.length,
    unit: 'activities',
  });

  return items;
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
