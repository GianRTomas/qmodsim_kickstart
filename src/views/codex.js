/**
 * Archetype 3: CODEX — Formal Mathematical Formulations & Statutory Crosswalks
 * Clean Unicode mathematical typography (zero raw LaTeX strings).
 */
import { CODEX_ENTRIES } from '../data/codex.js';

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function renderCodexView(selectedId) {
  const active = CODEX_ENTRIES.find((c) => c.id === selectedId) || CODEX_ENTRIES[0];

  return `
    <section class="codex-shell" aria-label="FATAMA Mathematical and Regulatory Codex">
      <div class="section-banner">
        <div>
          <span class="badge-mono badge-cyan">Topic-by-Topic Mathematical Formulations</span>
          <h2 class="section-heading">FATAMA-QMODSIM Mathematical &amp; Regulatory Codex</h2>
          <p class="section-lead">
            Formal derivations, clean Unicode governing equations, dojang engineering rationale, and RA 10173 / Kukkiwon statutory crosswalks mapped directly from KickStart.
          </p>
        </div>
        <div class="pill-stat">
          <span class="dot dot-cyan"></span>
          <span class="tabular-nums">${CODEX_ENTRIES.length} Core Modules &amp; Proofs</span>
        </div>
      </div>

      <div class="codex-grid">
        <aside class="codex-sidebar" aria-label="Codex Module Index">
          ${CODEX_ENTRIES.map((entry) => {
            const isSel = entry.id === active.id;
            return `
              <button type="button" class="codex-nav-card ${isSel ? 'is-active' : ''}" data-codex-id="${entry.id}">
                <div class="codex-nav-top">
                  <span class="badge-mono badge-crimson"># ${entry.moduleCode}</span>
                  <span class="codex-arrow">${isSel ? '→' : ''}</span>
                </div>
                <h4>${entry.title}</h4>
                <p>${entry.summary}</p>
                <div class="codex-nav-foot">
                  <span class="badge-cat">${entry.category}</span>
                  <span class="badge-law">Statutory Crosswalk</span>
                </div>
              </button>
            `;
          }).join('')}
        </aside>

        <article class="codex-detail-card">
          <div class="codex-detail-head">
            <div class="codex-detail-badges">
              <span class="badge-mono badge-crimson"># ${active.moduleCode}</span>
              <span class="badge-cat">${active.category}</span>
            </div>
            <h3>${active.title}</h3>
            <p class="codex-subtitle">${active.subtitle}</p>
          </div>

          <div class="codex-block">
            <span class="block-label">Governing Equation (Clean Unicode)</span>
            <div class="formula-box tabular-nums">${escapeHtml(active.mainFormula)}</div>
          </div>

          <div class="codex-block">
            <span class="block-label">Step-by-Step Mathematical Derivation</span>
            <ul class="derivation-list">
              ${active.derivations
                .map((step, idx) => `<li><span class="step-num">${idx + 1}.</span> <code>${escapeHtml(step)}</code></li>`)
                .join('')}
            </ul>
          </div>

          <div class="codex-two-col">
            <div class="info-callout">
              <span class="block-label">FATAMA Dojang Engineering Significance</span>
              <p>${escapeHtml(active.dojangSignificance)}</p>
            </div>
            <div class="info-callout is-law">
              <span class="block-label">Statutory &amp; Governance Crosswalk</span>
              <p>${escapeHtml(active.statutoryReference)}</p>
            </div>
          </div>

          <div class="codex-block">
            <div class="code-header">
              <span class="block-label">Reference Python Implementation</span>
              <button type="button" class="btn-ghost-sm" id="copyCodexCodeBtn" data-code="${encodeURIComponent(active.pythonCode)}">
                Copy Snippet
              </button>
            </div>
            <pre class="code-pre"><code>${escapeHtml(active.pythonCode)}</code></pre>
          </div>
        </article>
      </div>
    </section>
  `;
}

