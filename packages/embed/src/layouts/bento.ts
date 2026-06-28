import type { ActivityData } from '@scrobbletime/schema';
import { el } from '../utils.js';

export function renderBento(data: ActivityData): HTMLElement {
  const wrapper = el('div', { class: 'st-bento' });

  const tiles: HTMLElement[] = [];

  if (data.now) {
    tiles.push(createNowTile(data));
  }

  const codingStats = data.stats['github'];
  if (codingStats) {
    tiles.push(createCodeTile(codingStats, data));
  }

  const chessStats = data.stats['chess-com'] ?? data.stats['lichess'];
  if (chessStats) {
    tiles.push(createChessTile(chessStats));
  }

  const readingStats = data.stats['goodreads'];
  if (readingStats) {
    tiles.push(createReadingTile(readingStats));
  }

  const filmStats = data.stats['letterboxd'];
  if (filmStats) {
    tiles.push(createFilmTile(filmStats, data));
  }

  const stravaStats = data.stats['strava'];
  if (stravaStats) {
    tiles.push(createFitnessTile(stravaStats));
  }

  if (tiles.length === 0) {
    const idTile = el('div', { class: 'st-tile st-tile-wide st-tile-id' });
    idTile.appendChild(el('div', { class: 'st-tile-title' }, data.user.displayName));
    if (data.user.bio) {
      idTile.appendChild(el('div', { class: 'st-tile-meta' }, data.user.bio));
    }
    tiles.push(idTile);
  }

  for (const tile of tiles) {
    wrapper.appendChild(tile);
  }

  const footer = el('div', { class: 'st-bento-footer' });
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

function createNowTile(data: ActivityData): HTMLElement {
  const now = data.now!;
  const tile = el('div', { class: 'st-tile st-tile-wide st-tile-now' });

  const bg = el('div', { class: 'st-tile-now-bg' });
  tile.appendChild(bg);

  const content = el('div', { class: 'st-tile-now-content' });

  const label = el('div', { class: 'st-tile-label' });
  label.appendChild(el('span', { class: 'st-live-dot' }));
  label.appendChild(document.createTextNode(now.type === 'listening' ? 'NOW PLAYING' : 'ACTIVE NOW'));
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

function createCodeTile(stats: { items: Array<{ key: string; value: string | number }> }, _data: ActivityData): HTMLElement {
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

  const blitz = stats.items.find((i) => i.key === 'blitz');
  const rapid = stats.items.find((i) => i.key === 'rapid');

  if (blitz) {
    const arrow = blitz.trend === 'up' ? ' ↑' : blitz.trend === 'down' ? ' ↓' : '';
    const row = el('div', { class: 'st-chess-rating' });
    row.appendChild(el('span', { class: 'st-chess-value' }, `${blitz.value}${arrow}`));
    row.appendChild(el('span', { class: 'st-chess-label' }, 'Blitz'));
    content.appendChild(row);
  }

  if (rapid) {
    const arrow = rapid.trend === 'up' ? ' ↑' : rapid.trend === 'down' ? ' ↓' : '';
    const row = el('div', { class: 'st-chess-rating' });
    row.appendChild(el('span', { class: 'st-chess-value' }, `${rapid.value}${arrow}`));
    row.appendChild(el('span', { class: 'st-chess-label' }, 'Rapid'));
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
    spine.style.opacity = '0.2';
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

  const frameSvg = el('div', { class: 'st-film-frames' });
  for (let i = 0; i < 4; i++) {
    frameSvg.appendChild(el('div', { class: 'st-film-frame' }));
  }
  tile.appendChild(frameSvg);

  const content = el('div', { class: 'st-tile-film-content' });

  const latestFilm = data.recent.find((e) => e.type === 'film');
  if (latestFilm) {
    content.appendChild(el('div', { class: 'st-tile-title' }, latestFilm.title));
    const rating = latestFilm.metadata?.rating;
    if (rating) {
      content.appendChild(el('div', { class: 'st-tile-meta' }, `${rating}★`));
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
