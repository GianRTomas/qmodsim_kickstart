/**
 * Pure Mathematical Engine: Module 6 — M/M/c/K Finite-Capacity Queueing & Little's Law
 * Models Fatama Fighting Dragons dojang front-desk check-in tablets (c) and physical lobby capacity (K).
 */

/**
 * Compute steady-state M/M/c/K probabilities, blocking probability P_K, and Little's Law metrics.
 * @param {number} lambda - Arrival rate λ (students/min)
 * @param {number} mu - Verification service rate per instructor tablet μ (students/min/tablet)
 * @param {number} c - Active instructor check-in devices (1 to 4)
 * @param {number} K - Maximum lobby + service system capacity (must be >= c)
 * @returns {{
 *   lambda: number, mu: number, c: number, K: number,
 *   utilization: number, p0: number, pK: number, lambdaEff: number,
 *   meanInSystem: number, meanInQueue: number, meanWaitMin: number, meanQueueWaitMin: number,
 *   littlesLawDiff: number, erlangCWaitProb: number, stateDistribution: number[]
 * }}
 */
export function solveMmckQueue(lambda, mu, c, K) {
  const safeLambda = Math.max(0.05, lambda);
  const safeMu = Math.max(0.1, mu);
  const safeC = Math.max(1, Math.min(8, Math.round(c)));
  const safeK = Math.max(safeC, Math.min(120, Math.round(K)));

  const a = safeLambda / safeMu; // offered traffic in Erlangs
  const rho = a / safeC;         // per-tablet utilization

  // Compute unnormalized state weights w_n = P_n / P_0 iteratively to prevent factorial overflow
  const weights = new Float64Array(safeK + 1);
  weights[0] = 1.0;
  let sumWeights = 1.0;

  for (let n = 1; n <= safeK; n++) {
    const rateFactor = n <= safeC ? a / n : a / safeC;
    weights[n] = weights[n - 1] * rateFactor;
    sumWeights += weights[n];
  }

  const p0 = 1.0 / sumWeights;
  const stateDistribution = new Array(safeK + 1);
  let meanInSystem = 0;
  let meanInQueue = 0;
  let erlangCWaitProb = 0;

  for (let n = 0; n <= safeK; n++) {
    const pn = weights[n] * p0;
    stateDistribution[n] = pn;
    meanInSystem += n * pn;
    if (n > safeC) {
      meanInQueue += (n - safeC) * pn;
    }
    if (n >= safeC && n < safeK) {
      erlangCWaitProb += pn;
    }
  }

  const pK = stateDistribution[safeK];
  const lambdaEff = safeLambda * (1.0 - pK);
  const meanWaitMin = lambdaEff > 0 ? meanInSystem / lambdaEff : 0;
  const meanQueueWaitMin = lambdaEff > 0 ? meanInQueue / lambdaEff : 0;
  const littlesLawDiff = Math.abs(meanInSystem - lambdaEff * meanWaitMin);

  return {
    lambda: safeLambda,
    mu: safeMu,
    c: safeC,
    K: safeK,
    utilization: rho,
    p0,
    pK,
    lambdaEff,
    meanInSystem,
    meanInQueue,
    meanWaitMin,
    meanQueueWaitMin,
    littlesLawDiff,
    erlangCWaitProb,
    stateDistribution,
  };
}

