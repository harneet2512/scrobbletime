import type { ActivityData } from '@scrobbletime/schema';
import { fetchActivityData } from './fetcher.js';
import { renderSignature } from './layouts/signature.js';
import { renderCard } from './layouts/card.js';
import { renderProfile } from './layouts/profile.js';

import baseCSS from './themes/base.css?inline';
import professionalCSS from './themes/professional.css?inline';
import minimalCSS from './themes/minimal.css?inline';
import playfulCSS from './themes/playful.css?inline';

const THEME_CSS: Record<string, string> = {
  professional: professionalCSS,
  minimal: minimalCSS,
  playful: playfulCSS,
};

export class ScrobbleTimeElement extends HTMLElement {
  static observedAttributes = ['user', 'layout', 'theme', 'base-url', 'density'];

  private shadow: ShadowRoot;
  private data: ActivityData | null = null;
  private state: 'loading' | 'ready' | 'error' | 'empty' = 'loading';
  private abortController: AbortController | null = null;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.updateThemeClass();
    this.render();
    this.fetchData();
  }

  disconnectedCallback() {
    this.abortController?.abort();
  }

  attributeChangedCallback() {
    this.updateThemeClass();
    if (this.isConnected) {
      this.fetchData();
    }
  }

  private get activityUrl(): string {
    const baseUrl = this.getAttribute('base-url');
    if (baseUrl) {
      return baseUrl.endsWith('.json') ? baseUrl : `${baseUrl}/activity.json`;
    }
    const user = this.getAttribute('user');
    if (user) {
      return `https://${user}.github.io/scrobbletime/activity.json`;
    }
    return '';
  }

  private get layout(): string { return this.getAttribute('layout') ?? 'card'; }
  private get theme(): string { return this.getAttribute('theme') ?? 'auto'; }
  private get density(): string { return this.getAttribute('density') ?? 'comfortable'; }

  private updateThemeClass() {
    this.className = `st-theme-${this.theme}`;
  }

  private async fetchData() {
    const url = this.activityUrl;
    if (!url) {
      this.state = 'error';
      this.render();
      return;
    }

    this.abortController?.abort();
    this.abortController = new AbortController();

    try {
      this.state = 'loading';
      this.render();
      this.data = await fetchActivityData(url, this.abortController.signal);
      this.state = this.data.recent.length > 0 || this.data.now || Object.keys(this.data.stats).length > 0
        ? 'ready'
        : 'empty';
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        this.state = 'error';
      }
    }
    this.render();
  }

  private render() {
    const themeCSS = THEME_CSS[this.theme] ?? '';
    const densityClass = this.density === 'compact' ? ' st-density-compact' : '';

    this.shadow.innerHTML = '';

    const style = document.createElement('style');
    style.textContent = baseCSS + themeCSS;
    this.shadow.appendChild(style);

    const container = document.createElement('div');
    container.className = `st-root st-layout-${this.layout}${densityClass}`;

    if (this.state === 'loading') {
      container.innerHTML = this.renderSkeleton();
    } else if (this.state === 'error') {
      container.innerHTML = `<div class="st-error-state">
        <div class="st-empty-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg></div>
        <span>Unable to load activity</span>
      </div>`;
    } else if (this.state === 'empty') {
      container.innerHTML = `<div class="st-empty">
        <div class="st-empty-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg></div>
        <span>No activity yet</span>
      </div>`;
    } else if (this.data) {
      container.appendChild(this.renderLayout(this.data));
    }

    this.shadow.appendChild(container);
  }

  private renderLayout(data: ActivityData): HTMLElement {
    switch (this.layout) {
      case 'signature': return renderSignature(data);
      case 'profile': return renderProfile(data);
      case 'card':
      default: return renderCard(data);
    }
  }

  private renderSkeleton(): string {
    if (this.layout === 'signature') {
      return `<div style="padding: 12px 18px; display: flex; align-items: center; gap: 10px;">
        <div class="st-skeleton" style="width: 6px; height: 6px; border-radius: 50%;"></div>
        <div class="st-skeleton" style="height: 14px; width: 75%; border-radius: 4px;"></div>
      </div>`;
    }

    return `
      <div style="padding: 22px 24px; background: var(--st-bg-elevated);">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div class="st-skeleton" style="width: 56px; height: 56px; border-radius: 8px;"></div>
          <div style="flex: 1;">
            <div class="st-skeleton" style="height: 10px; width: 60px; margin-bottom: 8px; border-radius: 3px;"></div>
            <div class="st-skeleton" style="height: 16px; width: 180px; margin-bottom: 4px; border-radius: 4px;"></div>
            <div class="st-skeleton" style="height: 12px; width: 110px; border-radius: 3px;"></div>
          </div>
        </div>
      </div>
      <div style="padding: 6px 0;">
        <div style="padding: 12px 24px; display: flex; gap: 14px; align-items: center;">
          <div class="st-skeleton" style="width: 28px; height: 28px; border-radius: 50%;"></div>
          <div class="st-skeleton" style="height: 14px; width: 60%; border-radius: 4px;"></div>
        </div>
        <div style="padding: 12px 24px; display: flex; gap: 14px; align-items: center;">
          <div class="st-skeleton" style="width: 28px; height: 28px; border-radius: 50%;"></div>
          <div class="st-skeleton" style="height: 14px; width: 45%; border-radius: 4px;"></div>
        </div>
        <div style="padding: 12px 24px; display: flex; gap: 14px; align-items: center;">
          <div class="st-skeleton" style="width: 28px; height: 28px; border-radius: 50%;"></div>
          <div class="st-skeleton" style="height: 14px; width: 55%; border-radius: 4px;"></div>
        </div>
      </div>
    `;
  }
}
