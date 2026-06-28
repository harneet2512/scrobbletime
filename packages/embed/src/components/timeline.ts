import type { RecentEvent } from '@scrobbletime/schema';
import { el, svgEl, eventIcon, relativeTime } from '../utils.js';

export function renderTimeline(events: RecentEvent[], maxItems = 5): HTMLElement {
  const section = el('div', { class: 'st-section' });
  section.appendChild(el('span', { class: 'st-section-label' }, 'Recent'));

  const list = el('ul', { class: 'st-timeline' });

  for (const event of events.slice(0, maxItems)) {
    const item = el('li', { class: 'st-event' });

    const icon = el('span', { class: 'st-event-icon' });
    icon.appendChild(svgEl(eventIcon(event.type)));
    item.appendChild(icon);

    const content = el('div', { class: 'st-event-content' });
    content.appendChild(el('span', { class: 'st-event-title' }, event.title));
    if (event.subtitle) {
      content.appendChild(el('span', { class: 'st-event-subtitle' }, event.subtitle));
    }
    item.appendChild(content);

    item.appendChild(
      el('span', { class: 'st-event-time' }, relativeTime(event.timestamp)),
    );

    list.appendChild(item);
  }

  section.appendChild(list);
  return section;
}
