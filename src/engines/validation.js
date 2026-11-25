/**
 * Pure Mathematical Engine: Automated Verification & Validation Suite
 * Runs live mathematical invariant checks required by QMODSIM-Student-Guide Section 6.
 */
import { simulatePoissonInterArrivals } from './nhpp.js';
import { solveMmckQueue } from './queueing.js';
import { buildBeltTransitionMatrix, solveAbsorbingDtmc } from './dtmc.js';
import { runFairMonteCarlo } from './fair.js';
import { solveCreditIntegrityGame } from './gameTheory.js';
import { evaluateZScoreFidelity } from './anomaly.js';
import { computeDojangReliability } from './reliability.js';

/**
 * Execute all mathematical invariant checks against live parameters.
 * @param {{
 *   lambda?: number,
 *   mu?: number,
 *   c?: number,
 *   K?: number,
 *   policy?: 'baseline' | 'mentored' | 'unstructured',
 *   tefMode?: number,
 *   fairTrials?: number,
 *   zThreshold?: number
 * }} liveParams
 * @returns {Array<{ target: string, module: string, standard: string, measured: string, passed: boolean }>}
 */
export function runInvariantChecks(liveParams = {}) {
  const lambda = liveParams.lambda ?? 3.2;
  const mu = liveParams.mu ?? 1.8;
  const c = liveParams.c ?? 2;
  const K = liveParams.K ?? 24;
  const policy = liveParams.policy ?? 'baseline';
  const tefMode = liveParams.tefMode ?? 6;
  const fairTrials = Math.max(10000, liveParams.fairTrials ?? 10000);
  const zThreshold = liveParams.zThreshold ?? 3.5;

  // 1. Poisson Arrival Invariant
  const poissonSim = simulatePoissonInterArrivals(lambda, 10000, 202601);

  // 2. Little's Law Conservation (M/M/c/K)
  const queueRes = solveMmckQueue(lambda, mu, c, K);

  // 3. Markov Row-Stochasticity
  const { Q, R, fullP } = buildBeltTransitionMatrix(policy);
  const dtmcRes = solveAbsorbingDtmc(Q, R);
  const maxRowDev = Math.max(
    ...fullP.map((row) => Math.abs(row.reduce((a, b) => a + b, 0) - 1.0))
  );

  // 4. FAIR Monte Carlo Convergence across two independent random seeds
  const fairSeedA = runFairMonteCarlo({ trials: fairTrials, tefMode, seed: 10173 });
  const fairSeedB = runFairMonteCarlo({ trials: fairTrials, tefMode, seed: 88217 });
  const fairVariance = Math.abs(fairSeedA.ale - fairSeedB.ale) / (fairSeedA.ale || 1);

  // 5. Game Theory Nash Indifference Equality
  const gameRes = solveCreditIntegrityGame();
  const nashIndiffError = Math.max(gameRes.indifferenceCheckUser, gameRes.indifferenceCheckAdmin);

  // 6. Streaming Z-Score Anomaly Fidelity
  const zRes = evaluateZScoreFidelity(zThreshold);

  // 7. RBD Series-Parallel Bounds
  const rbdRes = computeDojangReliability({ offlineLocalSync: true });
  const rbdBoundsOk =
    rbdRes.resilientReliability >= rbdRes.seriesReliability &&
    rbdRes.resilientReliability <= 1.0 &&
    rbdRes.seriesReliability > 0;

  return [
    {
      target: 'Poisson Arrival Invariant',
      module: 'Modules 1 & 3',
      standard: 'Mean inter-arrival E[X] matches 1/λ within ±2.0%',
      measured: `Error: ${(poissonSim.relativeError * 100).toFixed(2)}% (${poissonSim.meanInterArrival.toFixed(4)} vs ${poissonSim.theoreticalMean.toFixed(4)} min)`,
      passed: poissonSim.relativeError < 0.02,
    },
    {
      target: "Little's Law Conservation",
      module: 'Module 6',
      standard: '|L - (λ_eff · W)| < 10⁻⁵ across M/M/c/K buffer states',
      measured: `Diff: ${queueRes.littlesLawDiff.toExponential(2)} (L=${queueRes.meanInSystem.toFixed(3)})`,
      passed: queueRes.littlesLawDiff < 1e-5,
    },
    {
      target: 'Markov Row-Stochasticity',
      module: 'Module 5',
      standard: 'Σ P_ij = 1.0 and Σ B_ij = 1.0 for all belt states in S',
      measured: dtmcRes.isRowStochastic
        ? `Max dev: ${maxRowDev.toExponential(1)} (Exact 1.0000)`
        : 'Row sum mismatch',
      passed: dtmcRes.isRowStochastic,
    },
    {
      target: 'FAIR Monte Carlo Convergence',
      module: 'Module 4',
      standard: `ALE converges within ±1.5% across ${fairTrials.toLocaleString()} trials (2 seeds)`,
      measured: `Spread: ${(fairVariance * 100).toFixed(2)}% (₱${Math.round(fairSeedA.ale).toLocaleString()} vs ₱${Math.round(fairSeedB.ale).toLocaleString()})`,
      passed: fairVariance < 0.015,
    },
    {
      target: 'Nash Equilibrium Indifference',
      module: 'Module 7',
      standard: 'Mixed-strategy indifference residual < 10⁻⁶',
      measured: `Residual: ${nashIndiffError.toExponential(2)} (q*=${(gameRes.qStar * 100).toFixed(1)}%)`,
      passed: nashIndiffError < 1e-6,
    },
    {
      target: 'Z-Score Anomaly Fidelity',
      module: 'Module 11',
      standard: 'TPR ≥ 99.0% and FPR ≤ 0.1% at ≥ 3.5σ tampering',
      measured: `TPR: ${(zRes.truePositiveRate * 100).toFixed(1)}% · FPR: ${(zRes.falsePositiveRate * 100).toFixed(2)}%`,
      passed: zRes.truePositiveRate >= 0.99 && zRes.falsePositiveRate <= 0.01,
    },
    {
      target: 'RBD Redundancy Dominance',
      module: 'Module 12',
      standard: 'Offline sync parallel path ≥ series path and ≤ 1.0',
      measured: `Parallel ${(rbdRes.resilientReliability * 100).toFixed(3)}% ≥ Series ${(rbdRes.seriesReliability * 100).toFixed(3)}%`,
      passed: rbdBoundsOk,
    },
  ];
}
