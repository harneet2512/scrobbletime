import type { ActivityData } from '@scrobbletime/schema';
import { el, svgEl, serviceIcon, relativeTime } from '../utils.js';

export function renderProfile(data: ActivityData): HTMLElement {
  const wrapper = el('div');

  wrapper.appendChild(renderProfileHero(data));
  wrapper.appendChild(renderSignals(data));

  if (data.recent.length > 0) {
    wrapper.appendChild(renderRecentHighlights(data));
  }

  wrapper.appendChild(renderProfileFooter(data));

  return wrapper;
}

function renderProfileHero(data: ActivityData): HTMLElement {
  const hero = el('div', { class: 'st-hero st-hero-profile' });

  const content = el('div', { class: 'st-hero-content' });

  if (data.user.avatar) {
    hero.appendChild(el('img', { class: 'st-hero-avatar st-hero-avatar-lg', src: data.user.avatar, alt: '' }));
  }

  content.appendChild(el('div', { class: 'st-hero-title st-hero-title-lg' }, data.user.displayName));
  if (data.user.bio) {
    content.appendChild(el('div', { class: 'st-hero-subtitle' }, data.user.bio));
  }

  if (data.now) {
    const nowBadge = el('div', { class: 'st-now-badge' });
    const dot = el('span', { class: 'st-live-dot' });
    nowBadge.appendChild(dot);
    const label = data.now.type === 'listening' ? 'Listening to'
      : data.now.type === 'coding' ? 'Building'
        : data.now.type === 'reading' ? 'Reading'
          : 'Active';
    nowBadge.appendChild(document.createTextNode(`${label} `));
    nowBadge.appendChild(el('strong', {}, data.now.title));
    content.appendChild(nowBadge);
  }

  hero.appendChild(content);

  if (data.now?.imageUrl) {
    hero.appendChild(el('img', { class: 'st-hero-art', src: data.now.imageUrl, alt: '' }));
  }

  return hero;
}

function renderSignals(data: ActivityData): HTMLElement {
  const section = el('div', { class: 'st-signals st-signals-profile' });

  const signals = collectProfileSignals(data);
  for (const signal of signals.slice(0, 6)) {
    const row = el('div', { class: 'st-signal' });

    const icon = el('span', { class: 'st-signal-icon' });
    const svg = serviceIcon(signal.service);
    if (svg) icon.appendChild(svgEl(svg));
    row.appendChild(icon);

    const body = el('div', { class: 'st-signal-body' });
    body.appendChild(el('span', { class: 'st-signal-value' }, signal.value));
    body.appendChild(el('span', { class: 'st-signal-label' }, signal.label));
    row.appendChild(body);

    section.appendChild(row);
  }

  return section;
}

function renderRecentHighlights(data: ActivityData): HTMLElement {
  const section = el('div', { class: 'st-section' });
  section.appendChild(el('span', { class: 'st-section-label' }, 'Recent'));

  const list = el('div', { class: 'st-highlights' });

  const seen = new Set<string>();
  for (const event of data.recent) {
    if (seen.has(event.type)) continue;
    seen.add(event.type);
    if (seen.size > 3) break;

    const item = el('div', { class: 'st-highlight' });
    item.appendChild(el('span', { class: 'st-highlight-title' }, event.title));
    if (event.subtitle) {
      item.appendChild(el('span', { class: 'st-highlight-meta' }, event.subtitle));
    }
    item.appendChild(el('span', { class: 'st-highlight-time' }, relativeTime(event.timestamp)));
    list.appendChild(item);
  }

  section.appendChild(list);
  return section;
}

interface Signal {
  service: string;
  value: string;
  label: string;
  priority: number;
}

function collectProfileSignals(data: ActivityData): Signal[] {
  const signals: Signal[] = [];

  for (const [serviceId, group] of Object.entries(data.stats)) {
    for (const item of group.items) {
      const s = mapSignal(serviceId, item.key, item.value, item.unit, item.trend);
      if (s) signals.push(s);
    }
  }

  signals.sort((a, b) => b.priority - a.priority);
  return signals;
}

function mapSignal(
  service: string,
  key: string,
  value: string | number,
  unit?: string,
  trend?: string,
): Signal | null {
  const arrow = trend === 'up' ? ' ↑' : trend === 'down' ? ' ↓' : '';

  switch (key) {
    case 'blitz':
    case 'rapid':
      return { service, value: `${value}${arrow}`, label: key.charAt(0).toUpperCase() + key.slice(1), priority: 7 };
    case 'languages':
      return { service, value: String(value), label: 'Building with', priority: 8 };
    case 'commitsWeek':
      return typeof value === 'number' && value > 0
        ? { service, value: `${value} commits`, label: 'This week', priority: 6 }
        : null;
    case 'currentlyReading':
      return { service, value: String(value), label: 'Reading', priority: 9 };
    case 'bookCount':
      return typeof value === 'number' && value > 0
        ? { service, value: `${value} books this year`, label: 'Reading', priority: 4 }
        : null;
    case 'filmCount':
      return typeof value === 'number' && value > 0
        ? { service, value: `${value} films this year`, label: 'Watching', priority: 4 }
        : null;
    case 'topGenres':
      return { service, value: String(value), label: 'Music taste', priority: 6 };
    case 'avgRating':
      return { service, value: `${value}★ avg`, label: 'Film rating', priority: 3 };
    case 'totalRunDistance':
      return { service, value: `${value} ${unit ?? 'km'}`, label: 'Total running', priority: 5 };
    case 'activitiesWeek':
      return typeof value === 'number' && value > 0
        ? { service, value: `${value} activities`, label: 'This week', priority: 5 }
        : null;
    default:
      return null;
  }
}

function renderProfileFooter(data: ActivityData): HTMLElement {
  const footer = el('div', { class: 'st-footer' });

  const services = el('div', { class: 'st-footer-services' });
  for (const status of Object.values(data.services)) {
    const statusClass = status.status === 'active' ? ''
      : status.status === 'stale' ? ' stale' : ' failed';
    const pill = el('span', {
      class: `st-service-dot-sm${statusClass}`,
      title: status.service,
    });
    services.appendChild(pill);
  }
  footer.appendChild(services);

  const right = el('div', { style: 'display: flex; align-items: center; gap: 12px;' });
  if (data.lastSync) {
    right.appendChild(el('span', { class: 'st-footer-time' }, relativeTime(data.lastSync)));
  }
  right.appendChild(el('a', {
    class: 'st-footer-brand',
    href: 'https://github.com/scrobbletime/scrobbletime',
    target: '_blank',
    rel: 'noopener',
  }, 'ScrobbleTime'));
  footer.appendChild(right);

  return footer;
}
