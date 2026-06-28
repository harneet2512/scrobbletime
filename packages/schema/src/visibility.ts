import type { ActivityData, RecentEvent } from './activity.js';
import type { ScrobbleTimeConfig } from './config.js';

export function applyVisibilityFilter(
  data: ActivityData,
  config: ScrobbleTimeConfig,
): ActivityData {
  const filtered: ActivityData = {
    ...data,
    services: { ...data.services },
    now: null,
    recent: [],
    stats: {},
  };

  if (data.now) {
    const serviceConf = config.services[data.now.service];
    if (serviceConf?.enabled) {
      filtered.now = data.now;
    }
  }

  filtered.recent = data.recent.filter((event) => {
    const serviceConf = config.services[event.service];
    if (!serviceConf?.enabled) return false;
    return isFieldVisible(serviceConf.visibility, event);
  });

  for (const [key, statGroup] of Object.entries(data.stats)) {
    const serviceConf = config.services[key];
    if (!serviceConf?.enabled) continue;

    const visibleItems = statGroup.items.filter((item) =>
      serviceConf.visibility[item.key] !== false,
    );

    if (visibleItems.length > 0) {
      filtered.stats[key] = {
        ...statGroup,
        items: visibleItems,
      };
    }
  }

  for (const [key] of Object.entries(data.services)) {
    const serviceConf = config.services[key];
    if (!serviceConf?.enabled) {
      delete filtered.services[key];
    }
  }

  return filtered;
}

function isFieldVisible(
  visibility: Record<string, boolean>,
  event: RecentEvent,
): boolean {
  const fieldMap: Record<string, string> = {
    commit: 'recentCommits',
    pr: 'recentPRs',
    track: 'recentTracks',
    game: 'recentGames',
    film: 'recentFilms',
    book: 'recentBooks',
    activity: 'recentActivities',
  };

  const fieldKey = fieldMap[event.type];
  if (fieldKey && visibility[fieldKey] === false) return false;

  return true;
}
