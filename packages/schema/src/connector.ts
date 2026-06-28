import type { ServiceId, NowActivity, RecentEvent, StatGroup } from './activity.js';

export interface ConnectorConfig {
  credentials: Record<string, string>;
  settings: Record<string, unknown>;
  visibleFields: string[];
}

export interface ConnectorResult {
  service: ServiceId;
  success: boolean;
  error?: string;
  data: {
    now: NowActivity | null;
    recent: RecentEvent[];
    stats: StatGroup;
  };
}

export interface ConnectorMeta {
  serviceId: ServiceId;
  displayName: string;
  authType: 'none' | 'api-key' | 'oauth2' | 'rss';
  requiredCredentials: string[];
  availableFields: string[];
}

export interface Connector extends ConnectorMeta {
  fetch(config: ConnectorConfig): Promise<ConnectorResult>;
  validate?(config: ConnectorConfig): Promise<{ valid: boolean; error?: string }>;
}
