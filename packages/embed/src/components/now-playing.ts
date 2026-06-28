import type { NowActivity } from '@scrobbletime/schema';
import { el } from '../utils.js';

const NOW_LABELS: Record<string, string> = {
  listening: 'Now playing',
  playing: 'Now playing',
  coding: 'Currently building',
  reading: 'Currently reading',
  watching: 'Now watching',
  exercising: 'Currently active',
};

export function renderNow(now: NowActivity): HTMLElement {
  const container = el('div', { class: 'st-now' });

  if (now.imageUrl) {
    container.appendChild(el('img', { class: 'st-now-image', src: now.imageUrl, alt: '' }));
  }

  const info = el('div', { class: 'st-now-info' });

  const label = el('div', { class: 'st-now-label' });
  label.appendChild(document.createTextNode(NOW_LABELS[now.type] ?? 'Now'));
  info.appendChild(label);

  info.appendChild(el('span', { class: 'st-now-title' }, now.title));
  if (now.subtitle) {
    info.appendChild(el('span', { class: 'st-now-subtitle' }, now.subtitle));
  }

  container.appendChild(info);

  const equalizer = el('div', { class: 'st-equalizer' });
  for (let i = 0; i < 4; i++) {
    equalizer.appendChild(el('div', { class: 'st-eq-bar' }));
  }
  container.appendChild(equalizer);

  return container;
}
