# FATAMA-QMODSIM Design System (`DESIGN_SYSTEM.md`)

## 1. Visual Direction & Layout Parity
Modeled directly after the **PULSE-GUARD** QMODSIM editorial instrument layout (`Scenarios` · `Lab` · `Codex` 3-tab workbench, hero duo card, 8-card curriculum overview grid, dual Dark/Light theme switcher), tailored specifically to **Fatama Fighting Dragons Taekwondo** (`Crimson` + `Dragon Gold` + `Precision Cyan`).

## 2. Color Tokens

### Dark Mode (Default)
- `--bg-app`: `#020617` (Deep midnight slate canvas)
- `--bg-surface`: `#0f172a` (Editorial card surface)
- `--bg-recessed`: `#090d16` (Plot canvases, code blocks, KPI chips)
- `--border-subtle`: `#1e293b` (Crisp `1px` structural border — zero heavy drop shadows, zero glassmorphism)
- `--accent-crimson`: `#f43f5e` (FATAMA Dragon Crimson — primary brand mark, active tab, surge peaks)
- `--accent-gold`: `#f59e0b` (Belt Promotion / Warning / VaR₉₅ markers)
- `--accent-cyan`: `#22d3ee` (Stochastic baselines, queue equilibrium, links)
- `--accent-emerald`: `#34d399` (Compliant / Validated / Clean remediation)

### Light Mode
- `--bg-app`: `#f8fafc`
- `--bg-surface`: `#ffffff`
- `--bg-recessed`: `#f1f5f9`
- `--border-subtle`: `#e2e8f0`
- `--accent-crimson`: `#e11d48`
- `--accent-gold`: `#d97706`
- `--accent-cyan`: `#0284c7`
- `--accent-emerald`: `#16a34a`

## 3. Typography
- **Display / Headings:** `'Fredoka', system-ui, sans-serif` (700/600)
- **Body Copy:** `'Plus Jakarta Sans', system-ui, sans-serif` (400/500/600)
- **Telemetry / Math / Code:** `'JetBrains Mono', monospace` with `font-variant-numeric: tabular-nums`

## 4. Theme-Reactive HTML5 Canvases
Every `<canvas>` reads the active theme (`document.documentElement.dataset.theme === 'light'`) on every render pass so backgrounds, gridlines, axes labels, and data strokes preserve WCAG AA contrast in both Light and Dark modes.

