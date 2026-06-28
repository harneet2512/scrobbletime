import { state, notify } from '../state.js';

export function renderCustomize(container: HTMLElement): void {
  container.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'wizard-step-header';
  header.innerHTML = `
    <h2>Customize Your Card</h2>
    <p>Choose how your identity card looks. Preview updates live below.</p>
  `;
  container.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'wizard-customize-grid';

  grid.appendChild(createOptionGroup('Layout', [
    { value: 'signature', label: 'Signature', desc: 'One-line summary for bios and footers' },
    { value: 'card', label: 'Card', desc: 'Sidebar card for about sections' },
    { value: 'profile', label: 'Profile', desc: 'Full section for /now pages' },
  ], state.layout, (v) => { state.layout = v as typeof state.layout; notify(); }));

  grid.appendChild(createOptionGroup('Theme', [
    { value: 'auto', label: 'Auto', desc: 'Follows system light/dark preference' },
    { value: 'professional', label: 'Professional', desc: 'Clean, restrained, portfolio-safe' },
    { value: 'minimal', label: 'Minimal', desc: 'Typography-focused, nearly invisible' },
    { value: 'playful', label: 'Playful', desc: 'Warm accents, rounded corners' },
  ], state.theme, (v) => { state.theme = v as typeof state.theme; notify(); }));

  grid.appendChild(createOptionGroup('Density', [
    { value: 'comfortable', label: 'Comfortable', desc: 'Standard spacing' },
    { value: 'compact', label: 'Compact', desc: 'Tighter for small sidebars' },
  ], state.density, (v) => { state.density = v as typeof state.density; notify(); }));

  container.appendChild(grid);

  const previewSection = document.createElement('div');
  previewSection.className = 'wizard-preview-section';
  previewSection.innerHTML = `
    <h3>Preview</h3>
    <div class="wizard-preview-container">
      <scrobble-time
        base-url="data:application/json;base64,${btoa(JSON.stringify(getMockData()))}"
        layout="${state.layout}"
        theme="${state.theme}"
        density="${state.density}">
      </scrobble-time>
    </div>
  `;
  container.appendChild(previewSection);
}

function createOptionGroup(
  label: string,
  options: Array<{ value: string; label: string; desc: string }>,
  current: string,
  onChange: (value: string) => void,
): HTMLElement {
  const group = document.createElement('div');
  group.className = 'wizard-option-group';

  const title = document.createElement('h4');
  title.textContent = label;
  group.appendChild(title);

  for (const opt of options) {
    const card = document.createElement('label');
    card.className = `wizard-option-card${opt.value === current ? ' selected' : ''}`;

    card.innerHTML = `
      <input type="radio" name="st-${label.toLowerCase()}" value="${opt.value}" ${opt.value === current ? 'checked' : ''} />
      <span class="wizard-option-label">${opt.label}</span>
      <span class="wizard-option-desc">${opt.desc}</span>
    `;

    const radio = card.querySelector('input') as HTMLInputElement;
    radio.addEventListener('change', () => {
      if (radio.checked) {
        group.querySelectorAll('.wizard-option-card').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
        onChange(opt.value);
      }
    });

    group.appendChild(card);
  }

  return group;
}

function getMockData() {
  return {
    version: 1,
    lastSync: new Date().toISOString(),
    user: { displayName: state.username || 'Your Name', bio: 'Building things' },
    services: {
      github: { service: 'github', status: 'active', lastSync: new Date().toISOString() },
    },
    now: { service: 'spotify', type: 'listening', title: 'Everything In Its Right Place', subtitle: 'Radiohead' },
    recent: [
      { id: '1', service: 'github', type: 'commit', title: 'Pushed 3 commits', subtitle: 'feat: initial setup', timestamp: new Date().toISOString() },
      { id: '2', service: 'chess-com', type: 'game', title: 'vs opponent', subtitle: 'Win (1847)', timestamp: new Date(Date.now() - 3600000).toISOString() },
    ],
    stats: {
      github: { service: 'github', label: 'GitHub', items: [
        { key: 'commitsWeek', label: 'Commits This Week', value: 23 },
        { key: 'languages', label: 'Top Languages', value: 'TypeScript, Python' },
      ] },
    },
  };
}
