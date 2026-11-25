/**
 * In-App Verification & Validation Drawer (QMODSIM-Student-Guide Section 6)
 * Executes live mathematical invariant checks against active simulation state.
 */
import { runInvariantChecks } from '../engines/validation.js';

export function renderValidationDrawer(isOpen, liveParams) {
  if (!isOpen) return '';
  const results = runInvariantChecks(liveParams);
  const passCount = results.filter((r) => r.passed).length;
  const allPassed = passCount === results.length;

  return `
    <div class="modal-backdrop" id="validationBackdrop" role="dialog" aria-modal="true" aria-labelledby="validationTitle">
      <div class="validation-drawer">
        <div class="drawer-header">
          <div>
            <span class="badge-mono badge-cyan">Automated Mathematical Verification</span>
            <h2 id="validationTitle" class="drawer-title">QMODSIM Invariant Audit Suite</h2>
            <p class="drawer-sub">Live unit checks against pure engines under <code>src/engines/</code> using active sandbox parameters.</p>
          </div>
          <div class="drawer-header-actions">
            <span class="status-pill ${allPassed ? 'is-ok' : 'is-warn'}">
              ${passCount}/${results.length} Checks Passed
            </span>
            <button type="button" class="icon-btn" id="closeValidationBtn" aria-label="Close validation drawer">✕</button>
          </div>
        </div>

        <div class="validation-grid">
          ${results
            .map(
              (r) => `
            <div class="validation-row ${r.passed ? 'is-pass' : 'is-fail'}">
              <div class="validation-row-top">
                <div class="validation-title-group">
                  <span class="badge-mono badge-muted">${r.module}</span>
                  <strong>${r.target}</strong>
                </div>
                <span class="result-chip ${r.passed ? 'is-ok' : 'is-warn'}">
                  ${r.passed ? 'PASS ✓' : 'CHECK !'}
                </span>
              </div>
              <div class="validation-meta">
                <div><span class="meta-label">Standard:</span> <code>${r.standard}</code></div>
                <div><span class="meta-label">Measured:</span> <code class="tabular-nums">${r.measured}</code></div>
              </div>
            </div>
          `
            )
            .join('')}
        </div>

        <div class="drawer-footer">
          <span class="drawer-footnote">RA 10173 Sec. 13 Compliance: All simulation streams use anonymized IDs and Web Crypto CSPRNG tokens.</span>
          <button type="button" class="btn-primary" id="reRunValidationBtn">Re-Run All Invariants</button>
        </div>
      </div>
    </div>
  `;
}

