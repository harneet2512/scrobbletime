import type { ActivityData, TileOverride } from '@scrobbletime/schema';
import { el } from '../utils.js';

interface TileDef {
  id: string;
  available: boolean;
  size: '1x1' | '2x1';
  render: () => HTMLElement;
}

export function renderBento(data: ActivityData, overrides?: Record<string, string>): HTMLElement {
  const display = data.display ?? {};
  const tileOverrides = display.tiles ?? [];
  const overrideMap = new Map(tileOverrides.map((t) => [t.id, t]));

  const cols = parseInt(overrides?.columns ?? String(display.columns ?? 2));
  const gap = parseInt(overrides?.gap ?? String(display.gap ?? 8));
  const radius = parseInt(overrides?.radius ?? String(display.radius ?? 10));
  const accent = overrides?.accent ?? display.accentColor;

  const allTiles = buildTileDefs(data);

  const orderedIds = getOrderedIds(allTiles, tileOverrides);

  const wrapper = el('div', { class: 'st-bento' });
  wrapper.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
  wrapper.style.gap = `${gap}px`;
  wrapper.style.padding = `${gap}px`;

  if (accent) {
    wrapper.style.setProperty('--st-accent', accent);
  }

  let rendered = 0;
  for (const id of orderedIds) {
    const def = allTiles.find((t) => t.id === id);
    if (!def || !def.available) continue;

    const override = overrideMap.get(id);
    if (override?.hidden) continue;

    const size = override?.size ?? def.size;
    const color = override?.color;

    const tile = def.render();
    if (size === '2x1') {
      tile.style.gridColumn = 'span 2';
    }
    if (color) {
      tile.style.background = color;
      tile.style.borderColor = 'transparent';
    }
    if (radius !== 10) {
      tile.style.borderRadius = `${radius}px`;
    }

    wrapper.appendChild(tile);
    rendered++;
  }

  if (rendered === 0) {
    const empty = el('div', { class: 'st-tile st-tile-wide st-tile-id' });
    empty.style.gridColumn = 'span 2';
    empty.appendChild(el('div', { class: 'st-tile-title' }, data.user.displayName || 'ScrobbleTime'));
    if (data.user.bio) {
      empty.appendChild(el('div', { class: 'st-tile-meta' }, data.user.bio));
    }
    wrapper.appendChild(empty);
  }

  const footer = el('div', { class: 'st-bento-footer' });
  footer.style.gridColumn = `span ${cols}`;
  footer.appendChild(el('span', { class: 'st-bento-name' }, data.user.displayName));
  footer.appendChild(el('a', {
    class: 'st-footer-brand',
    href: 'https://github.com/scrobbletime/scrobbletime',
    target: '_blank',
    rel: 'noopener',
  }, 'ScrobbleTime'));
  wrapper.appendChild(footer);

  return wrapper;
}

function getOrderedIds(allTiles: TileDef[], overrides: TileOverride[]): string[] {
  if (overrides.length > 0) {
    const overrideIds = overrides.map((t) => t.id);
    const remaining = allTiles.filter((t) => !overrideIds.includes(t.id)).map((t) => t.id);
    return [...overrideIds, ...remaining];
  }
  return allTiles.map((t) => t.id);
}

function buildTileDefs(data: ActivityData): TileDef[] {
  const defs: TileDef[] = [];

  defs.push({
    id: 'now',
    available: !!data.now,
    size: '2x1',
    render: () => createNowTile(data),
  });

  defs.push({
    id: 'github',
    available: !!data.stats['github'],
    size: '1x1',
    render: () => createCodeTile(data.stats['github']),
  });

  defs.push({
    id: 'chess',
    available: !!(data.stats['chess-com'] ?? data.stats['lichess']),
    size: '1x1',
    render: () => createChessTile(data.stats['chess-com'] ?? data.stats['lichess']),
  });

  defs.push({
    id: 'reading',
    available: !!data.stats['goodreads'],
    size: '1x1',
    render: () => createReadingTile(data.stats['goodreads']),
  });

  defs.push({
    id: 'films',
    available: !!data.stats['letterboxd'],
    size: '1x1',
    render: () => createFilmTile(data.stats['letterboxd'], data),
  });

  defs.push({
    id: 'fitness',
    available: !!data.stats['strava'],
    size: '1x1',
    render: () => createFitnessTile(data.stats['strava']),
  });

  defs.push({
    id: 'music',
    available: !!(data.stats['spotify'] ?? data.stats['youtube-music']),
    size: '1x1',
    render: () => createMusicTile(data.stats['spotify'] ?? data.stats['youtube-music']),
  });

  return defs;
}

/* ── Tile renderers ── */

function createNowTile(data: ActivityData): HTMLElement {
  const now = data.now!;
  const tile = el('div', { class: 'st-tile st-tile-now' });
  tile.style.gridColumn = 'span 2';

  const bg = el('div', { class: 'st-tile-now-bg' });
  tile.appendChild(bg);

  const content = el('div', { class: 'st-tile-now-content' });
  const label = el('div', { class: 'st-tile-label' });
  label.appendChild(el('span', { class: 'st-live-dot' }));
  const labelText = now.type === 'listening' ? 'NOW PLAYING'
    : now.type === 'coding' ? 'BUILDING'
      : now.type === 'reading' ? 'READING'
        : 'ACTIVE NOW';
  label.appendChild(document.createTextNode(labelText));
  content.appendChild(label);
  content.appendChild(el('div', { class: 'st-tile-title' }, now.title));
  if (now.subtitle) {
    content.appendChild(el('div', { class: 'st-tile-meta' }, now.subtitle));
  }
  tile.appendChild(content);

  if (now.imageUrl) {
    tile.appendChild(el('img', { class: 'st-tile-art', src: now.imageUrl, alt: '' }));
  } else {
    const eqWrap = el('div', { class: 'st-tile-eq' });
    for (let i = 0; i < 5; i++) {
      eqWrap.appendChild(el('div', { class: 'st-eq-bar' }));
    }
    tile.appendChild(eqWrap);
  }

  return tile;
}

function createCodeTile(stats: { items: Array<{ key: string; value: string | number }> }): HTMLElement {
  const tile = el('div', { class: 'st-tile st-tile-code' });

  const termLine = el('div', { class: 'st-tile-term' });
  const dots = el('div', { class: 'st-tile-term-dots' });
  dots.appendChild(el('span', { class: 'st-dot-red' }));
  dots.appendChild(el('span', { class: 'st-dot-yellow' }));
  dots.appendChild(el('span', { class: 'st-dot-green' }));
  termLine.appendChild(dots);
  tile.appendChild(termLine);

  const langs = stats.items.find((i) => i.key === 'languages');
  const commits = stats.items.find((i) => i.key === 'commitsWeek');

  if (langs) {
    const langStr = String(langs.value);
    const langList = langStr.split(',').map((l) => l.trim()).slice(0, 3);
    const barWrap = el('div', { class: 'st-lang-bars' });
    const colors = ['#3178c6', '#f1e05a', '#00ADD8', '#e34c26', '#563d7c'];
    langList.forEach((lang, i) => {
      const row = el('div', { class: 'st-lang-row' });
      const bar = el('div', { class: 'st-lang-bar' });
      bar.style.background = colors[i % colors.length];
      bar.style.width = `${90 - i * 20}%`;
      row.appendChild(bar);
      row.appendChild(el('span', { class: 'st-lang-name' }, lang));
      barWrap.appendChild(row);
    });
    tile.appendChild(barWrap);
  }

  if (commits) {
    tile.appendChild(el('div', { class: 'st-tile-stat' }, `${commits.value} commits this week`));
  }

  return tile;
}

function createChessTile(stats: { items: Array<{ key: string; value: string | number; trend?: string }> }): HTMLElement {
  const tile = el('div', { class: 'st-tile st-tile-chess' });

  const pieceSvg = `<svg viewBox="0 0 45 45" class="st-chess-piece"><path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03C15.41 27.09 11 31.58 11 39.5H34c0-7.92-4.41-12.41-7.41-13.47C28.06 24.84 29 23.03 29 21c0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" fill="currentColor" opacity="0.15"/></svg>`;
  const pieceEl = el('div', { class: 'st-tile-chess-bg' });
  pieceEl.innerHTML = pieceSvg;
  tile.appendChild(pieceEl);

  const content = el('div', { class: 'st-tile-chess-content' });
  for (const tc of ['blitz', 'rapid', 'bullet']) {
    const item = stats.items.find((i) => i.key === tc);
    if (!item) continue;
    const arrow = item.trend === 'up' ? ' ↑' : item.trend === 'down' ? ' ↓' : '';
    const row = el('div', { class: 'st-chess-rating' });
    row.appendChild(el('span', { class: 'st-chess-value' }, `${item.value}${arrow}`));
    row.appendChild(el('span', { class: 'st-chess-label' }, tc.charAt(0).toUpperCase() + tc.slice(1)));
    content.appendChild(row);
  }

  tile.appendChild(content);
  return tile;
}

function createReadingTile(stats: { items: Array<{ key: string; value: string | number }> }): HTMLElement {
  const tile = el('div', { class: 'st-tile st-tile-reading' });

  const spinesSvg = el('div', { class: 'st-book-spines' });
  const heights = [70, 85, 60, 90, 55, 75, 80, 65];
  const colors = ['#c0392b', '#2980b9', '#27ae60', '#8e44ad', '#f39c12', '#1abc9c', '#e74c3c', '#3498db'];
  heights.forEach((h, i) => {
    const spine = el('div', { class: 'st-spine' });
    spine.style.height = `${h}%`;
    spine.style.background = colors[i % colors.length];
    spine.style.opacity = '0.45';
    spinesSvg.appendChild(spine);
  });
  tile.appendChild(spinesSvg);

  const content = el('div', { class: 'st-tile-reading-content' });
  const current = stats.items.find((i) => i.key === 'currentlyReading');
  const count = stats.items.find((i) => i.key === 'bookCount');

  if (current) {
    content.appendChild(el('div', { class: 'st-tile-title' }, String(current.value)));
    content.appendChild(el('div', { class: 'st-tile-meta' }, 'Currently reading'));
  }
  if (count) {
    content.appendChild(el('div', { class: 'st-tile-stat' }, `${count.value} books this year`));
  }

  tile.appendChild(content);
  return tile;
}

function createFilmTile(stats: { items: Array<{ key: string; value: string | number }> }, data: ActivityData): HTMLElement {
  const tile = el('div', { class: 'st-tile st-tile-film' });

  const filmStrip = el('div', { class: 'st-film-strip' });
  for (let i = 0; i < 8; i++) {
    filmStrip.appendChild(el('div', { class: 'st-film-perf' }));
  }
  tile.appendChild(filmStrip);

  const content = el('div', { class: 'st-tile-film-content' });

  const latestFilm = data.recent.find((e) => e.type === 'film');
  if (latestFilm) {
    content.appendChild(el('div', { class: 'st-tile-title' }, latestFilm.title));
    const rating = latestFilm.metadata?.rating;
    if (rating) {
      const stars = el('div', { class: 'st-film-stars' });
      const fullStars = Math.floor(Number(rating));
      const half = Number(rating) % 1 >= 0.5;
      for (let i = 0; i < fullStars; i++) stars.appendChild(el('span', { class: 'st-star st-star-full' }, '★'));
      if (half) stars.appendChild(el('span', { class: 'st-star st-star-half' }, '★'));
      content.appendChild(stars);
    }
  }

  const count = stats.items.find((i) => i.key === 'filmCount');
  if (count) {
    content.appendChild(el('div', { class: 'st-tile-stat' }, `${count.value} films this year`));
  }

  tile.appendChild(content);
  return tile;
}

function createFitnessTile(stats: { items: Array<{ key: string; value: string | number; unit?: string }> }): HTMLElement {
  const tile = el('div', { class: 'st-tile st-tile-fitness' });

  const runnerSvg = `<svg viewBox="0 0 24 24" class="st-fitness-icon" fill="currentColor" opacity="0.12"><path d="M13.49 5.48c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm-3.6 13.9l1-4.4 2.1 2v6h2v-7.5l-2.1-2 .6-3c1.3 1.5 3.3 2.5 5.5 2.5v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1l-5.2 2.2v4.7h2v-3.4l1.8-.7-1.6 8.1-4.9-1-.4 2 7 1.4z"/></svg>`;
  const iconEl = el('div', { class: 'st-tile-fitness-bg' });
  iconEl.innerHTML = runnerSvg;
  tile.appendChild(iconEl);

  const content = el('div', { class: 'st-tile-fitness-content' });
  const dist = stats.items.find((i) => i.key === 'totalRunDistance' || i.key === 'totalRideDistance');
  const week = stats.items.find((i) => i.key === 'activitiesWeek');

  if (dist) {
    content.appendChild(el('div', { class: 'st-fitness-big' }, `${dist.value}`));
    content.appendChild(el('div', { class: 'st-tile-meta' }, `km ${dist.key.includes('Run') ? 'running' : 'cycling'}`));
  }
  if (week && typeof week.value === 'number' && week.value > 0) {
    content.appendChild(el('div', { class: 'st-tile-stat' }, `${week.value} activities this week`));
  }

  tile.appendChild(content);
  return tile;
}

function createMusicTile(stats: { items: Array<{ key: string; value: string | number; unit?: string }> }): HTMLElement {
  const tile = el('div', { class: 'st-tile st-tile-music' });

  const eqWrap = el('div', { class: 'st-music-eq-bg' });
  for (let i = 0; i < 12; i++) {
    const bar = el('div', { class: 'st-music-eq-bar' });
    bar.style.animationDelay = `${i * 0.08}s`;
    bar.style.height = `${30 + Math.abs(6 - i) * 8}%`;
    eqWrap.appendChild(bar);
  }
  tile.appendChild(eqWrap);

  const content = el('div', { class: 'st-tile-music-content' });
  const genres = stats.items.find((i) => i.key === 'topGenres');
  const count = stats.items.find((i) => i.key === 'recentCount' || i.key === 'likedCount');

  if (genres) {
    content.appendChild(el('div', { class: 'st-tile-title' }, String(genres.value)));
    content.appendChild(el('div', { class: 'st-tile-meta' }, 'Top genres'));
  }
  if (count) {
    content.appendChild(el('div', { class: 'st-tile-stat' }, `${count.value} ${count.unit ?? 'tracks'}`));
  }

  tile.appendChild(content);
  return tile;
}
