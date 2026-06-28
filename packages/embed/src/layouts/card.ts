import type { ActivityData, StatGroup } from '@scrobbletime/schema';
import { el, svgEl, serviceIcon } from '../utils.js';

export function renderCard(data: ActivityData): HTMLElement {
  const wrapper = el('div');

  wrapper.appendChild(renderHero(data));
  wrapper.appendChild(renderIdentitySignals(data));
  wrapper.appendChild(renderFooter(data));

  return wrapper;
}

function renderHero(data: ActivityData): HTMLElement {
  if (data.now) {
    return renderNowHero(data);
  }
  return renderActiveProject(data);
}

function renderNowHero(data: ActivityData): HTMLElement {
  const now = data.now!;
  const hero = el('div', { class: 'st-hero' });

  const content = el('div', { class: 'st-hero-content' });

  const label = el('div', { class: 'st-hero-label' });
  const dot = el('span', { class: 'st-live-dot' });
  label.appendChild(dot);
  label.appendChild(document.createTextNode(heroLabel(now.type)));
  content.appendChild(label);

  content.appendChild(el('div', { class: 'st-hero-title' }, now.title));
  if (now.subtitle) {
    content.appendChild(el('div', { class: 'st-hero-subtitle' }, now.subtitle));
  }

  hero.appendChild(content);

  if (now.imageUrl) {
    const art = el('img', { class: 'st-hero-art', src: now.imageUrl, alt: '' });
    hero.appendChild(art);
  }

  return hero;
}

function renderActiveProject(data: ActivityData): HTMLElement {
  const hero = el('div', { class: 'st-hero st-hero-idle' });
  const content = el('div', { class: 'st-hero-content' });

  if (data.user.avatar) {
    const avatar = el('img', { class: 'st-hero-avatar', src: data.user.avatar, alt: '' });
    hero.appendChild(avatar);
  }

  content.appendChild(el('div', { class: 'st-hero-title' }, data.user.displayName));
  if (data.user.bio) {
    content.appendChild(el('div', { class: 'st-hero-subtitle' }, data.user.bio));
  }

  hero.appendChild(content);
  return hero;
}

function renderIdentitySignals(data: ActivityData): HTMLElement {
  const signals = el('div', { class: 'st-signals' });
  const items = collectSignals(data);

  for (const item of items.slice(0, 4)) {
    const signal = el('div', { class: 'st-signal' });

    const icon = el('span', { class: 'st-signal-icon' });
    const svg = serviceIcon(item.service);
    if (svg) icon.appendChild(svgEl(svg));
    signal.appendChild(icon);

    const body = el('div', { class: 'st-signal-body' });
    body.appendChild(el('span', { class: 'st-signal-value' }, item.value));
    body.appendChild(el('span', { class: 'st-signal-label' }, item.label));
    signal.appendChild(body);

    signals.appendChild(signal);
  }

  return signals;
}

interface IdentitySignal {
  service: string;
  value: string;
  label: string;
  priority: number;
}

function collectSignals(data: ActivityData): IdentitySignal[] {
  const signals: IdentitySignal[] = [];

  for (const [serviceId, group] of Object.entries(data.stats)) {
    for (const item of group.items) {
      const signal = mapToSignal(serviceId, item.key, item.value, item.unit, item.trend, group);
      if (signal) signals.push(signal);
    }
  }

  if (data.recent.length > 0) {
    const latestFilm = data.recent.find((e) => e.type === 'film');
    if (latestFilm) {
      const rating = latestFilm.metadata?.rating;
      const ratingStr = rating ? ` · ${rating}★` : '';
      signals.push({
        service: 'letterboxd',
        value: latestFilm.title + ratingStr,
        label: 'Recently watched',
        priority: 5,
      });
    }
  }

  signals.sort((a, b) => b.priority - a.priority);
  return signals;
}

function mapToSignal(
  service: string,
  key: string,
  value: string | number,
  unit?: string,
  trend?: string,
  _group?: StatGroup,
): IdentitySignal | null {
  const arrow = trend === 'up' ? ' ↑' : trend === 'down' ? ' ↓' : '';

  switch (key) {
    case 'blitz':
    case 'rapid':
      return { service, value: `${value}${arrow}`, label: key.charAt(0).toUpperCase() + key.slice(1) + ' rating', priority: 7 };

    case 'languages':
      return { service, value: String(value), label: 'Building with', priority: 8 };

    case 'commitsWeek':
      return typeof value === 'number' && value > 0
        ? { service, value: `${value} this week`, label: 'Commits', priority: 6 }
        : null;

    case 'currentlyReading':
      return { service, value: String(value), label: 'Reading', priority: 9 };

    case 'bookCount':
      return typeof value === 'number' && value > 0
        ? { service, value: `${value} books`, label: 'This year', priority: 4 }
        : null;

    case 'filmCount':
      return typeof value === 'number' && value > 0
        ? { service, value: `${value} films`, label: 'This year', priority: 4 }
        : null;

    case 'topGenres':
      return { service, value: String(value), label: 'Listening to', priority: 6 };

    case 'totalRunDistance':
    case 'totalRideDistance':
      return { service, value: `${value} ${unit ?? 'km'}`, label: key.includes('Run') ? 'Running' : 'Cycling', priority: 5 };

    case 'activitiesWeek':
      return typeof value === 'number' && value > 0
        ? { service, value: `${value} this week`, label: 'Activities', priority: 5 }
        : null;

    default:
      return null;
  }
}

function renderFooter(data: ActivityData): HTMLElement {
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

  const brand = el('a', {
    class: 'st-footer-brand',
    href: 'https://github.com/scrobbletime/scrobbletime',
    target: '_blank',
    rel: 'noopener',
  }, 'ScrobbleTime');
  footer.appendChild(brand);

  return footer;
}

function heroLabel(type: string): string {
  switch (type) {
    case 'listening': return 'Listening now';
    case 'coding': return 'Building';
    case 'reading': return 'Reading now';
    case 'playing': return 'Playing now';
    case 'watching': return 'Watching now';
    case 'exercising': return 'Active now';
    default: return 'Now';
  }
}
