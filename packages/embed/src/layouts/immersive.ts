import type { ActivityData } from '@scrobbletime/schema';
import { el } from '../utils.js';

export function renderImmersive(data: ActivityData): HTMLElement {
  const wrapper = el('div', { class: 'st-immersive' });

  const bg = el('div', { class: 'st-imm-bg' });
  if (data.now?.imageUrl) {
    bg.style.backgroundImage = `url(${data.now.imageUrl})`;
    bg.classList.add('st-imm-bg-art');
  } else {
    const service = getMostActiveService(data);
    bg.classList.add(`st-imm-bg-${service}`);
  }
  wrapper.appendChild(bg);

  const overlay = el('div', { class: 'st-imm-overlay' });
  wrapper.appendChild(overlay);

  const content = el('div', { class: 'st-imm-content' });

  if (data.now) {
    const nowSection = el('div', { class: 'st-imm-now' });
    const label = el('div', { class: 'st-imm-now-label' });
    label.appendChild(el('span', { class: 'st-live-dot' }));
    const text = data.now.type === 'listening' ? 'LISTENING' : 'ACTIVE';
    label.appendChild(document.createTextNode(text));
    nowSection.appendChild(label);
    nowSection.appendChild(el('div', { class: 'st-imm-now-title' }, data.now.title));
    if (data.now.subtitle) {
      nowSection.appendChild(el('div', { class: 'st-imm-now-sub' }, data.now.subtitle));
    }
    content.appendChild(nowSection);
  } else {
    const idSection = el('div', { class: 'st-imm-now' });
    idSection.appendChild(el('div', { class: 'st-imm-now-title' }, data.user.displayName));
    if (data.user.bio) {
      idSection.appendChild(el('div', { class: 'st-imm-now-sub' }, data.user.bio));
    }
    content.appendChild(idSection);
  }

  const chips = el('div', { class: 'st-imm-chips' });
  const signals = collectImmersiveSignals(data);
  for (const s of signals.slice(0, 4)) {
    const chip = el('div', { class: 'st-imm-chip' });
    chip.appendChild(el('span', { class: 'st-imm-chip-val' }, s.value));
    chip.appendChild(el('span', { class: 'st-imm-chip-label' }, s.label));
    chips.appendChild(chip);
  }
  content.appendChild(chips);

  const footer = el('div', { class: 'st-imm-footer' });
  if (data.user.avatar) {
    footer.appendChild(el('img', { class: 'st-imm-avatar', src: data.user.avatar, alt: '' }));
  }
  footer.appendChild(el('span', { class: 'st-imm-name' }, data.user.displayName));

  const brandWrap = el('div', { style: 'margin-left: auto;' });
  brandWrap.appendChild(el('a', {
    class: 'st-imm-brand',
    href: 'https://github.com/scrobbletime/scrobbletime',
    target: '_blank',
    rel: 'noopener',
  }, 'ScrobbleTime'));
  footer.appendChild(brandWrap);

  content.appendChild(footer);
  wrapper.appendChild(content);

  return wrapper;
}

function getMostActiveService(data: ActivityData): string {
  if (data.stats['github']) return 'code';
  if (data.stats['chess-com'] || data.stats['lichess']) return 'chess';
  if (data.stats['strava']) return 'fitness';
  if (data.stats['letterboxd']) return 'film';
  if (data.stats['goodreads']) return 'reading';
  return 'default';
}

interface Signal { value: string; label: string; }

function collectImmersiveSignals(data: ActivityData): Signal[] {
  const signals: Signal[] = [];

  for (const group of Object.values(data.stats)) {
    for (const item of group.items) {
      switch (item.key) {
        case 'languages':
          signals.push({ value: String(item.value).split(',').slice(0, 2).map((s) => s.trim()).join(' · '), label: 'BUILDING WITH' });
          break;
        case 'blitz':
          signals.push({ value: `${item.value}${item.trend === 'up' ? '↑' : ''}`, label: 'BLITZ' });
          break;
        case 'rapid':
          signals.push({ value: `${item.value}`, label: 'RAPID' });
          break;
        case 'commitsWeek':
          if (typeof item.value === 'number' && item.value > 0)
            signals.push({ value: `${item.value}`, label: 'COMMITS/WK' });
          break;
        case 'currentlyReading':
          signals.push({ value: String(item.value), label: 'READING' });
          break;
        case 'filmCount':
          if (typeof item.value === 'number' && item.value > 0)
            signals.push({ value: `${item.value}`, label: 'FILMS' });
          break;
        case 'bookCount':
          if (typeof item.value === 'number' && item.value > 0)
            signals.push({ value: `${item.value}`, label: 'BOOKS' });
          break;
      }
    }
  }
  return signals;
}
