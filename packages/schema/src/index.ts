export type {
  ServiceId,
  EventType,
  NowType,
  ConnectorStatus,
  Trend,
  UserMeta,
  ServiceStatus,
  NowActivity,
  RecentEvent,
  StatItem,
  StatGroup,
  ActivityData,
} from './activity.js';

export type {
  ConnectorConfig,
  ConnectorResult,
  ConnectorMeta,
  Connector,
} from './connector.js';

export type {
  LayoutType,
  ThemeType,
  DensityType,
  SyncInterval,
  ServiceConfig,
  EmbedConfig,
  ScrobbleTimeConfig,
} from './config.js';

export { applyVisibilityFilter } from './visibility.js';
export { validateActivityData, validateConfig } from './validators.js';
