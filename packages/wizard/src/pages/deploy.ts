import { state, generateConfig, generateSnippet } from '../state.js';

export function renderDeploy(container: HTMLElement): void {
  container.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'wizard-step-header';
  header.innerHTML = `
    <h2>Deploy Your Card</h2>
    <p>Follow these steps to get your live identity card running.</p>
  `;
  container.appendChild(header);

  const steps = document.createElement('div');
  steps.className = 'wizard-deploy-steps';

  steps.innerHTML = `
    <div class="wizard-deploy-step">
      <span class="wizard-deploy-step-num">1</span>
      <div>
        <h4>Fork the ScrobbleTime repository</h4>
        <p>Fork <a href="https://github.com/scrobbletime/scrobbletime" target="_blank" rel="noopener">scrobbletime/scrobbletime</a> to your GitHub account.</p>
      </div>
    </div>

    <div class="wizard-deploy-step">
      <span class="wizard-deploy-step-num">2</span>
      <div>
        <h4>Add your configuration</h4>
        <p>Replace <code>scrobbletime.config.json</code> in your fork with this:</p>
        <div class="wizard-code-block">
          <button class="wizard-copy-btn" data-target="config">Copy</button>
          <pre id="config-output">${escapeHtml(JSON.stringify(generateConfig(), null, 2))}</pre>
        </div>
      </div>
    </div>

    <div class="wizard-deploy-step">
      <span class="wizard-deploy-step-num">3</span>
      <div>
        <h4>Set up secrets</h4>
        <p>Go to your fork's Settings → Secrets and variables → Actions, and add the required secrets for your enabled services:</p>
        ${renderSecretsList()}
      </div>
    </div>

    <div class="wizard-deploy-step">
      <span class="wizard-deploy-step-num">4</span>
      <div>
        <h4>Enable GitHub Actions and Pages</h4>
        <p>In your fork: Actions → enable workflows. Settings → Pages → set source to "GitHub Actions" or "gh-pages" branch.</p>
      </div>
    </div>

    <div class="wizard-deploy-step">
      <span class="wizard-deploy-step-num">5</span>
      <div>
        <h4>Add the embed to your site</h4>
        <p>Paste this snippet into your portfolio HTML:</p>
        <div class="wizard-code-block">
          <button class="wizard-copy-btn" data-target="snippet">Copy</button>
          <pre id="snippet-output">${escapeHtml(generateSnippet())}</pre>
        </div>
      </div>
    </div>

    <div class="wizard-deploy-step">
      <span class="wizard-deploy-step-num">6</span>
      <div>
        <h4>Verify</h4>
        <p>After the first sync runs (~30 min), your embed should be live.</p>
        <button class="wizard-verify-btn" id="verify-btn">Check Status</button>
        <div id="verify-result"></div>
      </div>
    </div>
  `;

  container.appendChild(steps);

  container.querySelectorAll('.wizard-copy-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = (btn as HTMLElement).dataset.target;
      const text = target === 'config'
        ? JSON.stringify(generateConfig(), null, 2)
        : generateSnippet();
      navigator.clipboard.writeText(text).then(() => {
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
      });
    });
  });

  const verifyBtn = container.querySelector('#verify-btn');
  verifyBtn?.addEventListener('click', async () => {
    const result = container.querySelector('#verify-result') as HTMLElement;
    result.textContent = 'Checking...';
    result.className = '';

    const url = `https://${state.username}.github.io/scrobbletime/activity.json`;
    try {
      const response = await fetch(url);
      if (response.ok) {
        result.textContent = 'Activity data found. Your embed is live!';
        result.className = 'wizard-verify-success';
      } else {
        result.textContent = `HTTP ${response.status} — activity.json not found yet. Run the sync workflow manually or wait for the next scheduled run.`;
        result.className = 'wizard-verify-warning';
      }
    } catch {
      result.textContent = 'Could not reach activity.json. Make sure GitHub Pages is enabled and the sync has run at least once.';
      result.className = 'wizard-verify-error';
    }
  });
}

function renderSecretsList(): string {
  const secrets: Array<{ name: string; service: string }> = [];

  if (state.services.spotify?.enabled) {
    secrets.push(
      { name: 'SPOTIFY_CLIENT_ID', service: 'Spotify' },
      { name: 'SPOTIFY_CLIENT_SECRET', service: 'Spotify' },
      { name: 'SPOTIFY_REFRESH_TOKEN', service: 'Spotify' },
    );
  }
  if (state.services['youtube-music']?.enabled) {
    secrets.push(
      { name: 'YOUTUBE_API_KEY', service: 'YouTube Music' },
      { name: 'YOUTUBE_CHANNEL_ID', service: 'YouTube Music' },
    );
  }
  if (state.services.strava?.enabled) {
    secrets.push(
      { name: 'STRAVA_CLIENT_ID', service: 'Strava' },
      { name: 'STRAVA_CLIENT_SECRET', service: 'Strava' },
      { name: 'STRAVA_REFRESH_TOKEN', service: 'Strava' },
    );
  }

  if (secrets.length === 0) {
    return '<p>No secrets needed for your selected services.</p>';
  }

  return `<ul class="wizard-secrets-list">${secrets.map((s) => `<li><code>${s.name}</code> — ${s.service}</li>`).join('')}</ul>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
