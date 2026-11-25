# Mathematical Verification & Invariant Audit (`MATH_VERIFICATION.md`)

Automated verification suite for **FATAMA-QMODSIM**, validating all quantitative modeling and cyber-resilience engines under `src/engines/` via `runInvariantChecks(liveParams)` in [`src/engines/validation.js`](src/engines/validation.js).

---

## 1. How to Run Verification

1. **In-App Verification Drawer:** Open the web artifact (`qmodsim.html`) and click **`✓ Verify Invariants`** in the top header. This executes `runInvariantChecks()` against the active sandbox parameters via [`src/views/validationDrawer.js`](src/views/validationDrawer.js).
2. **Standalone Test Runner:** Open [`tests/verify.html`](tests/verify.html) over HTTP (e.g., via `python server.py` or your Vercel deployment at `/tests/verify.html`) to run all 7 invariant checks directly against `src/engines/validation.js`.

---

## 2. Default Audit Parameters

When `runInvariantChecks(liveParams)` is invoked without overrides, it uses:

| Parameter | Default | Description |
|---|---|---|
| `lambda` (`λ`) | `3.2` | Arrival rate (athletes/min) |
| `mu` (`μ`) | `1.8` | Service rate per check-in tablet (athletes/min) |
| `c` | `2` | Number of check-in tablet servers |
| `K` | `24` | Finite lobby buffer capacity |
| `policy` | `'baseline'` | DTMC belt progression policy (`'baseline'`, `'mentored'`, `'unstructured'`) |
| `tefMode` | `6` | FAIR Threat Event Frequency PERT mode |
| `fairTrials` | `10000` | Monte Carlo trial count (`Math.max(10000, ...)`) |
| `zThreshold` | `3.5` | Critical Z-score threshold (`τ_crit`) |

---

## 3. Automated Mathematical Invariant Checks

| # | Invariant Target | QMODSIM Module | Engine Source | Mathematical Standard & Pass Condition |
|---|---|---|---|---|
| 1 | **Poisson Arrival Invariant** | Modules 1 & 3 | [`src/engines/nhpp.js`](src/engines/nhpp.js) | Simulated mean inter-arrival `E[X]` across `10,000` draws (`seed: 202601`) matches theoretical `1 / λ` with relative error `< 0.02` (`±2.0%`). |
| 2 | **Little's Law Conservation** | Module 6 | [`src/engines/queueing.js`](src/engines/queueing.js) | Finite-capacity `M/M/c/K` queue satisfies `|L - (λ_eff · W)| < 1e-5` across all buffer states. |
| 3 | **Markov Row-Stochasticity** | Module 5 | [`src/engines/dtmc.js`](src/engines/dtmc.js) | Transition matrix `P` and absorption probability matrix `B = N · R` (`N = (I - Q)⁻¹`) satisfy `Σ P_ij = 1.0` and `Σ B_ij = 1.0` for all belt states in `S` (`isRowStochastic === true`). |
| 4 | **FAIR Monte Carlo Convergence** | Module 4 | [`src/engines/fair.js`](src/engines/fair.js) | Annualized Loss Expectancy (`ALE`) converges within `< 0.015` (`±1.5%`) relative spread across `≥ 10,000` trials between two independent seeds (`10173` and `88217`). |
| 5 | **Nash Equilibrium Indifference** | Module 7 | [`src/engines/gameTheory.js`](src/engines/gameTheory.js) | `2×2` mixed-strategy Nash Equilibrium `(σ_U*, σ_D*)` achieves `max(indifferenceCheckUser, indifferenceCheckAdmin) < 1e-6`. |
| 6 | **Z-Score Anomaly Fidelity** | Module 11 | [`src/engines/anomaly.js`](src/engines/anomaly.js) | Circular `Float64Array(30)` detector with outlier gating achieves `TPR ≥ 0.99` (`99.0%`) and `FPR ≤ 0.01` (`1.0%`) at `≥ 3.5σ` tampering. |
| 7 | **RBD Redundancy Dominance** | Module 12 | [`src/engines/reliability.js`](src/engines/reliability.js) | Offline LocalStorage sync parallel path reliability satisfies `resilientReliability >= seriesReliability`, `resilientReliability <= 1.0`, and `seriesReliability > 0`. |

---

## 4. Cryptographic & Privacy Verification Note

- **Modules 2 & 10 ([`src/engines/entropy.js`](src/engines/entropy.js)):** Uses `crypto.getRandomValues()` and `crypto.subtle.sign('HMAC', ...)` (Web Crypto CSPRNG / HMAC-SHA-256) rather than `Math.random()`.
- **RA 10173 Sec. 13 Compliance:** All simulation streams use anonymized IDs and synthetic/aggregated parameters without exposing live student PII.
