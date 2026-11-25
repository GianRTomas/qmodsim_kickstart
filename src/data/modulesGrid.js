/**
 * Core QMODSIM Curriculum Modules Grid (8 cards rendered below active workspace, matching PULSE-GUARD).
 * Clean Unicode math strings (zero raw LaTeX).
 */

export const CURRICULUM_CARDS = [
  {
    episodeId: 1,
    moduleCode: 'Modules 1 & 3',
    title: 'Stochastic Arrivals & Sunday Check-In Bursts',
    description:
      'Models 10:45–11:15 AM Sunday lobby bursts using Non-Homogeneous Poisson intensity λ(t) and Exponential inter-arrivals f(t) = λ·e^(-λt).',
    formula: 'λ(t) = λ_base + λ_peak · exp(-(t - t_class)² / (2σ²))',
    accent: 'crimson',
    icon: 'activity',
  },
  {
    episodeId: 2,
    moduleCode: 'Module 6',
    title: 'Dojang Entrance Queueing (M/M/c/K)',
    description:
      'Multi-tablet finite-capacity queueing model proving Little’s Law (L = λ_eff · W) and eliminating warm-up delays at the front desk.',
    formula: 'P_drop = P_K = P₀ · (cᶜ · ρᴷ) / c!,   L = λ_eff · W',
    accent: 'cyan',
    icon: 'layers',
  },
  {
    episodeId: 3,
    moduleCode: 'Module 5',
    title: 'Belt Progression & Retention DTMC',
    description:
      'Absorbing Markov chain across White → Yellow → Green → Blue → Red → Black Belt vs. Drop-out using N = (I - Q)⁻¹ and B = N·R.',
    formula: 'N = (I - Q)⁻¹,   B = N · R,   t = N · 1',
    accent: 'gold',
    icon: 'gitbranch',
  },
  {
    episodeId: 4,
    moduleCode: 'Module 4',
    title: 'FAIR Monte Carlo & RA 10173 Minor SPI',
    description:
      '10,000-trial Beta-PERT & heavy-tailed Lognormal simulation in PHP (₱) quantifying NPC fines, VaR₉₅, and RLS + encryption ROSI.',
    formula: 'ALE = (1/N) Σ Loss_i,   ROSI = (ΔALE - C_ctrl) / C_ctrl',
    accent: 'crimson',
    icon: 'shield',
  },
  {
    episodeId: 5,
    moduleCode: 'Module 7',
    title: 'Game Theory in Session Credit Integrity',
    description:
      '2×2 strategic game between shared login exploitation and strict verification, solved via Mixed-Strategy Nash Equilibrium (σ_U*, σ_D*).',
    formula: 'q* = F / (F + P - friction),   p* = C_audit / (F + P)',
    accent: 'cyan',
    icon: 'scale',
  },
  {
    episodeId: 6,
    moduleCode: 'Modules 2 & 10',
    title: 'Shannon Entropy & HMAC QR Security',
    description:
      'Compares 4-digit student PIN brute-force time vs. 128-bit Web Crypto rolling HMAC-SHA-256 check-in tokens.',
    formula: 'H(X) = log₂(|Σ|^L),   T_crack = |Σ|^L / (2 · R_rate)',
    accent: 'emerald',
    icon: 'key',
  },
  {
    episodeId: 7,
    moduleCode: 'Module 11',
    title: 'Streaming Z-Score Ledger Anomaly Guard',
    description:
      'Zero-allocation circular Float64Array (W = 30) flagging abnormal ₱200 payment voids or attendance tampering at ≥ 3.5σ.',
    formula: 'Z_t = |x_t - μ_t| / σ_t ≥ τ_crit   (W = 30)',
    accent: 'gold',
    icon: 'radar',
  },
  {
    episodeId: 8,
    moduleCode: 'Module 12',
    title: 'Dojang RBD & Offline LocalStorage Sync',
    description:
      'Series-parallel Reliability Block Diagram proving how offline browser queueing maintains Four Nines uptime during mall Wi-Fi drops.',
    formula: 'R_par = 1 - (1 - R_online)(1 - R_local),   A = MTBF / (MTBF + MTTR)',
    accent: 'emerald',
    icon: 'server',
  },
];

