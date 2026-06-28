export function relativeTime(timestamp: string): string {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function el(
  tag: string,
  attrs?: Record<string, string>,
  ...children: (Node | string)[]
): HTMLElement {
  const element = document.createElement(tag);
  if (attrs) {
    for (const [key, value] of Object.entries(attrs)) {
      element.setAttribute(key, value);
    }
  }
  for (const child of children) {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    } else {
      element.appendChild(child);
    }
  }
  return element;
}

export function svgEl(svg: string): HTMLElement {
  const wrapper = document.createElement('span');
  wrapper.innerHTML = svg;
  wrapper.style.display = 'inline-flex';
  wrapper.style.alignItems = 'center';
  wrapper.style.justifyContent = 'center';
  return wrapper;
}

const SERVICE_SVGS: Record<string, string> = {
  'github': '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>',
  'spotify': '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/></svg>',
  'youtube-music': '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.376 0 0 5.376 0 12s5.376 12 12 12 12-5.376 12-12S18.624 0 12 0zm0 19.104c-3.924 0-7.104-3.18-7.104-7.104S8.076 4.896 12 4.896s7.104 3.18 7.104 7.104-3.18 7.104-7.104 7.104zm0-13.332c-3.432 0-6.228 2.796-6.228 6.228S8.568 18.228 12 18.228s6.228-2.796 6.228-6.228S15.432 5.772 12 5.772zM9.684 15.54V8.46L15.816 12l-6.132 3.54z"/></svg>',
  'chess-com': '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M5.683 6.833l2.13-1.545-1.182-.94L4.5 6.104V3.382L2.333 5.55v3.95L0 11.833v5.8l2.333-1.366v-3.834l2.167-2.333V6.833zm14.634-1.545l2.13 1.545V10.1l2.167 2.333v3.834L27 17.633v-5.8l-2.333-2.333V5.55L22.5 3.382v2.722l-2.183-1.756zM12 2.5l-4.5 3.5h3v3.5h3V6h3L12 2.5zM7.5 11.5v5l4.5 3.5 4.5-3.5v-5h-3v3.5h-3v-3.5h-3z"/></svg>',
  'lichess': '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12.5 2C11 2 10 3 9.5 4.5c-.5 1-.5 2-1 3-.5.5-1.5 1-2.5 1.5-1 .5-2 1.5-2 2.5 0 2 2 3.5 3 4 1 .5 1.5 1 2 2s1 2.5 1.5 3.5c.5.5 1 1 2 1s1.5-.5 2-1c.5-1 1-2.5 1.5-3.5s1-1.5 2-2c1-.5 3-2 3-4 0-1-1-2-2-2.5-1-.5-2-1-2.5-1.5-.5-1-.5-2-1-3C14 3 13 2 12.5 2z"/></svg>',
  'letterboxd': '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8.224 14.352a4.773 4.773 0 0 1-3.2-4.496c0-2.639 2.14-4.776 4.776-4.776a4.77 4.77 0 0 1 3.2 1.228A4.77 4.77 0 0 1 16.2 5.08c2.637 0 4.776 2.137 4.776 4.776a4.773 4.773 0 0 1-3.2 4.496 4.773 4.773 0 0 1-3.2 4.496 4.77 4.77 0 0 1-3.152-1.2 4.77 4.77 0 0 1-3.2 1.2c-2.639 0-4.776-2.14-4.776-4.776a4.773 4.773 0 0 1 2.576-4.72z"/></svg>',
  'goodreads': '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M11.43 23.995c-3.608-.208-6.274-2.077-6.448-5.078.695.007 1.375-.013 2.07-.006.224 1.342 1.065 2.43 2.683 3.026 1.583.496 3.737.46 5.082-.174 1.524-.744 2.261-2.145 2.42-3.86l.06-.649c-.931 1.314-2.742 2.502-5.415 2.28C7.612 19.163 5 16.203 5 12.03c0-4.358 2.663-7.393 6.535-7.59 2.702-.032 4.358 1.1 5.328 2.373V4.585h2.07v13.89c.02 3.87-2.578 5.733-7.503 5.52zm.57-5.263c2.8.12 4.927-1.98 4.927-5.733 0-3.727-1.873-6.218-5.052-5.965-3.082.207-4.795 2.59-4.795 5.965 0 3.327 1.968 5.553 4.92 5.733z"/></svg>',
  'strava': '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169"/></svg>',
};

const SERVICE_COLORS: Record<string, string> = {
  'github': '#6e40c9',
  'spotify': '#1DB954',
  'youtube-music': '#FF0000',
  'chess-com': '#769656',
  'lichess': '#ffffff',
  'letterboxd': '#00E054',
  'goodreads': '#553B08',
  'strava': '#FC4C02',
};

export function serviceIcon(service: string): string {
  return SERVICE_SVGS[service] ?? '';
}

export function serviceColor(service: string): string {
  return SERVICE_COLORS[service] ?? '#888';
}

const EVENT_SVGS: Record<string, string> = {
  'commit': '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="2.5" fill="none" stroke="currentColor" stroke-width="1.5"/><line x1="0" y1="8" x2="5" y2="8" stroke="currentColor" stroke-width="1.5"/><line x1="11" y1="8" x2="16" y2="8" stroke="currentColor" stroke-width="1.5"/></svg>',
  'pr': '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm0 9.5a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm7 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0zM4.25 5v6M11.75 5v6" stroke="currentColor" stroke-width="1.2" fill="none"/></svg>',
  'track': '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M6 2l8 1v8.5a2 2 0 11-1.5-1.93V4.5L7.5 3.87V11a2 2 0 11-1.5-1.93V2z"/></svg>',
  'game': '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M11 2a2 2 0 012 2v1h-2V4H5v1H3V4a2 2 0 012-2h6zM3 7v5a2 2 0 002 2h6a2 2 0 002-2V7H3zm5 1.5L10.5 11H5.5L8 8.5z"/></svg>',
  'film': '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="3" width="14" height="10" rx="1" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M1 6h14M1 10h14M4 3v10M12 3v10" stroke="currentColor" stroke-width="0.8" opacity="0.5"/></svg>',
  'book': '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M3 1.5A1.5 1.5 0 014.5 0h7A1.5 1.5 0 0113 1.5v13a.5.5 0 01-.5.5h-9a1 1 0 01-1-1V1.5zm1 0v11h8V1.5a.5.5 0 00-.5-.5h-7a.5.5 0 00-.5.5z" fill="currentColor"/></svg>',
  'activity': '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><polyline points="1,8 4,8 6,3 8,13 10,6 12,8 15,8" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  'release': '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><path d="M8 1l2.5 5 5.5.8-4 3.9.9 5.3L8 13.5 3.1 16l.9-5.3-4-3.9L5.5 6z" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
  'album': '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="8" cy="8" r="2.5" fill="currentColor"/></svg>',
};

export function eventIcon(type: string): string {
  return EVENT_SVGS[type] ?? EVENT_SVGS['commit'];
}

export function trendArrow(trend?: string): string {
  switch (trend) {
    case 'up': return '↑';
    case 'down': return '↓';
    default: return '';
  }
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len - 1) + '…';
}
