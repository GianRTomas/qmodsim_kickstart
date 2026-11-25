# FATAMA-QMODSIM System & Mathematical Specification (`SPEC.md`)

**Project:** FATAMA Fighting Dragons — Quantitative Modeling, Operations & Cyber-Resilience Artifact  
**Venue & Operational Context:** Robinsons Luisita Covered Area, San Miguel, Tarlac City (Sundays, 11:00 AM – 1:00 PM)  
**Source Inputs:** `QMODSIM-KickStart.pdf`, `QMODSIM-Student-Guide`, `PULSE-GUARD` reference layout, and the FATAMA KickStart portal (`supabase_schema.sql`, `html/`).

---

## 1. Domain Scope & Explicit Modeling Assumptions

1. **Cohort & Facility Scale:**
   - Active dojang cohort baseline: **48 enrolled student-athletes** (adjustable in Lab up to 80) across 6 Taekwondo belt ranks (White/10th-Gup through Black/Dan).
   - Fixed Sunday session block: **11:00 AM – 1:00 PM** (`t = 0` corresponds to `10:45 AM` lobby opening; `t_class = 15 min` corresponds to `11:00 AM` class start; window `0..30 min`).
   - Session fee benchmark: **₱200.00 per session** (`attendance_logs.fee_amount`), settled via `GCash / Maya`, `Studio Cash`, or `Bank Transfer`.
2. **Units & Scales:**
   - Arrival rates (`λ`) and service rates (`μ`) in **students/min** (or **check-ins/min**).
   - Waiting times (`W`, `W_q`) in **minutes** (displayed in both minutes and seconds where helpful).
   - Financial loss & audit metrics in **Philippine Pesos (`₱` / PHP)**, aligned with **Republic Act No. 10173 (Philippine Data Privacy Act of 2012, Section 13 — Sensitive Personal Information of minors)**.
3. **Zero Raw LaTeX Policy:**
   - All equations rendered in UI and Canvas labels use clean Unicode mathematical typography (`λ, μ, σ, ρ, τ, →, ∈, ≤, ≥, ·, ±, ², ³, ⁻¹, ₀, ₅, ₉`) with zero raw LaTeX syntax exposed.

---

## 2. Mathematical Module Contracts (`src/engines/`)

| # | Module | Engine File | Governing Equations (Clean Unicode) | Verification Standard |
|---|--------|-------------|-------------------------------------|-----------------------|
| 1 | **Modules 1 & 3:** Peak Check-In Bursts | `src/engines/nhpp.js` | `λ(t) = λ_base + λ_peak · exp(-(t - t_class)² / (2σ²))`, `f(t) = λ · e^(-λt)` | Mean inter-arrival matches `1/λ` within `±2.0%` |
| 2 | **Module 6:** Entrance Queueing | `src/engines/queueing.js` | `M/M/c/K`, `ρ = λ / (c · μ)`, `P_K = P₀ · (cᶜ · ρᴷ) / c!`, `L = λ_eff · W` | `|L - λ_eff · W| < 10⁻⁵` |
| 3 | **Module 5:** Belt Progression DTMC | `src/engines/dtmc.js` | `P = [Q R ; 0 I]`, `N = (I - Q)⁻¹`, `B = N · R`, `t = N · 1` | Every row of `P` and `B` sums to `1.0 ± 10⁻⁵` |
| 4 | **Module 4:** FAIR Risk & RA 10173 | `src/engines/fair.js` | `TEF ~ Beta-PERT(1, 6, 25)`, `LM ~ Lognormal(μ=11.5, σ=1.2)`, `ROSI = (ΔALE - C_ctrl)/C_ctrl` | `ALE` converges within `±1.5%` across 10,000 trials |
| 5 | **Module 7:** Credit Fraud Game Theory | `src/engines/gameTheory.js` | `2×2` normal-form payoffs `(U, D)`, Mixed Nash `(σ_U*, σ_D*)` | Indifference equality `E[U(Legit)] = E[U(Share)]` |
| 6 | **Modules 2 & 10:** Check-In Token Entropy | `src/engines/entropy.js` | `H(X) = -Σ P(x_i) log₂ P(x_i) = log₂(|Σ|^L)`, `T = |Σ|^L / (2 · R_rate)` | Web Crypto `crypto.getRandomValues()` + HMAC-SHA-256 |
| 7 | **Module 11:** Ledger Anomaly Z-Score | `src/engines/anomaly.js` | `μ_t = (1/W) Σ x_{t-k}`, `σ_t² = (1/W) Σ (x_{t-k} - μ_t)²`, `Z_t = |x_t - μ_t|/σ_t ≥ τ` | `O(1)` circular `Float64Array`, TPR `≥ 99.0%` at `≥ 3.5σ` |
| 8 | **Module 12:** RBD & Offline Sync | `src/engines/reliability.js` | `R_sys = ∏ R_i(t)`, `R_parallel = 1 - ∏ (1 - R_i(t))`, `A = MTBF / (MTBF + MTTR)` | `0 ≤ R ≤ 1`, parallel redundancy `≥` series |

---

## 3. Three-Archetype Interface Contract

1. **Scenarios (`src/views/scenarios.js`):**
   - 8 guided FATAMA crisis walkthroughs (matching Modules 1–8) with **Simplified (~2m)** and **Extended (5m)** editions.
   - Interactive dialogue stage featuring **Master Bruce** (Head Instructor) and **Kiko** (Dragon Cadet Analyst).
   - **Real Parameter Decision Forks:** Selecting a mitigation option inside a scenario updates the underlying mathematical engine state and recalculates live telemetry/charts immediately.
2. **Lab (`src/views/lab.js`):**
   - **Full Dojang Hub** overview + 8 dedicated single-module sandboxes with continuous sliders, preset buttons, theme-reactive HTML5 Canvas charts, and `tabular-nums` KPI cards.
3. **Codex (`src/views/codex.js`):**
   - Interactive formula reference, step-by-step derivations, dojang significance, RA 10173 / Kukkiwon statutory crosswalks, and copyable Python + JavaScript reference implementations.
4. **Verification & Validation Drawer (`src/views/validationDrawer.js`):**
   - Live in-app mathematical invariant suite runnable on demand to prove accuracy during capstone defense.

