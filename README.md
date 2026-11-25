# FATAMA-QMODSIM: Interactive Quantitative Modeling & Cyber-Resilience Web Artifact

An interactive QMODSIM web application for **Fatama Fighting Dragons Taekwondo (KickStart)** at Robinsons Luisita Covered Area, San Miguel, Tarlac City, engineered in the visual and functional architecture of the **PULSE-GUARD** reference proposal (`Scenarios` · `Lab` · `Codex` + In-App Mathematical Verification Drawer + Dual Dark/Light Themes).

---

## Quick Start (Local Development)

Run the existing local Python HTTP server and open **`/qmodsim.html`**:

```powershell
python server.py
```

Then navigate in your browser to:
- **Interactive QMODSIM Web Artifact:** `http://127.0.0.1:5500/qmodsim.html` *(or whichever port `server.py` prints)*
- **Mathematical Invariant Test Runner:** `http://127.0.0.1:5500/tests/verify.html`
- **FATAMA KickStart Portal:** `http://127.0.0.1:5500/html/landing_page.html`

---

## Proposal-to-QMODSIM Module Mapping

| QMODSIM Module | FATAMA Operational / Security Stressor | Engine Module |
|---|---|---|
| **Modules 1 & 3:** Stochastic Processes | Sunday 10:45–11:15 AM peak check-in bursts before 11:00 AM class (`λ(t)` NHPP & `f(t)=λe^(-λt)`) | `src/engines/nhpp.js` |
| **Module 6:** Queueing Theory | Multi-tablet front-desk verification bottlenecks (`M/M/c/K`, `P_drop`, Little's Law `L = λ_eff·W`) | `src/engines/queueing.js` |
| **Module 5:** Absorbing DTMC | White → Yellow → Green → Blue → Red → Black Belt vs. Drop-out (`N = (I-Q)⁻¹`, `B = N·R`) | `src/engines/dtmc.js` |
| **Module 4:** FAIR & Monte Carlo | Minor SPI exposure (`medical_notes`, `blood_type`, guardian logs) under **RA 10173** in PHP (`₱`) | `src/engines/fair.js` |
| **Module 7:** Game Theory | Session credit sharing vs. strict IP/device pinning & QR audit (`2×2` Mixed Nash `(σ_U*, σ_D*)`) | `src/engines/gameTheory.js` |
| **Modules 2 & 10:** Entropy | 4-digit check-in PIN brute-force vs. 128-bit Web Crypto rolling HMAC-SHA-256 QR tokens | `src/engines/entropy.js` |
| **Module 11:** Anomaly Detection | Circular `Float64Array(30)` Z-score guard flagging ₱200 payment/attendance tampering (`≥ 3.5σ`) | `src/engines/anomaly.js` |
| **Module 12:** Reliability (RBD) | Lobby Router → Web Portal → PostgreSQL → Media Storage + Offline LocalStorage sync failover | `src/engines/reliability.js` |

---

## Project Documentation
- [`SPEC.md`](SPEC.md) — Mathematical contracts, domain assumptions, and interface specification
- [`DESIGN_SYSTEM.md`](DESIGN_SYSTEM.md) — Dark/Light tokens, typography, and theme-reactive canvas spec
- [`AI_USAGE.md`](AI_USAGE.md) — Agentic workflow log, OWASP skill vetting, refinement iterations, and code attribution

