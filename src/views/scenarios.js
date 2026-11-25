/**
 * Archetype 1: SCENARIOS — Narrative-Driven Dojang Crisis Walkthroughs
 * Features Simplified/Extended editions, Master Bruce & Kiko mascots,
 * interactive Decision Forks that mutate engine state, and live embedded visualizations.
 */
import { SCENARIO_EPISODES } from '../data/episodes.js';
import { renderMascotSvg } from '../components/mascots.js';
import { evaluateNhppIntensity, generateNhppWindowProfile } from '../engines/nhpp.js';
import { solveMmckQueue } from '../engines/queueing.js';
import { BELT_STATES, buildBeltTransitionMatrix, solveAbsorbingDtmc } from '../engines/dtmc.js';
import { runFairMonteCarlo } from '../engines/fair.js';
import { solveCreditIntegrityGame } from '../engines/gameTheory.js';
import { analyzeTokenSecurity } from '../engines/entropy.js';
import { evaluateZScoreFidelity } from '../engines/anomaly.js';
import { computeDojangReliability } from '../engines/reliability.js';
import {
  drawNhppCanvas,
  drawMmckCanvas,
  drawFairLecCanvas,
  drawGameTheoryCanvas,
  drawZScoreCanvas,
  drawRbdCanvas,
} from '../components/canvases.js';

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function renderScenariosView(state) {
  const ep = SCENARIO_EPISODES.find((e) => e.id === state.scenarioId) || SCENARIO_EPISODES[0];
  const lines = state.scenarioEdition === 'simplified' ? ep.dialogueSimplified : ep.dialogueExtended;
  const lineIdx = Math.max(0, Math.min(lines.length - 1, state.scenarioLineIndex));
  const curLine = lines[lineIdx];
  const activeForkId = state.scenarioForkChoice[ep.id] || ep.decisionFork.options[1].id;

  const summaryStats = computeScenarioSummary(ep.interactiveType, state);

  return `
    <section class="scenarios-shell" aria-label="Guided Dojang Operational and Threat Scenarios">
      <div class="pill-strip" role="tablist" aria-label="Scenario Modules">
        ${SCENARIO_EPISODES.map((item) => {
          const isActive = item.id === ep.id;
          return `
            <button type="button" class="strip-pill ${isActive ? 'is-active' : ''}" data-episode-id="${item.id}">
              <span class="strip-hash">#</span>
              <span>${item.moduleCode}</span>
            </button>
          `;
        }).join('')}
      </div>

      <div class="scenario-stage">
        <div class="stage-topbar">
          <div class="stage-title-group">
            <span class="badge-mono badge-crimson"># ${ep.moduleCode}</span>
            <h2 class="stage-title">${ep.title}</h2>
          </div>
          <div class="stage-controls-right">
            <div class="segmented-control" role="group" aria-label="Curriculum edition mode">
              <button type="button" class="seg-btn ${state.scenarioEdition === 'simplified' ? 'is-active' : ''}" data-edition="simplified">
                Simplified (~${ep.durationSimplified})
              </button>
              <button type="button" class="seg-btn ${state.scenarioEdition === 'extended' ? 'is-active' : ''}" data-edition="extended">
                Extended (${ep.durationExtended})
              </button>
            </div>
            <span class="line-counter tabular-nums">Line ${lineIdx + 1} of ${lines.length}</span>
          </div>
        </div>

        <div class="stage-body">
          <!-- Left Column: Mentor/Apprentice Dialogue & Threat Context -->
          <div class="stage-dialogue-col">
            <div class="threat-card">
              <div class="threat-row">
                <span class="badge-mono badge-rose">Dojang Stressor</span>
                <p>${escapeHtml(ep.clinicalThreat)}</p>
              </div>
              <div class="threat-row">
                <span class="badge-mono badge-cyan">Mathematical Driver</span>
                <p class="mono-sm">${escapeHtml(ep.mathematicalDriver)}</p>
              </div>
            </div>

            <div class="dialogue-stage-box">
              <div class="dialogue-cast">
                <div class="cast-avatar ${curLine.speaker === 'mentor' ? 'is-focused' : 'is-dimmed'}">
                  ${renderMascotSvg('mentor', state.mascotVariant, curLine.speaker === 'mentor' ? curLine.emotion : 'happy', curLine.speaker === 'mentor' && state.isAutoPlaying, 92)}
                  <span class="cast-label">Master Bruce</span>
                </div>
                <div class="cast-avatar ${curLine.speaker === 'apprentice' ? 'is-focused' : 'is-dimmed'}">
                  ${renderMascotSvg('apprentice', state.mascotVariant, curLine.speaker === 'apprentice' ? curLine.emotion : 'curious', curLine.speaker === 'apprentice' && state.isAutoPlaying, 92)}
                  <span class="cast-label">Kiko</span>
                </div>
              </div>

              <div class="speech-bubble">
                <div class="speech-head">
                  <span class="speaker-tag ${curLine.speaker === 'mentor' ? 'is-mentor' : 'is-apprentice'}">${curLine.name}</span>
                  <span class="emotion-chip">${curLine.emotion}</span>
                </div>
                <p class="speech-text">${escapeHtml(curLine.text)}</p>
              </div>

              <div class="dialogue-nav">
                <button type="button" class="btn-secondary" id="prevLineBtn" ${lineIdx === 0 ? 'disabled' : ''}>← Prev</button>
                <button type="button" class="btn-primary" id="autoPlayDialogueBtn">
                  ${state.isAutoPlaying ? '⏸ Pause Story' : '▶ Auto-Play'}
                </button>
                <button type="button" class="btn-secondary" id="nextLineBtn" ${lineIdx === lines.length - 1 ? 'disabled' : ''}>Next →</button>
              </div>
            </div>
          </div>

          <!-- Right Column: Interactive Decision Fork & Live Model Canvas -->
          <div class="stage-sim-col">
            <div class="fork-panel">
              <div class="fork-head">
                <span class="badge-mono badge-gold">Interactive Decision Fork</span>
                <p class="fork-prompt">${escapeHtml(ep.decisionFork.prompt)}</p>
              </div>
              <div class="fork-options">
                ${ep.decisionFork.options
                  .map((opt) => {
                    const isPicked = opt.id === activeForkId;
                    return `
                      <button type="button" class="fork-btn ${isPicked ? 'is-selected' : ''}" data-fork-ep="${ep.id}" data-fork-opt="${opt.id}">
                        <div class="fork-btn-title">
                          <span>${isPicked ? '●' : '○'}</span>
                          <strong>${escapeHtml(opt.label)}</strong>
                        </div>
                        <span class="fork-btn-impact">${escapeHtml(opt.impact)}</span>
                      </button>
                    `;
                  })
                  .join('')}
              </div>
            </div>

            <div class="scenario-visual-box">
              ${renderScenarioVisualMarkup(ep.interactiveType, state)}
              <div class="kpi-strip-3 tabular-nums">
                ${summaryStats
                  .map(
                    (st) => `
                  <div class="kpi-mini">
                    <span class="kpi-mini-label">${st.label}</span>
                    <strong class="kpi-mini-val ${st.tone || ''}">${st.value}</strong>
                  </div>
                `
                  )
                  .join('')}
              </div>
            </div>

            <details class="code-drawer">
              <summary>Inspect Python Formulation &amp; Jump to Full Lab</summary>
              <div class="code-drawer-inner">
                <pre class="code-pre"><code>${escapeHtml(ep.pythonSnippet)}</code></pre>
                <button type="button" class="btn-primary btn-sm" data-jump-lab="${ep.interactiveType}">
                  Open in Interactive Lab →
                </button>
              </div>
            </details>
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderScenarioVisualMarkup(type, state) {
  if (type === 'dtmc') {
    const { Q, R } = buildBeltTransitionMatrix(state.lab.dtmcPolicy);
    const res = solveAbsorbingDtmc(Q, R);
    return `
      <div class="dtmc-mini-bars">
        <div class="dtmc-bar-row">
          <span>White → Black Belt Yield B[S₀, Black]</span>
          <strong class="text-emerald tabular-nums">${(res.blackBeltYieldFromWhite * 100).toFixed(1)}%</strong>
        </div>
        <div class="progress-track"><div class="progress-fill is-emerald" style="width:${(res.blackBeltYieldFromWhite * 100).toFixed(1)}%"></div></div>
        <div class="dtmc-bar-row">
          <span>Early Drop-Out Risk B[S₀, Drop-out]</span>
          <strong class="text-rose tabular-nums">${(res.dropoutProbFromWhite * 100).toFixed(1)}%</strong>
        </div>
        <div class="progress-track"><div class="progress-fill is-rose" style="width:${(res.dropoutProbFromWhite * 100).toFixed(1)}%"></div></div>
        <div class="belt-chip-row">
          ${BELT_STATES.slice(0, 5)
            .map(
              (b, idx) => `
            <div class="belt-cycle-chip">
              <span class="belt-swatch" style="background:${b.color}"></span>
              <span>${b.name.split(' ')[0]}</span>
              <strong class="tabular-nums">${res.expectedCyclesToAbsorption[idx].toFixed(1)} cyc</strong>
            </div>
          `
            )
            .join('')}
        </div>
      </div>
    `;
  }

  if (type === 'entropy') {
    const sec = analyzeTokenSecurity(state.lab.alphabetSize, state.lab.tokenLength, state.lab.attackRate);
    return `
      <div class="entropy-mini-card">
        <div class="entropy-meter-row">
          <span>Shannon Entropy H(X)</span>
          <strong class="tabular-nums ${sec.entropyBits >= 80 ? 'text-emerald' : 'text-rose'}">${sec.entropyBits.toFixed(1)} bits</strong>
        </div>
        <div class="progress-track">
          <div class="progress-fill ${sec.entropyBits >= 80 ? 'is-emerald' : 'is-rose'}" style="width:${Math.min(100, (sec.entropyBits / 128) * 100).toFixed(1)}%"></div>
        </div>
        <div class="entropy-compare-grid tabular-nums">
          <div><small>Alphabet |Σ|</small><strong>${sec.alphabetSize}</strong></div>
          <div><small>Length L</small><strong>${sec.length}</strong></div>
          <div><small>Crack Time</small><strong class="${sec.entropyBits >= 80 ? 'text-emerald' : 'text-rose'}">${sec.humanCrackTime}</strong></div>
        </div>
      </div>
    `;
  }

  return `<canvas id="scenarioCanvas" width="600" height="210" class="plot-canvas"></canvas>`;
}

function computeScenarioSummary(type, state) {
  const l = state.lab;
  if (type === 'nhpp') {
    const prof = generateNhppWindowProfile(l.lambdaBase, l.lambdaPeak, 15, l.sigma, 30);
    const rateAt11 = evaluateNhppIntensity(15, l.lambdaBase, l.lambdaPeak, 15, l.sigma);
    return [
      { label: 'Peak Intensity λ(11:00)', value: `${rateAt11.toFixed(2)} /min`, tone: 'text-rose' },
      { label: 'Expected 30m Arrivals', value: `${prof.expectedArrivals.toFixed(1)} students`, tone: 'text-cyan' },
      { label: 'Peak Inter-Arrival', value: `${(60 / rateAt11).toFixed(1)} sec`, tone: 'text-gold' },
    ];
  }
  if (type === 'queueing') {
    const q = solveMmckQueue(l.qLambda, l.qMu, l.qCores, l.qCap);
    return [
      { label: 'Utilization ρ', value: `${(q.utilization * 100).toFixed(1)}%`, tone: q.utilization > 1 ? 'text-rose' : 'text-emerald' },
      { label: 'Drop Rate P_K', value: `${(q.pK * 100).toFixed(2)}%`, tone: q.pK > 0.02 ? 'text-rose' : 'text-emerald' },
      { label: 'Avg Lobby Wait W', value: `${(q.meanWaitMin * 60).toFixed(0)} sec`, tone: 'text-cyan' },
    ];
  }
  if (type === 'dtmc') {
    const { Q, R } = buildBeltTransitionMatrix(l.dtmcPolicy);
    const d = solveAbsorbingDtmc(Q, R);
    return [
      { label: 'Black Belt Yield', value: `${(d.blackBeltYieldFromWhite * 100).toFixed(1)}%`, tone: 'text-emerald' },
      { label: 'Attrition Risk', value: `${(d.dropoutProbFromWhite * 100).toFixed(1)}%`, tone: 'text-rose' },
      { label: 'Expected Grading Cycles', value: `${d.expectedCyclesToAbsorption[0].toFixed(2)}`, tone: 'text-cyan' },
    ];
  }
  if (type === 'fair') {
    const f = state.fairCache;
    return [
      { label: 'Annualized Loss (ALE)', value: `₱${Math.round(f.ale).toLocaleString()}`, tone: l.rlsMitigated ? 'text-emerald' : 'text-rose' },
      { label: '95% Value-at-Risk', value: `₱${Math.round(f.var95).toLocaleString()}`, tone: 'text-gold' },
      { label: 'Security ROSI', value: `${f.rosiPercent.toFixed(0)}%`, tone: 'text-cyan' },
    ];
  }
  if (type === 'gameTheory') {
    const g = solveCreditIntegrityGame({
      sessionFee: l.sessionFee,
      penaltyFee: l.penaltyFee,
      auditOverhead: l.auditOverhead,
      lobbyFriction: l.lobbyFriction,
    });
    return [
      { label: 'Optimal Audit Rate q*', value: `${(g.qStar * 100).toFixed(1)}%`, tone: 'text-gold' },
      { label: 'Equilibrium Fraud p*', value: `${(g.pStar * 100).toFixed(1)}%`, tone: 'text-cyan' },
      { label: 'Expected Fee Yield', value: `₱${g.expectedAdminRevenue.toFixed(0)}/visit`, tone: 'text-emerald' },
    ];
  }
  if (type === 'entropy') {
    const s = analyzeTokenSecurity(l.alphabetSize, l.tokenLength, l.attackRate);
    return [
      { label: 'Shannon Entropy', value: `${s.entropyBits.toFixed(1)} bits`, tone: s.entropyBits >= 80 ? 'text-emerald' : 'text-rose' },
      { label: 'Keyspace Order', value: `10^${s.keyspaceLog10.toFixed(1)}`, tone: 'text-cyan' },
      { label: 'Time-to-Crack', value: s.humanCrackTime, tone: s.entropyBits >= 80 ? 'text-emerald' : 'text-rose' },
    ];
  }
  if (type === 'anomaly') {
    const z = evaluateZScoreFidelity(l.zThreshold);
    return [
      { label: 'True Positive Rate', value: `${(z.truePositiveRate * 100).toFixed(1)}%`, tone: z.truePositiveRate >= 0.99 ? 'text-emerald' : 'text-rose' },
      { label: 'False Positive Rate', value: `${(z.falsePositiveRate * 100).toFixed(2)}%`, tone: 'text-cyan' },
      { label: 'Threshold τ_crit', value: `${l.zThreshold.toFixed(1)}σ`, tone: 'text-gold' },
    ];
  }
  const r = computeDojangReliability({ rNetwork: l.rNetwork, offlineLocalSync: l.offlineLocalSync });
  return [
    { label: 'Effective Reliability', value: `${(r.effectiveReliability * 100).toFixed(3)}%`, tone: r.offlineLocalSync ? 'text-emerald' : 'text-gold' },
    { label: 'Availability A', value: `${(r.effectiveAvailability * 100).toFixed(4)}%`, tone: 'text-cyan' },
    { label: 'Annual Downtime', value: `${r.annualDowntimeMinutes.toFixed(0)} min/yr`, tone: r.offlineLocalSync ? 'text-emerald' : 'text-rose' },
  ];
}

export function hydrateScenarioCanvas(state) {
  const ep = SCENARIO_EPISODES.find((e) => e.id === state.scenarioId) || SCENARIO_EPISODES[0];
  const canvas = document.getElementById('scenarioCanvas');
  if (!canvas) return;
  const l = state.lab;

  if (ep.interactiveType === 'nhpp') {
    const prof = generateNhppWindowProfile(l.lambdaBase, l.lambdaPeak, 15, l.sigma, 30);
    const rate = evaluateNhppIntensity(l.tScrubber, l.lambdaBase, l.lambdaPeak, 15, l.sigma);
    drawNhppCanvas(canvas, prof, l.tScrubber, l.lambdaBase, rate);
  } else if (ep.interactiveType === 'queueing') {
    drawMmckCanvas(canvas, solveMmckQueue(l.qLambda, l.qMu, l.qCores, l.qCap));
  } else if (ep.interactiveType === 'fair') {
    drawFairLecCanvas(canvas, state.fairCache);
  } else if (ep.interactiveType === 'gameTheory') {
    drawGameTheoryCanvas(
      canvas,
      solveCreditIntegrityGame({
        sessionFee: l.sessionFee,
        penaltyFee: l.penaltyFee,
        auditOverhead: l.auditOverhead,
        lobbyFriction: l.lobbyFriction,
      })
    );
  } else if (ep.interactiveType === 'anomaly') {
    drawZScoreCanvas(canvas, state.anomalyStream, l.zThreshold);
  } else if (ep.interactiveType === 'reliability') {
    drawRbdCanvas(canvas, computeDojangReliability({ rNetwork: l.rNetwork, offlineLocalSync: l.offlineLocalSync }));
  }
}

