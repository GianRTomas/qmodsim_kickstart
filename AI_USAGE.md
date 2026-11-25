# Agentic AI Workflow & Skill Documentation (`AI_USAGE.md`)

Documented per **QMODSIM Student Guide Section 7 (`AI_USAGE.md`)**.

---

## 1. Agentic Environment & Model Rationale
- **Agentic Environment:** Antigravity IDE Agent
- **Primary Model:** Gemini 4 Hydrogen (High)
- **Rationale:** Provided multi-file architectural separation (`src/engines/`, `src/data/`, `src/components/`, `src/views/`), deterministic numerical verification across all 8 QMODSIM mathematical modules, and faithful adaptation of the PULSE-GUARD 3-archetype web layout to the Fatama Fighting Dragons (KickStart) operational domain without introducing external build-tool dependencies that are unavailable in a Python-only local runtime.

---

## 2. Skills Activated & OWASP Agentic Skills Top 10 Vetting Log
| Skill / Reference | Path / Source | Purpose in Project | OWASP Agentic Top 10 Vetting |
|---|---|---|---|
| `frontend-design` | `.agents/skills/frontend-design/SKILL.md` | Editorial flat cards, `1px` crisp borders, deliberate Dark/Light palette, `tabular-nums` telemetry | Inspected locally: pure design guidance markdown; zero shell hooks, zero hidden network calls, zero prompt-injection directives. |
| `github-commit` | `.agents/skills/github-commit/SKILL.md` | Safe GitHub Desktop commit/sync guidance when pushing changes | Inspected locally: read-only operational git guidance; no automatic execution or secret harvesting. |
| QMODSIM Student Guide Blueprint | `QMODSIM-Student-Guide...pdf` | Enforces `Scenarios` / `Lab` / `Codex` 3-tab shell, clean Unicode math, Web Crypto CSPRNG, and Verification Drawer | First-party course specification PDF. |

---

## 3. Phase-by-Phase Prompt & Refinement Log

### Refinement Iteration 01: Zero-Build Native ES6 Modules for Local Python Runtime
- **SE Phase:** Phase 2 (System Architecture)
- **Issue Detected:** Environment inspection confirmed `node` and `npm` are not installed on the target Windows workstation; only Python 3.14 (`server.py`) is available locally.
- **Refinement Applied:** Architected `qmodsim.html` and `src/` as native ES6 JavaScript modules (`<script type="module">`) with zero external bundler dependencies and self-contained dual-theme CSS (`src/styles/qmodsim.css`), ensuring instant execution via `python server.py`.

### Refinement Iteration 02: Zero-Allocation Circular Z-Score Detector (`W = 30`) with Outlier Gating
- **SE Phase:** Phase 3 (Engine Implementation)
- **Issue Detected:** Naive sliding-window anomaly detectors allow an injected ₱95 ledger tampering spike to enter the baseline buffer, inflating `σ_t` and masking consecutive tampering events.
- **Refinement Applied:** Implemented `CircularZScoreDetector` in `src/engines/anomaly.js` using a fixed-capacity `Float64Array(30)` with `O(1)` running sums (`sum`, `sumSq`) and outlier gating so flagged events (`Z_t ≥ τ_crit`) trigger alerts without contaminating the baseline mean/variance.

### Refinement Iteration 03: Clean Unicode Math & Web Crypto CSPRNG Compliance
- **SE Phase:** Phase 4 (Security Hardening & Typography Audit)
- **Issue Detected:** Risk of raw LaTeX delimiters (`\lambda`, `\rightarrow`, `\mathbb{R}`) leaking into UI/Canvas labels and predictable `Math.random()` usage in token entropy demonstrations.
- **Refinement Applied:** Audited all strings across `src/data/` and `src/components/canvases.js` to enforce clean Unicode symbols (`λ, μ, σ, ρ, τ, →, ⁻¹, ₀, ₅, ₉, ₱`), and bound `src/engines/entropy.js` exclusively to `crypto.getRandomValues()` and `crypto.subtle.sign('HMAC', ...)`.

---

## 4. Code Attribution Matrix
| File / Directory | Authoring Mode | Verification Status |
|---|---|---|
| `SPEC.md`, `DESIGN_SYSTEM.md`, `README.md`, `AI_USAGE.md` | Agent-authored from `QMODSIM-KickStart.pdf`, `QMODSIM-Student-Guide.pdf`, and FATAMA schema | Cross-checked against PDF specs & `supabase_schema.sql` |
| `src/engines/*.js` (8 math modules + `validation.js`) | Agent-authored pure ES6 computational engines | Verified via mathematical invariant audit & `tests/verify.html` |
| `src/data/*.js` (`episodes.js`, `codex.js`, `modulesGrid.js`) | Agent-authored FATAMA domain mappings | Audited for zero raw LaTeX & authentic FATAMA operational metrics |
| `src/components/*.js`, `src/views/*.js`, `src/styles/qmodsim.css`, `src/app.js`, `qmodsim.html` | Agent-authored SPA matching PULSE-GUARD 3-archetype layout | Verified via local `server.py` HTTP serve & JS syntax/runtime checks |

