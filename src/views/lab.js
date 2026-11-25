/**
 * Archetype 2: LAB — Multi-Variable Stochastic Workbench
 * Includes "Full Dojang Hub" + 8 dedicated single-module sandboxes with real-time HTML5 Canvases,
 * 48-athlete Markov cohort animation, Web Crypto live token generator, and FAIR Monte Carlo runner.
 */
import { evaluateNhppIntensity, generateNhppWindowProfile } from '../engines/nhpp.js';
import { solveMmckQueue } from '../engines/queueing.js';
import { BELT_STATES, buildBeltTransitionMatrix, solveAbsorbingDtmc } from '../engines/dtmc.js';
import { solveCreditIntegrityGame } from '../engines/gameTheory.js';
import { analyzeTokenSecurity } from '../engines/entropy.js';
import { computeDojangReliability } from '../engines/reliability.js';
import {
  drawNhppCanvas,
  drawMmckCanvas,
  drawFairLecCanvas,
  drawGameTheoryCanvas,
  drawZScoreCanvas,
  drawRbdCanvas,
} from '../components/canvases.js';

const LAB_TABS = [
  { id: 'full-hub', label: 'Full Dojang Hub', badge: 'Unified' },
  { id: 'nhpp', label: 'Modules 1 & 3: Check-In Bursts', badge: 'NHPP' },
  { id: 'queueing', label: 'Module 6: Entrance Queue', badge: 'M/M/c/K' },
  { id: 'dtmc', label: 'Module 5: Belt Progression', badge: 'DTMC' },
  { id: 'fair', label: 'Module 4: RA 10173 Risk', badge: 'FAIR 10k' },
  { id: 'gameTheory', label: 'Module 7: Credit Fraud', badge: 'Nash' },
  { id: 'entropy', label: 'Modules 2 & 10: QR Entropy', badge: 'WebCrypto' },
  { id: 'anomaly', label: 'Module 11: Ledger Guard', badge: 'Z-Score' },
  { id: 'reliability', label: 'Module 12: Offline Sync', badge: 'RBD' },
];

export function renderLabView(state) {
  const active = state.labTab || 'full-hub';
  return `
    <section class="lab-shell" aria-label="Interactive QMODSIM Stochastic Workbench">
      <div class="pill-strip" role="tablist" aria-label="Lab Module Selectors">
        ${LAB_TABS.map(
          (t) => `
          <button type="button" class="strip-pill ${active === t.id ? 'is-active' : ''}" data-lab-tab="${t.id}">
            <span class="strip-hash">${t.badge}</span>
            <span>${t.label}</span>
          </button>
        `
        ).join('')}
      </div>

      ${active === 'full-hub' ? renderFullHub(state) : ''}
      ${active === 'nhpp' ? renderNhppLab(state) : ''}
      ${active === 'queueing' ? renderQueueLab(state) : ''}
      ${active === 'dtmc' ? renderDtmcLab(state) : ''}
      ${active === 'fair' ? renderFairLab(state) : ''}
      ${active === 'gameTheory' ? renderGameLab(state) : ''}
      ${active === 'entropy' ? renderEntropyLab(state) : ''}
      ${active === 'anomaly' ? renderAnomalyLab(state) : ''}
      ${active === 'reliability' ? renderReliabilityLab(state) : ''}
    </section>
  `;
}

function renderFullHub(state) {
  const l = state.lab;
  const q = solveMmckQueue(l.qLambda, l.qMu, l.qCores, l.qCap);
  const { Q, R } = buildBeltTransitionMatrix(l.dtmcPolicy);
  const d = solveAbsorbingDtmc(Q, R);
  const f = state.fairCache;
  const r = computeDojangReliability({ rNetwork: l.rNetwork, offlineLocalSync: l.offlineLocalSync });

  return `
    <div class="hub-grid">
      <div class="lab-card">
        <div class="lab-card-head">
          <div>
            <span class="badge-mono badge-crimson">Modules 1 &amp; 3 · NHPP</span>
            <h3>Sunday 11:00 AM Check-In Rush</h3>
          </div>
          <button type="button" class="btn-ghost-sm" data-lab-tab="nhpp">Tune →</button>
        </div>
        <canvas id="hubNhppCanvas" width="540" height="170" class="plot-canvas"></canvas>
      </div>

      <div class="lab-card">
        <div class="lab-card-head">
          <div>
            <span class="badge-mono badge-cyan">Module 6 · M/M/c/K</span>
            <h3>Front-Desk Tablet Queue (c=${l.qCores}, K=${l.qCap})</h3>
          </div>
          <span class="status-pill ${q.pK > 0.02 ? 'is-warn' : 'is-ok'} tabular-nums">P_drop=${(q.pK * 100).toFixed(2)}%</span>
        </div>
        <canvas id="hubQueueCanvas" width="540" height="170" class="plot-canvas"></canvas>
      </div>

      <div class="lab-card">
        <div class="lab-card-head">
          <div>
            <span class="badge-mono badge-gold">Module 4 · FAIR Monte Carlo</span>
            <h3>RA 10173 Breach Loss Curve (${f.trials.toLocaleString()} Trials)</h3>
          </div>
          <span class="status-pill ${l.rlsMitigated ? 'is-ok' : 'is-warn'} tabular-nums">ALE ₱${Math.round(f.ale).toLocaleString()}</span>
        </div>
        <canvas id="hubFairCanvas" width="540" height="170" class="plot-canvas"></canvas>
      </div>

      <div class="lab-card">
        <div class="lab-card-head">
          <div>
            <span class="badge-mono badge-emerald">Modules 5 &amp; 12 · DTMC &amp; RBD</span>
            <h3>Dojang Health Summary</h3>
          </div>
          <button type="button" class="btn-ghost-sm" data-lab-tab="dtmc">Cohort →</button>
        </div>
        <div class="hub-kpi-grid tabular-nums">
          <div class="kpi-box"><small>Black Belt Yield</small><strong class="text-emerald">${(d.blackBeltYieldFromWhite * 100).toFixed(1)}%</strong></div>
          <div class="kpi-box"><small>Avg Lobby Wait</small><strong class="text-cyan">${(q.meanWaitMin * 60).toFixed(0)} sec</strong></div>
          <div class="kpi-box"><small>Portal Reliability</small><strong class="text-emerald">${(r.effectiveReliability * 100).toFixed(3)}%</strong></div>
          <div class="kpi-box"><small>Security ROSI</small><strong class="text-gold">${f.rosiPercent.toFixed(0)}%</strong></div>
        </div>
      </div>
    </div>
  `;
}

function renderNhppLab(state) {
  const l = state.lab;
  const prof = generateNhppWindowProfile(l.lambdaBase, l.lambdaPeak, 15, l.sigma, 30);
  const curRate = evaluateNhppIntensity(l.tScrubber, l.lambdaBase, l.lambdaPeak, 15, l.sigma);
  const clockMin = 45 + Math.round(l.tScrubber);
  const clockStr = clockMin < 60 ? `10:${String(clockMin).padStart(2, '0')} AM` : `11:${String(clockMin - 60).padStart(2, '0')} AM`;

  return `
    <div class="lab-card">
      <div class="lab-card-head">
        <div>
          <span class="badge-mono badge-crimson"># Modules 1 &amp; 3 Interactive Lab</span>
          <h3>Sunday Check-In Bursts &amp; NHPP Arrival Intensity λ(t)</h3>
        </div>
        <span class="status-pill is-info tabular-nums">${clockStr} → ${curRate.toFixed(2)} students/min</span>
      </div>
      <div class="lab-two-col">
        <div class="controls-stack">
          <div class="control-box">
            <label class="slider-row">
              <span>Baseline Arrival Rate (λ_base)</span>
              <strong class="tabular-nums text-cyan">${l.lambdaBase.toFixed(1)} /min</strong>
              <input type="range" min="0.2" max="2.5" step="0.1" value="${l.lambdaBase}" data-slider="lambdaBase">
            </label>
            <label class="slider-row">
              <span>11:00 AM Rush-Hour Peak (λ_peak)</span>
              <strong class="tabular-nums text-rose">+${l.lambdaPeak.toFixed(1)} /min</strong>
              <input type="range" min="1.0" max="12.0" step="0.2" value="${l.lambdaPeak}" data-slider="lambdaPeak">
            </label>
            <label class="slider-row">
              <span>Arrival Window Spread (σ)</span>
              <strong class="tabular-nums text-gold">${l.sigma.toFixed(1)} min</strong>
              <input type="range" min="1.5" max="9.0" step="0.5" value="${l.sigma}" data-slider="sigma">
            </label>
            <label class="slider-row">
              <span>Time Scrubber (t from 10:45 AM)</span>
              <strong class="tabular-nums text-cyan">${clockStr} (t=${l.tScrubber}m)</strong>
              <input type="range" min="0" max="30" step="1" value="${l.tScrubber}" data-slider="tScrubber">
            </label>
          </div>
          <div class="invariant-box">
            <span class="block-label">Theoretical Invariant</span>
            <p class="mono-sm">Stationary exponential inter-arrivals obey <code>f(t) = λ · e^(-λt)</code> with mean <code>E[X] = 1/λ = ${(1 / curRate).toFixed(3)} min</code>.</p>
          </div>
        </div>
        <div class="plot-stack">
          <canvas id="labNhppCanvas" width="640" height="220" class="plot-canvas"></canvas>
          <div class="kpi-strip-3 tabular-nums">
            <div class="kpi-box"><small>Peak Rate λ(11:00)</small><strong class="text-rose">${prof.peakRate.toFixed(2)} /min</strong></div>
            <div class="kpi-box"><small>Expected 30m Batch</small><strong class="text-cyan">${prof.expectedArrivals.toFixed(1)} trainees</strong></div>
            <div class="kpi-box"><small>Instant Inter-Arrival</small><strong class="text-gold">${(60 / curRate).toFixed(1)} sec</strong></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderQueueLab(state) {
  const l = state.lab;
  const q = solveMmckQueue(l.qLambda, l.qMu, l.qCores, l.qCap);
  return `
    <div class="lab-card">
      <div class="lab-card-head">
        <div>
          <span class="badge-mono badge-cyan"># Module 6 Interactive Lab</span>
          <h3>Dojang Entrance Verification Queue (M/M/c/K)</h3>
        </div>
        <span class="status-pill ${q.pK > 0.02 ? 'is-warn' : 'is-ok'} tabular-nums">
          ${q.pK > 0.02 ? `P_drop ${(q.pK * 100).toFixed(2)}% (Warm-Up Risk)` : `P_drop ${(q.pK * 100).toFixed(2)}% (Smooth Flow)`}
        </span>
      </div>
      <div class="lab-two-col">
        <div class="controls-stack">
          <div class="control-box">
            <label class="slider-row">
              <span>Lobby Arrival Rate (λ)</span>
              <strong class="tabular-nums text-cyan">${l.qLambda.toFixed(1)} students/min</strong>
              <input type="range" min="0.5" max="8.0" step="0.1" value="${l.qLambda}" data-slider="qLambda">
            </label>
            <label class="slider-row">
              <span>Tablet Verification Rate (μ)</span>
              <strong class="tabular-nums text-emerald">${l.qMu.toFixed(1)} /min/tablet</strong>
              <input type="range" min="0.8" max="4.0" step="0.1" value="${l.qMu}" data-slider="qMu">
            </label>
            <div class="button-group-row">
              <span>Active Instructor Tablets (c):</span>
              <div class="btn-group">
                ${[1, 2, 3, 4]
                  .map((c) => `<button type="button" class="btn-chip ${l.qCores === c ? 'is-active' : ''}" data-set-cores="${c}">${c}</button>`)
                  .join('')}
              </div>
            </div>
            <label class="slider-row">
              <span>Physical Lobby Capacity (K)</span>
              <strong class="tabular-nums text-gold">${l.qCap} students</strong>
              <input type="range" min="6" max="50" step="1" value="${l.qCap}" data-slider="qCap">
            </label>
          </div>
          <div class="invariant-box tabular-nums">
            <span class="block-label">Little's Law Conservation</span>
            <p class="mono-sm"><code>L = λ_eff · W → ${q.meanInSystem.toFixed(4)} = ${(q.lambdaEff * q.meanWaitMin).toFixed(4)}</code></p>
            <p class="mono-sm text-emerald">Error |L - λ_eff·W| = ${q.littlesLawDiff.toExponential(2)} (&lt; 10⁻⁵)</p>
          </div>
        </div>
        <div class="plot-stack">
          <canvas id="labQueueCanvas" width="640" height="220" class="plot-canvas"></canvas>
          <div class="kpi-strip-4 tabular-nums">
            <div class="kpi-box"><small>Utilization (ρ)</small><strong class="${q.utilization > 1 ? 'text-rose' : 'text-cyan'}">${(q.utilization * 100).toFixed(1)}%</strong></div>
            <div class="kpi-box"><small>Blocking P_K</small><strong class="${q.pK > 0.02 ? 'text-rose' : 'text-emerald'}">${(q.pK * 100).toFixed(2)}%</strong></div>
            <div class="kpi-box"><small>Mean Queue L_q</small><strong class="text-gold">${q.meanInQueue.toFixed(2)}</strong></div>
            <div class="kpi-box"><small>Wait Time W</small><strong class="text-cyan">${(q.meanWaitMin * 60).toFixed(0)} sec</strong></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderDtmcLab(state) {
  const l = state.lab;
  const { Q, R } = buildBeltTransitionMatrix(l.dtmcPolicy);
  const res = solveAbsorbingDtmc(Q, R);
  const counts = Array(7).fill(0);
  state.dtmcCohort.forEach((s) => { counts[s] += 1; });

  return `
    <div class="lab-card">
      <div class="lab-card-head">
        <div>
          <span class="badge-mono badge-gold"># Module 5 Interactive Lab</span>
          <h3>48-Athlete Belt Progression Cohort (Absorbing DTMC)</h3>
        </div>
        <div class="btn-group">
          ${[
            { id: 'unstructured', label: 'Unstructured' },
            { id: 'baseline', label: 'Baseline' },
            { id: 'mentored', label: 'Portal + Badges' },
          ]
            .map((p) => `<button type="button" class="btn-chip ${l.dtmcPolicy === p.id ? 'is-active' : ''}" data-dtmc-policy="${p.id}">${p.label}</button>`)
            .join('')}
        </div>
      </div>

      <div class="cohort-toolbar">
        <span class="mono-sm tabular-nums">Promotion Cycle: <strong>#${state.dtmcTurn}</strong> · Black Belts: <strong class="text-emerald">${counts[5]}</strong> · Drop-outs: <strong class="text-rose">${counts[6]}</strong></span>
        <div class="btn-group">
          <button type="button" class="btn-primary btn-sm" id="stepDtmcBtn">Step Cycle +1</button>
          <button type="button" class="btn-secondary btn-sm" id="resetDtmcBtn">Reset 48 White Belts</button>
        </div>
      </div>

      <div class="cohort-grid" aria-label="48 Fatama Taekwondo Athletes Belt States">
        ${state.dtmcCohort
          .map((sIdx, idx) => {
            const st = BELT_STATES[sIdx];
            return `
              <div class="athlete-tile state-${st.id}" title="Athlete #${idx + 1}: ${st.name} (${st.gup})">
                <span class="tile-num">${idx + 1}</span>
                <span class="tile-rank">${st.id === 'S5' ? 'BLK' : st.id === 'SD' ? 'OUT' : st.name.slice(0, 3).toUpperCase()}</span>
              </div>
            `;
          })
          .join('')}
      </div>

      <div class="belt-legend">
        ${BELT_STATES.map((s, i) => `<span class="legend-item"><i class="belt-swatch" style="background:${s.color}"></i>${s.name} (${counts[i]})</span>`).join('')}
      </div>

      <div class="kpi-strip-3 tabular-nums">
        <div class="kpi-box"><small>White → Black Yield B[S₀, S₅]</small><strong class="text-emerald">${(res.blackBeltYieldFromWhite * 100).toFixed(1)}%</strong></div>
        <div class="kpi-box"><small>Drop-out Absorption B[S₀, S_D]</small><strong class="text-rose">${(res.dropoutProbFromWhite * 100).toFixed(1)}%</strong></div>
        <div class="kpi-box"><small>Expected Cycles N·1 from White</small><strong class="text-cyan">${res.expectedCyclesToAbsorption[0].toFixed(2)} cycles</strong></div>
      </div>
    </div>
  `;
}

function renderFairLab(state) {
  const l = state.lab;
  const f = state.fairCache;
  return `
    <div class="lab-card">
      <div class="lab-card-head">
        <div>
          <span class="badge-mono badge-crimson"># Module 4 Interactive Lab</span>
          <h3>FAIR Monte Carlo Risk (RA 10173 Minor SPI · PHP ₱)</h3>
        </div>
        <button type="button" class="btn-primary btn-sm" id="runFairBtn">Re-Run ${l.fairTrials.toLocaleString()} Trials</button>
      </div>
      <div class="lab-two-col">
        <div class="controls-stack">
          <div class="control-box">
            <label class="slider-row">
              <span>Threat Frequency Mode (TEF Beta-PERT)</span>
              <strong class="tabular-nums text-cyan">${l.tefMode} attempts/yr</strong>
              <input type="range" min="2" max="20" step="1" value="${l.tefMode}" data-slider="tefMode">
            </label>
            <div class="button-group-row">
              <span>Monte Carlo Trials (Float64Array):</span>
              <div class="btn-group">
                ${[1000, 5000, 10000, 25000]
                  .map((n) => `<button type="button" class="btn-chip ${l.fairTrials === n ? 'is-active' : ''}" data-fair-trials="${n}">${n / 1000}k</button>`)
                  .join('')}
              </div>
            </div>
            <div class="button-group-row">
              <span>RA 10173 Control Posture:</span>
              <div class="btn-group">
                <button type="button" class="btn-chip ${!l.rlsMitigated ? 'is-active' : ''}" data-fair-rls="false">No RLS (42% Vuln)</button>
                <button type="button" class="btn-chip ${l.rlsMitigated ? 'is-active' : ''}" data-fair-rls="true">RLS + AES-256 (6% Vuln)</button>
              </div>
            </div>
          </div>
          <div class="invariant-box tabular-nums">
            <span class="block-label">ROSI Actuarial Summary (PHP ₱)</span>
            <p class="mono-sm">Baseline ALE: <strong class="text-rose">₱${Math.round(f.baselineAle).toLocaleString()}/yr</strong></p>
            <p class="mono-sm">Mitigated ALE: <strong class="text-emerald">₱${Math.round(f.mitigatedAle).toLocaleString()}/yr</strong> (Control Cost: ₱${f.controlCostPhp.toLocaleString()})</p>
            <p class="mono-sm">Return on Security Investment: <strong class="text-gold">${f.rosiPercent.toFixed(0)}%</strong></p>
          </div>
        </div>
        <div class="plot-stack">
          <canvas id="labFairCanvas" width="640" height="220" class="plot-canvas"></canvas>
          <div class="kpi-strip-3 tabular-nums">
            <div class="kpi-box"><small>Active ALE</small><strong class="${l.rlsMitigated ? 'text-emerald' : 'text-rose'}">₱${Math.round(f.ale).toLocaleString()}</strong></div>
            <div class="kpi-box"><small>95% VaR (Tail)</small><strong class="text-gold">₱${Math.round(f.var95).toLocaleString()}</strong></div>
            <div class="kpi-box"><small>Trials Executed</small><strong class="text-cyan">${f.trials.toLocaleString()}</strong></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderGameLab(state) {
  const l = state.lab;
  const g = solveCreditIntegrityGame({
    sessionFee: l.sessionFee,
    penaltyFee: l.penaltyFee,
    auditOverhead: l.auditOverhead,
    lobbyFriction: l.lobbyFriction,
  });
  return `
    <div class="lab-card">
      <div class="lab-card-head">
        <div>
          <span class="badge-mono badge-cyan"># Module 7 Interactive Lab</span>
          <h3>Game Theory: Session Credit Integrity &amp; Optimal Audit Frequency</h3>
        </div>
        <span class="status-pill is-info tabular-nums">Optimal Strict Audit q* = ${(g.qStar * 100).toFixed(1)}%</span>
      </div>
      <div class="lab-two-col">
        <div class="controls-stack">
          <div class="control-box">
            <label class="slider-row">
              <span>Session Fee (₱)</span>
              <strong class="tabular-nums text-cyan">₱${l.sessionFee}</strong>
              <input type="range" min="100" max="400" step="25" value="${l.sessionFee}" data-slider="sessionFee">
            </label>
            <label class="slider-row">
              <span>Caught Fraud Penalty Fee (₱)</span>
              <strong class="tabular-nums text-rose">₱${l.penaltyFee}</strong>
              <input type="range" min="100" max="1000" step="50" value="${l.penaltyFee}" data-slider="penaltyFee">
            </label>
            <label class="slider-row">
              <span>Instructor Audit Overhead C_audit (₱)</span>
              <strong class="tabular-nums text-gold">₱${l.auditOverhead}</strong>
              <input type="range" min="5" max="90" step="5" value="${l.auditOverhead}" data-slider="auditOverhead">
            </label>
          </div>
          <table class="payoff-table tabular-nums">
            <thead><tr><th>User \\ Dojang</th><th>Passive Trust</th><th>Strict Verification</th></tr></thead>
            <tbody>
              <tr><th>Legit Check-in</th><td>(0, +₱${g.matrix.legitPassive.d})</td><td>(-₱${l.lobbyFriction}, +₱${g.matrix.legitStrict.d})</td></tr>
              <tr><th>Shared Login</th><td>(+₱${g.matrix.sharedPassive.u}, -₱${l.sessionFee})</td><td>(-₱${l.penaltyFee}, +₱${g.matrix.sharedStrict.d})</td></tr>
            </tbody>
          </table>
        </div>
        <div class="plot-stack">
          <canvas id="labGameCanvas" width="640" height="220" class="plot-canvas"></canvas>
          <div class="kpi-strip-3 tabular-nums">
            <div class="kpi-box"><small>Strict Audit Rate q*</small><strong class="text-gold">${(g.qStar * 100).toFixed(1)}%</strong></div>
            <div class="kpi-box"><small>Equilibrium Fraud p*</small><strong class="text-cyan">${(g.pStar * 100).toFixed(1)}%</strong></div>
            <div class="kpi-box"><small>Expected Session Yield</small><strong class="text-emerald">₱${g.expectedAdminRevenue.toFixed(1)}</strong></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderEntropyLab(state) {
  const l = state.lab;
  const sec = analyzeTokenSecurity(l.alphabetSize, l.tokenLength, l.attackRate);
  return `
    <div class="lab-card">
      <div class="lab-card-head">
        <div>
          <span class="badge-mono badge-emerald"># Modules 2 &amp; 10 Interactive Lab</span>
          <h3>Check-In Token Shannon Entropy &amp; Web Crypto CSPRNG</h3>
        </div>
        <button type="button" class="btn-primary btn-sm" id="genTokensBtn">Generate Live Web Crypto Tokens</button>
      </div>
      <div class="lab-two-col">
        <div class="controls-stack">
          <div class="control-box">
            <div class="button-group-row">
              <span>Token Alphabet |Σ|:</span>
              <div class="btn-group">
                <button type="button" class="btn-chip ${l.alphabetSize === 10 ? 'is-active' : ''}" data-entropy-preset="10,4">4-Digit PIN (10)</button>
                <button type="button" class="btn-chip ${l.alphabetSize === 16 ? 'is-active' : ''}" data-entropy-preset="16,32">HMAC Hex (16)</button>
                <button type="button" class="btn-chip ${l.alphabetSize === 62 ? 'is-active' : ''}" data-entropy-preset="62,22">Base62 QR (62)</button>
              </div>
            </div>
            <label class="slider-row">
              <span>Token Length (L)</span>
              <strong class="tabular-nums text-cyan">${l.tokenLength} chars</strong>
              <input type="range" min="4" max="32" step="1" value="${l.tokenLength}" data-slider="tokenLength">
            </label>
            <label class="slider-row">
              <span>Attacker Brute-Force Rate (R_rate)</span>
              <strong class="tabular-nums text-rose">${l.attackRate.toLocaleString()} guesses/s</strong>
              <input type="range" min="10" max="100000" step="100" value="${l.attackRate}" data-slider="attackRate">
            </label>
          </div>
        </div>
        <div class="plot-stack">
          <div class="crypto-compare-box">
            <div class="crypto-token-row">
              <span>Legacy 4-Digit PIN (crypto.getRandomValues)</span>
              <code class="token-pill is-weak">${state.cryptoTokens.pin}</code>
            </div>
            <div class="crypto-token-row">
              <span>Rolling 30s HMAC-SHA-256 QR Token</span>
              <code class="token-pill is-strong">${state.cryptoTokens.hmacToken}</code>
            </div>
          </div>
          <div class="kpi-strip-3 tabular-nums">
            <div class="kpi-box"><small>Shannon Entropy H(X)</small><strong class="${sec.entropyBits >= 80 ? 'text-emerald' : 'text-rose'}">${sec.entropyBits.toFixed(1)} bits</strong></div>
            <div class="kpi-box"><small>Keyspace |Σ|^L</small><strong class="text-cyan">10^${sec.keyspaceLog10.toFixed(1)}</strong></div>
            <div class="kpi-box"><small>Mean Crack Time</small><strong class="${sec.entropyBits >= 80 ? 'text-emerald' : 'text-rose'}">${sec.humanCrackTime}</strong></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderAnomalyLab(state) {
  const l = state.lab;
  const last = state.anomalyStream[state.anomalyStream.length - 1] || { value: 200, zScore: 0, isAnomaly: false };
  const flaggedCount = state.anomalyStream.filter((d) => d.isAnomaly).length;

  return `
    <div class="lab-card">
      <div class="lab-card-head">
        <div>
          <span class="badge-mono badge-gold"># Module 11 Interactive Lab</span>
          <h3>Circular Float64Array (W=30) Ledger Anomaly Z-Score Guard</h3>
        </div>
        <div class="btn-group">
          <button type="button" class="btn-secondary btn-sm" id="pushNormalLedgerBtn">+ Normal ₱200 Entry</button>
          <button type="button" class="btn-danger btn-sm" id="injectTamperBtn">⚡ Inject Tamper Spike</button>
        </div>
      </div>
      <div class="lab-two-col">
        <div class="controls-stack">
          <div class="control-box">
            <label class="slider-row">
              <span>Critical Z-Score Threshold (τ_crit)</span>
              <strong class="tabular-nums text-gold">${l.zThreshold.toFixed(1)}σ</strong>
              <input type="range" min="2.0" max="6.0" step="0.1" value="${l.zThreshold}" data-slider="zThreshold">
            </label>
          </div>
          <div class="invariant-box tabular-nums">
            <span class="block-label">O(1) Circular Window Status</span>
            <p class="mono-sm">Last Ledger Value: <strong>₱${last.value.toFixed(0)}</strong> · Z-Score: <strong class="${last.isAnomaly ? 'text-rose' : 'text-emerald'}">${last.zScore.toFixed(2)}σ</strong></p>
            <p class="mono-sm">Tamper Alerts Flagged: <strong class="text-rose">${flaggedCount}</strong> events</p>
          </div>
        </div>
        <div class="plot-stack">
          <canvas id="labZScoreCanvas" width="640" height="220" class="plot-canvas"></canvas>
        </div>
      </div>
    </div>
  `;
}

function renderReliabilityLab(state) {
  const l = state.lab;
  const r = computeDojangReliability({ rNetwork: l.rNetwork, offlineLocalSync: l.offlineLocalSync });
  return `
    <div class="lab-card">
      <div class="lab-card-head">
        <div>
          <span class="badge-mono badge-emerald"># Module 12 Interactive Lab</span>
          <h3>Robinsons Luisita RBD &amp; Offline LocalStorage Sync Failover</h3>
        </div>
        <button type="button" class="btn-chip ${l.offlineLocalSync ? 'is-active' : ''}" id="toggleOfflineSyncBtn">
          Offline LocalStorage Sync: ${l.offlineLocalSync ? 'ON' : 'OFF'}
        </button>
      </div>
      <div class="lab-two-col">
        <div class="controls-stack">
          <div class="control-box">
            <label class="slider-row">
              <span>Covered-Court Wi-Fi / Router R_net</span>
              <strong class="tabular-nums text-cyan">${(l.rNetwork * 100).toFixed(2)}%</strong>
              <input type="range" min="0.80" max="0.999" step="0.005" value="${l.rNetwork}" data-slider="rNetwork">
            </label>
          </div>
          <div class="invariant-box tabular-nums">
            <span class="block-label">Series vs. Parallel Offline Availability</span>
            <p class="mono-sm">Strict Series R_sys: <strong class="text-gold">${(r.seriesReliability * 100).toFixed(3)}%</strong></p>
            <p class="mono-sm">With LocalStorage Sync: <strong class="text-emerald">${(r.effectiveReliability * 100).toFixed(3)}%</strong></p>
            <p class="mono-sm">Inherent Availability A: <strong class="text-cyan">${(r.effectiveAvailability * 100).toFixed(4)}%</strong> (${r.ninesLabel})</p>
          </div>
        </div>
        <div class="plot-stack">
          <canvas id="labRbdCanvas" width="640" height="200" class="plot-canvas"></canvas>
        </div>
      </div>
    </div>
  `;
}

export function hydrateLabCanvases(state) {
  const l = state.lab;
  const active = state.labTab || 'full-hub';

  if (active === 'full-hub') {
    const prof = generateNhppWindowProfile(l.lambdaBase, l.lambdaPeak, 15, l.sigma, 30);
    const rate = evaluateNhppIntensity(l.tScrubber, l.lambdaBase, l.lambdaPeak, 15, l.sigma);
    drawNhppCanvas(document.getElementById('hubNhppCanvas'), prof, l.tScrubber, l.lambdaBase, rate);
    drawMmckCanvas(document.getElementById('hubQueueCanvas'), solveMmckQueue(l.qLambda, l.qMu, l.qCores, l.qCap));
    drawFairLecCanvas(document.getElementById('hubFairCanvas'), state.fairCache);
  } else if (active === 'nhpp') {
    const prof = generateNhppWindowProfile(l.lambdaBase, l.lambdaPeak, 15, l.sigma, 30);
    const rate = evaluateNhppIntensity(l.tScrubber, l.lambdaBase, l.lambdaPeak, 15, l.sigma);
    drawNhppCanvas(document.getElementById('labNhppCanvas'), prof, l.tScrubber, l.lambdaBase, rate);
  } else if (active === 'queueing') {
    drawMmckCanvas(document.getElementById('labQueueCanvas'), solveMmckQueue(l.qLambda, l.qMu, l.qCores, l.qCap));
  } else if (active === 'fair') {
    drawFairLecCanvas(document.getElementById('labFairCanvas'), state.fairCache);
  } else if (active === 'gameTheory') {
    drawGameTheoryCanvas(
      document.getElementById('labGameCanvas'),
      solveCreditIntegrityGame({
        sessionFee: l.sessionFee,
        penaltyFee: l.penaltyFee,
        auditOverhead: l.auditOverhead,
        lobbyFriction: l.lobbyFriction,
      })
    );
  } else if (active === 'anomaly') {
    drawZScoreCanvas(document.getElementById('labZScoreCanvas'), state.anomalyStream, l.zThreshold);
  } else if (active === 'reliability') {
    drawRbdCanvas(document.getElementById('labRbdCanvas'), computeDojangReliability({ rNetwork: l.rNetwork, offlineLocalSync: l.offlineLocalSync }));
  }
}

