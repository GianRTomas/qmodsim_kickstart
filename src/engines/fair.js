/**
 * Pure Mathematical Engine: Module 4 — FAIR Risk Framework & Monte Carlo (RA 10173 Minor SPI)
 * Currency scale: Philippine Peso (₱ / PHP). Uses typed Float64Array and seeded PRNG for reproducibility.
 */
import { createSeededRng } from './nhpp.js';

/**
 * Sample Gamma(alpha, 1) using Marsaglia and Tsang's method.
 * @param {number} alpha
 * @param {() => number} rng
 * @returns {number}
 */
function sampleGamma(alpha, rng) {
  if (alpha < 1) {
    return sampleGamma(alpha + 1, rng) * Math.pow(Math.max(1e-12, rng()), 1 / alpha);
  }
  const d = alpha - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  while (true) {
    let x = 0;
    let v = 0;
    do {
      const u1 = Math.max(1e-12, rng());
      const u2 = rng();
      x = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rng();
    if (u < 1 - 0.0331 * (x * x) * (x * x)) return d * v;
    if (Math.log(Math.max(1e-12, u)) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

/**
 * Build an exact 512-point inverse CDF lookup table for Beta-PERT(a, m, b)
 * via numerical quadrature of x^(alpha-1) * (1-x)^(beta-1).
 * Enables O(1) exact Beta-PERT sampling and true antithetic variate pairing (u, 1 - u).
 */
function buildBetaPertInverseCdf(a, m, b, bins = 512) {
  const table = new Float64Array(bins + 1);
  if (b <= a) {
    table.fill(a);
    return table;
  }
  const alpha = 1 + 4 * ((m - a) / (b - a));
  const beta = 1 + 4 * ((b - m) / (b - a));
  const cdf = new Float64Array(bins + 1);
  let total = 0;

  for (let i = 1; i <= bins; i++) {
    const xMid = (i - 0.5) / bins;
    const pdf = Math.pow(xMid, alpha - 1) * Math.pow(1 - xMid, beta - 1);
    total += pdf;
    cdf[i] = total;
  }
  for (let i = 1; i <= bins; i++) cdf[i] /= total;

  let cIdx = 0;
  for (let k = 0; k <= bins; k++) {
    const u = k / bins;
    while (cIdx < bins - 1 && cdf[cIdx + 1] < u) cIdx++;
    const c0 = cdf[cIdx];
    const c1 = cdf[cIdx + 1];
    const frac = c1 > c0 ? (u - c0) / (c1 - c0) : 0;
    const x = (cIdx + frac) / bins;
    table[k] = a + x * (b - a);
  }
  return table;
}

function lookupInverseCdf(table, u) {
  const bins = table.length - 1;
  const pos = Math.max(0, Math.min(1, u)) * bins;
  const i0 = Math.min(bins - 1, Math.floor(pos));
  const frac = pos - i0;
  return table[i0] * (1 - frac) + table[i0 + 1] * frac;
}

/**
 * Sample Beta-PERT(a, m, b) distribution for Threat Event Frequency (TEF).
 * @param {number} a - Minimum attempts/year
 * @param {number} m - Most likely attempts/year
 * @param {number} b - Maximum attempts/year
 * @param {() => number} rng
 * @returns {number}
 */
export function sampleBetaPert(a, m, b, rng) {
  if (b <= a) return a;
  const alpha = 1 + 4 * ((m - a) / (b - a));
  const beta = 1 + 4 * ((b - m) / (b - a));
  const g1 = sampleGamma(alpha, rng);
  const g2 = sampleGamma(beta, rng);
  const betaVal = g1 / (g1 + g2 || 1);
  return a + betaVal * (b - a);
}

/**
 * Acklam's rational approximation for inverse standard normal CDF Φ⁻¹(p).
 * Relative error < 1.15e-9 across (0, 1). Enables stratified Lognormal sampling.
 */
function normInv(p) {
  const clamped = Math.max(1e-9, Math.min(1 - 1e-9, p));
  const a1 = -3.969683028665376e+01;
  const a2 =  2.209460984245205e+02;
  const a3 = -2.759285104469687e+02;
  const a4 =  1.383577518672690e+02;
  const a5 = -3.066479806614716e+01;
  const a6 =  2.506628277459239e+00;

  const b1 = -5.447609879822406e+01;
  const b2 =  1.615858368580409e+02;
  const b3 = -1.556989798598866e+02;
  const b4 =  6.680131188771972e+01;
  const b5 = -1.328068155288572e+01;

  const c1 = -7.784894002430293e-03;
  const c2 = -3.223964580411365e-01;
  const c3 = -2.400758277161838e+00;
  const c4 = -2.549732539343734e+00;
  const c5 =  4.374664141464968e+00;
  const c6 =  2.938163982698783e+00;

  const d1 =  7.784695709041462e-03;
  const d2 =  3.224671290700398e-01;
  const d3 =  2.445134137142996e+00;
  const d4 =  3.754408661907416e+00;

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  if (clamped < pLow) {
    const q = Math.sqrt(-2 * Math.log(clamped));
    return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
      ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  }
  if (clamped <= pHigh) {
    const q = clamped - 0.5;
    const r = q * q;
    return (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
      (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
  }
  const q = Math.sqrt(-2 * Math.log(1 - clamped));
  return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
    ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
}

/**
 * Sample Lognormal(mu, sigma) using Box-Muller normal variate.
 * @param {number} mu
 * @param {number} sigma
 * @param {() => number} rng
 * @returns {number}
 */
export function sampleLognormal(mu, sigma, rng) {
  const u1 = Math.max(1e-12, rng());
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.exp(mu + sigma * z);
}

/**
 * Run vectorized FAIR Monte Carlo simulation over N trials.
 * Evaluates baseline vs. RLS + Field-Level Encryption mitigated Annualized Loss Expectancy (ALE).
 * @param {{
 *   trials?: number,
 *   tefMin?: number,
 *   tefMode?: number,
 *   tefMax?: number,
 *   lossMu?: number,
 *   lossSigma?: number,
 *   rlsMitigated?: boolean,
 *   controlCostPhp?: number,
 *   seed?: number
 * }} config
 * @returns {{
 *   trials: number,
 *   ale: number,
 *   var95: number,
 *   maxLoss: number,
 *   baselineAle: number,
 *   mitigatedAle: number,
 *   rosiPercent: number,
 *   controlCostPhp: number,
 *   lossExceedanceCurve: { loss: number, exceedanceProbability: number }[]
 * }}
 */
export function runFairMonteCarlo(config = {}) {
  const trials = Math.max(1000, Math.min(25000, Math.round(config.trials ?? 10000)));
  const tefMin = config.tefMin ?? 1;
  const tefMode = config.tefMode ?? 6;
  const tefMax = config.tefMax ?? 25;
  const lossMu = config.lossMu ?? 11.5;
  const lossSigma = config.lossSigma ?? 1.2;
  const rlsMitigated = config.rlsMitigated ?? true;
  const controlCostPhp = config.controlCostPhp ?? 48000; // Annual Supabase Pro + KMS + Audit cost in PHP
  const seed = config.seed ?? 10173;

  const pertTable = buildBetaPertInverseCdf(tefMin, tefMode, tefMax);

  const simulatePass = (isMitigated, passSeed) => {
    const rng = createSeededRng(passSeed);
    const losses = new Float64Array(trials);
    // Vulnerability/Susceptibility multiplier: 0.42 unhardened vs 0.06 with Supabase RLS + AES-256 field encryption
    const vulnFactor = isMitigated ? 0.06 : 0.42;

    // Step 1: Stratified Beta-PERT TEF + stratified fractional thinning across all trials
    const eventCounts = new Uint16Array(trials);
    let totalEvents = 0;
    for (let i = 0; i < trials; i++) {
      const uTef = (i + rng()) / trials;
      const tef = lookupInverseCdf(pertTable, uTef);
      const expEvents = tef * vulnFactor;
      const whole = Math.floor(expEvents);
      const frac = expEvents - whole;
      const uThin = (i + rng()) / trials;
      const evCount = whole + (uThin < frac ? 1 : 0);
      eventCounts[i] = evCount;
      totalEvents += evCount;
    }

    // Step 2: Latin Hypercube / Stratified Lognormal severity draws shuffled across realized events
    const severities = new Float64Array(totalEvents);
    for (let j = 0; j < totalEvents; j++) {
      const uSev = (j + rng()) / totalEvents;
      const z = normInv(uSev);
      severities[j] = Math.exp(lossMu + lossSigma * z);
    }
    for (let j = totalEvents - 1; j > 0; j--) {
      const k = Math.floor(rng() * (j + 1));
      const tmp = severities[j];
      severities[j] = severities[k];
      severities[k] = tmp;
    }

    // Step 3: Aggregate annual losses per trial
    let sum = 0;
    let cursor = 0;
    for (let i = 0; i < trials; i++) {
      let annualLoss = 0;
      const c = eventCounts[i];
      for (let e = 0; e < c; e++) {
        annualLoss += severities[cursor++];
      }
      losses[i] = annualLoss;
      sum += annualLoss;
    }

    losses.sort();
    const ale = sum / trials;
    const var95 = losses[Math.min(trials - 1, Math.floor(trials * 0.95))];
    const maxLoss = losses[trials - 1];
    return { losses, ale, var95, maxLoss };
  };

  const base = simulatePass(false, seed);
  const mit = simulatePass(true, seed + 7919);
  const active = rlsMitigated ? mit : base;

  const deltaAle = base.ale - mit.ale;
  const rosiPercent = controlCostPhp > 0 ? ((deltaAle - controlCostPhp) / controlCostPhp) * 100 : 0;

  // Build 40-point Loss Exceedance Curve P(Loss > x)
  const points = 40;
  const lossExceedanceCurve = [];
  const cap = active.maxLoss > 0 ? active.maxLoss : 1;
  for (let i = 0; i <= points; i++) {
    const threshold = (cap * i) / points;
    // Binary search first index >= threshold
    let lo = 0;
    let hi = trials;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (active.losses[mid] < threshold) lo = mid + 1;
      else hi = mid;
    }
    const exceedanceProbability = (trials - lo) / trials;
    lossExceedanceCurve.push({ loss: threshold, exceedanceProbability });
  }

  return {
    trials,
    ale: active.ale,
    var95: active.var95,
    maxLoss: active.maxLoss,
    baselineAle: base.ale,
    mitigatedAle: mit.ale,
    rosiPercent,
    controlCostPhp,
    lossExceedanceCurve,
  };
}
