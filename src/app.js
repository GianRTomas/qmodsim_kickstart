/**
 * FATAMA-QMODSIM Main Interactive Application Shell
 * Mirrors PULSE-GUARD's 3-Archetype layout (Scenarios, Lab, Codex) + Verification Drawer + Dual Theme.
 */
import { SCENARIO_EPISODES } from './data/episodes.js';
import { CURRICULUM_CARDS } from './data/modulesGrid.js';
import { CODEX_ENTRIES } from './data/codex.js';
import { renderMascotSvg } from './components/mascots.js';
import { runFairMonteCarlo } from './engines/fair.js';
import { generateComparisonTokens } from './engines/entropy.js';
import { CircularZScoreDetector } from './engines/anomaly.js';
import { buildBeltTransitionMatrix } from './engines/dtmc.js';
import { createSeededRng } from './engines/nhpp.js';
import { renderScenariosView, hydrateScenarioCanvas } from './views/scenarios.js';
import { renderLabView, hydrateLabCanvases } from './views/lab.js';
import { renderCodexView } from './views/codex.js';
import { renderValidationDrawer } from './views/validationDrawer.js';

const SLIDER_BOUNDS = {
  lambdaBase: [0.2, 2.5],
  lambdaPeak: [1.0, 12.0],
  sigma: [1.5, 9.0],
  tScrubber: [0, 30],
  qLambda: [0.5, 8.0],
  qMu: [0.8, 4.0],
  qCap: [6, 50],
  tefMode: [2, 20],
  sessionFee: [100, 400],
  penaltyFee: [100, 1000],
  auditOverhead: [5, 90],
  tokenLength: [4, 32],
  attackRate: [10, 100000],
  zThreshold: [2.0, 6.0],
  rNetwork: [0.8, 0.999],
};

function clampSlider(key, val) {
  const num = Number(val);
  if (!Number.isFinite(num)) return 0;
  const bounds = SLIDER_BOUNDS[key];
  if (!bounds) return num;
  return Math.max(bounds[0], Math.min(bounds[1], num));
}

function initAnomalyHistory(threshold) {
  const detector = new CircularZScoreDetector(30, threshold);
  const rng = createSeededRng(202611);
  const stream = [];
  for (let i = 0; i < 36; i++) {
    const val = i === 28 ? 285 : 200 + (rng() - 0.5) * 18;
    stream.push(detector.push(val));
  }
  return { detector, stream };
}

const initialAnomaly = initAnomalyHistory(3.5);

const state = {
  theme: (() => {
    try {
      const saved = localStorage.getItem('fatama_qmodsim_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {}
    return 'dark';
  })(),
  activeTab: 'scenarios', // 'scenarios' | 'lab' | 'codex'
  mascotVariant: 'dojang', // 'dojang' | 'cyber' | 'tournament'
  scenarioId: 1,
  scenarioEdition: 'extended',
  scenarioLineIndex: 0,
  isAutoPlaying: false,
  scenarioForkChoice: {
    1: 'staggered_batches',
    2: 'two_tablets',
    3: 'mentored',
    4: 'rls_encrypted',
    5: 'pinned_deterrence',
    6: 'hmac_qr',
    7: 'strict_35sigma',
    8: 'offline_sync',
  },
  labTab: 'full-hub',
  codexId: CODEX_ENTRIES[0].id,
  validationOpen: false,
  dtmcTurn: 0,
  dtmcCohort: Array(48).fill(0),
  dtmcRng: createSeededRng(5050),
  anomalyDetector: initialAnomaly.detector,
  anomalyStream: initialAnomaly.stream,
  cryptoTokens: { pin: '4829', hmacToken: '9f3a7c12d84b01e6a45c91e30b78f21d' },
  lab: {
    lambdaBase: 0.8,
    lambdaPeak: 4.1,
    sigma: 6.5,
    tScrubber: 15,
    qLambda: 3.4,
    qMu: 1.9,
    qCores: 2,
    qCap: 24,
    dtmcPolicy: 'mentored',
    tefMode: 6,
    fairTrials: 10000,
    rlsMitigated: true,
    sessionFee: 200,
    penaltyFee: 500,
    auditOverhead: 25,
    lobbyFriction: 5,
    alphabetSize: 16,
    tokenLength: 32,
    attackRate: 1000,
    zThreshold: 3.5,
    rNetwork: 0.965,
    offlineLocalSync: true,
  },
  fairCache: null,
};

state.fairCache = runFairMonteCarlo({
  trials: state.lab.fairTrials,
  tefMode: state.lab.tefMode,
  rlsMitigated: state.lab.rlsMitigated,
});

let autoPlayTimer = null;

function applyTheme() {
  const root = document.documentElement;
  root.setAttribute('data-theme', state.theme);
  root.classList.toggle('light', state.theme === 'light');
  root.classList.toggle('dark', state.theme === 'dark');
  try {
    localStorage.setItem('fatama_qmodsim_theme', state.theme);
  } catch {}
}

function getCardIconSvg(name) {
  const icons = {
    activity: '<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    gitbranch: '<line x1="6" y1="3" x2="6" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    scale: '<path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/><path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
    radar: '<path d="M12 20h.01"/><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/>',
    server: '<rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>',
  };
  return `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.activity}</svg>`;
}

function renderHeader() {
  const tabs = [
    { id: 'scenarios', label: 'Scenarios', icon: '📖' },
    { id: 'lab', label: 'Lab', icon: '🧪' },
    { id: 'codex', label: 'Codex', icon: '📜' },
  ];

  return `
    <header class="top-header">
      <div class="header-inner">
        <div class="brand-group">
          <button type="button" class="brand-btn" id="homeBrandBtn" aria-label="FATAMA-QMODSIM Home">
            <img src="images/fatama_logo.png" alt="Fatama Fighting Dragons Emblem" class="brand-emblem">
            <span class="brand-wordmark">FATAMA<span class="brand-accent">-QMODSIM</span></span>
          </button>
          <div class="status-badge">
            <span class="pulse-dot"></span>
            <span class="status-ok-text">Active</span>
            <span class="sep">·</span>
            <span class="status-sub">48 Athletes · Tarlac Dojang</span>
          </div>
        </div>

        <nav class="main-nav" aria-label="Primary QMODSIM Navigation">
          ${tabs
            .map(
              (t) => `
            <button type="button" class="nav-pill ${state.activeTab === t.id ? 'is-active' : ''}" data-nav-tab="${t.id}">
              <span>${t.icon}</span>
              <span>${t.label}</span>
            </button>
          `
            )
            .join('')}
        </nav>

        <div class="header-actions">
          <button type="button" class="validation-trigger-btn" id="openValidationBtn" title="Run Mathematical Invariant Audit">
            <span>✓</span>
            <span>Verify Invariants</span>
          </button>
          <span class="qmod-year">QMODSIM 2026</span>
          <button type="button" class="theme-toggle-btn" id="themeToggleBtn" aria-label="Switch color theme">
            <span>${state.theme === 'dark' ? '☀ Light' : '🌙 Dark'}</span>
          </button>
        </div>
      </div>

      <div class="mobile-nav-bar">
        ${tabs
          .map(
            (t) => `
          <button type="button" class="nav-pill ${state.activeTab === t.id ? 'is-active' : ''}" data-nav-tab="${t.id}">
            <span>${t.icon}</span>
            <span>${t.label}</span>
          </button>
        `
          )
          .join('')}
      </div>
    </header>
  `;
}

function renderHeroBanner() {
  return `
    <section class="hero-card" aria-label="FATAMA-QMODSIM Overview">
      <div class="hero-copy">
        <div class="hero-kicker">
          <span>🥋</span>
          <span>Quantitative Modeling &amp; Simulation · Fatama KickStart Testbed</span>
        </div>
        <h1 class="hero-title">
          FATAMA-QMODSIM:<br>
          <span class="hero-accent">Dojang Operations &amp; Cyber-Resilience Engine</span>
        </h1>
        <p class="hero-desc">
          Simulate Sunday 11:00 AM training operations at Robinsons Luisita Covered Area across 48 student-athletes, front-desk check-in tablets, and ₱200 session ledgers. Model rush-hour NHPP arrival surges, M/M/c/K queue bottlenecks, absorbing belt progression (DTMC), and RA 10173 Minor SPI financial cyber-risk (FAIR).
        </p>
        <div class="hero-tags tabular-nums">
          <span class="tag-pill tag-cyan">M/M/c/K Queueing</span>
          <span class="tag-pill tag-gold">Belt DTMC N=(I-Q)⁻¹</span>
          <span class="tag-pill tag-crimson">FAIR Monte Carlo 10k</span>
          <span class="tag-pill tag-emerald">RA 10173 Minor SPI</span>
        </div>
      </div>

      <div class="hero-mascot-col">
        <div class="variant-switcher" role="group" aria-label="Mascot style preset">
          ${[
            { id: 'dojang', label: 'Dojang Gi' },
            { id: 'cyber', label: 'Cyber Ops' },
            { id: 'tournament', label: 'Tournament' },
          ]
            .map(
              (v) => `
            <button type="button" class="variant-btn ${state.mascotVariant === v.id ? 'is-active' : ''}" data-mascot-variant="${v.id}">
              ${v.label}
            </button>
          `
            )
            .join('')}
        </div>

        <div class="mascot-duo-card">
          <div class="mascot-unit">
            ${renderMascotSvg('mentor', state.mascotVariant, 'happy', false, 100)}
            <strong>Master Bruce</strong>
            <span class="role-badge is-crimson">Head Instructor</span>
          </div>
          <div class="duo-divider"></div>
          <div class="mascot-unit">
            ${renderMascotSvg('apprentice', state.mascotVariant, 'curious', false, 100)}
            <strong>Kiko</strong>
            <span class="role-badge is-cyan">Dragon Analyst</span>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderCurriculumOverview() {
  return `
    <section class="overview-section" aria-label="Core QMODSIM Curriculum Modules">
      <div class="overview-header">
        <div>
          <span class="badge-mono badge-cyan">Curriculum Architecture</span>
          <h2>8 Quantitative Modeling &amp; Cyber-Defense Modules</h2>
        </div>
        <a href="html/landing_page.html" class="portal-link">Open FATAMA KickStart Portal →</a>
      </div>
      <div class="overview-grid">
        ${CURRICULUM_CARDS.map(
          (card) => `
          <article class="overview-card">
            <div>
              <div class="overview-icon is-${card.accent}">
                ${getCardIconSvg(card.icon)}
              </div>
              <div class="overview-card-meta">
                <span class="badge-mono badge-${card.accent}"># ${card.moduleCode}</span>
                <button type="button" class="study-link" data-study-episode="${card.episodeId}">Study →</button>
              </div>
              <h3>${card.title}</h3>
              <p>${card.description}</p>
            </div>
            <div class="overview-formula tabular-nums">${card.formula}</div>
          </article>
        `
        ).join('')}
      </div>
    </section>
  `;
}

function renderFooter() {
  return `
    <footer class="site-footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <img src="images/fatama_logo.png" alt="" class="footer-logo">
          <strong>FATAMA-QMODSIM</strong>
          <span>·</span>
          <span>Fatama Fighting Dragons Taekwondo (Robinsons Luisita, Tarlac)</span>
        </div>
        <div class="footer-tags">
          <span>NHPP Bursts</span><span>·</span>
          <span>M/M/c/K Queueing</span><span>·</span>
          <span>Belt DTMC</span><span>·</span>
          <span>FAIR ₱ Monte Carlo</span><span>·</span>
          <span>Nash Equilibrium</span><span>·</span>
          <span>HMAC Entropy</span><span>·</span>
          <span>Z-Score Guard</span><span>·</span>
          <span>RA 10173</span>
        </div>
      </div>
    </footer>
  `;
}

function renderApp() {
  applyTheme();
  const root = document.getElementById('app');
  if (!root) return;

  let activeContent = '';
  if (state.activeTab === 'scenarios') activeContent = renderScenariosView(state);
  else if (state.activeTab === 'lab') activeContent = renderLabView(state);
  else activeContent = renderCodexView(state.codexId);

  root.innerHTML = `
    <div class="app-frame">
      ${renderHeader()}
      <main class="main-container">
        ${renderHeroBanner()}
        <div class="workspace-slot">
          ${activeContent}
        </div>
        ${renderCurriculumOverview()}
      </main>
      ${renderFooter()}
      ${renderValidationDrawer(state.validationOpen, {
        lambda: state.lab.qLambda,
        mu: state.lab.qMu,
        c: state.lab.qCores,
        K: state.lab.qCap,
        policy: state.lab.dtmcPolicy,
        tefMode: state.lab.tefMode,
        fairTrials: state.lab.fairTrials,
        zThreshold: state.lab.zThreshold,
      })}
    </div>
  `;

  if (state.activeTab === 'scenarios') hydrateScenarioCanvas(state);
  if (state.activeTab === 'lab') hydrateLabCanvases(state);
}

function stepDtmcCohort() {
  const { fullP } = buildBeltTransitionMatrix(state.lab.dtmcPolicy);
  state.dtmcTurn += 1;
  state.dtmcCohort = state.dtmcCohort.map((s) => {
    if (s >= 5) return s; // Absorbed: Black Belt (5) or Drop-out (6)
    const row = fullP[s];
    const u = state.dtmcRng();
    let acc = 0;
    for (let j = 0; j < row.length; j++) {
      acc += row[j];
      if (u <= acc) return j;
    }
    return s;
  });
}

function stopAutoPlay() {
  state.isAutoPlaying = false;
  if (autoPlayTimer) {
    clearInterval(autoPlayTimer);
    autoPlayTimer = null;
  }
}

function startAutoPlay() {
  stopAutoPlay();
  state.isAutoPlaying = true;
  autoPlayTimer = setInterval(() => {
    const ep = SCENARIO_EPISODES.find((e) => e.id === state.scenarioId) || SCENARIO_EPISODES[0];
    const lines = state.scenarioEdition === 'simplified' ? ep.dialogueSimplified : ep.dialogueExtended;
    if (state.scenarioLineIndex < lines.length - 1) {
      state.scenarioLineIndex += 1;
      renderApp();
    } else {
      stopAutoPlay();
      renderApp();
    }
  }, 3200);
}

// Event delegation on root so sliders and buttons stay responsive without memory leaks
document.addEventListener('click', async (ev) => {
  const target = ev.target;
  if (!(target instanceof Element)) return;

  const navBtn = target.closest('[data-nav-tab]');
  if (navBtn) {
    stopAutoPlay();
    state.activeTab = navBtn.getAttribute('data-nav-tab');
    renderApp();
    return;
  }

  if (target.closest('#homeBrandBtn')) {
    stopAutoPlay();
    state.activeTab = 'scenarios';
    state.scenarioId = 1;
    state.scenarioLineIndex = 0;
    renderApp();
    return;
  }

  if (target.closest('#themeToggleBtn')) {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    renderApp();
    return;
  }

  if (target.closest('#openValidationBtn') || target.closest('#reRunValidationBtn')) {
    state.validationOpen = true;
    renderApp();
    return;
  }

  if (target.closest('#closeValidationBtn') || target.id === 'validationBackdrop') {
    state.validationOpen = false;
    renderApp();
    return;
  }

  const varBtn = target.closest('[data-mascot-variant]');
  if (varBtn) {
    state.mascotVariant = varBtn.getAttribute('data-mascot-variant');
    renderApp();
    return;
  }

  const epBtn = target.closest('[data-episode-id]');
  if (epBtn) {
    stopAutoPlay();
    state.scenarioId = Number(epBtn.getAttribute('data-episode-id'));
    state.scenarioLineIndex = 0;
    renderApp();
    return;
  }

  const edBtn = target.closest('[data-edition]');
  if (edBtn) {
    stopAutoPlay();
    state.scenarioEdition = edBtn.getAttribute('data-edition');
    state.scenarioLineIndex = 0;
    renderApp();
    return;
  }

  if (target.closest('#prevLineBtn')) {
    stopAutoPlay();
    state.scenarioLineIndex = Math.max(0, state.scenarioLineIndex - 1);
    renderApp();
    return;
  }

  if (target.closest('#nextLineBtn')) {
    stopAutoPlay();
    const ep = SCENARIO_EPISODES.find((e) => e.id === state.scenarioId) || SCENARIO_EPISODES[0];
    const lines = state.scenarioEdition === 'simplified' ? ep.dialogueSimplified : ep.dialogueExtended;
    state.scenarioLineIndex = Math.min(lines.length - 1, state.scenarioLineIndex + 1);
    renderApp();
    return;
  }

  if (target.closest('#autoPlayDialogueBtn')) {
    if (state.isAutoPlaying) {
      stopAutoPlay();
      renderApp();
    } else {
      startAutoPlay();
      renderApp();
    }
    return;
  }

  const forkBtn = target.closest('[data-fork-ep]');
  if (forkBtn) {
    const epId = Number(forkBtn.getAttribute('data-fork-ep'));
    const optId = forkBtn.getAttribute('data-fork-opt');
    const ep = SCENARIO_EPISODES.find((e) => e.id === epId);
    const opt = ep?.decisionFork.options.find((o) => o.id === optId);
    if (opt) {
      state.scenarioForkChoice[epId] = optId;
      if (opt.params.lambdaBase !== undefined) state.lab.lambdaBase = opt.params.lambdaBase;
      if (opt.params.lambdaPeak !== undefined) state.lab.lambdaPeak = opt.params.lambdaPeak;
      if (opt.params.sigma !== undefined) state.lab.sigma = opt.params.sigma;
      if (opt.params.lambda !== undefined) state.lab.qLambda = opt.params.lambda;
      if (opt.params.mu !== undefined) state.lab.qMu = opt.params.mu;
      if (opt.params.c !== undefined) state.lab.qCores = opt.params.c;
      if (opt.params.K !== undefined) state.lab.qCap = opt.params.K;
      if (opt.params.policy !== undefined) state.lab.dtmcPolicy = opt.params.policy;
      if (opt.params.rlsMitigated !== undefined) {
        state.lab.rlsMitigated = opt.params.rlsMitigated;
        state.fairCache = runFairMonteCarlo({
          trials: state.lab.fairTrials,
          tefMode: state.lab.tefMode,
          rlsMitigated: state.lab.rlsMitigated,
        });
      }
      if (opt.params.penaltyFee !== undefined) state.lab.penaltyFee = opt.params.penaltyFee;
      if (opt.params.auditOverhead !== undefined) state.lab.auditOverhead = opt.params.auditOverhead;
      if (opt.params.lobbyFriction !== undefined) state.lab.lobbyFriction = opt.params.lobbyFriction;
      if (opt.params.alphabetSize !== undefined) state.lab.alphabetSize = opt.params.alphabetSize;
      if (opt.params.length !== undefined) state.lab.tokenLength = opt.params.length;
      if (opt.params.rate !== undefined) state.lab.attackRate = opt.params.rate;
      if (opt.params.threshold !== undefined) {
        state.lab.zThreshold = opt.params.threshold;
        const fresh = initAnomalyHistory(state.lab.zThreshold);
        state.anomalyDetector = fresh.detector;
        state.anomalyStream = fresh.stream;
      }
      if (opt.params.offlineLocalSync !== undefined) state.lab.offlineLocalSync = opt.params.offlineLocalSync;
      if (opt.params.rNetwork !== undefined) state.lab.rNetwork = opt.params.rNetwork;
      renderApp();
    }
    return;
  }

  const jumpLabBtn = target.closest('[data-jump-lab]');
  if (jumpLabBtn) {
    stopAutoPlay();
    state.activeTab = 'lab';
    state.labTab = jumpLabBtn.getAttribute('data-jump-lab');
    renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const studyBtn = target.closest('[data-study-episode]');
  if (studyBtn) {
    stopAutoPlay();
    state.activeTab = 'scenarios';
    state.scenarioId = Number(studyBtn.getAttribute('data-study-episode'));
    state.scenarioLineIndex = 0;
    renderApp();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  const labTabBtn = target.closest('[data-lab-tab]');
  if (labTabBtn) {
    state.labTab = labTabBtn.getAttribute('data-lab-tab');
    renderApp();
    return;
  }

  const coresBtn = target.closest('[data-set-cores]');
  if (coresBtn) {
    state.lab.qCores = Number(coresBtn.getAttribute('data-set-cores'));
    renderApp();
    return;
  }

  const dtmcBtn = target.closest('[data-dtmc-policy]');
  if (dtmcBtn) {
    state.lab.dtmcPolicy = dtmcBtn.getAttribute('data-dtmc-policy');
    renderApp();
    return;
  }

  if (target.closest('#stepDtmcBtn')) {
    stepDtmcCohort();
    renderApp();
    return;
  }

  if (target.closest('#resetDtmcBtn')) {
    state.dtmcTurn = 0;
    state.dtmcCohort = Array(48).fill(0);
    renderApp();
    return;
  }

  const fairTrialsBtn = target.closest('[data-fair-trials]');
  if (fairTrialsBtn) {
    state.lab.fairTrials = Number(fairTrialsBtn.getAttribute('data-fair-trials'));
    state.fairCache = runFairMonteCarlo({
      trials: state.lab.fairTrials,
      tefMode: state.lab.tefMode,
      rlsMitigated: state.lab.rlsMitigated,
    });
    renderApp();
    return;
  }

  const fairRlsBtn = target.closest('[data-fair-rls]');
  if (fairRlsBtn) {
    state.lab.rlsMitigated = fairRlsBtn.getAttribute('data-fair-rls') === 'true';
    state.fairCache = runFairMonteCarlo({
      trials: state.lab.fairTrials,
      tefMode: state.lab.tefMode,
      rlsMitigated: state.lab.rlsMitigated,
    });
    renderApp();
    return;
  }

  if (target.closest('#runFairBtn')) {
    state.fairCache = runFairMonteCarlo({
      trials: state.lab.fairTrials,
      tefMode: state.lab.tefMode,
      rlsMitigated: state.lab.rlsMitigated,
      seed: Math.floor(Date.now() % 100000),
    });
    renderApp();
    return;
  }

  const entropyPresetBtn = target.closest('[data-entropy-preset]');
  if (entropyPresetBtn) {
    const [alpha, len] = entropyPresetBtn.getAttribute('data-entropy-preset').split(',').map(Number);
    state.lab.alphabetSize = alpha;
    state.lab.tokenLength = len;
    renderApp();
    return;
  }

  if (target.closest('#genTokensBtn')) {
    state.cryptoTokens = await generateComparisonTokens('FFD-2026-042');
    renderApp();
    return;
  }

  if (target.closest('#pushNormalLedgerBtn')) {
    const val = 200 + (Math.random() - 0.5) * 16;
    state.anomalyStream.push(state.anomalyDetector.push(val));
    if (state.anomalyStream.length > 50) state.anomalyStream.shift();
    renderApp();
    return;
  }

  if (target.closest('#injectTamperBtn')) {
    const spike = 200 + (Math.random() > 0.5 ? 95 : -95);
    state.anomalyStream.push(state.anomalyDetector.push(spike));
    if (state.anomalyStream.length > 50) state.anomalyStream.shift();
    renderApp();
    return;
  }

  if (target.closest('#toggleOfflineSyncBtn')) {
    state.lab.offlineLocalSync = !state.lab.offlineLocalSync;
    renderApp();
    return;
  }

  const codexBtn = target.closest('[data-codex-id]');
  if (codexBtn) {
    state.codexId = codexBtn.getAttribute('data-codex-id');
    renderApp();
    return;
  }

  const copyBtn = target.closest('#copyCodexCodeBtn');
  if (copyBtn) {
    const code = decodeURIComponent(copyBtn.getAttribute('data-code') || '');
    try {
      await navigator.clipboard.writeText(code);
      copyBtn.textContent = 'Copied ✓';
      setTimeout(() => { copyBtn.textContent = 'Copy Snippet'; }, 1600);
    } catch {}
  }
});

document.addEventListener('input', (ev) => {
  const el = ev.target;
  if (!(el instanceof HTMLInputElement) || !el.dataset.slider) return;
  const key = el.dataset.slider;
  const clamped = clampSlider(key, el.value);
  state.lab[key] = clamped;

  if (key === 'tefMode') {
    state.fairCache = runFairMonteCarlo({
      trials: state.lab.fairTrials,
      tefMode: state.lab.tefMode,
      rlsMitigated: state.lab.rlsMitigated,
    });
  } else if (key === 'zThreshold') {
    state.anomalyDetector.threshold = clamped;
    // Re-evaluate anomaly flag on existing stream values using updated threshold
    const det = new CircularZScoreDetector(30, clamped);
    state.anomalyStream = state.anomalyStream.map((pt) => det.push(pt.value));
    state.anomalyDetector = det;
  }

  renderApp();
  // Restore focus on the active slider after re-render
  const reEl = document.querySelector(`input[data-slider="${key}"]`);
  if (reEl) reEl.focus();
});

// Initial render + Web Crypto token refresh
renderApp();
generateComparisonTokens('FFD-2026-042')
  .then((tokens) => {
    state.cryptoTokens = tokens;
    if (state.activeTab === 'lab' && state.labTab === 'entropy') renderApp();
  })
  .catch(() => {});

