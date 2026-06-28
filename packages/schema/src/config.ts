export type LayoutType = 'signature' | 'card' | 'profile';
export type ThemeType = 'professional' | 'minimal' | 'playful' | 'auto';
export type DensityType = 'compact' | 'comfortable';
export type SyncInterval = '15m' | '30m' | '1h' | 'daily';

export interface ServiceConfig {
  enabled: boolean;
  username?: string;
  visibility: Record<string, boolean>;
}

export interface EmbedConfig {
  layout: LayoutType;
  theme: ThemeType;
  density: DensityType;
}

export interface ScrobbleTimeConfig {
  version: 1;
  username: string;
  syncInterval: SyncInterval;
  services: Record<string, ServiceConfig>;
  embed: EmbedConfig;
}
