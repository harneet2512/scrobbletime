import type { ActivityData } from '@scrobbletime/schema';
import { el, truncate } from '../utils.js';

export function renderSignature(data: ActivityData): HTMLElement {
  const parts: string[] = [];

  if (data.now) {
    const verb = data.now.type === 'coding' ? 'Building'
      : data.now.type === 'listening' ? 'Listening to'
        : data.now.type === 'reading' ? 'Reading'
          : data.now.type === 'playing' ? 'Playing'
            : data.now.type === 'watching' ? 'Watching'
              : 'Active on';
    parts.push(`${verb} ${data.now.title}`);
  }

  for (const group of Object.values(data.stats)) {
    for (const item of group.items) {
      if (item.key === 'languages' && typeof item.value === 'string') {
        parts.push(item.value);
      } else if (item.key === 'blitz' || item.key === 'rapid') {
        const arrow = item.trend === 'up' ? ' ↑' : item.trend === 'down' ? ' ↓' : '';
        parts.push(`${item.label} ${item.value}${arrow}`);
      } else if (item.key === 'currentlyReading' && typeof item.value === 'string') {
        if (!data.now || data.now.type !== 'reading') {
          parts.push(`Reading ${item.value}`);
        }
      } else if (item.key === 'bookCount' && typeof item.value === 'number') {
        parts.push(`${item.value} books this year`);
      } else if (item.key === 'filmCount' && typeof item.value === 'number') {
        parts.push(`${item.value} films this year`);
      }
    }
  }

  if (parts.length === 0) {
    parts.push(data.user.displayName || 'ScrobbleTime');
  }

  const wrapper = el('div', {
    style: 'padding: 12px 18px; display: flex; align-items: center; gap: 8px;',
  });

  if (data.now) {
    const dot = el('span', {
      style: 'width: 6px; height: 6px; border-radius: 50%; background: var(--st-success); flex-shrink: 0; animation: st-pulse 2s ease-in-out infinite;',
    });
    wrapper.appendChild(dot);
  }

  const text = el('span', {
    style: 'font-size: 13px; font-weight: 500; color: var(--st-text-secondary); letter-spacing: -0.01em;',
  });
  text.appendChild(document.createTextNode(truncate(parts.join('  ·  '), 200)));
  wrapper.appendChild(text);

  return wrapper;
}
