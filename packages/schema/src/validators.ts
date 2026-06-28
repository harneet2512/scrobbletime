import { z } from 'zod';

const serviceIdSchema = z.enum([
  'github',
  'spotify',
  'youtube-music',
  'chess-com',
  'lichess',
  'letterboxd',
  'goodreads',
  'strava',
]);

const eventTypeSchema = z.enum([
  'commit', 'pr', 'release',
  'track', 'album',
  'game',
  'film',
  'book',
  'activity',
]);

const nowTypeSchema = z.enum([
  'listening', 'playing', 'coding', 'reading', 'watching', 'exercising',
]);

const connectorStatusSchema = z.enum([
  'active', 'stale', 'disconnected', 'failed', 'disabled',
]);

const trendSchema = z.enum(['up', 'down', 'flat']);

const userMetaSchema = z.object({
  displayName: z.string(),
  bio: z.string().optional(),
  avatar: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
});

const serviceStatusSchema = z.object({
  service: serviceIdSchema,
  status: connectorStatusSchema,
  lastSync: z.string().nullable(),
  error: z.string().optional(),
});

const nowActivitySchema = z.object({
  service: serviceIdSchema,
  type: nowTypeSchema,
  title: z.string(),
  subtitle: z.string().optional(),
  url: z.string().optional(),
  imageUrl: z.string().optional(),
  startedAt: z.string().optional(),
});

const recentEventSchema = z.object({
  id: z.string(),
  service: serviceIdSchema,
  type: eventTypeSchema,
  title: z.string(),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  url: z.string().optional(),
  imageUrl: z.string().optional(),
  timestamp: z.string(),
  metadata: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

const statItemSchema = z.object({
  key: z.string(),
  label: z.string(),
  value: z.union([z.string(), z.number()]),
  unit: z.string().optional(),
  trend: trendSchema.optional(),
});

const statGroupSchema = z.object({
  service: serviceIdSchema,
  label: z.string(),
  items: z.array(statItemSchema),
});

export const activityDataSchema = z.object({
  version: z.literal(1),
  lastSync: z.string(),
  user: userMetaSchema,
  services: z.record(serviceStatusSchema),
  now: nowActivitySchema.nullable(),
  recent: z.array(recentEventSchema),
  stats: z.record(statGroupSchema),
});

export const configSchema = z.object({
  version: z.literal(1),
  username: z.string(),
  syncInterval: z.enum(['15m', '30m', '1h', 'daily']),
  services: z.record(z.object({
    enabled: z.boolean(),
    username: z.string().optional(),
    visibility: z.record(z.boolean()),
  })),
  embed: z.object({
    layout: z.enum(['signature', 'card', 'profile']),
    theme: z.enum(['professional', 'minimal', 'playful', 'auto']),
    density: z.enum(['compact', 'comfortable']),
  }),
});

export function validateActivityData(data: unknown) {
  return activityDataSchema.safeParse(data);
}

export function validateConfig(data: unknown) {
  return configSchema.safeParse(data);
}
