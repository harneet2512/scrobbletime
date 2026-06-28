export type ServiceId =
  | 'github'
  | 'spotify'
  | 'youtube-music'
  | 'chess-com'
  | 'lichess'
  | 'letterboxd'
  | 'goodreads'
  | 'strava';

export type EventType =
  | 'commit'
  | 'pr'
  | 'release'
  | 'track'
  | 'album'
  | 'game'
  | 'film'
  | 'book'
  | 'activity';

export type NowType =
  | 'listening'
  | 'playing'
  | 'coding'
  | 'reading'
  | 'watching'
  | 'exercising';

export type ConnectorStatus =
  | 'active'
  | 'stale'
  | 'disconnected'
  | 'failed'
  | 'disabled';

export type Trend = 'up' | 'down' | 'flat';

export interface UserMeta {
  displayName: string;
  bio?: string;
  avatar?: string;
  location?: string;
  website?: string;
}

export interface ServiceStatus {
  service: ServiceId;
  status: ConnectorStatus;
  lastSync: string | null;
  error?: string;
}

export interface NowActivity {
  service: ServiceId;
  type: NowType;
  title: string;
  subtitle?: string;
  url?: string;
  imageUrl?: string;
  startedAt?: string;
}

export interface RecentEvent {
  id: string;
  service: ServiceId;
  type: EventType;
  title: string;
  subtitle?: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  timestamp: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface StatItem {
  key: string;
  label: string;
  value: string | number;
  unit?: string;
  trend?: Trend;
}

export interface StatGroup {
  service: ServiceId;
  label: string;
  items: StatItem[];
}

export interface TileOverride {
  id: string;
  size?: '1x1' | '2x1';
  color?: string;
  hidden?: boolean;
}

export interface DisplayConfig {
  tiles?: TileOverride[];
  columns?: number;
  gap?: number;
  radius?: number;
  accentColor?: string;
}

export interface ActivityData {
  version: 1;
  lastSync: string;
  user: UserMeta;
  services: Record<string, ServiceStatus>;
  now: NowActivity | null;
  recent: RecentEvent[];
  stats: Record<string, StatGroup>;
  display?: DisplayConfig;
}
