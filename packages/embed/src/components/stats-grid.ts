import type { StatGroup } from '@scrobbletime/schema';
import { el, trendArrow } from '../utils.js';

export function renderStats(statsMap: Record<string, StatGroup>): HTMLElement {
  const section = el('div', { class: 'st-section' });
  section.appendChild(el('span', { class: 'st-section-label' }, 'Stats'));

  const grid = el('div', { class: 'st-stats-grid' });

  for (const group of Object.values(statsMap)) {
    for (const item of group.items) {
      const stat = el('div', { class: 'st-stat' });

      const isTextValue = typeof item.value === 'string' && item.value.length > 6;

      if (isTextValue) {
        stat.appendChild(el('span', { class: 'st-stat-text' }, String(item.value)));
      } else {
        const valueStr = typeof item.value === 'number'
          ? item.value.toLocaleString()
          : String(item.value);

        const valueEl = el('span', { class: 'st-stat-value' }, valueStr);

        if (item.unit) {
          valueEl.appendChild(el('span', { class: 'st-stat-unit' }, item.unit));
        }

        const arrow = trendArrow(item.trend);
        if (arrow) {
          valueEl.appendChild(el('span', { class: `st-stat-trend ${item.trend}` }, arrow));
        }

        stat.appendChild(valueEl);
      }

      stat.appendChild(el('span', { class: 'st-stat-label' }, item.label));
      grid.appendChild(stat);
    }
  }

  section.appendChild(grid);
  return section;
}
