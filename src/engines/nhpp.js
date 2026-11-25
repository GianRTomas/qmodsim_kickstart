/**
 * Pure Mathematical Engine: Modules 1 & 3 — NHPP Sunday Check-In Bursts & Exponential Inter-Arrivals
 * Zero DOM dependencies. Clean Unicode symbols only.
 */

/**
 * Evaluate Non-Homogeneous Poisson Process (NHPP) check-in intensity λ(t) in students/min.
 * Models Sunday 10:45 AM – 11:15 AM dojang lobby arrival surge centered around class start (t_class = 15 min).
 * @param {number} tMinutes - Minutes since lobby opening (0 to 30)
 * @param {number} lambdaBase - Baseline arrival rate (students/min)
 * @param {number} lambdaPeak - Peak rush-hour burst amplitude (students/min)
 * @param {number} tClass - Class start time offset in minutes (default 15 = 11:00 AM)
 * @param {number} sigma - Rush-hour spread in minutes
 * @returns {number} Instantaneous arrival intensity λ(t) in students/min
 */
export function evaluateNhppIntensity(tMinutes, lambdaBase, lambdaPeak, tClass = 15, sigma = 4) {
  const safeBase = Math.max(0.05, lambdaBase);
  const safePeak = Math.max(0, lambdaPeak);
  const safeSigma = Math.max(0.5, sigma);
  const exponent = -Math.pow(tMinutes - tClass, 2) / (2 * Math.pow(safeSigma, 2));
  return safeBase + safePeak * Math.exp(exponent);
}

/**
 * Exponential inter-arrival PDF f(t) = λ · e^(-λt).
 * @param {number} deltaT - Inter-arrival interval in minutes
 * @param {number} lambda - Arrival rate (students/min)
 * @returns {number} Probability density
 */
export function exponentialPdf(deltaT, lambda) {
  if (deltaT < 0 || lambda <= 0) return 0;
  return lambda * Math.exp(-lambda * deltaT);
}

/**
 * Poisson probability mass function P(N(t) = k) = ((λt)^k · e^(-λt)) / k!.
 * Computed in log-space to avoid factorial overflow.
 * @param {number} k - Event count
 * @param {number} mean - Expected arrivals (λ · t)
 * @returns {number} Probability in [0, 1]
 */
export function poissonPmf(k, mean) {
  if (k < 0 || !Number.isInteger(k) || mean < 0) return 0;
  if (mean === 0) return k === 0 ? 1 : 0;
  let logFact = 0;
  for (let i = 2; i <= k; i++) logFact += Math.log(i);
  return Math.exp(k * Math.log(mean) - mean - logFact);
}

/**
 * Deterministic PRNG (Mulberry32) so simulations and invariant checks are reproducible.
 * @param {number} seed
 * @returns {() => number} Uniform [0, 1) generator
 */
export function createSeededRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Sample N stationary exponential inter-arrival times to test the Poisson Invariant E[X] = 1/λ.
 * @param {number} lambda - Rate in students/min
 * @param {number} count - Number of samples
 * @param {number} seed - PRNG seed
 * @returns {{ samples: Float64Array, meanInterArrival: number, theoreticalMean: number, relativeError: number }}
 */
export function simulatePoissonInterArrivals(lambda, count = 10000, seed = 202601) {
  const safeLambda = Math.max(0.05, lambda);
  const rng = createSeededRng(seed);
  const samples = new Float64Array(count);
  let sum = 0;
  for (let i = 0; i < count; i++) {
    const u = Math.max(1e-12, 1 - rng());
    const dt = -Math.log(u) / safeLambda;
    samples[i] = dt;
    sum += dt;
  }
  const meanInterArrival = sum / count;
  const theoreticalMean = 1 / safeLambda;
  const relativeError = Math.abs(meanInterArrival - theoreticalMean) / theoreticalMean;
  return { samples, meanInterArrival, theoreticalMean, relativeError };
}

/**
 * Integrate NHPP expected total arrivals over [0, durationMin] via midpoint rule.
 * @param {number} lambdaBase
 * @param {number} lambdaPeak
 * @param {number} tClass
 * @param {number} sigma
 * @param {number} durationMin
 * @returns {{ curve: { t: number, rate: number }[], expectedArrivals: number, peakRate: number }}
 */
export function generateNhppWindowProfile(lambdaBase, lambdaPeak, tClass = 15, sigma = 4, durationMin = 30) {
  const steps = 60;
  const dt = durationMin / steps;
  const curve = [];
  let expectedArrivals = 0;
  let peakRate = 0;

  for (let i = 0; i <= steps; i++) {
    const t = i * dt;
    const rate = evaluateNhppIntensity(t, lambdaBase, lambdaPeak, tClass, sigma);
    curve.push({ t, rate });
    if (rate > peakRate) peakRate = rate;
    if (i < steps) {
      const midRate = evaluateNhppIntensity(t + dt * 0.5, lambdaBase, lambdaPeak, tClass, sigma);
      expectedArrivals += midRate * dt;
    }
  }
  return { curve, expectedArrivals, peakRate };
}

