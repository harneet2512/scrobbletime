import { state, subscribe, setStep, type Step } from './state.js';
import { renderConnect } from './pages/connect.js';
import { renderConfigure } from './pages/configure.js';
import { renderCustomize } from './pages/customize.js';
import { renderDeploy } from './pages/deploy.js';

const STEPS = [
  { label: 'Connect', render: renderConnect },
  { label: 'Configure', render: renderConfigure },
  { label: 'Customize', render: renderCustomize },
  { label: 'Deploy', render: renderDeploy },
];

function init() {
  const nav = document.getElementById('wizard-nav')!;
  const content = document.getElementById('wizard-content')!;
  const prevBtn = document.getElementById('prev-btn') as HTMLButtonElement;
  const nextBtn = document.getElementById('next-btn') as HTMLButtonElement;

  function renderNav() {
    nav.innerHTML = '';
    for (let i = 0; i < STEPS.length; i++) {
      const btn = document.createElement('button');
      btn.className = `wizard-nav-step${i === state.currentStep ? ' active' : ''}${i < state.currentStep ? ' completed' : ''}`;
      btn.textContent = `${i + 1}. ${STEPS[i].label}`;
      btn.addEventListener('click', () => setStep(i as Step));
      nav.appendChild(btn);
    }
  }

  function renderContent() {
    STEPS[state.currentStep].render(content);
  }

  function updateButtons() {
    prevBtn.disabled = state.currentStep === 0;
    prevBtn.style.visibility = state.currentStep === 0 ? 'hidden' : 'visible';
    nextBtn.textContent = state.currentStep === STEPS.length - 1 ? 'Done' : 'Next';
    nextBtn.style.visibility = state.currentStep === STEPS.length - 1 ? 'hidden' : 'visible';
  }

  prevBtn.addEventListener('click', () => {
    if (state.currentStep > 0) setStep((state.currentStep - 1) as Step);
  });

  nextBtn.addEventListener('click', () => {
    if (state.currentStep < STEPS.length - 1) setStep((state.currentStep + 1) as Step);
  });

  subscribe(() => {
    renderNav();
    renderContent();
    updateButtons();
  });

  renderNav();
  renderContent();
  updateButtons();
}

document.addEventListener('DOMContentLoaded', init);
