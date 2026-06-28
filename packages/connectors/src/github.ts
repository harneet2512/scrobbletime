import type { Connector, ConnectorConfig, ConnectorResult } from '@scrobbletime/schema';
import type { NowActivity, RecentEvent, StatItem } from '@scrobbletime/schema';
import { fetchJson } from './utils/http.js';

interface GitHubUser {
  login: string;
  name: string | null;
  bio: string | null;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
  location: string | null;
}

interface GitHubRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  pushed_at: string;
  fork: boolean;
}

interface GitHubEvent {
  id: string;
  type: string;
  repo: { name: string; url: string };
  created_at: string;
  payload: Record<string, unknown>;
}

export const githubConnector: Connector = {
  serviceId: 'github',
  displayName: 'GitHub',
  authType: 'none',
  requiredCredentials: ['username'],
  availableFields: [
    'currentProject', 'languages', 'commitStreak',
    'recentCommits', 'publicRepos', 'followers',
  ],

  async fetch(config: ConnectorConfig): Promise<ConnectorResult> {
    const username = config.credentials.username;
    const token = config.credentials.token;
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const [user, repos, events] = await Promise.all([
        fetchJson<GitHubUser>(`https://api.github.com/users/${username}`, { headers }),
        fetchJson<GitHubRepo[]>(
          `https://api.github.com/users/${username}/repos?sort=pushed&per_page=20`,
          { headers },
        ),
        fetchJson<GitHubEvent[]>(
          `https://api.github.com/users/${username}/events/public?per_page=30`,
          { headers },
        ),
      ]);

      const ownRepos = repos.filter((r) => !r.fork);
      const currentProject = ownRepos[0] ?? null;
      const languages = buildLanguageStats(ownRepos);
      const statItems = buildStatItems(user, languages, events);
      const recentEvents = buildRecentEvents(events);

      const now: NowActivity | null = currentProject
        ? {
            service: 'github',
            type: 'coding',
            title: currentProject.name,
            subtitle: currentProject.description ?? undefined,
            url: currentProject.html_url,
          }
        : null;

      return {
        service: 'github',
        success: true,
        data: {
          now,
          recent: recentEvents.slice(0, 10),
          stats: {
            service: 'github',
            label: 'GitHub',
            items: statItems,
          },
        },
      };
    } catch (error) {
      return {
        service: 'github',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        data: { now: null, recent: [], stats: { service: 'github', label: 'GitHub', items: [] } },
      };
    }
  },

  async validate(config: ConnectorConfig) {
    const username = config.credentials.username;
    try {
      await fetchJson(`https://api.github.com/users/${username}`);
      return { valid: true };
    } catch {
      return { valid: false, error: `GitHub user "${username}" not found` };
    }
  },
};

function buildLanguageStats(repos: GitHubRepo[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const repo of repos) {
    if (repo.language) {
      counts[repo.language] = (counts[repo.language] ?? 0) + 1;
    }
  }
  return counts;
}

function buildStatItems(
  user: GitHubUser,
  languages: Record<string, number>,
  events: GitHubEvent[],
): StatItem[] {
  const items: StatItem[] = [];

  items.push({
    key: 'publicRepos',
    label: 'Public Repos',
    value: user.public_repos,
  });

  items.push({
    key: 'followers',
    label: 'Followers',
    value: user.followers,
  });

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const commitsThisWeek = events.filter(
    (e) => e.type === 'PushEvent' && new Date(e.created_at).getTime() > weekAgo,
  ).length;

  items.push({
    key: 'commitsWeek',
    label: 'Commits This Week',
    value: commitsThisWeek,
  });

  const sorted = Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  if (sorted.length > 0) {
    items.push({
      key: 'languages',
      label: 'Top Languages',
      value: sorted.map(([lang]) => lang).join(', '),
    });
  }

  return items;
}

function buildRecentEvents(events: GitHubEvent[]): RecentEvent[] {
  return events
    .filter((e) => e.type === 'PushEvent' || e.type === 'CreateEvent' || e.type === 'PullRequestEvent')
    .map((event) => {
      const repoName = event.repo.name.split('/').pop() ?? event.repo.name;

      let title: string;
      let type: 'commit' | 'pr' | 'release' = 'commit';
      let subtitle: string | undefined;

      switch (event.type) {
        case 'PushEvent': {
          const commits = event.payload.commits as Array<{ message: string }> | undefined;
          const count = commits?.length ?? 0;
          title = `Pushed ${count} commit${count !== 1 ? 's' : ''} to ${repoName}`;
          subtitle = commits?.[0]?.message;
          type = 'commit';
          break;
        }
        case 'PullRequestEvent': {
          const pr = event.payload.pull_request as { title: string } | undefined;
          title = pr?.title ?? `PR on ${repoName}`;
          type = 'pr';
          break;
        }
        case 'CreateEvent': {
          const refType = event.payload.ref_type as string | undefined;
          title = `Created ${refType ?? 'ref'} on ${repoName}`;
          type = 'release';
          break;
        }
        default:
          title = `${event.type} on ${repoName}`;
      }

      return {
        id: `github-${event.id}`,
        service: 'github' as const,
        type,
        title,
        subtitle,
        url: `https://github.com/${event.repo.name}`,
        timestamp: event.created_at,
      };
    });
}
