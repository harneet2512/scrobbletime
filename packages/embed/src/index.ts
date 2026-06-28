import { ScrobbleTimeElement } from './ScrobbleTime.js';

if (!customElements.get('scrobble-time')) {
  customElements.define('scrobble-time', ScrobbleTimeElement);
}

const currentScript = document.currentScript;
if (currentScript) {
  const user = currentScript.getAttribute('data-user');
  const layout = currentScript.getAttribute('data-layout') ?? 'card';
  const theme = currentScript.getAttribute('data-theme') ?? 'auto';
  const density = currentScript.getAttribute('data-density') ?? 'comfortable';
  const baseUrl = currentScript.getAttribute('data-base-url');

  if (user || baseUrl) {
    const el = document.createElement('scrobble-time');
    if (user) el.setAttribute('user', user);
    if (baseUrl) el.setAttribute('base-url', baseUrl);
    el.setAttribute('layout', layout);
    el.setAttribute('theme', theme);
    el.setAttribute('density', density);
    currentScript.after(el);
  }
}

export { ScrobbleTimeElement };
