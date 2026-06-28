export type LayoutType = 'signature' | 'card' | 'profile' | 'bento' | 'immersive';
export type ThemeType = 'professional' | 'minimal' | 'playful' | 'auto';
export type DensityType = 'compact' | 'comfortable';
export type SyncInterval = '15m' | '30m' | '1h' | 'daily';
export type TileSize = '1x1' | '2x1';

export interface TileConfig {
  id: string;
  size?: TileSize;
  color?: string;
  hidden?: boolean;
}

export interface ServiceConfig {
  enabled: boolean;
  username?: string;
  visibility: Record<string, boolean>;
}

export interface EmbedConfig {
  layout: LayoutType;
  theme: ThemeType;
  density: DensityType;
  tiles?: TileConfig[];
  columns?: 2 | 3 | 4;
  gap?: number;
  radius?: number;
  accentColor?: string;
}

export interface ScrobbleTimeConfig {
  version: 1;
  username: string;
  syncInterval: SyncInterval;
  services: Record<string, ServiceConfig>;
  embed: EmbedConfig;
}
